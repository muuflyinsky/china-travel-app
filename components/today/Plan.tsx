"use client";
import { useCallback, useEffect, useState } from "react";
import { BedDouble, CalendarClock, Check, ChevronDown, Lightbulb, ListChecks, PlaneLanding, Smartphone, Ticket, Wallet, CarTaxiFront } from "lucide-react";
import { Section, Group, Row, Button, IconTile, Note } from "@/components/ui";
import { useInApp } from "@/components/useInApp";
import { useHotelPicks, usePrice } from "@/components/HotelPicks";
import { PaySetup } from "@/components/prep/PaySetup";
import { EsimPicker } from "@/components/prep/EsimPicker";
import { TrainBooking } from "@/components/prep/TrainBooking";
import { GoodToKnow } from "@/components/prep/GoodToKnow";
import { ReservationSheet } from "@/components/ReservationSheet";
import { useProfile } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { upcomingReminders, type Reminder } from "@/lib/reminders";
import { RESERVATIONS, type Reservation } from "@/lib/reservations";
import { fmt } from "@/lib/i18n";

// Trip-planning pieces of Today: ticket alarms, hotels per city and the "Get ready" checklist.

export const fmtDay = (iso: string, lang: string, month: "short" | "long" = "short") =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang, { timeZone: "UTC", day: "numeric", month });

/** How a sight's tickets are released, in one short line. */
function releaseRule(t: ReturnType<typeof useT>, r: Reservation) {
  return !r.release ? t.resv.noRelease
    : r.release.time ? fmt(t.resv.opensRule, { time: r.release.time, n: r.release.days })
    : fmt(t.resv.opensDays, { n: r.release.days });
}

/** Alarms set for the next 48 h, and sights in the trip cities that need booking and have none yet. */
export function useAlarms(suggest: boolean, refresh?: unknown) {
  const [p] = useProfile();
  const [list, setList] = useState<Reminder[]>([]);
  useEffect(() => setList(upcomingReminders()), [refresh]);
  const cities = p.cities.map((c) => c.a);
  const ideas = suggest ? RESERVATIONS.filter((r) => cities.includes(r.city) && !list.some((x) => x.id === r.id)) : [];
  return { list, ideas };
}

/**
 * Ticket alarms: releases the traveller set an alarm for (next 48 h), then sights in their trip
 * cities that need a reservation and have no alarm yet.
 */
export function Alarms({ suggest, bare }: { suggest: boolean; bare?: boolean }) {
  const t = useT();
  const [p] = useProfile();
  const [open, setOpen] = useState<Reservation | null>(null);
  const { list, ideas } = useAlarms(suggest, open);
  if (!list.length && !ideas.length) return null;
  const body = (
    <>
      <Group>
        {list.map((r) => {
          const s = RESERVATIONS.find((x) => x.id === r.id);
          const when = new Date(r.at).toLocaleString(p.lang, { weekday: "short", hour: "2-digit", minute: "2-digit" });
          return s && (
            <Row key={r.id + r.visit} href={s.url ?? s.guide} external icon={<IconTile><CalendarClock className="h-5 w-5" aria-hidden /></IconTile>}
              title={s.en} sub={fmt(t.resv.reminderLine, { date: fmtDay(r.visit, p.lang, "long"), when })} />
          );
        })}
        {ideas.map((r) => (
          <Row key={r.id} onClick={() => setOpen(r)} icon={<IconTile><Ticket className="h-5 w-5" aria-hidden /></IconTile>}
            title={r.en} sub={releaseRule(t, r)} after={<span className="text-subhead font-semibold text-cobalt">{t.resv.alarm}</span>} chevron={false} />
        ))}
      </Group>
      {open && <ReservationSheet r={open} open onClose={() => setOpen(null)} />}
    </>
  );
  return bare ? body : <Section title={t.resv.reminders}>{body}</Section>;
}

/** One row per destination city with its comfort-tier pick: the highest-earning spot in the app. */
function CityHotelRow({ c }: { c: { a: string; e: string; s: string } }) {
  const t = useT();
  const price = usePrice();
  const { data } = useHotelPicks(c.a, c.s);
  const pick = data?.tiers.comfort[0] ?? data?.tiers.economy[0];
  return (
    <Row href={`/app/stay?${new URLSearchParams({ city: c.a, name: c.s, en: c.e })}`}
      icon={<IconTile><BedDouble className="h-5 w-5" aria-hidden /></IconTile>}
      title={fmt(t.today.hotelsFor, { city: c.e })}
      sub={pick ? <><span className="zh">{pick.name}</span>{pick.cny ? <> · {price(pick.cny)}</> : null}</> : t.prepare.hotelsBody} />
  );
}

/** Hotel rows inside a Group the caller opens. */
export function CityHotelRows() {
  const t = useT();
  const [p] = useProfile();
  return (
    <>
      {p.cities.map((c) => <CityHotelRow key={c.a} c={c} />)}
      {p.cities.length === 0 && <Row href="/app/settings#cities" icon={<IconTile><BedDouble className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.addCities} sub={t.today.addCitiesSub} />}
    </>
  );
}

/** What used to be the Pay, Mobile data and Before-you-go pages, as one expandable checklist. */
const PREP = [
  { key: "pay", Icon: Wallet, Body: PaySetup },
  { key: "data", Icon: Smartphone, Body: EsimPicker },
  { key: "book", Icon: Ticket, Body: TrainBooking },
  { key: "good", Icon: Lightbulb, Body: GoodToKnow },
  { key: "airport", Icon: PlaneLanding, Body: AirportPrep },
] as const;

