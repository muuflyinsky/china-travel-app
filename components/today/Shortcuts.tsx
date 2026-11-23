"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ScanLine, ShieldAlert, CarTaxiFront, Wallet, Languages, MapPin, Calculator, CalendarCheck, BookOpen, Receipt, PlaneLanding, ListChecks,
  Pencil, X, ChevronRight,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import { EditSheet } from "@/components/EditSheet";
import { DriverPanel } from "@/components/DriverPanel";
import { PriceCheck } from "@/components/PriceCheck";
import { AllergyShowCard } from "@/components/AllergyShowCard";
import { useProfile } from "@/components/useProfile";
import { useCity } from "@/components/useCity";
import { useT } from "@/components/useT";
import { Alarms, Checklist, useAlarms, usePrep } from "./Plan";
import { EditToday } from "./EditToday";
import { AIRPORTS, airportsIn } from "@/lib/airports";
import { RESERVATIONS } from "@/lib/reservations";
import { fmt } from "@/lib/i18n";
import { shortcutsOf, useTodayPrefs, withAllergyCard, type ShortcutId } from "@/lib/today";
import type { Phase } from "@/lib/phase";

type Sheet = "driver" | "price" | "today" | "ready" | "allergy" | null;

export const SHORTCUT_ICON: Record<ShortcutId, typeof ScanLine> = {
  menu: ScanLine, allergy: ShieldAlert, driver: CarTaxiFront, pay: Wallet, translate: Languages, nearby: MapPin,
  price: Calculator, today: CalendarCheck, phrase: BookOpen, tax: Receipt, airport: PlaneLanding, ready: ListChecks,
};

/** Titles, shared with the editor. Existing keys where there was one (design §5.1). */
export function useShortcutTitle() {
  const t = useT();
  return (id: ShortcutId) => ({
    menu: t.today.scanMenu, allergy: t.today.allergyCard, driver: t.today.tileDriver, pay: t.inapp.tilePay, translate: t.talk.translate,
    nearby: t.go.nearby, price: t.today.priceCheck, today: t.today.tileToday, phrase: t.talk.phrasebook, tax: t.home.tTax,
    airport: t.home.tAirport, ready: t.home.tReady,
  })[id];
}

/** The allergens on file in the traveller's language, for subtitles. */
export function useAllergenNames() {
  const t = useT();
  const [p] = useProfile();
  return p.allergens.map((a) => t.allergens[a as keyof typeof t.allergens] ?? a);
}

