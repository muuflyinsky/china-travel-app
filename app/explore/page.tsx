"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Preloader } from "konsta/react";
import { LocateFixed, Search, TrainFront, Bath, Pill, Landmark, Store, Hospital, CarTaxiFront, ExternalLink } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Button, Note } from "@/components/ui";
import { AppIcon } from "@/components/AppIcon";
import { ShowCard } from "@/components/ShowCard";
import { CityPicker } from "@/components/CityPicker";
import { CityGuide } from "@/components/CityGuide";
import { AwardBadges } from "@/components/AwardBadges";
import { awardScore } from "@/lib/restaurant-awards";
import { isHotCity } from "@/lib/hot-cities";
import { useCity, type Here } from "@/components/useCity";
import { useProfile } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { amapNav, appleNav } from "@/lib/maplinks";
import { goLink } from "@/lib/affiliate";
import { track } from "@/lib/track";
import { fmt } from "@/lib/i18n";
import type { Place } from "@/lib/amap";

const NEARBY = [
  { key: "metro", q: "地铁站", Icon: TrainFront },
  { key: "toilet", q: "公共厕所", Icon: Bath },
  { key: "pharmacy", q: "药店", Icon: Pill },
  { key: "atm", q: "ATM", Icon: Landmark },
  { key: "convenience", q: "便利店", Icon: Store },
  { key: "hospital", q: "医院", Icon: Hospital },
] as const;

