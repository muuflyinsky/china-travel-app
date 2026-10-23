"use client";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Preloader } from "konsta/react";
import { Camera, Flame, Info, Leaf, ShieldAlert, ChevronDown, HandPlatter, TriangleAlert } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Field, Button, Note, Seg } from "@/components/ui";
import { useProfile } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useFx, parseCny, formatMoney } from "@/components/useFx";
import { useT } from "@/components/useT";
import { ShowCard } from "@/components/ShowCard";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, staffCardZh, type AllergenId, type DietId } from "@/lib/allergens";
import { fmt, type Dict } from "@/lib/i18n";
import type { Dish, Menu } from "@/lib/llm";

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

function conflicts(t: Dict, d: Dish, allergens: string[], diets: string[]) {
  const out: string[] = [];
  for (const a of d.allergens) if (allergens.includes(a)) out.push(fmt(t.eat.contains, { x: t.allergens[a as AllergenId].toLowerCase() }));
  if ((diets.includes("vegetarian") || diets.includes("vegan")) && !d.vegetarian) out.push(t.eat.notVeg);
  if ((diets.includes("no_pork") || diets.includes("halal")) && d.meat.includes("pork")) out.push(t.eat.pork);
  if (diets.includes("no_beef") && d.meat.includes("beef")) out.push(t.eat.beef);
  if ((diets.includes("halal") || diets.includes("no_alcohol")) && d.contains_alcohol) out.push(t.eat.cookedAlcohol);
  if (diets.includes("no_spicy") && d.spice_level >= 2) out.push(t.eat.spicy);
  return out;
}

