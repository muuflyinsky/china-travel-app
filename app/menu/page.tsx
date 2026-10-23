"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { BlockTitle, List, ListInput, Preloader, Segmented, SegmentedButton } from "konsta/react";
import { Camera, Flame, Info, Leaf, ShieldAlert, ChevronDown, HandPlatter, TriangleAlert } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { useProfile } from "@/components/useProfile";
import { ShowCard } from "@/components/ShowCard";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, DIETS, staffCardZh } from "@/lib/allergens";
import type { Dish, Menu } from "@/lib/llm";

const allergenLabel = (id: string) => ALLERGENS.find((a) => a.id === id)?.en ?? id;
const allergenZh = (id: string) => ALLERGENS.find((a) => a.id === id)?.zh.split("（")[0] ?? id;
const dietLabel = (id: string) => DIETS.find((d) => d.id === id)?.en ?? id;

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
  for (const a of d.allergens) if (allergens.includes(a)) out.push(`Contains ${allergenLabel(a).toLowerCase()}`);
  if ((diets.includes("vegetarian") || diets.includes("vegan")) && !d.vegetarian) out.push("Not vegetarian");
  if ((diets.includes("no_pork") || diets.includes("halal")) && d.meat.includes("pork")) out.push("Contains pork");
  if (diets.includes("no_beef") && d.meat.includes("beef")) out.push("Contains beef");
  if ((diets.includes("halal") || diets.includes("no_alcohol")) && d.contains_alcohol) out.push("Cooked with alcohol");
  if (diets.includes("no_spicy") && d.spice_level >= 2) out.push("Spicy");
  return out;
}

function DishCard({ d, warn, myAllergens, onOrder }: { d: Dish; warn: string[]; myAllergens: string[]; onOrder: () => void }) {
  const [open, setOpen] = useState(false);
  const others = d.allergens.filter((a) => !myAllergens.includes(a));
  return (
    <article className={`mx-4 mb-3 rounded-2xl border bg-card p-4 ${warn.length ? "border-danger" : "border-line"}`}>
      <header className="flex justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] leading-snug font-semibold">{d.translated}</h3>
          <p className="zh text-[15px]">{d.original} <span className="text-[13px] text-muted">{d.pinyin}</span></p>
          {d.literal && d.literal !== d.translated && <p className="text-[13px] text-muted italic">“{d.literal}”</p>}
        </div>
        <div className="shrink-0 text-right">
          {d.price && <p className="text-[17px] font-semibold tabular-nums">{d.price}</p>}
          {d.spice_level > 0 && (
            <p className="mt-1 flex justify-end text-danger" aria-label={`Spice level ${d.spice_level} of 3`}>
              {Array.from({ length: d.spice_level }, (_, i) => <Flame key={i} className="h-4 w-4" fill="currentColor" aria-hidden />)}
            </p>
          )}
        </div>
      </header>

      {warn.length > 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2 text-[15px] font-semibold text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {warn.join(" · ")}
        </p>
      )}

      <p className="mt-3 text-[15px] leading-relaxed">{d.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {d.vegetarian && <span className="tag tag-ok"><Leaf className="h-3.5 w-3.5" aria-hidden /> Vegetarian</span>}
        {others.map((a) => <span key={a} className="tag">{allergenLabel(a)}</span>)}
        {d.contains_alcohol && <span className="tag">Alcohol</span>}
        {d.confidence !== "high" && <span className="tag tag-warn">{d.confidence === "low" ? "Unsure — ask staff" : "Recipe varies"}</span>}
      </div>

      <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-2 flex min-h-11 items-center gap-1 text-[15px] font-semibold text-cobalt">
        Ingredients <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ul className="mb-2 space-y-1 text-[15px]">
          {d.ingredients.map((ing, j) => (
            <li key={j} className="flex justify-between gap-3 border-b border-line pb-1 last:border-0">
              <span>{ing.name}{ing.source === "standard_recipe" && <span className="text-muted"> · typical</span>}</span>
              <span className="zh text-muted">{ing.zh}</span>
            </li>
          ))}
        </ul>
      )}
      {d.notes && <p className="flex gap-2 text-[13px] text-muted"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{d.notes}</p>}

      <button onClick={onOrder} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cobalt-soft text-[15px] font-semibold text-cobalt">
        <HandPlatter className="h-4 w-4" aria-hidden /> Order this
      </button>
    </article>
  );
}

