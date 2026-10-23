"use client";
import { useMemo, useRef, useState } from "react";
import { useProfile } from "@/components/useProfile";
import { ShowCard } from "@/components/ShowCard";
import { DemoBadge } from "@/components/DemoBadge";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, staffCardZh } from "@/lib/allergens";
import type { Dish, Menu } from "@/lib/llm";

const allergenLabel = (id: string) => ALLERGENS.find((a) => a.id === id)?.en ?? id;
const allergenZh = (id: string) => ALLERGENS.find((a) => a.id === id)?.zh.split("（")[0] ?? id;

// Downscale on the phone before upload: menus stay legible at 1600px and the request stays small.
async function compress(file: File): Promise<{ data: string; mediaType: string; preview: string }> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const url = canvas.toDataURL("image/jpeg", 0.85);
  return { data: url.split(",")[1], mediaType: "image/jpeg", preview: url };
}

function conflicts(d: Dish, allergens: string[], diets: string[]) {
  const out: string[] = [];
  for (const a of d.allergens) if (allergens.includes(a)) out.push(`Contains ${allergenLabel(a)}`);
  if ((diets.includes("vegetarian") || diets.includes("vegan")) && !d.vegetarian) out.push("Not vegetarian");
  if ((diets.includes("no_pork") || diets.includes("halal")) && d.meat.includes("pork")) out.push("Contains pork");
  if (diets.includes("no_beef") && d.meat.includes("beef")) out.push("Contains beef");
  if ((diets.includes("halal") || diets.includes("no_alcohol")) && d.contains_alcohol) out.push("Cooked with alcohol");
  if (diets.includes("no_spicy") && d.spice_level >= 2) out.push("Spicy");
  return out;
}

export default function MenuPage() {
  const [profile, setProfile] = useProfile();
  const [preview, setPreview] = useState<string>();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [menu, setMenu] = useState<(Menu & { demo?: boolean }) | null>(null);
  const [safeOnly, setSafeOnly] = useState(false);
  const [card, setCard] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function run(body: object) {
    setLoading(true); setError(undefined); setMenu(null);
    try {
      const r = await fetch("/api/menu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, lang: profile.lang }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMenu(d);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onFile(f?: File) {
    if (!f) return;
    const img = await compress(f);
    setPreview(img.preview);
    run({ image: img.data, mediaType: img.mediaType });
  }

  const dishes = useMemo(() => {
    const list = (menu?.dishes ?? []).map((d) => ({ d, warn: conflicts(d, profile.allergens, profile.diets) }));
    return safeOnly ? list.filter((x) => x.warn.length === 0) : list;
  }, [menu, profile, safeOnly]);

  const hasRestrictions = profile.allergens.length + profile.diets.length > 0;

  return (
    <>
      <h1>Menu reader</h1>
      <p className="muted">Snap a menu or type dish names. We translate every dish and list ingredients and allergens — inferred from the standard recipe when the menu only shows a name.</p>

      <div className="card stack" style={{ marginTop: 12 }}>
        <div className="row">
          <label className="field" style={{ flex: 1 }}>Translate into
            <select value={profile.lang} onChange={(e) => setProfile({ lang: e.target.value })}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </label>
        </div>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
        <button className="btn primary block" onClick={() => fileRef.current?.click()} disabled={loading}>📷 Photograph menu</button>
        <details>
          <summary className="small">…or type / paste dish names</summary>
          <textarea placeholder={"宫保鸡丁\n鱼香肉丝\n夫妻肺片"} value={text} onChange={(e) => setText(e.target.value)} style={{ marginTop: 8 }} />
          <button className="btn block" style={{ marginTop: 8 }} disabled={loading || !text.trim()} onClick={() => run({ text })}>Look up dishes</button>
        </details>
        <a href="/essentials#profile" className="small muted">
          {hasRestrictions ? `Checking for: ${[...profile.allergens.map(allergenLabel), ...profile.diets].join(", ")}` : "⚙️ Set your allergies & diet to get warnings"}
        </a>
      </div>

      {preview && <img src={preview} alt="menu" style={{ width: "100%", borderRadius: 12, marginTop: 12, maxHeight: 220, objectFit: "cover" }} />}
      {loading && <p className="muted">Reading the menu… (10–40 s for a full page)</p>}
      {error && <div className="banner danger" style={{ marginTop: 12 }}>{error}</div>}

      {menu && (
        <div className="stack" style={{ marginTop: 14 }}>
          <DemoBadge show={menu.demo} what="ANTHROPIC_API_KEY" />
          <div className="row spread wrap">
            <h2 style={{ margin: 0 }}>{menu.restaurant_type} · {menu.dishes.length} dishes</h2>
            {hasRestrictions && (
              <button className={`chip toggle ${safeOnly ? "on" : ""}`} onClick={() => setSafeOnly(!safeOnly)}>Safe for me only</button>
            )}
          </div>
          {hasRestrictions && (
            <button className="btn block" onClick={() => setCard(staffCardZh(profile.allergens, profile.diets))}>🪪 Show my allergy card to staff</button>
          )}
          {menu.tips.map((t, i) => <div key={i} className="banner warn">💡 {t}</div>)}

          {dishes.map(({ d, warn }, i) => (
            <div key={i} className="card stack" style={warn.length ? { borderColor: "var(--danger)" } : undefined}>
              <div className="dish-head">
                <div>
                  <h3>{d.translated}</h3>
                  <div className="zh">{d.original} <span className="muted small">{d.pinyin}</span></div>
                  {d.literal && d.literal !== d.translated && <div className="muted small">“{d.literal}”</div>}
                </div>
                <div style={{ textAlign: "right" }}>
                  <b>{d.price}</b>
                  <div>{"🌶️".repeat(d.spice_level)}</div>
                </div>
              </div>
              <p className="small">{d.description}</p>
              <div className="row wrap">
                {warn.map((w) => <span key={w} className="chip danger">⚠ {w}</span>)}
                {d.vegetarian && <span className="chip ok">🌱 Vegetarian</span>}
                {d.allergens.filter((a) => !profile.allergens.includes(a)).map((a) => <span key={a} className="chip">{allergenLabel(a)}</span>)}
                {d.contains_alcohol && <span className="chip">Alcohol</span>}
                {d.confidence !== "high" && <span className="chip warn">{d.confidence} confidence</span>}
              </div>
              <details>
                <summary className="small">Ingredients</summary>
                <ul className="ing">
                  {d.ingredients.map((ing, j) => (
                    <li key={j}>{ing.name} <span className="zh muted">{ing.zh}</span>{ing.source === "standard_recipe" && <span className="muted"> · typical recipe</span>}</li>
                  ))}
                </ul>
              </details>
              {d.notes && <p className="small muted">ℹ️ {d.notes}</p>}
              <button className="btn sm" onClick={() => setCard([
                `我要点：${d.original}`,
                ...(warn.length && profile.allergens.length ? [`请不要放：${d.allergens.filter((a) => profile.allergens.includes(a)).map(allergenZh).join("、")}`] : []),
                ...(profile.diets.includes("no_spicy") ? ["请不要辣"] : []),
              ])}>🙋 Order this</button>
            </div>
          ))}
          <p className="small muted">Ingredients marked “typical recipe” are inferred — kitchens vary. With a severe allergy always show your allergy card and confirm with staff.</p>
        </div>
      )}
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </>
  );
}
