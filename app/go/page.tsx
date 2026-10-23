"use client";
import { useState } from "react";
import { Preloader } from "konsta/react";
import {
  LocateFixed, Search, TrainFront, Bath, Pill, Landmark, Store, Hospital, Footprints, Bus, CarTaxiFront, Car, ChevronRight,
} from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Button, Note } from "@/components/ui";
import { AppIcon } from "@/components/AppIcon";
import { ShowCard } from "@/components/ShowCard";
import { CityPicker } from "@/components/CityPicker";
import { useCity, type Here } from "@/components/useCity";
import { useT } from "@/components/useT";
import { amapNav, appleNav } from "@/lib/maplinks";
import { appStoreUrl } from "@/lib/apps";
import { fmt } from "@/lib/i18n";
import type { Place, RouteOption, RouteStep } from "@/lib/amap";
import type { Dict } from "@/lib/i18n";

const NEARBY = [
  { key: "metro", q: "地铁站", Icon: TrainFront },
  { key: "toilet", q: "公共厕所", Icon: Bath },
  { key: "pharmacy", q: "药店", Icon: Pill },
  { key: "atm", q: "ATM", Icon: Landmark },
  { key: "convenience", q: "便利店", Icon: Store },
  { key: "hospital", q: "医院", Icon: Hospital },
] as const;

const MODE_ICON = { transit: TrainFront, walking: Footprints, driving: CarTaxiFront } as const;
const STEP_ICON = { walk: Footprints, subway: TrainFront, bus: Bus, rail: TrainFront, drive: Car } as const;

function lineName(t: Dict, s: RouteStep) {
  if (s.metro) return fmt(t.go.metroLine, { n: s.metro });
  return s.kind === "rail" ? fmt(t.go.train, { n: s.line ?? "" }) : s.line ?? "";
}

function stepText(t: Dict, s: RouteStep) {
  if (s.kind === "walk") return fmt(t.go.walkM, { m: s.meters ?? 0 });
  const stops = s.stops ? ` (${s.stops === 1 ? t.go.stop1 : fmt(t.go.stops, { n: s.stops })})` : "";
  return `${lineName(t, s)}: ${s.from} → ${s.to}${stops}`;
}