export default function MenuPage() {
  const [profile, setProfile] = useProfile();
  const [mode, setMode] = useState<"photo" | "type">("photo");
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
      setError(`We couldn't read that menu. ${(e as Error).message || ""} Try a sharper, well-lit photo, or type the dish names.`);
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
  const flagged = (menu?.dishes ?? []).filter((d) => conflicts(d, profile.allergens, profile.diets).length).length;
  const restrictions = [...profile.allergens.map(allergenLabel), ...profile.diets.map(dietLabel)];

  return (
    <Screen title="Eat">
      <div className="mx-4 mt-1">
        <Segmented strong rounded>
          <SegmentedButton active={mode === "photo"} onClick={() => setMode("photo")}>Photo</SegmentedButton>
          <SegmentedButton active={mode === "type"} onClick={() => setMode("type")}>Type names</SegmentedButton>
        </Segmented>
      </div>

      {mode === "photo" ? (
        <div className="mx-4 mt-3">
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={loading}
            className="flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl border-2 border-dashed border-cobalt/40 bg-cobalt-soft py-8 text-cobalt disabled:opacity-60"
            style={preview ? { backgroundImage: `linear-gradient(rgb(0 0 0/.45),rgb(0 0 0/.45)),url(${preview})`, backgroundSize: "cover", color: "#fff", borderStyle: "solid" } : undefined}
          >
            <Camera className="h-9 w-9" aria-hidden />
            <span className="text-[17px] font-semibold">{preview ? "Scan another menu" : "Take a photo of the menu"}</span>
            <span className="text-[13px] opacity-80">Works with handwritten boards too</span>
          </button>
        </div>
      ) : (
        <List strong inset className="my-3!">
          <ListInput type="textarea" label="Dish names" placeholder={"宫保鸡丁\n鱼香肉丝"} value={text} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value)} inputClassName="min-h-24! zh" />
          <li className="p-3">
            <button disabled={loading || !text.trim()} onClick={() => run({ text })} className="h-11 w-full rounded-xl bg-cobalt text-[17px] font-semibold text-white disabled:opacity-40 dark:text-[#12141c]">Look up dishes</button>
          </li>
        </List>
      )}

      <List strong inset className="my-3!">
        <ListInput type="select" dropdown label="Translate into" value={profile.lang} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setProfile({ lang: e.target.value })}>
          {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
        </ListInput>
        <li>
          <Link href="/essentials#profile" className="flex min-h-12 items-center gap-2 px-4 text-[15px]">
            <ShieldAlert className={`h-4 w-4 ${restrictions.length ? "text-danger" : "text-muted"}`} aria-hidden />
            <span className="flex-1">{restrictions.length ? <>Checking for <b>{restrictions.join(", ")}</b></> : "Add allergies & diet to get warnings"}</span>
            <span className="text-cobalt">Edit</span>
          </Link>
        </li>
      </List>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-6 text-muted" role="status">
          <Preloader className="h-6! w-6!" /> Reading every dish… this takes 10–40 seconds
        </div>
      )}
      {error && <p role="alert" className="mx-4 rounded-xl bg-danger-soft p-3 text-[15px] text-danger">{error}</p>}

      {menu && (
        <>
          <DemoNote show={menu.demo} what="ANTHROPIC_API_KEY" />
          <BlockTitle className="mt-5!">{menu.restaurant_type} · {menu.dishes.length} dishes{flagged > 0 && ` · ${flagged} not for you`}</BlockTitle>
          {restrictions.length > 0 && (
            <div className="mx-4 mb-3">
              <Segmented strong rounded>
                <SegmentedButton active={!safeOnly} onClick={() => setSafeOnly(false)}>All dishes</SegmentedButton>
                <SegmentedButton active={safeOnly} onClick={() => setSafeOnly(true)}>Safe for me</SegmentedButton>
              </Segmented>
            </div>
          )}
          {menu.tips.length > 0 && (
            <ul className="mx-4 mb-3 space-y-2 rounded-2xl bg-cobalt-soft p-3 text-[15px]">
              {menu.tips.map((t, i) => <li key={i} className="flex gap-2"><Info className="mt-1 h-4 w-4 shrink-0 text-cobalt" aria-hidden />{t}</li>)}
            </ul>
          )}

          {dishes.map(({ d, warn }, i) => (
            <DishCard
              key={i}
              d={d}
              warn={warn}
              myAllergens={profile.allergens}
              onOrder={() => setCard([
                `我要点：${d.original}`,
                ...(d.allergens.some((a) => profile.allergens.includes(a)) ? [`请不要放：${d.allergens.filter((a) => profile.allergens.includes(a)).map(allergenZh).join("、")}`] : []),
                ...(profile.diets.includes("no_spicy") ? ["请不要辣"] : []),
              ])}
            />
          ))}
          <p className="mx-4 text-[13px] text-muted">“Typical” ingredients come from the standard recipe; kitchens vary. With a severe allergy, always show your allergy card and confirm with staff.</p>

          {restrictions.length > 0 && (
            <div className="fixed inset-x-0 bottom-[calc(92px+env(safe-area-inset-bottom))] z-10 px-4 pb-2">
              <button onClick={() => setCard(staffCardZh(profile.allergens, profile.diets))} className="mx-auto flex h-12 w-full max-w-[608px] items-center justify-center gap-2 rounded-2xl bg-ink text-[17px] font-semibold text-porcelain shadow-[0_6px_20px_rgb(0_0_0/0.18)]">
                <ShieldAlert className="h-5 w-5" aria-hidden /> Show my allergy card
              </button>
            </div>
          )}
        </>
      )}
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </Screen>
  );
}
