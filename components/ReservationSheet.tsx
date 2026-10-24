"use client";
import { useEffect, useState } from "react";
import { AlarmClock, ExternalLink, TriangleAlert, Check } from "lucide-react";
import { EditSheet } from "./EditSheet";
import { Group, Field, Button, Note } from "./ui";
import { useProfile } from "./useProfile";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import { goLink } from "@/lib/affiliate";
import { downloadIcs, icsEvent } from "@/lib/ics";
import { saveReminder } from "@/lib/reminders";
import { track } from "@/lib/track";
import { RESERVATION_SOURCE, releaseAt, type Reservation } from "@/lib/reservations";
import { addDays, todayIso } from "@/lib/stay";

/** When are tickets released, in the traveller's own time zone, plus an alarm and the rules that bite. */
export function ReservationSheet({ r, open, onClose }: { r: Reservation; open: boolean; onClose: () => void }) {
  const t = useT();
  const [p] = useProfile();
  const firstDay = p.arrival && p.arrival > todayIso() ? addDays(p.arrival, 1) : addDays(todayIso(), 3);
  const [visit, setVisit] = useState(firstDay);
  // The profile loads after the first render: start from the day after arrival once it is known.
  useEffect(() => { if (open) { setVisit(firstDay); setSaved(false); } }, [open, firstDay]);
  const [saved, setSaved] = useState(false);
  const at = releaseAt(r, visit);
  const local = (d: Date) => d.toLocaleString(p.lang, { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  const visitLabel = new Date(`${visit}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "long" });
  const past = at && at.getTime() < Date.now();

  function alarm() {
    if (!at) return;
    const title = fmt(t.resv.alarmTitle, { name: r.en });
    downloadIcs(icsEvent({ start: at, title, body: `${r.zh}\n${r.url ?? r.guide}`, uid: `${r.id}-${visit}`, url: r.url ?? r.guide }), `${r.id}-tickets.ics`);
    saveReminder({ id: r.id, visit, at: at.toISOString() });
    track("resv_alarm_added", { sight: r.id });
    setSaved(true);
  }

  const rules = [
    t.resv.passport,
    r.noSameDay && t.resv.noSameDay,
    r.closedMondays && t.resv.closedMon,
  ].filter(Boolean) as string[];

  return (
    <EditSheet open={open} title={r.en} onClose={onClose}>
      <p className="zh px-1 text-subhead text-muted">{r.zh}</p>
      <Group>
        <Field label={t.resv.visitDate}><input type="date" value={visit} min={todayIso()} onChange={(e) => { setVisit(e.target.value); setSaved(false); }} /></Field>
      </Group>
      {at ? (
        <div className="rounded-card border border-line bg-card p-4">
          <p className="text-footnote text-muted">{fmt(t.resv.forDate, { date: visitLabel })}</p>
          <p className="text-title">{r.release?.time ? local(at) : at.toLocaleDateString(p.lang, { weekday: "short", day: "numeric", month: "short" })}</p>
          <p className="text-footnote text-muted">
            {r.release?.time ? fmt(t.resv.beijing, { time: r.release.time }) : fmt(t.resv.daysAhead, { n: r.release!.days })}
          </p>
          {past
            ? <Note tone="warn">{t.resv.past}</Note>
            : <Button className="mt-3 w-full" onClick={alarm}>{saved ? <><Check className="h-5 w-5" aria-hidden />{t.resv.saved}</> : <><AlarmClock className="h-5 w-5" aria-hidden />{t.resv.alarm}</>}</Button>}
        </div>
      ) : (
        <p className="px-1 text-subhead">{t.resv.noFixed}</p>
      )}
      {r.noShow && (
        <p className="flex gap-2 rounded-card bg-warn-soft p-3 text-subhead text-warn">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {r.noShow.count > 1 ? fmt(t.resv.noShow, { count: r.noShow.count, days: r.noShow.windowDays ?? 0, ban: r.noShow.banDays }) : fmt(t.resv.noShow1, { ban: r.noShow.banDays })}
        </p>
      )}
      <ul className="space-y-1.5 px-1 text-subhead">{rules.map((x) => <li key={x}>· {x}</li>)}</ul>
      <p className="px-1 text-subhead font-semibold">{t.resv.channel[r.channel]}</p>
      <div className="flex flex-wrap gap-x-4 px-1">
        {r.url && <a href={r.url} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">{t.resv.official}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>}
        {r.channel === "trip" && <a href={goLink("trip", "attraction", { keyword: r.en }, "resv_trip", `resv-${r.id.slice(0, 12)}`)} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">{t.resv.onTrip}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>}
        <a href={r.guide} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">{t.resv.guide}<ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
      </div>
      <p className="px-1 text-footnote text-muted">
        {fmt(t.resv.source, { date: new Date(`${RESERVATION_SOURCE.checked}T00:00:00Z`).toLocaleDateString(p.lang, { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" }) })}{" "}
        <a href={RESERVATION_SOURCE.url} target="_blank" rel="noopener" className="underline">{RESERVATION_SOURCE.name}</a> ({RESERVATION_SOURCE.license})
      </p>
    </EditSheet>
  );
}