function DishCard({ d, warn, myAllergens, onOrder, homePrice }: { d: Dish; warn: string[]; myAllergens: string[]; onOrder: () => void; homePrice?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const others = d.allergens.filter((a) => !myAllergens.includes(a));
  return (
    <Card tone={warn.length ? "danger" : "plain"}>
      <header className="flex justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] leading-snug font-semibold">{d.translated}</h3>
          <p className="zh text-[15px]">{d.original} <span className="text-[13px] text-muted">{d.pinyin}</span></p>
          {d.literal && d.literal !== d.translated && <p className="text-[13px] text-muted italic">“{d.literal}”</p>}
        </div>
        <div className="shrink-0 text-right">
          {d.price && <p className="text-[17px] font-semibold tabular-nums">{d.price}</p>}
          {homePrice && <p className="text-[13px] text-muted tabular-nums">{fmt(t.eat.approx, { amount: homePrice })}</p>}
          {d.spice_level > 0 && (
            <p className="mt-1 flex justify-end text-danger" aria-label={fmt(t.eat.spice, { n: d.spice_level })}>
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
        {d.vegetarian && <span className="tag tag-ok"><Leaf className="h-3.5 w-3.5" aria-hidden /> {t.eat.vegetarian}</span>}
        {others.map((a) => <span key={a} className="tag">{t.allergens[a as AllergenId]}</span>)}
        {d.contains_alcohol && <span className="tag">{t.eat.alcohol}</span>}
        {d.confidence !== "high" && <span className="tag tag-warn">{d.confidence === "low" ? t.eat.unsure : t.eat.varies}</span>}
      </div>

      <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-2 flex min-h-11 items-center gap-1 text-[15px] font-semibold text-cobalt">
        {t.eat.ingredients} <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ul className="mb-2 space-y-1 text-[15px]">
          {d.ingredients.map((ing, j) => (
            <li key={j} className="flex justify-between gap-3 border-b border-line pb-1 last:border-0">
              <span>{ing.name}{ing.source === "standard_recipe" && <span className="text-muted"> · {t.eat.typical}</span>}</span>
              <span className="zh text-muted">{ing.zh}</span>
            </li>
          ))}
        </ul>
      )}
      {d.notes && <p className="flex gap-2 text-[13px] text-muted"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{d.notes}</p>}

      <Button variant="soft" onClick={onOrder} className="mt-3 w-full text-[15px]!"><HandPlatter className="h-4 w-4" aria-hidden /> {t.eat.order}</Button>
    </Card>
  );
}

export default function MenuPage() {
  const t = useT();
  const [profile, setProfile] = useProfile();
  const { city } = useCity();
  const fx = useFx(profile.homeCurrency);
  const [mode, setMode] = useState<"photo" | "type">("photo");
  const [preview, setPreview] = useState<string>();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [menu, setMenu] = useState<(Menu & { demo?: boolean }) | null>(null);
  const [safeOnly, setSafeOnly] = useState<"all" | "safe">("all");
  const [card, setCard] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function run(body: object) {
    setLoading(true); setError(undefined); setMenu(null);
    try {
      const r = await fetch("/api/menu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, lang: profile.lang, city: `${city.e} (${city.n}, ${city.p})` }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMenu(d);
    } catch {
      setError(t.eat.error);
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
    const list = (menu?.dishes ?? []).map((d) => ({ d, warn: conflicts(t, d, profile.allergens, profile.diets) }));
    return safeOnly === "safe" ? list.filter((x) => x.warn.length === 0) : list;
  }, [menu, profile, safeOnly, t]);
  const flagged = (menu?.dishes ?? []).filter((d) => conflicts(t, d, profile.allergens, profile.diets).length).length;
  const restrictions = [...profile.allergens.map((a) => t.allergens[a as AllergenId]), ...profile.diets.map((d) => t.diets[d as DietId])];
  const homePrice = (price: string) => {
    const cny = parseCny(price);
    return cny && fx && profile.homeCurrency !== "CNY" ? formatMoney(cny / fx.value, profile.homeCurrency, profile.lang) : undefined;
  };

  return (
    <Screen title={t.eat.title}>
      <Section>
        <Seg value={mode} onChange={setMode} options={[{ value: "photo", label: t.eat.photo }, { value: "type", label: t.eat.type }]} />
        {mode === "photo" ? (
          <>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-cobalt/40 bg-cobalt-soft px-4 py-8 text-cobalt disabled:opacity-60"
              style={preview ? { backgroundImage: `linear-gradient(rgb(0 0 0/.45),rgb(0 0 0/.45)),url(${preview})`, backgroundSize: "cover", color: "#fff", borderStyle: "solid" } : undefined}
            >
              <Camera className="h-9 w-9" aria-hidden />
              <span className="text-[17px] font-semibold">{preview ? t.eat.scanAnother : t.eat.takePhoto}</span>
              <span className="text-[13px] opacity-80">{t.eat.handwritten}</span>
            </button>
          </>
        ) : (
          <>
            <Group>
              <Field label={t.eat.dishNames}>
                <textarea rows={4} placeholder={"宫保鸡丁\n鱼香肉丝"} value={text} onChange={(e) => setText(e.target.value)} className="zh resize-none" />
              </Field>
            </Group>
            <Button className="w-full" disabled={loading || !text.trim()} onClick={() => run({ text })}>{t.eat.lookUp}</Button>
          </>
        )}
        <Group>
          <Field label={t.eat.translateInto}>
            <select value={profile.lang} onChange={(e) => setProfile({ lang: e.target.value })}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
            </select>
          </Field>
          <li>
            <Link href="/settings#food" className="flex min-h-12 items-center gap-2 px-4 py-2 text-[15px]">
              <ShieldAlert className={`h-4 w-4 shrink-0 ${restrictions.length ? "text-danger" : "text-muted"}`} aria-hidden />
              <span className="flex-1">{restrictions.length ? <>{t.eat.checkingFor} <b>{restrictions.join(", ")}</b></> : t.eat.addRestrictions}</span>
              <span className="text-cobalt">{t.common.edit}</span>
            </Link>
          </li>
        </Group>
      </Section>

      {loading && (
        <div className="flex items-center justify-center gap-3 py-6 text-muted" role="status">
          <Preloader className="h-6! w-6!" /> {t.eat.reading}
        </div>
      )}
      {error && <Section><Note tone="danger">{error}</Note></Section>}

      {menu && (
        <Section
          title={<>{fmt(t.eat.dishes, { type: menu.restaurant_type, n: menu.dishes.length })}{flagged > 0 && ` · ${fmt(t.eat.notForYou, { n: flagged })}`}</>}
        >
          <DemoNote show={menu.demo} what="ANTHROPIC_API_KEY" />
          {restrictions.length > 0 && (
            <Seg value={safeOnly} onChange={setSafeOnly} options={[{ value: "all", label: t.eat.all }, { value: "safe", label: t.eat.safe }]} />
          )}
          {menu.tips.map((tip, i) => <Note key={i}>{tip}</Note>)}
          {dishes.map(({ d, warn }, i) => (
            <DishCard
              key={i}
              d={d}
              warn={warn}
              myAllergens={profile.allergens}
              homePrice={homePrice(d.price)}
              onOrder={() => setCard([
                `我要点：${d.original}`,
                ...(d.allergens.some((a) => profile.allergens.includes(a)) ? [`请不要放：${d.allergens.filter((a) => profile.allergens.includes(a)).map(allergenZh).join("、")}`] : []),
                ...(profile.diets.includes("no_spicy") ? ["请不要辣"] : []),
              ])}
            />
          ))}
          <p className="px-1 text-[13px] text-muted">{t.eat.disclaimer}</p>
          {restrictions.length > 0 && <div className="h-16" aria-hidden />}
        </Section>
      )}

      {menu && restrictions.length > 0 && (
        <div className="sticky-bottom">
          <Button variant="ink" className="w-full shadow-[0_6px_20px_rgb(0_0_0/0.18)]" onClick={() => setCard(staffCardZh(profile.allergens, profile.diets))}>
            <ShieldAlert className="h-5 w-5" aria-hidden /> {t.eat.showAllergyCard}
          </Button>
        </div>
      )}
      {card && <ShowCard lines={card} onClose={() => setCard(null)} />}
    </Screen>
  );
}
