"use client";
import { useState } from "react";
import { BlockTitle, List, ListItem, Preloader } from "konsta/react";
import {
  LocateFixed, Search, TrainFront, Bath, Pill, Landmark, Store, Hospital, Footprints, Bus, CarTaxiFront, Car, Map, ChevronRight,
} from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { ShowCard } from "@/components/ShowCard";
import { CityPicker } from "@/components/CityPicker";
import { useCity, type Here } from "@/components/useCity";
import { amapNav, appleNav } from "@/lib/maplinks";
import type { Place, RouteOption } from "@/lib/amap";

const NEARBY = [
  { label: "Metro", q: "地铁站", Icon: TrainFront },
  { label: "Toilet", q: "公共厕所", Icon: Bath },
  { label: "Pharmacy", q: "药店", Icon: Pill },
  { label: "ATM", q: "ATM", Icon: Landmark },
  { label: "Convenience", q: "便利店", Icon: Store },
  { label: "Hospital", q: "医院", Icon: Hospital },
];

const MODE = {
  transit: { Icon: TrainFront, label: "Metro & bus" },
  walking: { Icon: Footprints, label: "Walk" },
  driving: { Icon: CarTaxiFront, label: "Taxi / DiDi" },
} as const;
const STEP_ICON = { walk: Footprints, subway: TrainFront, bus: Bus, rail: TrainFront, drive: Car } as const;

