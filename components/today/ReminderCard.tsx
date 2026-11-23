"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Sheet } from "konsta/react";
import { CalendarClock, CalendarPlus, CalendarRange, Ellipsis, ListChecks, PlaneLanding, PlaneTakeoff, TrainFront, ArrowRightLeft, X } from "lucide-react";
import { EditSheet } from "@/components/EditSheet";
import { DriverPanel } from "@/components/DriverPanel";
import { useProfile } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { fmt } from "@/lib/i18n";
import { goLink } from "@/lib/affiliate";
import { addDays, daysBetween, stayWindow, todayIso } from "@/lib/stay";
import { HOLIDAYS_CHECKED, OFFICIAL, holidaysAhead, isMajor, trainSaleDay } from "@/lib/holidays";
import { hideUntil, isHidden, reminderOn, useTodayPrefs, type ReminderType } from "@/lib/today";
import type { Phase } from "@/lib/phase";
import { fmtDay, usePrep } from "./Plan";
import { StaySheet, countryName } from "./StaySheet";

type Action = { label: string; href?: string; external?: boolean; onClick?: () => void; cta?: boolean };
type Candidate = {
  type: ReminderType; key: string; Icon: typeof CalendarClock; label: string;
  title: string; body?: string; foot?: React.ReactNode; actions: Action[];
};

/**
 * The one reminder card at the top of Today (DECISIONS D17, design §4.3 and §5.6): at most one,
 * only from what the traveller entered, none when unsure. Each type can be hidden or switched
 * off, except the stay limit, which can only be corrected.
 */