/** In the iOS app the list is things to get done, not apps to install (App Review 3.2.2(i), D19). */
const PREP_IN_APP = [
  PREP[0], PREP[1],
  { key: "around", Icon: CarTaxiFront, Body: GettingAround },
  PREP[2], PREP[4], PREP[3],
] as const;

type PrepKey = (typeof PREP_IN_APP)[number]["key"];

/** Taxis and maps, in words only: app names without icons or store links. */
function GettingAround() {
  const t = useT();
  return (
    <div className="space-y-3">
      <p className="text-subhead">{t.inapp.aroundBody}</p>
      <Note>{t.inapp.aroundNote}</Note>
    </div>
  );
}

/** Readable before the trip: the arrival-day guide (app/airport). */
function AirportPrep() {
  const t = useT();
  return (
    <div className="space-y-3">
      <p className="text-subhead">{t.today.airportPrepBody}</p>
      <Button variant="soft" href="/app/airport" className="w-full text-subhead!">{t.today.fromAirportOpen}</Button>
    </div>
  );
}

const PREP_KEY = "ctg.prep";
const PREP_EVENT = "ctg-prep";
const readDone = (): string[] => { try { return JSON.parse(localStorage.getItem(PREP_KEY) ?? "[]"); } catch { return []; } };

/** The checklist's items for this device, ticked ones, and the title of each. */
export function usePrep() {
  const t = useT();
  const app = useInApp();
  const items = app ? PREP_IN_APP : PREP;
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setDone(readDone());
    sync();
    window.addEventListener(PREP_EVENT, sync);
    return () => window.removeEventListener(PREP_EVENT, sync);
  }, []);
  const tick = useCallback((k: string) => {
    const cur = readDone();
    const n = cur.includes(k) ? cur.filter((x) => x !== k) : [...cur, k];
    try { localStorage.setItem(PREP_KEY, JSON.stringify(n)); } catch {}
    setDone(n);
    window.dispatchEvent(new Event(PREP_EVENT));
  }, []);
  const title = (key: PrepKey) => (app && key in t.inapp.prep ? t.inapp.prep[key as keyof typeof t.inapp.prep] : t.today.prep[key as keyof typeof t.today.prep]);
  const count = items.filter((x) => done.includes(x.key)).length;
  const next = items.find((x) => !done.includes(x.key));
  return { app, items, done, tick, title, count, total: items.length, next: next && { key: next.key, title: title(next.key) } };
}

/** Opens the checklist at one item: `#pay`, `#data` … (also from the "Before you fly" reminder). */
export function Checklist({ alwaysOpen = false }: { alwaysOpen?: boolean }) {
  const t = useT();
  const { items, done, tick, title, count } = usePrep();
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(alwaysOpen);
  useEffect(() => {
    const go = () => {
      const h = location.hash.slice(1);
      if (PREP_IN_APP.some((x) => x.key === h) || PREP.some((x) => x.key === h)) {
        setExpanded(true); setOpen(h);
        setTimeout(() => document.getElementById(h)?.scrollIntoView({ block: "start" }), 50);
      }
    };
    go();
    window.addEventListener("hashchange", go);
    return () => window.removeEventListener("hashchange", go);
  }, []);
  // Before mount `app` is still false: the collapsed row shows both versions and CSS picks one,
  // so the iOS app never flashes the website's "0 of 5".
  const both = (f: (list: readonly { key: string }[]) => React.ReactNode) => (
    <><span className="web-only">{f(PREP)}</span><span className="app-only">{f(PREP_IN_APP)}</span></>
  );
  const readyTitle = both((list) => fmt(t.today.getReady, { done: list.filter((x) => done.includes(x.key)).length, total: list.length }));
  // Collapsed to one row until opened: the prep list matters, but less than visa and hotels.
  if (!expanded) {
    return (
      <Group>
        <Row onClick={() => setExpanded(true)} icon={<IconTile><ListChecks className="h-5 w-5" aria-hidden /></IconTile>}
          title={readyTitle} sub={<><span className="web-only">{t.today.getReadySub}</span><span className="app-only">{t.inapp.getReadySub}</span></>} />
      </Group>
    );
  }
  return (
    <div>
      {!alwaysOpen && <p className="mb-2 px-1 text-subhead font-semibold text-muted">{fmt(t.today.getReady, { done: count, total: items.length })}</p>}
      <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
        {items.map(({ key, Icon, Body }) => {
          const isOpen = open === key, isDone = done.includes(key);
          return (
            <li key={key} id={key} className="scroll-mt-4">
              <div className="flex min-h-14 items-center gap-3 pl-4">
                <button onClick={() => tick(key)} aria-pressed={isDone} aria-label={title(key)}
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${isDone ? "border-cobalt bg-cobalt text-white dark:text-porcelain" : "border-line"}`}>
                  {isDone && <Check className="h-4 w-4" strokeWidth={3} />}
                </button>
                <button onClick={() => setOpen(isOpen ? null : key)} aria-expanded={isOpen} className="flex flex-1 items-center gap-3 py-3 pr-4 text-left">
                  <Icon className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
                  <span className={`flex-1 text-body ${isDone ? "text-muted line-through" : ""}`}>{title(key)}</span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden />
                </button>
              </div>
              {isOpen && <div className="px-4 pt-1 pb-4"><Body /></div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
