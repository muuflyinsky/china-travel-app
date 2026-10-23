"use client";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { Group, Field, Button } from "../ui";
import { CityPicker } from "../CityPicker";
import { useCity } from "../useCity";
import { useProfile } from "../useProfile";
import { useT } from "../useT";
import { goLink } from "@/lib/affiliate";
import { addDays, todayIso } from "@/lib/stay";
import { fmt } from "@/lib/i18n";
import type { City } from "@/lib/cities";

const BEIJING: City = { n: "北京市", s: "北京", a: "110000", p: "Beijing", e: "Beijing", py: "beijing", t: "city" };

/** Trains, flights and sight tickets between cities (was part of Before you go). */
export function TrainBooking() {
  const t = useT();
  const [p] = useProfile();
  const { city: here, detect } = useCity();
  const [fromPick, setFrom] = useState<City | null>(null);
  const from = fromPick ?? here;
  const [to, setTo] = useState<City>(BEIJING);
  const [date, setDate] = useState(() => (p.arrival && p.arrival > todayIso() ? addDays(p.arrival, 2) : addDays(todayIso(), 3)));
  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <CityPicker label={t.prepare.from} value={from} onChange={setFrom} onLocate={detect} />
        <CityPicker label={t.prepare.to} value={to} onChange={setTo} />
      </div>
      <Group>
        <Field label={t.prepare.date}><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
      </Group>
      <Button variant="cta" external className="w-full" href={goLink("trip", "train", { from: from.e, to: to.e, date }, "today_train")}>{t.prepare.findTrains}</Button>
      <div className="flex flex-wrap gap-x-4">
        <a href={goLink("trip", "flight", { from: from.e, to: to.e, date }, "today_flight")} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">{t.prepare.findFlights} <ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
        <a href={goLink("trip", "attraction", { city: to.s, cityEn: to.e }, "today_attraction")} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">{fmt(t.prepare.tickets, { city: to.e })} <ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
      </div>
      <p className="text-footnote text-muted">{t.prepare.bookNote}</p>
      <p className="text-footnote text-muted">{t.prepare.sightsBody}</p>
      <p className="text-footnote text-muted">{t.common.commission}</p>
    </div>
  );
}