export function ReminderCard({ phase }: { phase: Phase }) {
  const t = useT();
  const h = t.home;
  const [p] = useProfile();
  const { prefs, update, loaded } = useTodayPrefs();
  const prep = usePrep();
  const [menu, setMenu] = useState(false);
  const [visa, setVisa] = useState(false);
  const [driver, setDriver] = useState(false);
  const [undo, setUndo] = useState<string | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (undoTimer.current) clearTimeout(undoTimer.current); }, []);

  const today = todayIso();
  const day = (iso: string) => fmtDay(iso, p.lang);
  const list: Candidate[] = [];

  // Stay limit: the planned departure is after the legal limit, or 3 days or fewer are left in China.
  const w = stayWindow(p);
  // Once the planned departure has passed the trip is over (phase is "before" again): never a stay card then.
  const tripOver = Boolean(p.departure && today > p.departure);
  if (w && !tripOver) {
    const left = daysBetween(today, w.legal);
    const inChinaSoon = w.entered && left <= 3;
    if (w.overstay || inChinaSoon) {
      const kind = p.stayUntil ? fmt(h.bExtended, { date: day(p.stayUntil) })
        : p.entryType === "visa" ? fmt(h.bVisa, { n: w.allowed })
        : p.entryType === "transit_240" ? h.bTransit : fmt(h.bFree, { n: w.allowed });
      const basis = [p.nationality && countryName(p.nationality, p.lang), kind, fmt(w.entered ? h.bEntered : h.bEntering, { date: day(w.base) })].filter(Boolean).join(" · ");
      list.push({
        type: "stay", key: "stay", Icon: CalendarClock, label: h.rStay,
        title: inChinaSoon
          ? left < 0 ? h.stayOverdueTitle : left === 0 ? h.stayLastTitle : fmt(h.stayLeftTitle, { n: left })
          : fmt(h.stayOverTitle, { n: daysBetween(w.legal, w.planned) }),
        body: inChinaSoon && left < 0 ? fmt(t.stay.overdue, { n: -left })
          : w.overstay ? fmt(h.stayOverBody, { legal: day(w.legal), planned: day(w.planned) })
          : fmt(t.stay.leaveBy, { date: day(w.legal) }),
        foot: fmt(h.basedOn, { basis }),
        actions: [{ label: h.changeDates, href: "/app/settings#dates" }, { label: h.haveVisa, onClick: () => setVisa(true) }],
      });
    }
  }

  if (p.arrival === today || p.entryDate === today) {
    list.push({ type: "arrival", key: `arrival:${today}`, Icon: PlaneLanding, label: h.rArrival, title: t.today.fromAirportTitle, body: t.today.fromAirportBody,
      actions: [{ label: t.today.fromAirportOpen, href: "/app/airport" }] });
  }

  if (phase === "leaving" && w) {
    list.push({ type: "leaving", key: `leaving:${w.lastDay}`, Icon: PlaneTakeoff, label: h.rLeaving, title: t.today.airportTitle,
      body: p.departure ? fmt(t.today.airportBody, { date: fmtDay(p.departure, p.lang, "long") }) : t.today.airportBodyNoDate,
      actions: [{ label: t.today.airportFind, href: "/app/airport?dir=out" }, { label: h.tTax, href: "/app/tax-refund" }] });
  }

  // City moves: each trip city with a start date after the first one.
  const legs = [...p.cities].filter((c) => c.from).sort((a, b) => a.from!.localeCompare(b.from!))
    .flatMap((c, i, all) => (i ? [{ from: all[i - 1], to: c, date: c.from! }] : []));
  const move = legs.find((l) => l.date === today);
  if (move) {
    list.push({ type: "moving", key: `moving:${today}:${move.to.a}`, Icon: ArrowRightLeft, label: h.rMoving, title: fmt(h.movingTitle, { city: move.to.e }), body: h.movingBody,
      actions: [{ label: t.today.tileDriver, onClick: () => setDriver(true) }] });
  }

  // Train tickets: only when sales open today or tomorrow (12306 sells 15 days ahead).
  const train = legs.find((l) => l.date > today && [today, addDays(today, 1)].includes(trainSaleDay(l.date)));
  if (train) {
    const sale = trainSaleDay(train.date);
    list.push({ type: "train", key: `train:${train.date}:${train.to.a}`, Icon: TrainFront, label: h.rTrain,
      title: fmt(t.alerts.trainTitle, { from: train.from.e, to: train.to.e, date: day(train.date) }),
      body: sale <= today ? t.alerts.trainOnSale : fmt(t.alerts.trainSoon, { date: day(sale) }),
      actions: [{ label: t.prepare.findTrains, cta: true, external: true, href: goLink("trip", "train", { from: train.from.e, to: train.to.e, date: train.date }, "today_train", "today-train-alert") }] });
  }

  // Before you fly: the next unticked item of the checklist, once there is an arrival date.
  if (phase === "before" && p.arrival && p.arrival >= today && prep.next) {
    list.push({ type: "before", key: `before:${prep.next.key}`, Icon: ListChecks, label: `${h.rBefore} · ${fmt(h.beforeCount, { done: prep.count, total: prep.total })}`,
      title: fmt(h.beforeNext, { item: prep.next.title }), actions: [{ label: h.howTo, href: `#${prep.next.key}` }] });
  }

  // Only with dates (design §5.6: no dates, no reminder cards).
  const hol = p.arrival || p.departure ? holidaysAhead(today, p.arrival && p.departure ? { from: p.arrival, to: p.departure } : undefined)[0] : undefined;
  if (hol) {
    const span = hol.days[0] === hol.days[1] ? day(hol.days[0]) : `${day(hol.days[0])} – ${day(hol.days[1])}`;
    list.push({ type: "holiday", key: `holiday:${hol.id}:${hol.days[0]}`, Icon: CalendarRange, label: h.rHoliday,
      title: fmt(isMajor(hol) ? t.alerts.busyTitle : t.alerts.shortTitle, { name: t.alerts.names[hol.id], dates: span }),
      body: isMajor(hol) ? t.alerts.busyBody : t.alerts.shortBody,
      foot: <><span className="zh" lang="zh-CN">{hol.zh}</span> · {OFFICIAL ? fmt(t.src.checked, { date: day(HOLIDAYS_CHECKED) }) : t.alerts.unofficial}</>,
      actions: [] });
  }

  const card = loaded ? list.find((c) => reminderOn(prefs, c.type) && (c.type === "stay" || !isHidden(prefs, c.key, today))) : undefined;

  const hide = (key: string, how: "never" | "tomorrow") => {
    update((cur) => ({ hidden: { ...cur.hidden, [key]: hideUntil(how, today) } }));
    if (how === "never") {
      setUndo(key);
      if (undoTimer.current) clearTimeout(undoTimer.current);
      undoTimer.current = setTimeout(() => setUndo(null), 4000);
    }
  };
  const restore = () => {
    if (!undo) return;
    const key = undo;
    update((cur) => { const hidden = { ...cur.hidden }; delete hidden[key]; return { hidden }; });
    setUndo(null);
  };

  // No dates at all: no reminders, one quiet line instead (dismissable for good).
  const noDates = !p.arrival && !p.entryDate && !p.departure;

  return (
    <>
      {card ? <Card c={card} onMenu={() => setMenu(true)} onSwipe={() => hide(card.key, "never")} />
        : loaded && noDates && !prefs.datesHintDone && (
          <div className="mt-2 flex items-center rounded-card border border-line bg-card pr-1">
            <Link href="/app/settings#dates" className="flex min-h-[52px] flex-1 items-center gap-3 px-4 text-subhead">
              <CalendarPlus className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{h.addDates}
            </Link>
            <button type="button" onClick={() => update({ datesHintDone: true })} aria-label={t.common.close}
              className="grid h-touch w-touch shrink-0 place-items-center rounded-full text-muted"><X className="h-4 w-4" aria-hidden /></button>
          </div>
        )}

      {/* Options as a bottom action sheet: big targets for a thumb. */}
      <Sheet opened={menu} onBackdropClick={() => setMenu(false)} className="pb-safe">
        <div className="space-y-2 bg-porcelain p-3">
          <div className="divide-y divide-line overflow-hidden rounded-card bg-card">
            {card && card.type !== "stay" && ([
              [h.notNeeded, () => hide(card.key, "never")],
              [h.tomorrow, () => hide(card.key, "tomorrow")],
              [h.turnOff, () => update((cur) => ({ reminders: { ...cur.reminders, [card.type]: false } }))],
            ] as const).map(([label, run]) => (
              <button key={label} type="button" onClick={() => { run(); setMenu(false); }} className="flex min-h-[56px] w-full items-center justify-center px-4 text-body text-cobalt">{label}</button>
            ))}
          </div>
          <button type="button" onClick={() => setMenu(false)} className="flex min-h-[56px] w-full items-center justify-center rounded-card bg-card px-4 text-headline text-cobalt">{h.cancel}</button>
        </div>
      </Sheet>

      {undo && (
        <div role="status" className="fixed inset-x-0 bottom-[calc(96px+env(safe-area-inset-bottom))] z-30 mx-auto flex w-[min(100%-32px,420px)] items-center gap-3 rounded-control bg-[#1a1f2e] py-1 pr-1 pl-4 text-subhead text-white shadow-bar dark:bg-[#262b3a]">
          <span className="flex-1">{h.hidden}</span>
          <button type="button" onClick={restore} className="min-h-11 px-3 font-semibold">{h.undo}</button>
        </div>
      )}

      <StaySheet open={visa} onClose={() => setVisa(false)} />
      <EditSheet open={driver} title={t.today.tileDriver} onClose={() => setDriver(false)}>
        <DriverPanel />
      </EditSheet>
    </>
  );
}

