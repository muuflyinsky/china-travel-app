"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Popup, Preloader, Sheet } from "konsta/react";
import { Camera, Flame, Info, Leaf, ShieldAlert, ShieldCheck, ShieldOff, ChevronRight, ChevronDown, Plus, Minus, ReceiptText, Keyboard, UtensilsCrossed, Volume2, X, Lightbulb, Images, ScanText } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Field, Button, Note, IconTile, IconButton } from "@/components/ui";
import { useProfile } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useFx, parseCny, formatMoney } from "@/components/useFx";
import { useT } from "@/components/useT";
import { ShowCard, type StaffReply } from "@/components/ShowCard";
import { LANGUAGES } from "@/lib/languages";
import { ALLERGENS, DIETS, allergyLinesZh, type AllergenId, type DietId } from "@/lib/allergens";
import { track } from "@/lib/track";
import { compressImage } from "@/lib/image";
import { fmt } from "@/lib/i18n";
import type { ListDish, DishDetail, MenuEvent } from "@/lib/dishes";
import { SourceLine } from "@/components/SourceLine";
import { Feedback } from "@/components/Feedback";
import { verdict, withDetailAllergens, type Verdict, type VerdictKind } from "@/lib/verdict";
import { VerdictTag, reasonText, verdictLabel } from "@/components/VerdictTag";
import { orderCard, staffReplies, allergyExplain as allergyExplainText } from "@/lib/order-card";

/** The menu as it streams in. `dishes` is indexed by position on the menu; gaps are still coming. */
type Menu = { cuisine: string; total: number; dishes: (ListDish | undefined)[]; tips: string[]; missing: number; streaming: boolean; demo?: boolean };

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Order line: how many, and which sauce/garnish ingredients (Chinese) to leave out. */
type Line = { qty: number; without: string[] };
type Detail = DishDetail | "loading" | "error";

// Details already fetched this session, by dish + language: reopening a dish is instant.
const detailCache = new Map<string, DishDetail>();

/** Menu dishes are regenerated when the prompts change; feedback is grouped by that version. */
const DISH_FEEDBACK_VERSION = "1";

function Spice({ n }: { n: number }) {
  const t = useT();
  if (!n) return null;
  // Ink, not red: red is reserved for "don't order".
  return (
    <span className="inline-flex text-ink" aria-label={fmt(t.eat.spice, { n })} role="img">
      {Array.from({ length: n }, (_, i) => <Flame key={i} className="h-3.5 w-3.5" aria-hidden />)}
    </span>
  );
}

function Stepper({ line, onChange }: { line: Line; onChange: (l: Line | undefined) => void }) {
  const t = useT();
  return (
    <span className="flex shrink-0 items-center rounded-control bg-cobalt-soft text-cobalt">
      <button onClick={() => onChange(line.qty > 1 ? { ...line, qty: line.qty - 1 } : undefined)} aria-label="−" className="grid h-11 w-10 place-items-center"><Minus className="h-4 w-4" /></button>
      <span className="min-w-6 text-center text-subhead font-semibold tabular-nums" aria-label={t.eat.inOrder}>{line.qty}</span>
      <button onClick={() => onChange({ ...line, qty: line.qty + 1 })} aria-label="+" className="grid h-11 w-10 place-items-center"><Plus className="h-4 w-4" /></button>
    </span>
  );
}

