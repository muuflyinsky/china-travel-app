"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Popup, Preloader } from "konsta/react";
import { Camera, Flame, Info, Leaf, ShieldAlert, ChevronDown, Plus, Minus, TriangleAlert, ReceiptText, Keyboard, UtensilsCrossed } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Field, Button, Note, Seg, IconTile } from "@/components/ui";
import { isHotCity } from "@/lib/hot-cities";
import { useProfile } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useFx, parseCny, formatMoney } from "@/components/useFx";
import { useT } from "@/components/useT";
import { ShowCard, type StaffReply } from "@/components/ShowCard";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, DIETS, allergyLinesZh, blockedBySevere, type AllergenId, type DietId } from "@/lib/allergens";
import { track } from "@/lib/track";
import { compressImage } from "@/lib/image";
import { fmt, type Dict } from "@/lib/i18n";
import type { Dish, Menu } from "@/lib/llm";

const allergenZh = (id: string) => ALLERGENS.find((a) => a.id === id)?.zh.split("（")[0] ?? id;
const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** `blocked`: severe allergens that are a main ingredient — the dish can't be ordered safely. */
type Conflict = { allergens: string[]; diet: string[]; blocked: string[] };

function conflicts(t: Dict, d: Dish, allergens: string[], diets: string[], severe: string[]): Conflict {
  const diet: string[] = [];
  if ((diets.includes("vegetarian") || diets.includes("vegan")) && !d.vegetarian) diet.push(t.eat.notVeg);
  if ((diets.includes("no_pork") || diets.includes("halal")) && d.meat.includes("pork")) diet.push(t.eat.pork);
  if (diets.includes("no_beef") && d.meat.includes("beef")) diet.push(t.eat.beef);
  if ((diets.includes("halal") || diets.includes("no_alcohol")) && d.contains_alcohol) diet.push(t.eat.cookedAlcohol);
  if (diets.includes("no_spicy") && d.spice_level >= 2) diet.push(t.eat.spicy);
  return {
    allergens: d.allergens.filter((a) => allergens.includes(a)),
    diet,
    blocked: blockedBySevere(d, severe.filter((a) => allergens.includes(a))),
  };
}
const hasConflict = (c: Conflict) => c.allergens.length + c.diet.length > 0;

/** Order line: qty and whether to ask the kitchen to leave out the traveller's allergens. */
type Line = { qty: number; without: boolean };