/** Dark card (design §5.6). Swipe left = "Not needed", except the stay limit, which stays. */
function Card({ c, onMenu, onSwipe }: { c: Candidate; onMenu: () => void; onSwipe: () => void }) {
  const t = useT();
  const locked = c.type === "stay";
  const [dx, setDx] = useState(0);
  const [gone, setGone] = useState(false);
  const start = useRef<{ x: number; y: number; w: number; horizontal: boolean | null } | null>(null);
  const { Icon } = c;
  const btn = "inline-flex min-h-11 flex-1 items-center justify-center rounded-control px-3 text-subhead font-semibold";
  return (
    <div
      className={`relative mt-2 touch-pan-y rounded-card bg-[#1a1f2e] p-card text-white dark:border dark:border-line dark:bg-[#262b3a] ${dx === 0 || gone ? "transition-transform duration-200" : ""}`}
      style={{ transform: `translateX(${gone ? "-110%" : `${dx}px`})`, opacity: gone ? 0 : 1 }}
      onPointerDown={locked ? undefined : (e) => { if (e.pointerType !== "mouse") start.current = { x: e.clientX, y: e.clientY, w: e.currentTarget.offsetWidth, horizontal: null }; }}
      onPointerMove={locked ? undefined : (e) => {
        const s = start.current;
        if (!s) return;
        const mx = e.clientX - s.x, my = e.clientY - s.y;
        if (s.horizontal === null && Math.hypot(mx, my) > 8) s.horizontal = Math.abs(mx) > Math.abs(my);
        if (s.horizontal) setDx(Math.min(0, mx));
      }}
      onPointerUp={locked ? undefined : () => {
        const s = start.current;
        start.current = null;
        if (s?.horizontal && dx < -s.w * 0.35) { setGone(true); setTimeout(() => { onSwipe(); setGone(false); setDx(0); }, 180); }
        else setDx(0);
      }}
      onPointerCancel={() => { start.current = null; setDx(0); }}
    >
      <div className="flex items-start gap-2">
        <p className="flex min-w-0 flex-1 items-center gap-1.5 pt-1 text-footnote font-semibold opacity-70">
          <Icon className="h-4 w-4 shrink-0" aria-hidden /><span className="truncate">{c.label}</span>
        </p>
        {!locked && (
          <button type="button" onClick={onMenu} aria-label={t.home.options}
            className="-mt-1 -mr-1 grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full bg-white/14">
            <Ellipsis className="h-5 w-5" aria-hidden />
          </button>
        )}
      </div>
      <h2 className="mt-1 line-clamp-2 text-[21px] leading-[27px] font-semibold">{c.title}</h2>
      {c.body && <p className="mt-1 text-subhead opacity-90">{c.body}</p>}
      {c.actions.length > 0 && (
        <div className="mt-3 flex gap-2">
          {c.actions.slice(0, 2).map((a, i) => {
            const cls = `${btn} ${a.cta ? "bg-cta text-cta-ink" : i === 0 ? "bg-white text-[#1a1f2e]" : "bg-white/14 text-white"}`;
            return a.href
              ? a.external ? <a key={a.label} href={a.href} target="_blank" rel="noopener" className={cls}>{a.label}</a>
                // A hash on this page (the checklist): a plain link, so the hashchange fires.
                : a.href.startsWith("#") ? <a key={a.label} href={a.href} className={cls}>{a.label}</a>
                : <Link key={a.label} href={a.href} className={cls}>{a.label}</Link>
              : <button key={a.label} type="button" onClick={a.onClick} className={cls}>{a.label}</button>;
          })}
        </div>
      )}
      {c.foot && <p className="mt-3 text-footnote opacity-70">{c.foot}</p>}
    </div>
  );
}
