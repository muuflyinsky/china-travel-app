"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Check, TrainFront, CarTaxiFront, Car, CreditCard, Wifi, Wallet, MapPin, Clock, Receipt, PlaneTakeoff } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Section, Card, Group, Row, Button, Note, Seg, IconTile } from "@/components/ui";
import { HotelCard } from "@/components/HotelCard";
import { ShowCard } from "@/components/ShowCard";
import { SourceLine } from "@/components/SourceLine";
import { useT } from "@/components/useT";
import { useCity } from "@/components/useCity";
import { useProfile } from "@/components/useProfile";
import { fmt, type Dict } from "@/lib/i18n";
import { openApp } from "@/lib/openApp";
import { track } from "@/lib/track";
import {
  AIRPORT_CITIES, VERIFIED_ON, airportsIn, toAirportLines, type ArrivalAirport, type Metro, type Name,
} from "@/lib/airports";

type X = Dict["airport"];

/** A sign as it reads at the airport: the Chinese on it, then the English. */
function Sign({ zh, en }: Name) {
  return (
    <span className="inline-flex items-baseline gap-1.5 rounded-[6px] bg-ink px-2 py-0.5 text-porcelain">
      <span className="zh text-subhead font-semibold" lang="zh-CN">{zh}</span>
      <span className="text-footnote font-semibold">{en}</span>
    </span>
  );
}

function Line({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <p className="flex gap-2 text-subhead">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
      <span className="min-w-0">{children}</span>
    </p>
  );
}

const about = (x: X, m: { mins?: number; cny?: number }) =>
  [m.mins && fmt(x.aboutMins, { n: m.mins }), m.cny && fmt(x.aboutCny, { n: m.cny })].filter(Boolean).join(" · ");

function MetroLine({ x, m, out }: { x: X; m: Metro; out?: boolean }) {
  const meta = about(x, m);
  return (
    <div className="space-y-1.5">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {!m.line && <span className="text-subhead">{x.followSign}</span>}
        <Sign {...(m.line ?? { zh: "地铁", en: "Metro" })} />
        {m.to && <span className="text-subhead">{fmt(out ? x.fromPlace : x.toPlace, { place: m.to.en })} <span className="zh text-muted" lang="zh-CN">{m.to.zh}</span></span>}
      </p>
      {!m.line && <p className="text-subhead text-muted">{x.metroSigns}</p>}
      {m.from && <Line icon={MapPin}>{fmt(x.station, { place: m.from.en })} <span className="zh" lang="zh-CN">{m.from.zh}</span></Line>}
      {m.at && <Line icon={MapPin}>{fmt(x.stopsAt, { t: m.at })}</Line>}
      {meta && <Line icon={Clock}>{meta}</Line>}
      <Line icon={CreditCard}>{x.pay[m.pay]}</Line>
      {m.note && <p className="text-footnote text-muted">{x.notes[m.note]}</p>}
    </div>
  );
}

function Way({ icon: Icon, title, children }: { icon: typeof Clock; title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="mb-2 flex items-center gap-2 text-headline"><Icon className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />{title}</h3>
      <div className="space-y-3">{children}</div>
    </Card>
  );
}