function DishCard({ d, c, line, onChange, homePrice }: { d: Dish; c: Conflict; line?: Line; onChange: (l: Line | undefined) => void; homePrice?: string }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const warn = [...c.allergens.map((a) => fmt(t.eat.contains, { x: t.allergens[a as AllergenId].toLowerCase() })), ...c.diet];
  const others = d.allergens.filter((a) => !c.allergens.includes(a));
  const flagged = warn.length > 0;
  return (
    <Card tone={flagged ? "danger" : "plain"}>
      <header className="flex justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-body font-semibold">{d.translated}</h3>
          <p className="zh text-subhead">{d.original} <span className="text-footnote text-muted">{d.pinyin}</span></p>
          {d.literal && d.literal !== d.translated && <p className="text-footnote text-muted italic">“{d.literal}”</p>}
        </div>
        <div className="shrink-0 text-right">
          {d.price && <p className="text-headline tabular-nums">{d.price}</p>}
          {homePrice && <p className="text-footnote text-muted tabular-nums">{fmt(t.eat.approx, { amount: homePrice })}</p>}
          {d.spice_level > 0 && (
            // Spice uses ink, not red: red is reserved for allergy danger.
            <p className="mt-1 flex justify-end text-ink" aria-label={fmt(t.eat.spice, { n: d.spice_level })}>
              {Array.from({ length: d.spice_level }, (_, i) => <Flame key={i} className="h-4 w-4" aria-hidden />)}
            </p>
          )}
        </div>
      </header>

      {flagged && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-danger-soft px-3 py-2 text-subhead font-semibold text-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> {warn.join(" · ")}
        </p>
      )}

      <p className="mt-3 text-subhead">{d.description}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {d.vegetarian && <span className="tag"><Leaf className="h-3.5 w-3.5" aria-hidden /> {t.eat.vegetarian}</span>}
        {others.map((a) => <span key={a} className="tag">{t.allergens[a as AllergenId]}</span>)}
        {d.contains_alcohol && <span className="tag">{t.eat.alcohol}</span>}
        {d.confidence !== "high" && <span className="tag tag-warn">{d.confidence === "low" ? t.eat.unsure : t.eat.varies}</span>}
      </div>

      <button onClick={() => setOpen(!open)} aria-expanded={open} className="mt-2 flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">
        {t.eat.ingredients} <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <ul className="mb-2 space-y-1 text-subhead">
          {d.ingredients.map((ing, j) => (
            <li key={j} className="flex justify-between gap-3 border-b border-line pb-1 last:border-0">
              <span>{ing.name}{ing.source === "standard_recipe" && <span className="text-muted"> · {t.eat.typical}</span>}</span>
              <span className="zh text-muted">{ing.zh}</span>
            </li>
          ))}
        </ul>
      )}
      {d.notes && <p className="flex gap-2 text-footnote text-muted"><Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />{d.notes}</p>}

      {c.blocked.length > 0 ? (
        // Severe allergy and it's a main ingredient: no "add", no "ask without" — it isn't safe to try.
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-danger px-3 py-2.5 text-subhead font-semibold text-danger" role="note">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {fmt(t.eat.blockedSevere, { x: c.blocked.map((a) => t.allergens[a as AllergenId].toLowerCase()).join(", ") })}
        </p>
      ) : line ? (
        <div className="mt-3 flex items-center justify-between rounded-xl bg-cobalt-soft p-1">
          <button onClick={() => onChange(line.qty > 1 ? { ...line, qty: line.qty - 1 } : undefined)} aria-label="−" className="grid h-11 w-11 place-items-center rounded-lg text-cobalt"><Minus className="h-5 w-5" /></button>
          <span className="text-subhead font-semibold text-cobalt">{t.eat.inOrder} · ×{line.qty}</span>
          <button onClick={() => onChange({ ...line, qty: line.qty + 1 })} aria-label="+" className="grid h-11 w-11 place-items-center rounded-lg text-cobalt"><Plus className="h-5 w-5" /></button>
        </div>
      ) : c.allergens.length > 0 ? (
        // Don't nudge people to order a dish with their allergen; offer to ask for it without.
        <Button variant="ghost" className="mt-3 w-full border border-line text-subhead!" onClick={() => onChange({ qty: 1, without: true })}>
          <Plus className="h-4 w-4" aria-hidden />{fmt(t.eat.askWithout, { x: c.allergens.map((a) => t.allergens[a as AllergenId].toLowerCase()).join(", ") })}
        </Button>
      ) : (
        <Button variant={flagged ? "ghost" : "soft"} className={`mt-3 w-full text-subhead! ${flagged ? "border border-line" : ""}`} onClick={() => onChange({ qty: 1, without: false })}>
          <Plus className="h-4 w-4" aria-hidden />{t.eat.add}
        </Button>
      )}
    </Card>
  );
}