/** Find a place, then hand directions to Amap; we only add the taxi card and Chinese names. */
function Explore() {
  const t = useT();
  const params = useSearchParams();
  const { city, setCity, detect } = useCity();
  const [p] = useProfile();
  const [here, setHere] = useState<Here | null>(null);
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [dest, setDest] = useState<Place | null>(null);
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

  /** `byRating`: for "where to eat this dish", best-rated first, then nearest. */
  async function search(keyword: string, nearby = false, byRating = false) {
    setBusy("search"); setNotice(undefined); setDest(null);
    const qs = new URLSearchParams({ q: keyword });
    if (nearby && here) qs.set("around", here.location); else qs.set("city", city.a);
    const r = await fetch(`/api/places?${qs}`);
    const d = await r.json();
    const list: Place[] = r.ok ? d.places : [];
    // "Where to eat it": guide-listed restaurants first (Michelin, Black Pearl, Must-Eat), then rating, then distance.
    if (byRating) list.sort((a, b) => awardScore(b.awards) - awardScore(a.awards) || Number(b.rating ?? 0) - Number(a.rating ?? 0) || Number(a.distance ?? 0) - Number(b.distance ?? 0));
    if (r.ok) { setPlaces(list); setDemo(d.demo); if (!d.places.length) setNotice(fmt(t.go.nothing, { q: keyword })); }
    else setNotice(t.go.searchDown);
    setBusy("");
  }

  // Deep link from Today, e.g. /explore?q=机场 on the last days of the trip.
  useEffect(() => {
    const preset = params.get("q");
    if (preset) { setQ(preset); search(preset); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const from = here ? { location: here.location, name: "我的位置" } : undefined;

  const searching = places.length > 0 || busy === "search";
  const tripCities = p.cities.length ? p.cities : [];

  const finder = (
    <Section title={t.go.findPlace}>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) search(q.trim()); }}>
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-card px-3">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.go.placeholder} aria-label={t.go.destination} className="h-full w-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted" />
        </label>
        <Button type="submit" className="shrink-0 px-5">{t.go.go}</Button>
      </form>
      {/* Nearby: one row of small buttons; needs the traveller's location. */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={t.go.nearby}>
        {NEARBY.map(({ key, q: k, Icon }) => (
          <button key={k} onClick={() => (here ? search(k, true) : (locate(), setNotice(t.go.locateFirst)))} className="pill shrink-0 whitespace-nowrap">
            <Icon className="h-4 w-4 text-cobalt" aria-hidden />{t.go.nearbyItems[key]}
          </button>
        ))}
      </div>
      {here && <p className="zh px-1 text-footnote text-muted">{fmt(t.go.near, { address: here.address })}</p>}
      {notice && <Note tone="warn">{notice}</Note>}
      <DemoNote show={demo} what={t.common.mapKey} />
    </Section>
  );

  return (
    <Screen title={t.go.title}>
      <Section>
        {/* Trip cities as a switch; any other city through the picker. */}
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4" role="group" aria-label={t.city.label}>
          {tripCities.map((c) => (
            <button key={c.a} aria-pressed={c.a === city.a} className="pill shrink-0 whitespace-nowrap"
              onClick={() => { setCity({ n: c.n ?? c.s, s: c.s, a: c.a, e: c.e, p: c.p ?? "", py: "", t: "city" }); setHere(null); setPlaces([]); setDest(null); }}>
              {c.e}
            </button>
          ))}
          {!tripCities.some((c) => c.a === city.a) && <span className="pill shrink-0 whitespace-nowrap" aria-pressed="true">{city.e}</span>}
          <CityPicker value={city} onChange={(c) => { setCity(c); setHere(null); setPlaces([]); setDest(null); }} onLocate={locate}
            trigger={(open) => <button onClick={open} className="flex min-h-11 shrink-0 items-center px-2 text-subhead font-semibold whitespace-nowrap text-cobalt">{t.go.otherCity}</button>} />
          <button onClick={locate} disabled={busy === "locating"} aria-label={here ? t.go.updateLocation : t.go.useLocation} className="grid h-11 w-11 shrink-0 place-items-center text-cobalt">
            {busy === "locating" ? <Preloader className="h-4! w-4!" /> : <LocateFixed className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </Section>

      {dest ? (
        <Section>
          <Card>
            <h2 className="zh text-title">{dest.name}</h2>
            <AwardBadges awards={dest.awards} />
            <p className="text-subhead">{dest.pinyin}</p>
            <p className="zh text-footnote text-muted">{dest.address}</p>
            <a href={amapNav(dest, "bus", from)} target="_blank" rel="noopener" className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cobalt px-4 text-headline text-white dark:text-porcelain">
              <AppIcon id="amap" size={24} /> {t.go.openAmap}
            </a>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="soft" className="text-subhead!" onClick={() => { setCard(["师傅您好，请带我去：", dest.name, `地址：${dest.address}`]); track("taxi_card_shown", { source: "explore" }); }}>
                <CarTaxiFront className="h-5 w-5" aria-hidden /> {t.go.showDriver}
              </Button>
              <a href={appleNav(dest, "r")} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cobalt-soft text-subhead font-semibold text-cobalt"><AppIcon id="applemaps" size={24} /> Apple Maps</a>
            </div>
            <p className="mt-3 text-footnote text-muted">{t.go.amapNote}</p>
          </Card>
          <button onClick={() => setDest(null)} className="flex min-h-11 items-center px-1 text-subhead font-semibold text-cobalt">{t.go.back}</button>
          <div className="flex items-start gap-3 px-1">
            <span className="flex -space-x-2"><AppIcon id="alipay" size={28} /><AppIcon id="wechat" size={28} /></span>
            <p className="text-footnote text-muted">{t.go.metroNote}</p>
          </div>
        </Section>
      ) : searching ? (
        <>
          {finder}
          <Section>
            {busy === "search" && <div className="flex justify-center py-6"><Preloader /></div>}
            {places.length > 0 && (
              <>
                <button onClick={() => { setPlaces([]); setQ(""); }} className="flex min-h-11 items-center px-1 text-subhead font-semibold text-cobalt">{t.guide.backToPicks}</button>
                <Group>
                  {places.map((p) => (
                    <Row key={p.id} onClick={() => setDest(p)} title={<span className="zh">{p.name}</span>}
                      sub={<>{p.pinyin}<span className="zh block">{p.address}</span><AwardBadges awards={p.awards} /></>}
                      after={p.distance ? <span className="text-footnote text-muted tabular-nums">{p.distance} m</span> : undefined} />
                  ))}
                </Group>
              </>
            )}
          </Section>
        </>
      ) : (
        <>
          {/* City picks first (SPEC v0.5), then search and nearby. */}
          {isHotCity(city.a) ? (
            <Section title={fmt(t.guide.title, { city: city.e })}>
              <CityGuide adcode={city.a} cityEn={city.e} initialTab={params.get("tab") === "eat" ? "eat" : "see"}
                onFindDish={(zh) => { setQ(zh); search(zh, Boolean(here), true); window.scrollTo({ top: 0 }); }}
                onPickPlace={(x) => { if (typeof x === "string") { setQ(x); search(x); } else setDest(x); window.scrollTo({ top: 0 }); }} />
            </Section>
          ) : (
            <Section>
              <a href={goLink("trip", "attraction", { cityEn: city.e, city: city.s }, "explore_top", "explore-top")} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 px-1 text-subhead font-semibold text-cobalt">
                {fmt(t.guide.topTrip, { city: city.e })}<ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Section>
          )}
          {finder}
        </>
      )}
      {card && <ShowCard kind="taxi" lines={card} sub={dest?.pinyin} onClose={() => setCard(null)} />}
    </Screen>
  );
}

export default function ExplorePage() {
  return <Suspense><Explore /></Suspense>;
}
