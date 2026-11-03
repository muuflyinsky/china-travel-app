"use client";
import { CalendarRange, TrainFront } from "lucide-react";
import { Card, Button, Section } from "./ui";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { goLink } from "@/lib/affiliate";
import { todayIso, daysBetween } from "@/lib/stay";
import { HOLIDAYS_CHECKED, OFFICIAL, holidaysAhead, isMajor, trainSaleDay } from "@/lib/holidays";

/**
 * Today's pacing reminders (WorkBuddy research 11-03, Veer approved): a Chinese holiday that
 * falls in (or, without dates, comes up near) the trip, and when train tickets for the next city
 * go on sale. The two most common regrets: too much packed in, and tickets booked too late.
 */
export function TripAlerts({ section }: { section?: boolean }) {
  const t = useT();
  const x = t.alerts;
  const [p] = useProfile();
  const today = todayIso();
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "short" });
  const span = ([a, b]: [string, string]) => (a === b ? day(a) : `${day(a)} – ${day(b)}`);

  const holidays = holidaysAhead(today, p.arrival && p.departure ? { from: p.arrival, to: p.departure } : undefined);
  // Train legs: each trip city with a start date after the first one is a move from the city before.
  const legs = [...p.cities].filter((c) => c.from).sort((a, b) => a.from!.localeCompare(b.from!))
    .flatMap((c, i, all) => (i ? [{ from: all[i - 1], to: c, date: c.from! }] : []))
    .filter((l) => l.date >= today && daysBetween(today, l.date) <= TRAIN_LOOKAHEAD);
  if (!holidays.length && !legs.length) return null;

  const body = (
    <>
      {holidays.map((h) => (
        <Card key={h.id}>
          <h3 className="flex items-center gap-2 text-headline"><CalendarRange className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{fmt(isMajor(h) ? x.busyTitle : x.shortTitle, { name: x.names[h.id], dates: span(h.days) })}</h3>
          <p className="mt-1 text-subhead">{isMajor(h) ? x.busyBody : x.shortBody}</p>
          {/* Until the State Council's notice is in, only the legal days are certain. */}
          <p className="mt-2 text-footnote text-muted">
            <span className="zh" lang="zh-CN">{h.zh}</span> · {OFFICIAL ? fmt(t.src.checked, { date: day(HOLIDAYS_CHECKED) }) : x.unofficial}
          </p>
        </Card>
      ))}
      {legs.slice(0, 2).map((l) => {
        const sale = trainSaleDay(l.date);
        return (
          <Card key={l.date + l.to.a}>
            <h3 className="flex items-center gap-2 text-headline"><TrainFront className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{fmt(x.trainTitle, { from: l.from.e, to: l.to.e, date: day(l.date) })}</h3>
            <p className="mt-1 text-subhead">{sale <= today ? x.trainOnSale : fmt(x.trainSoon, { date: day(sale) })}</p>
            <Button variant="cta" external className="mt-3 w-full" href={goLink("trip", "train", { from: l.from.e, to: l.to.e, date: l.date }, "today_train", "today-train-alert")}>{t.prepare.findTrains}</Button>
          </Card>
        );
      })}
    </>
  );
  // Its own section where nothing else wraps it, so an empty Today has no stray gap.
  return section ? <Section>{body}</Section> : body;
}

/** Show a train leg from three weeks before (a few days before sales open) until the day. */
const TRAIN_LOOKAHEAD = 21;