/** Press and hold (500 ms, under 10 px of movement) on a touch screen; mice use the Edit button. */
function useLongPress(onLong: () => void) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);
  const cancel = () => { if (timer.current) clearTimeout(timer.current); timer.current = null; start.current = null; };
  useEffect(() => cancel, []);
  return {
    onPointerDown: (e: React.PointerEvent) => {
      fired.current = false;
      if (e.pointerType === "mouse") return;
      start.current = { x: e.clientX, y: e.clientY };
      timer.current = setTimeout(() => { fired.current = true; cancel(); navigator.vibrate?.(10); onLong(); }, 500);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (start.current && Math.hypot(e.clientX - start.current.x, e.clientY - start.current.y) > 10) cancel();
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onPointerLeave: cancel,
    // The tap that ends a long press must not also open the shortcut.
    onClickCapture: (e: React.MouseEvent) => { if (fired.current) { e.preventDefault(); e.stopPropagation(); fired.current = false; } },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}

/**
 * Today's shortcuts (DECISIONS D17, design §5.1–5.5): one tap does the thing. The traveller picks,
 * hides and orders them; the first is shown large. Only our own pages and panels (D19).
 */
export function Shortcuts({ phase }: { phase: Phase }) {
  const t = useT();
  const router = useRouter();
  const [p] = useProfile();
  const { city } = useCity();
  const { prefs, update, loaded } = useTodayPrefs();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [editing, setEditing] = useState(false);
  const title = useShortcutTitle();
  const allergenNames = useAllergenNames();
  const hasAllergies = p.allergens.length > 0;
  const { list: alarms } = useAlarms(false, sheet);
  const prep = usePrep();
  const press = useLongPress(() => openEditor());

  // First time allergies are set: the allergy card goes second, once (D17).
  useEffect(() => {
    if (!loaded || !hasAllergies || prefs.allergyAutoAdded) return;
    update((cur) => ({ allergyAutoAdded: true, ...(cur.shortcuts ? { shortcuts: withAllergyCard(cur.shortcuts) } : {}) }));
  }, [loaded, hasAllergies, prefs.allergyAutoAdded, update]);

  function openEditor() {
    setEditing(true);
    if (!prefs.hintDone) update({ hintDone: true });
  }

  const ids = shortcutsOf(prefs, hasAllergies);
  const next = alarms[0] && RESERVATIONS.find((r) => r.id === alarms[0].id);
  const nextWhen = alarms[0] && new Date(alarms[0].at).toLocaleTimeString(p.lang, { hour: "2-digit", minute: "2-digit" });
  const checks = [
    ...p.allergens.map((a) => `${t.allergens[a as keyof typeof t.allergens]}${p.severe.includes(a) ? ` (${t.settings.severeShort})` : ""}`),
    ...p.diets.map((d) => t.diets[d as keyof typeof t.diets]),
  ];
  const firstCity = [...p.cities].sort((a, b) => (a.from ?? "").localeCompare(b.from ?? ""))[0];
  const tripAirports = firstCity ? airportsIn(firstCity.a).map((a) => a.code) : [];

  /** What each shortcut says and does. */
  const meta = (id: ShortcutId): { sub?: React.ReactNode; href?: string; onClick?: () => void } => {
    switch (id) {
      case "menu": return { href: "/app/menu", sub: phase === "before" ? t.home.sMenuTry : checks.length ? `${t.eat.checkingFor} ${checks.join(", ")}` : t.home.sMenuPlain };
      case "allergy": return hasAllergies
        ? { onClick: () => setSheet("allergy"), sub: fmt(t.home.sAllergy, { allergens: allergenNames.join(", ") }) }
        : { href: "/app/settings#allergies", sub: t.today.allergyCardEmpty };
      case "driver": return { onClick: () => setSheet("driver"), sub: p.hotel ? <span className="zh">{p.hotel.name}</span> : t.today.tileDriverAdd };
      case "pay": return { href: "/app/pay-codes", sub: t.inapp.tilePaySub };
      case "translate": return { href: "/app/talk?focus=1", sub: t.home.sTranslate };
      case "nearby": return { href: "/app/explore#nearby", sub: t.home.sNearby };
      case "price": return { onClick: () => setSheet("price"), sub: `¥ → ${p.homeCurrency}` };
      case "today": return {
        onClick: () => (alarms.length ? setSheet("today") : router.push("/app/explore")),
        sub: next ? fmt(t.today.tileTodayAlarm, { name: next.en, when: nextWhen! }) : fmt(t.today.tileTodaySub, { city: city.e }),
      };
      case "phrase": return { href: "/app/talk#phrases", sub: t.home.sPhrase };
      case "tax": return { href: "/app/tax-refund", sub: t.home.sTax };
      case "airport": return { href: "/app/airport", sub: tripAirports.length ? tripAirports.join(" · ") : fmt(t.home.sAirports, { n: AIRPORTS.length }) };
      case "ready": return { onClick: () => setSheet("ready"), sub: fmt(t.home.beforeCount, { done: prep.count, total: prep.total }) };
    }
  };

  const tile = (id: ShortcutId, big: boolean) => {
    const m = meta(id);
    const Icon = SHORTCUT_ICON[id];
    const cls = big
      ? "col-span-2 flex min-h-24 items-center gap-3 rounded-card bg-cobalt px-4 py-3 text-left text-white dark:text-porcelain"
      : "flex min-h-[88px] flex-col items-start gap-1 rounded-card border border-line bg-card p-3.5 text-left";
    const body = big ? (
      <>
        <span className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-control bg-white/20"><Icon className="h-6 w-6" aria-hidden /></span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-2 block text-title">{title(id)}</span>
          {m.sub && <span className="mt-0.5 block truncate text-footnote opacity-90">{m.sub}</span>}
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 opacity-80" aria-hidden />
      </>
    ) : (
      <>
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-cobalt-soft text-cobalt"><Icon className="h-5 w-5" aria-hidden /></span>
        <span className="line-clamp-2 text-headline">{title(id)}</span>
        {m.sub && <span className="w-full truncate text-footnote text-muted">{m.sub}</span>}
      </>
    );
    const common = { ...press, className: `${cls} select-none [-webkit-touch-callout:none]`, "aria-describedby": "shortcuts-edit-hint" };
    return m.href
      ? <Link key={id} href={m.href} {...common}>{body}</Link>
      : <button key={id} type="button" onClick={m.onClick} {...common}>{body}</button>;
  };

  if (!loaded) return null;
  return (
    <section className="mt-section first:mt-2" aria-labelledby="shortcuts-title">
      <div className="mb-2 flex min-h-6 items-center justify-between gap-3 px-1">
        <h2 id="shortcuts-title" className="text-footnote font-semibold text-muted">{t.home.shortcuts}</h2>
        <button type="button" onClick={openEditor} aria-label={t.home.editShortcuts}
          className="-my-2 flex min-h-11 items-center gap-1 px-1 text-subhead font-semibold text-cobalt">
          <Pencil className="h-4 w-4" aria-hidden />{t.home.edit}
        </button>
      </div>
      <span id="shortcuts-edit-hint" className="sr-only">{t.home.hint}</span>
      <div className="grid grid-cols-2 gap-[10px]">
        {ids.map((id, i) => tile(id, i === 0))}
      </div>
      {!prefs.hintDone && (
        <p className="mt-stack flex items-start gap-2 rounded-control bg-cobalt-soft py-2 pr-1 pl-3 text-subhead text-ink">
          <Pencil className="mt-1 h-4 w-4 shrink-0 text-cobalt" aria-hidden />
          <span className="min-w-0 flex-1 py-1">{t.home.hint}</span>
          <button type="button" onClick={() => update({ hintDone: true })} aria-label={t.common.close}
            className="-my-1 grid h-touch w-touch shrink-0 place-items-center rounded-full text-muted"><X className="h-4 w-4" aria-hidden /></button>
        </p>
      )}

      <EditToday open={editing} onClose={() => setEditing(false)} />
      <EditSheet open={sheet === "driver"} title={t.today.tileDriver} onClose={() => setSheet(null)}>
        <DriverPanel />
      </EditSheet>
      <EditSheet open={sheet === "price"} title={t.today.priceCheck} onClose={() => setSheet(null)}>
        <Card><PriceCheck /></Card>
      </EditSheet>
      <EditSheet open={sheet === "today"} title={t.today.tileToday} onClose={() => setSheet(null)}>
        <Alarms suggest={false} bare />
        <Button variant="soft" href="/app/explore" className="w-full">{fmt(t.today.tileTodaySub, { city: city.e })}</Button>
      </EditSheet>
      <EditSheet open={sheet === "ready"} title={t.home.tReady} onClose={() => setSheet(null)}>
        <Checklist alwaysOpen />
      </EditSheet>
      {sheet === "allergy" && <AllergyShowCard onClose={() => setSheet(null)} />}
    </section>
  );
}