export default function GoPage() {
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
      setNotice(`Location is off. Search in ${city.e} still works; allow location in your browser settings for routes and “Nearby”.`);
    }
    setBusy("");
  }

  async function search(keyword: string, nearby = false) {
    setBusy("search"); setNotice(undefined); setDest(null); setRoutes([]);
    const qs = new URLSearchParams({ q: keyword });
    if (nearby && here) qs.set("around", here.location); else qs.set("city", city.a);
    const r = await fetch(`/api/places?${qs}`);
    const d = await r.json();
    if (r.ok) { setPlaces(d.places); setDemo(d.demo); if (!d.places.length) setNotice(`Nothing found for “${keyword}”. Try the Chinese name or a nearby landmark.`); }
    else setNotice("Search is unavailable right now. Check your connection and try again.");
    setBusy("");
  }

  async function choose(p: Place) {
    setDest(p); setPlaces([]); setRoutes([]);
    if (!here) return;
    setBusy("route");
    const qs = new URLSearchParams({ origin: here.location, destination: p.location, citycode: here.citycode, destCitycode: p.citycode || here.citycode });
    const r = await fetch(`/api/route?${qs}`);
    const d = await r.json();
    if (r.ok) setRoutes(d.routes); else setNotice("Couldn't plan a route. You can still open it in Amap.");
    setBusy("");
  }

  return (
    <Screen title="Go">
      <form className="mx-4 mt-1 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) search(q.trim()); }}>
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-card px-3">
          <Search className="h-5 w-5 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="A sight, hotel, station or address" aria-label="Destination" className="h-full w-full min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted" />
        </label>
        <button className="h-12 shrink-0 rounded-2xl bg-cobalt px-5 text-[17px] font-semibold text-white dark:text-[#12141c]">Go</button>
      </form>

      <div className="mx-4 mt-3 flex flex-wrap items-center gap-x-3 text-[15px]">
        <div className="flex items-center gap-1 text-muted">Searching in <CityPicker compact value={city} onChange={(c) => { setCity(c); setHere(null); }} onLocate={locate} /></div>
        <button onClick={locate} disabled={busy === "locating"} className="flex min-h-11 items-center gap-1.5 font-semibold text-cobalt">
          {busy === "locating" ? <Preloader className="h-4! w-4!" /> : <LocateFixed className="h-5 w-5" aria-hidden />}
          {here ? "Update location" : "Use my location"}
        </button>
      </div>
      {here && <p className="zh mx-4 text-[13px] text-muted">Near {here.address}</p>}

      <BlockTitle>Nearby</BlockTitle>
      <div className="mx-4 grid grid-cols-3 gap-2">
        {NEARBY.map(({ label, q: k, Icon }) => (
          <button
            key={k}
            onClick={() => (here ? search(k, true) : (locate(), setNotice("Getting your location first — tap again in a moment.")))}
            className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-2xl border border-line bg-card text-[13px] font-semibold"
          >
            <Icon className="h-5 w-5 text-cobalt" aria-hidden /> {label}
          </button>
        ))}
      </div>

      {notice && <p className="mx-4 mt-3 rounded-xl bg-warn-soft p-3 text-[15px] text-warn">{notice}</p>}
      <DemoNote show={demo} what="AMAP_KEY" />
      {busy === "search" && <div className="flex justify-center py-6"><Preloader /></div>}

      {places.length > 0 && (
        <List strong inset dividers>
          {places.map((p) => (
            <ListItem key={p.id} link title={<span className="zh">{p.name}</span>} subtitle={p.pinyin} text={<span className="zh">{p.address}</span>} after={p.distance ? `${p.distance} m` : undefined} onClick={() => choose(p)} />
          ))}
        </List>
      )}

      {dest && (
        <>
          <section className="mx-4 mt-4 rounded-2xl border border-line bg-card p-4">
            <h2 className="zh text-[22px] font-bold">{dest.name}</h2>
            <p className="text-[15px]">{dest.pinyin}</p>
            <p className="zh text-[13px] text-muted">{dest.address}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={() => setCard(["师傅您好，请带我去：", dest.name, `地址：${dest.address}`])} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-cobalt text-[17px] font-semibold text-white dark:text-[#12141c]">
                <CarTaxiFront className="h-5 w-5" aria-hidden /> Show to taxi driver
              </button>
              <a href={amapNav(dest, "bus")} target="_blank" className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-cobalt-soft font-semibold text-cobalt"><Map className="h-4 w-4" aria-hidden /> Amap</a>
              <a href={appleNav(dest, "r")} target="_blank" className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-cobalt-soft font-semibold text-cobalt"><Map className="h-4 w-4" aria-hidden /> Apple Maps</a>
            </div>
          </section>

          {!here && <p className="mx-4 mt-3 text-[15px] text-muted">Use your location to see metro, walking and taxi options.</p>}
          {busy === "route" && <div className="flex justify-center py-6"><Preloader /></div>}
          {routes.length > 0 && <BlockTitle>Ways to get there</BlockTitle>}
          {routes.map((r, i) => {
            const M = MODE[r.mode];
            return (
              <section key={i} className="mx-4 mb-3 rounded-2xl border border-line bg-card p-4">
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <M.Icon className="h-5 w-5 text-cobalt" aria-hidden />
                    <div>
                      <p className="text-[17px] font-semibold">{M.label}</p>
                      {r.mode === "transit" && <p className="text-[13px] text-muted">{r.summary}</p>}
                    </div>
                  </div>
                  <p className="text-right text-[17px] font-semibold tabular-nums">{r.minutes} min{r.priceCny !== undefined && <span className="block text-[13px] font-normal text-muted">≈ ¥{r.priceCny}</span>}</p>
                </header>
                {r.steps.length > 0 && (
                  <ol className="mt-3 space-y-2 border-l-2 border-cobalt-soft pl-3">
                    {r.steps.map((s, j) => {
                      const S = STEP_ICON[s.kind];
                      return (
                        <li key={j} className="flex gap-2 text-[15px]">
                          <S className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
                          <span>{s.text}{s.zh && <span className="zh block text-[13px] text-muted">{s.zh}</span>}</span>
                        </li>
                      );
                    })}
                  </ol>
                )}
                {r.mode === "driving" && <p className="mt-2 text-[13px] text-muted">Book in the DiDi app (English) or Alipay → DiDi. Fare is Amap’s estimate.</p>}
                {here && (
                  <a target="_blank" href={amapNav(dest, r.mode === "transit" ? "bus" : r.mode === "walking" ? "walk" : "car", { location: here.location, name: "我的位置" })} className="mt-2 flex min-h-11 items-center gap-1 text-[15px] font-semibold text-cobalt">
                    Start navigation <ChevronRight className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </section>
            );
          })}
          {routes.some((r) => r.mode === "transit") && (
            <p className="mx-4 text-[13px] text-muted">At the metro gate, scan the Alipay or WeChat “Transport code”. In many big cities you can also tap a Visa or Mastercard.</p>
          )}
        </>
      )}
      {card && <ShowCard lines={card} sub={dest?.pinyin} onClose={() => setCard(null)} />}
    </Screen>
  );
}