/** List card: name + price, Chinese + pinyin, one line, one verdict, add. Tap opens the detail. */
function DishRow({ d, v, restricted, line, onChange, onOpen, homePrice }: {
  d: ListDish; v: Verdict; restricted: boolean; line?: Line; onChange: (l: Line | undefined) => void; onOpen: () => void; homePrice?: string;
}) {
  const t = useT();
  return (
    <div className={`rounded-card border bg-card ${v.kind === "no" ? "border-danger" : "border-line"}`}>
      <button onClick={onOpen} className="block w-full px-4 pt-2.5 text-left">
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 text-body font-semibold">{d.name}</span>
          {d.price && <span className="shrink-0 text-subhead font-semibold tabular-nums">{d.price}</span>}
        </span>
        <span className="flex items-baseline justify-between gap-3">
          <span className="min-w-0 truncate text-footnote text-muted"><span className="zh" lang="zh-CN">{d.zh}</span> {d.pinyin}</span>
          {homePrice && <span className="shrink-0 text-footnote text-muted tabular-nums">{fmt(t.eat.approx, { amount: homePrice })}</span>}
        </span>
        <span className="mt-1 flex items-center gap-1.5 text-subhead">
          <span className="min-w-0 truncate">{d.short}</span><Spice n={d.spice} />
        </span>
      </button>
      <div className="flex min-h-11 items-center justify-between gap-2 pr-1.5 pb-1 pl-4">
        <span className="min-w-0">
          {restricted ? <VerdictTag v={v} /> : d.vegetarian ? <span className="tag"><Leaf className="h-3.5 w-3.5" aria-hidden />{t.eat.vegetarian}</span> : null}
        </span>
        {v.blocked.length ? (
          <ShieldAlert className="h-5 w-5 shrink-0 text-danger" aria-label={fmt(t.eat.blockedSevere, { x: v.blocked.map((a) => t.allergens[a as AllergenId].toLowerCase()).join(", ") })} />
        ) : line ? (
          <Stepper line={line} onChange={onChange} />
        ) : (
          <button onClick={() => onChange({ qty: 1, without: v.removable.map((a) => a.via_zh).filter(Boolean) })}
            className="flex min-h-11 shrink-0 items-center gap-1 rounded-control px-3 text-subhead font-semibold text-cobalt">
            <Plus className="h-4 w-4" aria-hidden />{t.eat.add}
          </button>
        )}
      </div>
    </div>
  );
}

function DishSkeleton() {
  return (
    <div className="animate-pulse rounded-card border border-line bg-card p-4" aria-hidden>
      <div className="h-4 w-2/3 rounded bg-line" />
      <div className="mt-2 h-3 w-1/3 rounded bg-line" />
      <div className="mt-3 h-3 w-5/6 rounded bg-line" />
    </div>
  );
}