export default function GoPage() {
  const t = useT();
  const { city, setCity, detect } = useCity();
  const [here, setHere] = useState<Here | null>(null);
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [dest, setDest] = useState<Place | null>(null);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<string>();
  const [card, setCard] = useState<string[] | null>(null);

  async function locate() {
    setBusy("locating"); setNotice(undefined);
    try {
      setHere(await detect());
    } catch {
      setNotice(fmt(t.go.locationOff, { city: city.e }));
    }
    setBusy("");
  }

  async function search(keyword: string, nearby = false) {
    setBusy("search"); setNotice(undefined); setDest(null); setRoutes([]);
    const qs = new URLSearchParams({ q: keyword });
    if (nearby && here) qs.set("around", here.location); else qs.set("city", city.a);
    const r = await fetch(`/api/places?${qs}`);
    const d = await r.json();
    if (r.ok) { setPlaces(d.places); setDemo(d.demo); if (!d.places.length) setNotice(fmt(t.go.nothing, { q: keyword })); }
    else setNotice(t.go.searchDown);
    setBusy("");
  }

  async function choose(p: Place) {
    setDest(p); setPlaces([]); setRoutes([]);
    if (!here) return;
    setBusy("route");
    const qs = new URLSearchParams({ origin: here.location, destination: p.location, citycode: here.citycode, destCitycode: p.citycode || here.citycode });
    const r = await fetch(`/api/route?${qs}`);
    const d = await r.json();
    if (r.ok) setRoutes(d.routes); else setNotice(t.go.routeDown);
    setBusy("");
  }

  return (
    <Screen title={t.go.title}>
      <Section>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) search(q.trim()); }}>
          <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-card px-3">
            <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.go.placeholder} aria-label={t.go.destination} className="h-full w-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted" />
          </label>
          <Button type="submit" className="shrink-0 px-5">{t.go.go}</Button>
        </form>
        <div className="flex flex-wrap items-center justify-between gap-x-3 px-1 text-[15px]">
          <div className="flex items-center gap-1 text-muted">{t.city.searchingIn} <CityPicker compact value={city} onChange={(c) => { setCity(c); setHere(null); }} onLocate={locate} /></div>
          <button onClick={locate} disabled={busy === "locating"} className="flex min-h-11 items-center gap-1.5 font-semibold text-cobalt">
            {busy === "locating" ? <Preloader className="h-4! w-4!" /> : <LocateFixed className="h-5 w-5" aria-hidden />}
            {here ? t.go.updateLocation : t.go.useLocation}
          </button>
        </div>
        {here && <p className="zh px-1 text-[13px] text-muted">{fmt(t.go.near, { address: here.address })}</p>}
      </Section>

      <Section title={t.go.nearby}>
        <div className="grid grid-cols-3 gap-2">
          {NEARBY.map(({ key, q: k, Icon }) => (
            <button key={k} onClick={() => (here ? search(k, true) : (locate(), setNotice(t.go.locateFirst)))}
              className="flex min-h-[68px] flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-card text-[13px] font-semibold">
              <Icon className="h-5 w-5 text-cobalt" aria-hidden /> {t.go.nearbyItems[key]}
            </button>
          ))}
        </div>
        {notice && <Note tone="warn">{notice}</Note>}
        <DemoNote show={demo} what="AMAP_KEY" />
        {busy === "search" && <div className="flex justify-center py-6"><Preloader /></div>}
        {places.length > 0 && (
          <Group>
            {places.map((p) => (
              <Row key={p.id} onClick={() => choose(p)} title={<span className="zh">{p.name}</span>}
                sub={<>{p.pinyin}<span className="zh block">{p.address}</span></>}
                after={p.distance ? <span className="text-[13px] text-muted tabular-nums">{p.distance} m</span> : undefined} />
            ))}
          </Group>
        )}
      </Section>

      {dest && (
        <Section>
          <Card>
            <h2 className="zh text-[22px] font-bold">{dest.name}</h2>
            <p className="text-[15px]">{dest.pinyin}</p>
            <p className="zh text-[13px] text-muted">{dest.address}</p>
            <Button className="mt-3 w-full" onClick={() => setCard(["师傅您好，请带我去：", dest.name, `地址：${dest.address}`])}>
              <CarTaxiFront className="h-5 w-5" aria-hidden /> {t.go.showDriver}
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <a href={amapNav(dest, "bus")} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cobalt-soft font-semibold text-cobalt"><AppIcon id="amap" size={24} /> Amap</a>
              <a href={appleNav(dest, "r")} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cobalt-soft font-semibold text-cobalt"><AppIcon id="applemaps" size={24} /> Apple Maps</a>
            </div>
          </Card>
          {!here && <p className="px-1 text-[15px] text-muted">{t.go.useLocationForRoutes}</p>}
          {busy === "route" && <div className="flex justify-center py-6"><Preloader /></div>}
        </Section>
      )}

      {dest && routes.length > 0 && (
        <Section title={t.go.ways}>
          {routes.map((r, i) => {
            const M = MODE_ICON[r.mode];
            return (
              <Card key={i}>
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <M className="h-5 w-5 text-cobalt" aria-hidden />
                    <div>
                      <p className="text-[17px] font-semibold">{t.go.modes[r.mode]}</p>
                      {r.mode === "transit" && <p className="text-[13px] text-muted">{r.steps.filter((x) => x.kind !== "walk").map((x) => lineName(t, x)).join(" → ")}</p>}
                    </div>
                  </div>
                  <p className="text-right text-[17px] font-semibold tabular-nums">{fmt(t.go.min, { n: r.minutes })}{r.priceCny !== undefined && <span className="block text-[13px] font-normal text-muted">≈ ¥{r.priceCny}</span>}</p>
                </header>
                {r.steps.length > 0 && (
                  <ol className="mt-3 space-y-2 border-l-2 border-cobalt-soft pl-3">
                    {r.steps.map((s, j) => {
                      const S = STEP_ICON[s.kind];
                      return (
                        <li key={j} className="flex gap-2 text-[15px]">
                          <S className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                          <span>{stepText(t, s)}{s.zh && <span className="zh block text-[13px] text-muted">{s.zh}</span>}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {r.mode === "driving" && (
                  <a href={appStoreUrl("didi")} target="_blank" rel="noopener" className="mt-3 flex items-center gap-3 rounded-xl bg-porcelain p-2">
                    <AppIcon id="didi" size={32} /><span className="flex-1 text-[13px] text-muted">{t.go.didiNote}</span>
                  </a>
                )}
                {here && (
                  <a target="_blank" rel="noopener" href={amapNav(dest, r.mode === "transit" ? "bus" : r.mode === "walking" ? "walk" : "car", { location: here.location, name: "我的位置" })} className="mt-2 flex min-h-11 items-center gap-1 text-[15px] font-semibold text-cobalt">
                    {t.go.start} <ChevronRight className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </Card>
            );
          })}
          {routes.some((r) => r.mode === "transit") && (
            <div className="flex items-start gap-3 px-1">
              <span className="flex -space-x-2"><AppIcon id="alipay" size={28} /><AppIcon id="wechat" size={28} /></span>
              <p className="text-[13px] text-muted">{t.go.metroNote}</p>
            </div>
          )}
        </Section>
      )}
      {card && <ShowCard lines={card} sub={dest?.pinyin} onClose={() => setCard(null)} />}
    </Screen>
  );
}