/** First visit to Eat: ask once about allergies, with "none" as the first answer. */
function AllergySheet({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [p, set] = useProfile();
  const [a, setA] = useState<string[]>(p.allergens);
  const [d, setD] = useState<string[]>(p.diets);
  const finish = (allergens: string[], diets: string[]) => { set({ allergens, diets, allergiesAsked: true }); onDone(); };
  return (
    <Popup opened onBackdropClick={() => finish(a, d)}>
      <div className="flex h-full flex-col overflow-auto bg-porcelain px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-8 text-ink">
        <h2 className="text-title">{t.eat.allergyAsk}</h2>
        <p className="mt-1 text-subhead text-muted">{t.eat.allergyAskSub}</p>
        <Button className="mt-4 w-full" onClick={() => finish([], d)}>{t.eat.noAllergy}</Button>
        <p className="mt-6 mb-2 text-subhead font-semibold text-muted">{t.settings.allergies}</p>
        <div className="flex flex-wrap gap-2">
          {ALLERGENS.map((x) => <button key={x.id} className="pill" aria-pressed={a.includes(x.id)} onClick={() => setA(toggle(a, x.id))}>{t.allergens[x.id]}</button>)}
        </div>
        <p className="mt-6 mb-2 text-subhead font-semibold text-muted">{t.settings.diet}</p>
        <div className="flex flex-wrap gap-2">
          {DIETS.map((x) => <button key={x.id} className="pill" aria-pressed={d.includes(x.id)} onClick={() => setD(toggle(d, x.id))}>{t.diets[x.id]}</button>)}
        </div>
        <Button variant="soft" className="mt-6 w-full" onClick={() => finish(a, d)}>{t.eat.save}</Button>
      </div>
    </Popup>
  );
}

export default function MenuPage() {
  const t = useT();
  const [profile, setProfile, loaded] = useProfile();
  const { city } = useCity();
  const fx = useFx(profile.homeCurrency);
  const [mode, setMode] = useState<"photo" | "type">("photo");
  const [preview, setPreview] = useState<string>();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [menu, setMenu] = useState<(Menu & { demo?: boolean }) | null>(null);
  const [inputOpen, setInputOpen] = useState(true);
  const [filter, setFilter] = useState<"all" | "safe">("all");
  const [order, setOrder] = useState<Record<number, Line>>({});
  const [card, setCard] = useState<{ kind: string; lead?: string; lines: string[]; rest?: string[]; explain?: string; replies?: StaffReply[] } | null>(null);
  const [askAllergies, setAskAllergies] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (loaded && !profile.allergiesAsked) setAskAllergies(true); }, [loaded, profile.allergiesAsked]);

  async function run(body: object) {
    track("menu_scan", { input: "image" in body ? "photo" : "text" });
    setLoading(true); setError(undefined); setMenu(null); setOrder({});
    try {
      const r = await fetch("/api/menu", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...body, lang: profile.lang, city: `${city.e} (${city.n}, ${city.p})` }) });
      const d = await r.json();
      // 503: no AI configured (production) · 422: the model's answer didn't validate → retake.
      if (!r.ok) throw new Error(r.status === 503 ? "unavailable" : "unreadable");
      setMenu(d);
      setInputOpen(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      setError((e as Error).message === "unavailable" ? t.common.unavailable : t.eat.error);
    } finally {
      setLoading(false);
    }
  }

  async function onFile(f?: File) {
    if (!f) return;
    const img = await compressImage(f);
    setPreview(img.preview);
    run({ image: img.data, mediaType: img.mediaType });
  }

  const rows = useMemo(() => (menu?.dishes ?? []).map((d, i) => ({ d, i, c: conflicts(t, d, profile.allergens, profile.diets, profile.severe) })), [menu, profile, t]);
  const shown = filter === "safe" ? rows.filter((r) => !hasConflict(r.c)) : rows;
  const flagged = rows.filter((r) => hasConflict(r.c)).length;
  const restrictions = [...profile.allergens.map((a) => t.allergens[a as AllergenId]), ...profile.diets.map((d) => t.diets[d as DietId])];
  const myAllergensZh = profile.allergens.map(allergenZh);
  const myAllergensMine = profile.allergens.map((a) => t.allergens[a as AllergenId].toLowerCase());
  const homePrice = (price: string) => {
    const cny = parseCny(price);
    return cny && fx && profile.homeCurrency !== "CNY" ? formatMoney(cny / fx.value, profile.homeCurrency, profile.lang) : undefined;
  };
  // A dish added before an allergy was marked severe drops out of the order.
  const orderLines = Object.entries(order).map(([i, l]) => ({ d: menu!.dishes[Number(i)], l, i: Number(i) }))
    .filter(({ i }) => !rows[i]?.c.blocked.length);
  const dishCount = orderLines.reduce((n, x) => n + x.l.qty, 0);

  // At most three answers, so they fit under the card without scrolling.
  const replies = (withCant: boolean): StaffReply[] => [
    { zh: "可以，没问题", mine: t.eat.replyOk },
    ...(withCant ? [{ zh: "这道菜做不了", mine: t.eat.replyCant }] : []),
    ...(profile.allergens.length ? [{ zh: "里面有您过敏的东西", mine: t.eat.replyContainsAny }] : []),
  ];
  const allergyExplain = myAllergensMine.length ? fmt(t.eat.orderExplainAllergy, { allergens: myAllergensMine.join(", ") }) : "";

  function showOrder() {
    const without = myAllergensZh.length ? `（不要放${myAllergensZh.join("、")}）` : "";
    const { severe, rest } = allergyLinesZh(profile.allergens, profile.diets, profile.severe);
    const dishes = orderLines.map(({ d, l }) => `${d.translated} ×${l.qty}`).join(", ");
    track("order_card_shown", { dishes: orderLines.length, severe: Boolean(severe) });
    setCard({
      kind: "order",
      lead: severe || undefined,
      lines: ["您好，我要点：", ...orderLines.map(({ d, l }) => `${d.original} ×${l.qty}${l.without ? without : ""}`)],
      rest,
      explain: [fmt(t.eat.orderExplain, { dishes }), allergyExplain].filter(Boolean).join(" "),
      replies: replies(true),
    });
  }

  function showAllergyCard() {
    const { severe, rest } = allergyLinesZh(profile.allergens, profile.diets, profile.severe);
    setCard({ kind: "allergy", lead: severe || undefined, lines: ["您好！我有饮食限制，麻烦您帮忙确认，谢谢！"], rest, explain: allergyExplain, replies: replies(false) });
  }

  return (
    <Screen title={t.eat.title}>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0])} />

      {menu && !inputOpen ? (
        // After results: the input collapses to one row so the dishes start on the first screen.
        <Section>
          <div className="flex gap-2">
            <Button variant="soft" className="flex-1" onClick={() => fileRef.current?.click()}><Camera className="h-5 w-5" aria-hidden />{t.eat.rescan}</Button>
            <Button variant="soft" ariaLabel={t.eat.type} onClick={() => { setMode("type"); setInputOpen(true); }}><Keyboard className="h-5 w-5" aria-hidden /></Button>
          </div>
        </Section>
      ) : (
        <Section>
          <Seg value={mode} onChange={setMode} options={[{ value: "photo", label: t.eat.photo }, { value: "type", label: t.eat.type }]} />
          {mode === "photo" ? (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              className="flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-cobalt/40 bg-cobalt-soft px-4 py-8 text-cobalt disabled:opacity-60"
              style={preview ? { backgroundImage: `linear-gradient(rgb(0 0 0/.45),rgb(0 0 0/.45)),url(${preview})`, backgroundSize: "cover", color: "#fff", borderStyle: "solid" } : undefined}
            >
              <Camera className="h-9 w-9" aria-hidden />
              <span className="text-headline">{preview ? t.eat.scanAnother : t.eat.takePhoto}</span>
              <span className="text-footnote opacity-80">{t.eat.handwritten}</span>
            </button>
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
              <button onClick={() => setAskAllergies(true)} className="flex min-h-12 w-full items-center gap-2 px-4 py-2 text-left text-subhead">
                <ShieldAlert className={`h-4 w-4 shrink-0 ${restrictions.length ? "text-danger" : "text-muted"}`} aria-hidden />
                <span className="flex-1">{restrictions.length ? <>{t.eat.checkingFor} <b>{restrictions.join(", ")}</b></> : t.eat.addRestrictions}</span>
                <span className="text-cobalt">{t.common.edit}</span>
              </button>
            </li>
          </Group>
          {!menu && isHotCity(city.a) && (
            <Group>
              <Row href="/explore?tab=eat" icon={<IconTile><UtensilsCrossed className="h-5 w-5" aria-hidden /></IconTile>} title={fmt(t.guide.mustEat, { city: city.e })} sub={t.guide.mustEatSub} />
            </Group>
          )}
        </Section>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-3 py-6 text-muted" role="status">
          <Preloader className="h-6! w-6!" /> {t.eat.reading}
        </div>
      )}
      {error && <Section><Note tone="danger">{error}</Note></Section>}

      {menu && (
        <div ref={resultsRef} className="scroll-mt-2">
          <Section>
            <Card>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-headline">{fmt(t.eat.dishes, { type: menu.restaurant_type, n: menu.dishes.length })}</p>
                {flagged > 0 && <span className="tag tag-danger">{fmt(t.eat.notForYou, { n: flagged })}</span>}
              </div>
              {restrictions.length > 0 && (
                <div className="mt-3"><Seg value={filter} onChange={setFilter} options={[{ value: "all", label: t.eat.all }, { value: "safe", label: t.eat.safe }]} /></div>
              )}
            </Card>
            <DemoNote show={menu.demo} what={t.common.aiKey} />
            {menu.tips.map((tip, i) => <Note key={i}>{tip}</Note>)}
            {shown.map(({ d, i, c }) => (
              <DishCard key={i} d={d} c={c} line={order[i]} homePrice={homePrice(d.price)}
                onChange={(l) => setOrder((o) => { const n = { ...o }; if (l) n[i] = l; else delete n[i]; return n; })} />
            ))}
            <p className="px-1 text-footnote text-muted">{t.eat.disclaimer}</p>
            <div className="h-16" aria-hidden />
          </Section>
        </div>
      )}

      {menu && (dishCount > 0 || restrictions.length > 0) && (
        <div className="sticky-bottom flex items-center justify-end gap-2">
          {dishCount > 0 && (
            <Button variant="ink" className="flex-1 shadow-[0_6px_20px_rgb(0_0_0/0.18)]" onClick={showOrder}>
              <ReceiptText className="h-5 w-5" aria-hidden />{fmt(t.eat.orderBar, { n: dishCount })}
            </Button>
          )}
          {restrictions.length > 0 && (
            <button aria-label={t.eat.showAllergyCard}
              onClick={showAllergyCard}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card text-danger shadow-[0_6px_20px_rgb(0_0_0/0.18)] ring-1 ring-line">
              <ShieldAlert className="h-6 w-6" />
            </button>
          )}
        </div>
      )}
      {card && <ShowCard {...card} onClose={() => setCard(null)} />}
      {askAllergies && <AllergySheet onDone={() => setAskAllergies(false)} />}
      <Link href="/settings#food" className="sr-only">{t.common.settings}</Link>
    </Screen>
  );
}