/** Bottom sheet for one dish: why, what's usually in it, and the add actions. */
function DishSheet({ d, v, mine, detail, line, onAdd, onFlag, onClose, homePrice }: {
  d: ListDish; v: Verdict; mine: string[]; detail?: Detail; line?: Line; onAdd: (without: string[]) => void; onFlag: () => void; onClose: () => void; homePrice?: string;
}) {
  const t = useT();
  const speak = () => {
    const u = new SpeechSynthesisUtterance(d.zh);
    u.lang = "zh-CN";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  const hit = (ing: { allergens: string[] }) => ing.allergens.some((a) => mine.includes(a));
  const ings = typeof detail === "object" ? detail.ingredients : [];
  const groups = [
    { title: t.eat.detailOnMenu, list: ings.filter((i) => i.source === "menu") },
    { title: t.eat.detailUsually, list: ings.filter((i) => i.source !== "menu") },
  ].filter((g) => g.list.length);
  const removable = v.removable.map((a) => a.via).join(", ");
  const withoutOffer = v.kind === "ask" && v.removable.length > 0;

  return (
    <Sheet opened onBackdropClick={onClose} className="pb-safe" style={{ maxHeight: "88vh" }}>
      <div className="flex max-h-[88vh] flex-col bg-card text-ink">
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line" aria-hidden />
        <div className="flex shrink-0 items-start gap-3 px-4 pt-3">
          <div className="min-w-0 flex-1">
            <h2 className="text-title">{d.name}</h2>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2">
              <span className="zh whitespace-nowrap text-headline" lang="zh-CN">{d.zh}</span>
              <span className="text-subhead text-muted">{d.pinyin}</span>
              <button onClick={speak} aria-label={t.eat.listen} className="grid h-9 w-9 place-items-center rounded-full bg-cobalt-soft text-cobalt"><Volume2 className="h-4 w-4" /></button>
            </p>
          </div>
          <div className="shrink-0 text-right">
            {d.price && <p className="text-headline tabular-nums">{d.price}</p>}
            {homePrice && <p className="text-footnote text-muted tabular-nums">{fmt(t.eat.approx, { amount: homePrice })}</p>}
          </div>
          <button onClick={onClose} aria-label={t.common.close} className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-porcelain"><X className="h-5 w-5" /></button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-auto px-4 pt-3 pb-3">
          {typeof detail === "object" && detail.literal && <p className="text-subhead text-muted">{t.eat.detailLiteral}: “{detail.literal}”</p>}

          <div className={`rounded-card p-3 text-subhead ${v.confirm ? "bg-porcelain text-ink" : { ok: "bg-ok-soft text-ok", ask: "bg-warn-soft text-warn", no: "bg-danger-soft text-danger" }[v.kind]}`}>
            <p className="font-semibold">{verdictLabel(t, v)}</p>
            {v.blocked.length > 0 ? <p>{fmt(t.eat.blockedSevere, { x: v.blocked.map((a) => t.allergens[a as AllergenId].toLowerCase()).join(", ") })}</p>
              : v.kind === "ok" ? <p>{t.eat.whyOk}</p>
              : <p>{[...v.reasons.filter((r) => r.k !== "has" || v.kind === "no").map((r) => reasonText(t, r)), v.kind === "ask" && removable && fmt(t.eat.whyAsk, { x: removable })].filter(Boolean).join(" · ")}</p>}
          </div>

          {typeof detail === "object" && detail.description && <p className="text-body">{detail.description}</p>}
          {detail === "loading" && <div className="flex items-center gap-3 text-muted" role="status"><Preloader className="h-5! w-5!" />{t.common.loading}</div>}
          {detail === "error" && <Note tone="warn">{t.eat.detailDown}</Note>}

          {groups.map((g) => (
            <div key={g.title}>
              <p className="mb-1 text-footnote font-semibold text-muted">{g.title}</p>
              <ul className="divide-y divide-line rounded-card border border-line">
                {g.list.map((ing, j) => (
                  <li key={j} className={`flex justify-between gap-3 px-3 py-2 text-subhead ${hit(ing) ? "font-semibold text-danger" : ""}`}>
                    <span>{ing.name}</span><span className="zh text-muted" lang="zh-CN">{ing.zh}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {typeof detail === "object" && detail.notes && (
            <div>
              <p className="mb-1 text-footnote font-semibold text-muted">{t.eat.detailNotes}</p>
              <p className="flex gap-2 text-subhead"><Info className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden />{detail.notes}</p>
            </div>
          )}
          <p className="text-footnote text-muted">{t.eat.disclaimer}</p>
          <Feedback kind="menu_dish" id={d.zh} version={DISH_FEEDBACK_VERSION} reportLabel={t.eat.wrongInfo} onReport={onFlag} />
        </div>

        {/* Severe allergen anywhere in the usual recipe: no add button at all. "Don't order" for another
            reason (an allergen is a main ingredient, diet): only a plain, secondary Add — leaving out a
            sauce wouldn't fix it, so "add, without X" is offered only for "ask first". */}
        {!v.blocked.length && !line && (
          <div className="flex shrink-0 gap-2 border-t border-line px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            {withoutOffer && (
              <Button className="flex-1 text-subhead!" onClick={() => onAdd(v.removable.map((a) => a.via_zh).filter(Boolean))}>
                {fmt(t.eat.addWithout, { x: removable })}
              </Button>
            )}
            <Button variant={withoutOffer || v.kind === "no" ? "soft" : "primary"} className={`${withoutOffer ? "" : "flex-1"} text-subhead!`} onClick={() => onAdd(v.kind === "no" ? v.removable.map((a) => a.via_zh).filter(Boolean) : [])}>
              <Plus className="h-4 w-4" aria-hidden />{t.eat.add}
            </Button>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/**
 * What the allergy check covers, before and after a scan: which allergens and diets (severe ones
 * marked), that every dish is checked in its main ingredients, sauces and garnishes, and where
 * the check stops (kitchens vary). Off: says so, and how to turn it on.
 */
function AllergyStatus({ onEdit, onCard }: { onEdit: () => void; onCard: () => void }) {
  const t = useT();
  const [p] = useProfile();
  const on = p.allergens.length + p.diets.length > 0;
  if (!on) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-porcelain text-muted"><ShieldOff className="h-5 w-5" aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <p className="text-headline">{t.eat.checkOff}</p>
            <p className="mt-0.5 text-subhead text-muted">{t.eat.checkOffBody}</p>
          </div>
        </div>
        <Button variant="soft" className="mt-3 w-full text-subhead!" onClick={onEdit}>{t.eat.addRestrictions}</Button>
      </Card>
    );
  }
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-ok-soft text-ok"><ShieldCheck className="h-5 w-5" aria-hidden /></span>
        <p className="min-w-0 flex-1 text-headline">{t.eat.checkOn}</p>
        <button onClick={onEdit} className="flex min-h-touch shrink-0 items-center px-1 text-subhead font-semibold text-cobalt">{t.common.edit}</button>
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5" aria-label={t.eat.checkingFor}>
        {p.allergens.map((a) => {
          const severe = p.severe.includes(a);
          return (
            <li key={a} className={`tag ${severe ? "tag-danger" : ""}`}>
              {severe && <ShieldAlert className="h-3.5 w-3.5" aria-hidden />}
              {t.allergens[a as AllergenId]}{severe && ` · ${t.settings.severeShort}`}
            </li>
          );
        })}
        {p.diets.map((d) => <li key={d} className="tag">{t.diets[d as DietId]}</li>)}
      </ul>
      <p className="mt-3 text-footnote text-muted">{t.eat.checkScope}</p>
      <button onClick={onCard} className="mt-1 -mb-1 flex min-h-touch items-center gap-1.5 text-subhead font-semibold text-danger">
        <ShieldAlert className="h-4 w-4" aria-hidden />{t.eat.showAllergyCard}
      </button>
    </Card>
  );
}

/**
 * First visit to Eat: ask once about allergies, with "none" as the first answer. Once an allergen
 * is picked, "none" goes away (it would wipe the picks) and Save becomes the pinned main button.
 * New allergies start as severe; finer control per allergen is in Settings.
 */
function AllergySheet({ onDone }: { onDone: () => void }) {
  const t = useT();
  const [p, set] = useProfile();
  const [a, setA] = useState<string[]>(p.allergens);
  const [d, setD] = useState<string[]>(p.diets);
  const [severe, setSevere] = useState(p.allergens.length === 0 || p.severe.some((x) => p.allergens.includes(x)));
  const finish = (allergens: string[], diets: string[]) => {
    set({ allergens, diets, severe: severe ? allergens : allergens.filter((x) => p.severe.includes(x)), allergiesAsked: true });
    onDone();
  };
  return (
    <Popup opened onBackdropClick={() => finish(a, d)}>
      <div className="flex h-full flex-col bg-porcelain text-ink">
        <div className="min-h-0 flex-1 overflow-auto px-4 pt-[calc(16px+env(safe-area-inset-top))] pb-4">
          <h2 className="text-title">{t.eat.allergyAsk}</h2>
          <p className="mt-1 text-subhead text-muted">{t.eat.allergyAskSub}</p>
          {a.length === 0 && <Button className="mt-4 w-full" onClick={() => finish([], d)}>{t.eat.noAllergy}</Button>}
          <p className="mt-6 mb-2 text-subhead font-semibold text-muted">{t.settings.allergies}</p>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((x) => <button key={x.id} className="pill" aria-pressed={a.includes(x.id)} onClick={() => setA(toggle(a, x.id))}>{t.allergens[x.id]}</button>)}
          </div>
          {a.length > 0 && (
            <label className="mt-3 flex min-h-touch items-center gap-3 rounded-control bg-card px-3 ring-1 ring-line">
              <ShieldAlert className="h-5 w-5 shrink-0 text-danger" aria-hidden />
              <span className="min-w-0 flex-1 text-subhead">{t.settings.severe}</span>
              <input type="checkbox" className="h-6 w-6 accent-[var(--danger)]" checked={severe} onChange={() => setSevere(!severe)} />
            </label>
          )}
          <p className="mt-6 mb-2 text-subhead font-semibold text-muted">{t.settings.diet}</p>
          <div className="flex flex-wrap gap-2">
            {DIETS.map((x) => <button key={x.id} className="pill" aria-pressed={d.includes(x.id)} onClick={() => setD(toggle(d, x.id))}>{t.diets[x.id]}</button>)}
          </div>
        </div>
        {a.length + d.length > 0 && (
          <div className="shrink-0 border-t border-line px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            <Button className="w-full" onClick={() => finish(a, d)}>{t.eat.save}</Button>
          </div>
        )}
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
  const [menu, setMenu] = useState<Menu | null>(null);
  const [inputOpen, setInputOpen] = useState(true);
  const [filter, setFilter] = useState<"all" | VerdictKind>("all");
  const [tipsOpen, setTipsOpen] = useState(false);
  const [order, setOrder] = useState<Record<number, Line>>({});
  const [opened, setOpened] = useState<number | null>(null);
  const [details, setDetails] = useState<Record<number, Detail>>({});
  const [card, setCard] = useState<{ kind: string; lead?: string; lines: string[]; rest?: string[]; explain?: string; replies?: StaffReply[] } | null>(null);
  const [askAllergies, setAskAllergies] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => { if (loaded && !profile.allergiesAsked) setAskAllergies(true); }, [loaded, profile.allergiesAsked]);
  useEffect(() => () => abort.current?.abort(), []);

  const cityLabel = `${city.e} (${city.n}, ${city.p})`;

  /** Reads the NDJSON stream from /api/menu and renders each dish as it arrives. */
  async function run(body: object) {
    track("menu_scan", { input: "image" in body ? "photo" : "text" });
    abort.current?.abort();
    const ctl = (abort.current = new AbortController());
    const t0 = performance.now();
    setLoading(true); setError(undefined); setMenu(null); setOrder({}); setDetails({}); setFilter("all"); setTipsOpen(false);
    try {
      const r = await fetch("/api/menu", {
        method: "POST", signal: ctl.signal, headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...body, lang: profile.lang, city: cityLabel, adcode: city.a }),
      });
      // 503: no AI configured (production) · 429: rate limited · 422: unreadable → retake · anything else: the AI service failed.
      if (!r.ok || !r.body) throw new Error(r.status === 503 || r.status === 429 ? "unavailable" : r.status === 422 ? "unreadable" : "down");
      let m: Menu = { cuisine: "", total: 0, dishes: [], tips: [], missing: 0, streaming: true };
      setMenu(m);
      setInputOpen(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      const reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let buf = "", first = true;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += value;
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const l of lines) {
          if (!l.trim()) continue;
          const ev = JSON.parse(l) as MenuEvent | { type: "demo" } | { type: "error" } | { type: "done" };
          if (ev.type === "meta") m = { ...m, cuisine: ev.cuisine || m.cuisine, total: ev.total };
          else if (ev.type === "dish") {
            const dishes = [...m.dishes]; dishes[ev.i] = ev.dish; m = { ...m, dishes };
            if (first) { first = false; track("menu_first_dish", { ms: Math.round(performance.now() - t0), cached: ev.cached }); }
          }
          else if (ev.type === "tips") m = { ...m, tips: ev.tips };
          else if (ev.type === "missing") m = { ...m, missing: ev.i.length };
          else if (ev.type === "demo") m = { ...m, demo: true };
          else if (ev.type === "error") m = { ...m, missing: m.total - m.dishes.filter(Boolean).length };
          else if (ev.type === "done") m = { ...m, streaming: false };
          setMenu(m);
        }
      }
      setMenu({ ...m, streaming: false });
      track("menu_done", { ms: Math.round(performance.now() - t0), dishes: m.dishes.filter(Boolean).length, missing: m.missing });
    } catch (e) {
      if (ctl.signal.aborted) return;
      const msg = (e as Error).message;
      setMenu(null); setInputOpen(true);
      setError(msg === "unavailable" ? t.common.unavailable : msg === "unreadable" ? t.eat.error : t.eat.aiDown);
    } finally {
      if (abort.current === ctl) setLoading(false);
    }
  }

  async function onFile(f?: File) {
    if (!f) return;
    const img = await compressImage(f);
    setPreview(img.preview);
    run({ image: img.data, mediaType: img.mediaType });
  }

  const restrictions = { allergens: profile.allergens, diets: profile.diets, severe: profile.severe.filter((a) => profile.allergens.includes(a)) };
  const restricted = restrictions.allergens.length + restrictions.diets.length > 0;
  const rows = useMemo(() => (menu?.dishes ?? []).flatMap((d, i) => (d ? [{ d, i, v: verdict(d, restrictions) }] : [])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menu, profile.allergens, profile.diets, profile.severe]);
  const count = (k: VerdictKind) => rows.filter((r) => r.v.kind === k).length;
  // Menu order, not "ok" first: a dish at the top of the list must not read as a recommendation.
  const shown = filter === "all" ? rows : rows.filter((r) => r.v.kind === filter);
  const pending = menu?.streaming ? Math.max(0, menu.total - rows.length - menu.missing) : 0;
  const restrictionNames = [...profile.allergens.map((a) => t.allergens[a as AllergenId]), ...profile.diets.map((d) => t.diets[d as DietId])];
  const restrictionLabels = [
    ...profile.allergens.map((a) => `${t.allergens[a as AllergenId]}${profile.severe.includes(a) ? ` (${t.settings.severeShort})` : ""}`),
    ...profile.diets.map((d) => t.diets[d as DietId]),
  ];
  const homePrice = (price: string) => {
    const cny = parseCny(price);
    return cny && fx && profile.homeCurrency !== "CNY" ? formatMoney(cny / fx.value, profile.homeCurrency, profile.lang) : undefined;
  };
  // A dish added before an allergy was marked severe drops out of the order.
  const orderLines = Object.entries(order).map(([i, l]) => ({ row: rows.find((r) => r.i === Number(i)), l }))
    .filter((x): x is { row: (typeof rows)[number]; l: Line } => Boolean(x.row && !x.row.v.blocked.length));
  const dishCount = orderLines.reduce((n, x) => n + x.l.qty, 0);
  const setLine = (i: number, l?: Line) => setOrder((o) => { const n = { ...o }; if (l) n[i] = l; else delete n[i]; return n; });

  async function openDish(i: number) {
    setOpened(i);
    const d = menu?.dishes[i];
    if (!d || details[i]) return;
    const k = `${d.zh}|${profile.lang}|${city.a}`;
    const got = (detail: Detail) => {
      setDetails((x) => ({ ...x, [i]: detail }));
      // Allergens the detail adds make the verdict stricter, never looser.
      if (typeof detail === "object") setMenu((m) => m && { ...m, dishes: m.dishes.map((x, j) => (j === i && x ? withDetailAllergens(x, detail.ingredients) : x)) });
    };
    const hit = detailCache.get(k);
    if (hit) return got(hit);
    setDetails((x) => ({ ...x, [i]: "loading" }));
    try {
      const r = await fetch("/api/dish", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ zh: d.zh, printed: d.printed, lang: profile.lang, city: cityLabel, adcode: city.a }) });
      if (!r.ok) throw new Error(String(r.status));
      const detail = (await r.json()) as DishDetail;
      detailCache.set(k, detail);
      got(detail);
    } catch { got("error"); }
  }

  function flagDish(d: ListDish) {
    track("dish_flagged", {});
    for (const k of detailCache.keys()) if (k.startsWith(`${d.zh}|`)) detailCache.delete(k);
    fetch("/api/dish/flag", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ zh: d.zh, adcode: city.a, lang: profile.lang }) }).catch(() => {});
  }

  const replies = (withCant: boolean) => staffReplies(t, profile, withCant);
  const allergyExplain = allergyExplainText(t, profile);

  function showOrder() {
    track("order_card_shown", { dishes: orderLines.length, severe: Boolean(allergyLinesZh(profile.allergens, profile.diets, profile.severe).severe) });
    setCard(orderCard(t, profile, orderLines.map(({ row, l }) => ({ zh: row.d.zh, name: row.d.name, qty: l.qty, without: l.without }))));
  }

  function showAllergyCard() {
    const { severe, rest } = allergyLinesZh(profile.allergens, profile.diets, profile.severe);
    setCard({ kind: "allergy", lead: severe || undefined, lines: ["您好！我有饮食限制，麻烦您帮忙确认，谢谢！"], rest, explain: allergyExplain, replies: replies(false) });
  }

  const openRow = opened == null ? undefined : rows.find((r) => r.i === opened);

  return (
    <Screen title={t.eat.title}>
      {/* Two inputs: the camera, and the photo library (a menu photographed earlier, or a screenshot). */}
      <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={libraryRef} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ""; }} />

      {(!menu || inputOpen) && (
        <Section>
          <Card>
            {mode === "photo" ? (
              <>
                <div className="flex items-center gap-3">
                  {preview
                    ? <img src={preview} alt="" className="h-12 w-12 shrink-0 rounded-control object-cover" />
                    : <span className="grid h-12 w-12 shrink-0 place-items-center rounded-control bg-cobalt-soft text-cobalt"><ScanText className="h-6 w-6" aria-hidden /></span>}
                  <h2 className="min-w-0 flex-1 text-headline">{preview ? t.eat.scanAnother : t.today.tileMenu}</h2>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button onClick={() => fileRef.current?.click()} disabled={loading} className="min-w-0 px-2.5! py-1.5 text-subhead! leading-tight"><Camera className="h-5 w-5 shrink-0" aria-hidden /><span>{t.eat.takePhotoBtn}</span></Button>
                  <Button variant="soft" onClick={() => libraryRef.current?.click()} disabled={loading} className="min-w-0 px-2.5! py-1.5 text-subhead! leading-tight"><Images className="h-5 w-5 shrink-0" aria-hidden /><span>{t.eat.choosePhoto}</span></Button>
                </div>
              </>
            ) : (
              <>
                <label className="block">
                  <span className="block text-headline">{t.eat.dishNames}</span>
                  <textarea rows={4} placeholder={"宫保鸡丁\n鱼香肉丝"} value={text} onChange={(e) => setText(e.target.value)}
                    className="zh mt-2 w-full resize-none rounded-control bg-porcelain p-3 text-body outline-none placeholder:text-muted" />
                </label>
                <Button className="mt-3 w-full" disabled={loading || !text.trim()} onClick={() => run({ text })}>{t.eat.lookUp}</Button>
              </>
            )}
            <div className="mt-2 -mb-2 flex flex-wrap items-center justify-between gap-x-3">
              <button onClick={() => setMode(mode === "photo" ? "type" : "photo")} className="flex min-h-touch items-center gap-1.5 text-subhead font-semibold text-cobalt">
                {mode === "photo" ? <Keyboard className="h-4 w-4" aria-hidden /> : <Camera className="h-4 w-4" aria-hidden />}{mode === "photo" ? t.eat.typeInstead : t.eat.photoInstead}
              </button>
              {/* The native select sits invisibly over its label, so the row is only as wide as the chosen language. */}
              <label className="relative flex min-h-touch items-center gap-1 text-footnote text-muted">
                {t.eat.translateInto}
                <span className="flex items-center gap-0.5 font-semibold text-cobalt">{LANGUAGES.find((l) => l.code === profile.lang)?.name ?? profile.lang}<ChevronDown className="h-3.5 w-3.5" aria-hidden /></span>
                <select value={profile.lang} onChange={(e) => setProfile({ lang: e.target.value })} aria-label={t.eat.translateInto} className="absolute inset-0 cursor-pointer opacity-0">
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}
                </select>
              </label>
            </div>
          </Card>
          <AllergyStatus onEdit={() => setAskAllergies(true)} onCard={showAllergyCard} />
          {/* Where to eat: Explore's restaurant list (award lists, or well-rated places). */}
          {!menu && (
            <Group>
              <Row href="/explore?tab=restaurants" icon={<IconTile><UtensilsCrossed className="h-5 w-5" aria-hidden /></IconTile>} title={fmt(t.awards.eatEntry, { city: city.e })} />
            </Group>
          )}
        </Section>
      )}

      {loading && !menu && (
        <div className="flex items-center justify-center gap-3 py-6 text-muted" role="status">
          <Preloader className="h-6! w-6!" /> {t.eat.readingMenu}
        </div>
      )}
      {error && <Section><Note tone="danger">{error}</Note></Section>}

      {menu && (
        <div ref={resultsRef} className="scroll-mt-2">
          <Section>
            <div className="space-y-2 px-1">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-headline">
                    {menu.total ? fmt(t.eat.dishes, { type: menu.cuisine, n: menu.total }).replace(/^ · /, "") : t.eat.readingMenu}
                  </p>
                  {menu.streaming && menu.total > 0 && (
                    <p className="text-footnote text-muted tabular-nums" role="status">{fmt(t.eat.progress, { n: rows.length, total: menu.total })}</p>
                  )}
                </div>
                {!inputOpen && (
                  // Scan again / type instead, folded into the summary line so dishes start higher.
                  <div className="flex shrink-0 gap-2">
                    <IconButton label={t.eat.takePhotoBtn} onClick={() => fileRef.current?.click()}><Camera className="h-5 w-5" /></IconButton>
                    <IconButton label={t.eat.choosePhoto} onClick={() => libraryRef.current?.click()}><Images className="h-5 w-5" /></IconButton>
                    <IconButton label={t.eat.type} onClick={() => { setMode("type"); setInputOpen(true); }}><Keyboard className="h-5 w-5" /></IconButton>
                  </div>
                )}
              </div>
              {menu.streaming && menu.total > 0 && (
                <div className="h-1 overflow-hidden rounded-full bg-line" aria-hidden>
                  <div className="h-full rounded-full bg-cobalt transition-[width] duration-300" style={{ width: `${(rows.length / menu.total) * 100}%` }} />
                </div>
              )}
              {/* What this list was checked for, always visible above the dishes. */}
              <button onClick={() => setAskAllergies(true)} className="flex min-h-touch w-full items-center gap-2 rounded-control bg-card px-3 text-left text-footnote ring-1 ring-line">
                {restricted ? <ShieldCheck className="h-4 w-4 shrink-0 text-ok" aria-hidden /> : <ShieldOff className="h-4 w-4 shrink-0 text-muted" aria-hidden />}
                <span className="min-w-0 flex-1">{restricted ? fmt(t.eat.checkedFor, { list: restrictionLabels.join(", ") }) : t.eat.notChecked}</span>
                <span className="shrink-0 font-semibold text-cobalt">{restricted ? t.common.edit : t.eat.turnOn}</span>
              </button>
              {restricted && rows.length > 0 && (
                <div className="chip-row">
                  {([["all", t.eat.all, rows.length], ["ok", t.eat.filterOk, count("ok")], ["ask", t.eat.filterAsk, count("ask")], ["no", t.eat.filterNo, count("no")]] as const)
                    .filter(([k, , n]) => k === "all" || n > 0)
                    .map(([k, label, n]) => (
                      <button key={k} className="pill tabular-nums" aria-pressed={filter === k} onClick={() => setFilter(k)}>{label} {n}</button>
                    ))}
                </div>
              )}
            </div>
            <DemoNote show={menu.demo} what={t.common.aiKey} />
            {menu.tips.length > 0 && (
              <div>
                <button onClick={() => setTipsOpen(!tipsOpen)} aria-expanded={tipsOpen} className="flex min-h-11 items-center gap-1 px-1 text-subhead font-semibold text-cobalt">
                  <Lightbulb className="h-4 w-4" aria-hidden />{fmt(t.eat.tipsRow, { n: menu.tips.length })}
                  <ChevronRight className={`h-4 w-4 transition-transform ${tipsOpen ? "rotate-90" : ""}`} aria-hidden />
                </button>
                {tipsOpen && <div className="space-y-2">{menu.tips.map((tip, i) => <Note key={i}>{tip}</Note>)}</div>}
              </div>
            )}
            {shown.map(({ d, i, v }) => (
              <DishRow key={i} d={d} v={v} restricted={restricted} line={order[i]} homePrice={homePrice(d.price)}
                onOpen={() => openDish(i)} onChange={(l) => setLine(i, l)} />
            ))}
            {filter === "all" && Array.from({ length: Math.min(pending, 3) }, (_, k) => <DishSkeleton key={`s${k}`} />)}
            {!menu.streaming && menu.total === 0 && <Note tone="warn">{t.eat.noneRead}</Note>}
            {menu.missing > 0 && <Note tone="warn">{fmt(t.eat.missing, { n: menu.missing })}</Note>}
            {rows.length > 0 && <>
              <SourceLine ai name={t.eat.aiSource} />
              <p className="px-1 text-footnote text-muted">{t.eat.disclaimer}</p>
            </>}
            <div className="sticky-spacer" aria-hidden />
          </Section>
        </div>
      )}

      {menu && (dishCount > 0 || restricted) && (
        <div className="sticky-bottom flex items-center justify-end gap-2">
          {dishCount > 0 && (
            <Button variant="ink" className="flex-1 shadow-float" onClick={showOrder}>
              <ReceiptText className="h-5 w-5" aria-hidden />{fmt(t.eat.orderBar, { n: dishCount })}
            </Button>
          )}
          {profile.allergens.length + profile.diets.length > 0 && (
            <button aria-label={t.eat.showAllergyCard}
              onClick={showAllergyCard}
              className="flex min-h-control shrink-0 items-center gap-1.5 rounded-full bg-card px-4 text-subhead font-semibold text-danger shadow-float ring-1 ring-line">
              <ShieldAlert className="h-5 w-5" aria-hidden />{dishCount > 0 ? null : t.eat.allergyCardShort}
            </button>
          )}
        </div>
      )}
      {openRow && (
        <DishSheet d={openRow.d} v={openRow.v} mine={profile.allergens} detail={details[openRow.i]} line={order[openRow.i]} homePrice={homePrice(openRow.d.price)}
          onAdd={(without) => { setLine(openRow.i, { qty: 1, without }); setOpened(null); }}
          onFlag={() => flagDish(openRow.d)} onClose={() => setOpened(null)} />
      )}
      {card && <ShowCard {...card} onClose={() => setCard(null)} />}
      {askAllergies && <AllergySheet onDone={() => setAskAllergies(false)} />}
      <Link href="/settings#food" className="sr-only">{t.common.settings}</Link>
    </Screen>
  );
}