/** One airport, landing: three ways into town. */
function WaysIn({ a, x, heading }: { a: ArrivalAirport; x: X; heading: boolean }) {
  const taxi = a.taxi;
  return (
    <>
      {heading && <p className="px-1 pt-1 text-subhead font-semibold">{a.name.en} <span className="zh font-normal text-muted" lang="zh-CN">{a.name.zh}</span></p>}
      {a.note && <Note>{x.notes[a.note]}</Note>}
      <Way icon={TrainFront} title={x.metro}>
        {a.metro.map((m) => <MetroLine key={m.line?.zh ?? "signs"} x={x} m={m} />)}
      </Way>
      <Way icon={CarTaxiFront} title={x.taxi}>
        <p className="flex flex-wrap items-center gap-2 text-subhead">{x.followSign} <Sign zh="出租车" en="Taxi" /></p>
        {taxi?.doors?.map((d) => <Line key={d.t} icon={MapPin}>{fmt(x.door, { t: d.t, n: d.door })}</Line>)}
        {taxi?.note && <Line icon={MapPin}>{x.notes[taxi.note]}</Line>}
        {!taxi?.doors && !taxi?.note && <p className="text-subhead text-muted">{x.taxiSigns}</p>}
        {taxi?.cny && (
          <Line icon={Clock}>
            {fmt(taxi.to ? x.taxiFare : x.taxiTime, { place: taxi.to?.en ?? "", cny: taxi.cny[1] ? `${taxi.cny[0]}–${taxi.cny[1]}` : taxi.cny[0], n: taxi.mins ?? "" })}
          </Line>
        )}
        {taxi?.someCards && <Line icon={CreditCard}>{x.someCards}</Line>}
        <p className="text-footnote text-muted">{x.official}</p>
      </Way>
      <Way icon={Car} title={x.ride}>
        <p className="flex flex-wrap items-center gap-2 text-subhead">{x.followSign} <Sign zh="网约车" en="Ride-hailing" /></p>
        {a.ride?.parks?.map((pk) => <Line key={pk.park} icon={MapPin}>{fmt(pk.floor ? x.parkFloor : x.park, { p: pk.park, f: pk.floor ?? "" })}</Line>)}
        {a.ride?.note && <Line icon={MapPin}>{x.notes[a.ride.note]}</Line>}
        {!a.ride && <p className="text-subhead text-muted">{x.rideSigns}</p>}
        <p className="text-subhead">{x.rideHow}</p>
        <Button variant="soft" onClick={() => { openApp("didi"); track("airport_didi", { code: a.code }); }} className="w-full text-subhead!">{x.openDidi}</Button>
      </Way>
      {a.online && <Note>{x.notes[a.online]}</Note>}
      {a.money && <Note>{x.notes[a.money]}</Note>}
    </>
  );
}

/** Two things to do before leaving the airport, ticked off on this phone only. */
function FirstThings({ x }: { x: X }) {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => { try { setDone(JSON.parse(localStorage.getItem("ctg.airport") ?? "[]")); } catch {} }, []);
  const tick = (k: string) => {
    const n = done.includes(k) ? done.filter((d) => d !== k) : [...done, k];
    setDone(n);
    try { localStorage.setItem("ctg.airport", JSON.stringify(n)); } catch {}
  };
  const items = [{ k: "online", Icon: Wifi, title: x.online, sub: x.onlineSub }, { k: "alipay", Icon: Wallet, title: x.alipay, sub: x.alipaySub }];
  return (
    <Group>
      {items.map(({ k, Icon, title, sub }) => {
        const on = done.includes(k);
        return (
          <li key={k}>
            <button onClick={() => tick(k)} aria-pressed={on} className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left">
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 ${on ? "border-cobalt bg-cobalt text-white dark:text-porcelain" : "border-line"}`}>
                {on ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <Icon className="h-3.5 w-3.5 text-muted" aria-hidden />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-body ${on ? "text-muted line-through" : ""}`}>{title}</span>
                <span className="block text-footnote text-muted">{sub}</span>
              </span>
            </button>
          </li>
        );
      })}
    </Group>
  );
}

/** Leaving: a card for the driver to the right terminal, then the metro the other way. */
function WayOut({ a, x, heading }: { a: ArrivalAirport; x: X; heading: boolean }) {
  const [term, setTerm] = useState(a.terminals.length === 1 ? a.terminals[0] : "");
  const [card, setCard] = useState(false);
  return (
    <>
      {heading && <p className="px-1 pt-1 text-subhead font-semibold">{a.name.en} <span className="zh font-normal text-muted" lang="zh-CN">{a.name.zh}</span></p>}
      {a.note && <Note>{x.notes[a.note]}</Note>}
      <Card>
        {a.terminals.length > 1 && (
          <>
            <p className="mb-2 text-subhead text-muted">{x.terminal}</p>
            <Seg value={term} onChange={setTerm} label={x.terminal}
              options={[...a.terminals.map((tm) => ({ value: tm, label: tm })), { value: "", label: x.notSure }]} />
            {!term && <p className="mt-2 text-footnote text-muted">{x.terminalHint}</p>}
          </>
        )}
        <Button onClick={() => { setCard(true); track("airport_card_out", { code: a.code }); }} className={`w-full text-subhead! ${a.terminals.length > 1 ? "mt-3" : ""}`}>
          <PlaneTakeoff className="h-5 w-5" aria-hidden />{x.showDriverOut}
        </Button>
      </Card>
      <Way icon={TrainFront} title={x.metro}>
        {a.metro.map((m) => <MetroLine key={m.line?.zh ?? "signs"} x={x} m={m} out />)}
      </Way>
      <Way icon={Car} title={x.ride}>
        <p className="text-subhead">{x.rideOut} <span className="zh font-semibold" lang="zh-CN">{a.name.zh}{term ? ` ${term}` : ""}</span></p>
        <Button variant="soft" onClick={() => { openApp("didi"); track("airport_didi", { code: a.code, out: 1 }); }} className="w-full text-subhead!">{x.openDidi}</Button>
      </Way>
      {card && <ShowCard kind="airport" lines={toAirportLines(a, term)} sub={`${a.name.en}${term ? ` ${term}` : ""} · ${x.intlDepartures}`} onClose={() => setCard(false)} />}
    </>
  );
}

