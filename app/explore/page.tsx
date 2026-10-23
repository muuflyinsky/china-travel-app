"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Preloader } from "konsta/react";
import { LocateFixed, Search, TrainFront, Bath, Pill, Landmark, Store, Hospital, CarTaxiFront, ExternalLink, Church, Trees, MoonStar, UtensilsCrossed, ShoppingBag, Star } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, Card, Group, Row, Button, Note } from "@/components/ui";
import { AppIcon } from "@/components/AppIcon";
import { ShowCard } from "@/components/ShowCard";
import { CityPicker } from "@/components/CityPicker";
import { CityGuide } from "@/components/CityGuide";
import { Photo } from "@/components/Photo";
import { RoutePanel } from "@/components/RoutePanel";
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

// Browse by category (SPEC v0.5 P1.6 #21): live Amap search in the city, best rated first.
const CATEGORIES = [
  { key: "museum", q: "博物馆", types: "140100", Icon: Landmark },
  { key: "temple", q: "寺庙", types: "110000", Icon: Church },
  { key: "park", q: "公园", types: "110000", Icon: Trees },
  { key: "night", q: "夜景", types: "110000", Icon: MoonStar },
  { key: "food", q: "美食", types: "050000", Icon: UtensilsCrossed },
  { key: "shopping", q: "购物中心", types: "060000", Icon: ShoppingBag },
] as const;
type CategoryKey = (typeof CATEGORIES)[number]["key"];

type Query = { keyword: string; nearby?: boolean; byRating?: boolean; types?: string; cat?: CategoryKey; page: number };