function Airport() {
  const t = useT();
  const x = t.airport;
  const out = useSearchParams().get("dir") === "out";
  const [p, set, loaded] = useProfile();
  const { city } = useCity();
  const [at, setAt] = useState(AIRPORT_CITIES[0]);
  const [outPick, setOutPick] = useState<string | null>(null);
  useEffect(() => { track("airport_open", { dir: out ? "out" : "in" }); }, [out]);

  const [covered, setCovered] = useState(true);
  // Arriving: the first city on the trip; leaving: where they are now. Either, if we cover it.
  useEffect(() => {
    if (!loaded) return;
    const want = (out ? [city.a, p.cities.at(-1)?.a] : [p.cities[0]?.a, city.a]).filter(Boolean) as string[];
    const hit = want.find((a) => AIRPORT_CITIES.includes(a));
    if (hit) setAt(hit);
    // Their city isn't one of ours: say so at the top, not only at the bottom.
    setCovered(Boolean(hit) || want.length === 0);
  }, [loaded, out, city.a]); // eslint-disable-line react-hooks/exhaustive-deps

  const list = airportsIn(at);
  // Two airports: ask once which they land at (remembered, for the first city only), or show both.
  // Leaving always asks: they may fly out of the other airport, and a wrong card sends them there.
  const firstCity = !p.cities[0] || p.cities[0].a === at;
  const [browse, setBrowse] = useState<string | null>(null);
  const choice = out ? outPick : firstCity ? (browse ?? p.arrivalAirport) : browse;
  const picked = list.find((a) => a.code === choice);
  const shown = picked ? [picked] : list;
  const choose = (v: string) => (out ? setOutPick(v) : firstCity ? set({ arrivalAirport: v }) : setBrowse(v));
  useEffect(() => { setBrowse(null); setOutPick(null); }, [at]);

  return (
    <Screen title={out ? x.titleOut : x.title} back>
      <Section>
        {!covered && <Note>{x.otherCities}</Note>}
        <Seg value={at} onChange={setAt} label={x.cityLabel} options={AIRPORT_CITIES.map((a) => ({ value: a, label: x.cities[a as keyof X["cities"]] }))} />
        {list.length > 1 && (
          <>
            {!picked && <p className="px-1 text-subhead font-semibold">{out ? x.whichOut : x.whichIn}</p>}
            <Seg value={picked ? picked.code : choice === "both" ? "both" : ""} onChange={choose} label={out ? x.whichOut : x.whichIn}
              options={[...list.map((a) => ({ value: a.code, label: a.name.en.split(" ").at(-1)! })), { value: "both", label: x.both }]} />
          </>
        )}
      </Section>

      {out ? (
        <Section title={x.leaveEarly}>
          {shown.map((a) => <WayOut key={a.code} a={a} x={x} heading={shown.length > 1 || list.length === 1} />)}
          <Group>
            <Row href="/tax-refund" icon={<IconTile><Receipt className="h-5 w-5" aria-hidden /></IconTile>} title={t.today.taxRow} sub={t.today.taxRowSub} />
          </Group>
        </Section>
      ) : (
        <>
          <Section title={x.firstTitle}>
            <FirstThings x={x} />
          </Section>
          <Section title={x.waysTitle}>
            {shown.map((a) => <WaysIn key={a.code} a={a} x={x} heading={shown.length > 1 || list.length === 1} />)}
          </Section>
          <Section title={x.driverTitle}>
            {p.hotel
              ? <HotelCard lead="师傅您好，请带我去这家酒店：" title={x.toHotel} />
              : <><HotelCard /><p className="px-1 text-footnote text-muted">{x.noHotel}</p></>}
          </Section>
        </>
      )}

      <Section>
        {covered && <p className="px-1 text-footnote text-muted">{x.otherCities}</p>}
        <SourceLine name={x.source} date={VERIFIED_ON} />
      </Section>
    </Screen>
  );
}

export default function AirportPage() {
  return <Suspense><Airport /></Suspense>;
}