/** Search → categories → city picks → nearby. A chosen place shows metro, bus and taxi routes in the app. */
function Explore() {
  const t = useT();
  const params = useSearchParams();
  const { city, setCity, detect } = useCity();
  const [p] = useProfile();
  const [here, setHere] = useState<Here | null>(null);
  const [q, setQ] = useState("");
  const [places, setPlaces] = useState<Place[]>([]);
  const [query, setQuery] = useState<Query | null>(null);
  const [more, setMore] = useState(false);
  const [dest, setDest] = useState<Place | null>(null);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<string>();
  const [card, setCard] = useState<string[] | null>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  async function locate() {
    setBusy("locating"); setNotice(undefined);
    try {
      setHere(await detect());
    } catch {
      setNotice(fmt(t.go.locationOff, { city: city.e }));
    }
    setBusy("");
  }

  /** Runs a search; page > 1 appends (infinite scroll in category browsing). */
  async function run(next: Query) {
    const append = next.page > 1;
    setBusy(append ? "more" : "search"); setNotice(undefined); if (!append) { setDest(null); setPlaces([]); }
    setQuery(next);
    const qs = new URLSearchParams({ q: next.keyword, page: String(next.page) });
    if (next.nearby && here) qs.set("around", here.location); else qs.set("city", city.a);
    if (next.types) qs.set("types", next.types);
    if (next.cat || next.byRating) qs.set("sort", "rating");
    const r = await fetch(`/api/places?${qs}`).catch(() => null);
    const d = r?.ok ? await r.json() : null;
    if (!d) { setNotice(t.go.searchDown); setBusy(""); return; }
    let list: Place[] = d.places;
    // "Where to eat it": guide-listed restaurants first (Michelin, Black Pearl, Must-Eat), then rating, then distance.
    if (next.byRating) list = [...list].sort((a, b) => awardScore(b.awards) - awardScore(a.awards) || Number(b.rating ?? 0) - Number(a.rating ?? 0) || Number(a.distance ?? 0) - Number(b.distance ?? 0));
    setPlaces((old) => {
      const merged = append ? [...old, ...list.filter((x) => !old.some((o) => o.id === x.id))] : list;
      if (!merged.length) setNotice(fmt(t.go.nothing, { q: next.keyword }));
      return merged;
    });
    setDemo(d.demo);
    // Amap pages hold 20; a short page (before cleaning) means there's nothing more. Demo data has one page.
    setMore(Boolean(next.cat) && !d.demo && list.length >= 10);
    setBusy("");
  }
  const search = (keyword: string, nearby = false, byRating = false) => run({ keyword, nearby, byRating, page: 1 });

  // Load the next page when the end of a category list scrolls into view.
  useEffect(() => {
    const el = moreRef.current;
    if (!el || !more || !query) return;
    const io = new IntersectionObserver((e) => { if (e[0].isIntersecting && !busy) run({ ...query, page: query.page + 1 }); }, { rootMargin: "200px" });
    io.observe(el);
    return () => io.disconnect();
  }, [more, query, busy]); // eslint-disable-line react-hooks/exhaustive-deps

  // Deep link from Today, e.g. /explore?q=机场 on the last days of the trip.
  useEffect(() => {
    const preset = params.get("q");
    if (preset) { setQ(preset); search(preset); }
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  const from = here ? { location: here.location, name: "我的位置" } : undefined;
  // Routes start from here, or from the saved hotel when location is off.
  const origin = here ? { location: here.location, label: "here" as const, citycode: here.citycode }
    : p.hotel?.location ? { location: p.hotel.location, label: "hotel" as const } : null;

  const searching = places.length > 0 || busy === "search";
  const tripCities = p.cities.length ? p.cities : [];
  const reset = () => { setPlaces([]); setQ(""); setQuery(null); setMore(false); setNotice(undefined); };

  const finder = (
    <Section>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (q.trim()) search(q.trim()); }}>
        <label className="flex h-12 min-w-0 flex-1 items-center gap-2 rounded-2xl border border-line bg-card px-3">
          <Search className="h-5 w-5 shrink-0 text-muted" aria-hidden />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.go.placeholder} aria-label={t.go.destination} className="h-full w-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted" />
        </label>
        <Button type="submit" className="shrink-0 px-5">{t.go.go}</Button>
      </form>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={t.go.findPlace}>
        {CATEGORIES.map(({ key, q: k, types, Icon }) => (
          <button key={key} aria-pressed={query?.cat === key} className="pill shrink-0 whitespace-nowrap"
            onClick={() => (query?.cat === key ? reset() : (setQ(""), run({ keyword: k, types, cat: key, page: 1 })))}>
            <Icon className="h-4 w-4" aria-hidden />{t.go.cats[key]}
          </button>
        ))}
      </div>
      {notice && <Note tone="warn">{notice}</Note>}
      <DemoNote show={demo} what={t.common.mapKey} />
    </Section>
  );

  const nearby = (
    <Section title={t.go.nearby}>
      {/* Nearby: one row of small buttons; needs the traveller's location. */}
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4" role="group" aria-label={t.go.nearby}>
        {NEARBY.map(({ key, q: k, Icon }) => (
          <button key={k} onClick={() => (here ? (search(k, true), window.scrollTo({ top: 0 })) : (locate(), setNotice(t.go.locateFirst)))} className="pill shrink-0 whitespace-nowrap">
            <Icon className="h-4 w-4 text-cobalt" aria-hidden />{t.go.nearbyItems[key]}
          </button>
        ))}
      </div>
      {here && <p className="zh px-1 text-footnote text-muted">{fmt(t.go.near, { address: here.address })}</p>}
    </Section>
  );

  return (
    <Screen title={t.go.title}>
      <Section>
        {/* Trip cities as a switch; any other city through the picker. */}
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4" role="group" aria-label={t.city.label}>
          {tripCities.map((c) => (
            <button key={c.a} aria-pressed={c.a === city.a} className="pill shrink-0 whitespace-nowrap"
              onClick={() => { setCity({ n: c.n ?? c.s, s: c.s, a: c.a, e: c.e, p: c.p ?? "", py: "", t: "city" }); setHere(null); reset(); setDest(null); }}>
              {c.e}
            </button>
          ))}
          {!tripCities.some((c) => c.a === city.a) && <span className="pill shrink-0 whitespace-nowrap" aria-pressed="true">{city.e}</span>}
          <CityPicker value={city} onChange={(c) => { setCity(c); setHere(null); reset(); setDest(null); }} onLocate={locate}
            trigger={(open) => <button onClick={open} className="flex min-h-11 shrink-0 items-center px-2 text-subhead font-semibold whitespace-nowrap text-cobalt">{t.go.otherCity}</button>} />
          <button onClick={locate} disabled={busy === "locating"} aria-label={here ? t.go.updateLocation : t.go.useLocation} className="grid h-11 w-11 shrink-0 place-items-center text-cobalt">
            {busy === "locating" ? <Preloader className="h-4! w-4!" /> : <LocateFixed className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </Section>

      {dest ? (
        <>
          <Section>
            <button onClick={() => setDest(null)} className="flex min-h-11 items-center px-1 text-subhead font-semibold text-cobalt">{places.length ? t.go.back : t.guide.backToPicks}</button>
            <Card>
              <Photo src={dest.photo} alt={dest.name} className="mb-3" />
              <h2 className="zh text-title">{dest.name}</h2>
              <AwardBadges awards={dest.awards} />
              <p className="text-subhead">{dest.pinyin}</p>
              <p className="zh text-footnote text-muted">{dest.address}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="soft" className="text-subhead!" onClick={() => { setCard(["师傅您好，请带我去：", dest.name, `地址：${dest.address}`]); track("taxi_card_shown", { source: "explore" }); }}>
                  <CarTaxiFront className="h-5 w-5" aria-hidden /> {t.go.showDriver}
                </Button>
                <a href={amapNav(dest, "bus", from)} target="_blank" rel="noopener" className="flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cobalt-soft text-subhead font-semibold text-cobalt">
                  <AppIcon id="amap" size={22} /> {t.go.start}
                </a>
              </div>
              <a href={appleNav(dest, "r")} target="_blank" rel="noopener" className="mt-1 flex min-h-11 items-center justify-center gap-1.5 text-footnote font-semibold text-cobalt"><AppIcon id="applemaps" size={18} /> Apple Maps</a>
            </Card>
          </Section>
          <Section title={t.go.ways} aside={!here && <button onClick={locate} className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt"><LocateFixed className="h-4 w-4" aria-hidden />{t.go.useLocation}</button>}>
            <RoutePanel dest={dest} origin={origin} />
            <div className="flex items-start gap-3 px-1">
              <span className="flex -space-x-2"><AppIcon id="alipay" size={28} /><AppIcon id="wechat" size={28} /></span>
              <p className="text-footnote text-muted">{t.go.metroNote}</p>
            </div>
          </Section>
        </>
      ) : searching ? (
        <>
          {finder}
          <Section>
            {busy === "search" && <div className="flex justify-center py-6"><Preloader /></div>}
            {places.length > 0 && (
              <>
                <button onClick={reset} className="flex min-h-11 items-center px-1 text-subhead font-semibold text-cobalt">{t.guide.backToPicks}</button>
                <Group>
                  {places.map((x) => (
                    <Row key={x.id} onClick={() => { setDest(x); window.scrollTo({ top: 0 }); }}
                      icon={x.photo ? <Photo src={x.photo} alt="" shape="square" /> : undefined}
                      title={<span className="zh">{x.name}</span>}
                      sub={<>{x.pinyin}<span className="zh block">{x.address}</span>
                        {Number(x.rating) > 0 && <span className="flex items-center gap-1 tabular-nums"><Star className="h-3.5 w-3.5 fill-current text-ink" aria-hidden />{x.rating}{x.cost ? ` · ¥${x.cost}` : ""}</span>}
                        <AwardBadges awards={x.awards} /></>}
                      after={x.distance ? <span className="text-footnote text-muted tabular-nums">{x.distance} m</span> : undefined} />
                  ))}
                </Group>
                {more && (
                  <div ref={moreRef} className="flex justify-center">
                    {busy === "more" ? <Preloader /> : <Button variant="ghost" onClick={() => query && run({ ...query, page: query.page + 1 })}>{t.go.showMore}</Button>}
                  </div>
                )}
              </>
            )}
          </Section>
        </>
      ) : (
        <>
          {finder}
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
          {nearby}
        </>
      )}
      {card && <ShowCard kind="taxi" lines={card} sub={dest?.pinyin} onClose={() => setCard(null)} />}
    </Screen>
  );
}

export default function ExplorePage() {
  return <Suspense><Explore /></Suspense>;
}
