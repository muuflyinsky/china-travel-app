"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Preloader } from "konsta/react";
import { LocateFixed, Search, X, MapPin, ChevronDown, Sparkles, Soup, TrainFront, Bath, Pill, Landmark, Store, Hospital, CarTaxiFront, ExternalLink, Church, Trees, MoonStar, UtensilsCrossed, ShoppingBag, Star } from "lucide-react";
import { Screen, DemoNote } from "@/components/Shell";
import { Section, SectionTitle, Card, Group, Row, Button, Note } from "@/components/ui";
import { AppIcon } from "@/components/AppIcon";
import { ShowCard } from "@/components/ShowCard";
import { CityPicker } from "@/components/CityPicker";
import { CityGuide, type GuideTab } from "@/components/CityGuide";
import { Photo } from "@/components/Photo";
import { RoutePanel } from "@/components/RoutePanel";
import { AwardBadges } from "@/components/AwardBadges";
import { AwardRestaurants } from "@/components/AwardRestaurants";
import { RestaurantDetail } from "@/components/RestaurantDetail";
import type { ListedRestaurant } from "@/lib/restaurants";
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
import categoryDefs from "@/lib/data/categories.json";

const NEARBY = [
  { key: "metro", q: "地铁站", Icon: TrainFront },
  { key: "toilet", q: "公共厕所", Icon: Bath },
  { key: "pharmacy", q: "药店", Icon: Pill },
  { key: "atm", q: "ATM", Icon: Landmark },
  { key: "convenience", q: "便利店", Icon: Store },
  { key: "hospital", q: "医院", Icon: Hospital },
] as const;

// Browse by category (SPEC v0.5 P1.6 #21), best rated first. Keywords live in
// lib/data/categories.json, shared with scripts/build-category-lists.mjs, which pre-generates the
// first page for hot cities into public/categories/; later pages and other cities are live.
type CategoryKey = "museum" | "temple" | "park" | "night" | "shopping";
const ICONS: Record<CategoryKey, typeof Landmark> = { museum: Landmark, temple: Church, park: Trees, night: MoonStar, shopping: ShoppingBag };
const CATEGORIES = (categoryDefs as { key: CategoryKey; q: string; types: string }[]).map((c) => ({ ...c, Icon: ICONS[c.key] }));

type StaticCategories = { generatedAt: string; cats: Partial<Record<CategoryKey, Place[]>> };
const staticCats = new Map<string, Promise<StaticCategories | null>>();
/** The pre-generated lists for a city, fetched once per session; null when there are none. */
const loadStatic = (adcode: string) => {
  if (!staticCats.has(adcode)) staticCats.set(adcode, fetch(`/categories/${adcode}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return staticCats.get(adcode)!;
};

/** Screens scroll inside Konsta's Page element, not the window. */
const scrollTop = () => document.querySelector(".k-page")?.scrollTo({ top: 0, behavior: "smooth" });

type Query = { keyword: string; nearby?: boolean; byRating?: boolean; types?: string; cat?: CategoryKey; page: number };

/**
 * Two rows before content (v0.6): a search bar scoped to a city (city button inside it, location
 * at its end), then one filter row — the city's top picks and must-eat dishes, then live
 * categories. A chosen place shows metro, bus and taxi routes in the app; Nearby sits at the end.
 */
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
  // A guide-listed restaurant opened from the Restaurants view: its own detail, then the same route block.
  const [restaurant, setRestaurant] = useState<ListedRestaurant | null>(null);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState<string>();
  const [card, setCard] = useState<string[] | null>(null);
  // What the page shows with no search: the guide's sights or dishes, or the restaurant list
  // (award lists from the database; well-rated Amap places where a city has none).
  type View = GuideTab | "restaurants";
  const [view, setView] = useState<View>(() => { const v = params.get("tab"); return v === "eat" || v === "restaurants" ? v : "see"; });
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
    // First page of a category in a hot city: the static file, no Amap call.
    if (next.cat && !append && isHotCity(city.a)) {
      const list = (await loadStatic(city.a))?.cats[next.cat];
      if (list?.length) {
        setPlaces(list); setDemo(false); setMore(list.length >= 10); setBusy("");
        return;
      }
    }
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
  const tripCities = p.cities.map((c) => ({ n: c.n ?? c.s, s: c.s, a: c.a, e: c.e, p: c.p ?? "", py: "", t: "city" as const }));
  const reset = () => { setPlaces([]); setQ(""); setQuery(null); setMore(false); setNotice(undefined); };
  const hot = isHotCity(city.a);
  const show = (v: View) => { reset(); setDest(null); setRestaurant(null); setView(v); };
  const pickPlace = (x: Place | string) => { setRestaurant(null); if (typeof x === "string") { setQ(x); search(x); } else setDest(x); scrollTop(); };
  const pickRestaurant = (r: ListedRestaurant) => { setRestaurant(r); setDest(r.poi); scrollTop(); track("restaurant_open", { dishes: r.dishes.length }); };
  const closeDetail = () => { setDest(null); setRestaurant(null); };

  const finder = (
    <Section>
      <div className="flex h-control items-center rounded-control border border-line bg-card">
        {/* The city the search runs in, inside the bar; trip cities are listed first in the picker.
            Kept outside the <form>: the picker's sheet renders here and its buttons must not submit. */}
        <CityPicker value={city} trip={tripCities} onChange={(c) => { setCity(c); setHere(null); reset(); setDest(null); setRestaurant(null); }} onLocate={locate}
          trigger={(open) => (
            <button type="button" onClick={open} aria-label={`${t.city.searchingIn} ${city.e}. ${t.common.edit}`}
              className="flex h-full max-w-[42%] shrink-0 items-center gap-1 border-r border-line pr-2 pl-3 text-subhead font-semibold text-cobalt">
              <MapPin className="h-4 w-4 shrink-0 max-[359px]:hidden" aria-hidden /><span className="truncate">{city.e}</span><ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
            </button>
          )} />
        <form role="search" className="flex h-full min-w-0 flex-1 items-center" onSubmit={(e) => { e.preventDefault(); (document.activeElement as HTMLElement | null)?.blur(); if (q.trim()) search(q.trim()); }}>
          <Search className="ml-2.5 h-4 w-4 shrink-0 text-muted max-[359px]:hidden" aria-hidden />
          <input type="search" enterKeyHint="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t.go.placeholderShort} aria-label={t.go.destination}
            className="h-full min-w-0 flex-1 bg-transparent pl-2 text-body max-[359px]:pl-2.5 outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden" />
          {q && <button type="button" onClick={reset} aria-label={t.go.clear} className="grid h-full w-9 shrink-0 place-items-center text-muted"><X className="h-4 w-4" aria-hidden /></button>}
          <button type="button" onClick={locate} disabled={busy === "locating"} aria-label={here ? t.go.updateLocation : t.go.useLocation} className={`grid h-full w-touch shrink-0 place-items-center ${here ? "text-cobalt" : "text-muted"}`}>
            {busy === "locating" ? <Preloader className="h-4! w-4!" /> : <LocateFixed className="h-5 w-5" aria-hidden />}
          </button>
        </form>
      </div>
      {/* One filter row: the city's picks (when we have a guide), restaurants, then live categories. */}
      <div className="chip-row" role="group" aria-label={t.go.findPlace}>
        {hot && (["see", "eat"] as const).map((tab) => (
          <button key={tab} aria-pressed={!query && view === tab} className="pill" onClick={() => show(tab)}>
            {tab === "see" ? <Sparkles className="h-4 w-4" aria-hidden /> : <Soup className="h-4 w-4" aria-hidden />}{tab === "see" ? t.go.topPicks : t.go.mustEat}
          </button>
        ))}
        <button aria-pressed={!query && view === "restaurants"} className="pill" onClick={() => show("restaurants")}>
          <UtensilsCrossed className="h-4 w-4" aria-hidden />{t.go.restaurants}
        </button>
        {CATEGORIES.map(({ key, q: k, types, Icon }) => (
          <button key={key} aria-pressed={query?.cat === key} className="pill"
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
      <div className="chip-row" role="group" aria-label={t.go.nearby}>
        {NEARBY.map(({ key, q: k, Icon }) => (
          <button key={k} onClick={() => (here ? (search(k, true), scrollTop()) : (locate(), setNotice(t.go.locateFirst)))} className="pill">
            <Icon className="h-4 w-4 text-cobalt" aria-hidden />{t.go.nearbyItems[key]}
          </button>
        ))}
      </div>
      {here && <p className="zh px-1 text-footnote text-muted">{fmt(t.go.near, { address: here.address })}</p>}
    </Section>
  );

  /** Taxi card and Amap navigation for a place (shared by the place card and the restaurant detail). */
  const actions = (x: Place) => (
    <div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="soft" className="text-subhead!" onClick={() => { setCard(["师傅您好，请带我去：", x.name, `地址：${x.address}`]); track("taxi_card_shown", { source: restaurant ? "restaurant" : "explore" }); }}>
          <CarTaxiFront className="h-5 w-5" aria-hidden /> {t.go.showDriver}
        </Button>
        <a href={amapNav(x, "bus", from)} target="_blank" rel="noopener" className="flex min-h-control items-center justify-center gap-2 rounded-control bg-cobalt-soft text-subhead font-semibold text-cobalt">
          <AppIcon id="amap" size={22} /> {t.go.start}
        </a>
      </div>
      <a href={appleNav(x, "r")} target="_blank" rel="noopener" className="mt-1 flex min-h-11 items-center justify-center gap-1.5 text-footnote font-semibold text-cobalt"><AppIcon id="applemaps" size={18} /> Apple Maps</a>
    </div>
  );

  /** Metro, bus and taxi in the app (RoutePanel), under a "Getting there" heading. */
  const routes = (x: Place) => (
    <div className="space-y-stack pt-2">
      <SectionTitle aside={!here && <button onClick={locate} className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt"><LocateFixed className="h-4 w-4" aria-hidden />{t.go.useLocation}</button>}>{t.go.ways}</SectionTitle>
      <RoutePanel dest={x} origin={origin} />
      <div className="flex items-start gap-3 px-1">
        <span className="flex -space-x-2"><AppIcon id="alipay" size={28} /><AppIcon id="wechat" size={28} /></span>
        <p className="text-footnote text-muted">{t.go.metroNote}</p>
      </div>
    </div>
  );

  return (
    <Screen title={t.go.title}>
      {dest || restaurant ? (
        <>
          <Section>
            <button onClick={closeDetail} className="flex min-h-11 items-center px-1 text-subhead font-semibold text-cobalt">{places.length || restaurant ? t.go.back : t.guide.backToPicks}</button>
            {restaurant ? (
              <RestaurantDetail r={restaurant}>
                {dest ? <>{actions(dest)}{routes(dest)}</> : (
                  <Button variant="soft" className="w-full text-subhead!" onClick={() => { setCard(["您好，我想去这家餐厅：", restaurant.zh]); track("taxi_card_shown", { source: "restaurant" }); }}>
                    <CarTaxiFront className="h-5 w-5" aria-hidden /> {t.go.showDriver}
                  </Button>
                )}
              </RestaurantDetail>
            ) : dest && (
              <Card>
                <Photo src={dest.photo} alt={dest.name} className="mb-3" />
                <h2 className="zh text-title">{dest.name}</h2>
                <AwardBadges awards={dest.awards} />
                <p className="text-subhead">{dest.pinyin}</p>
                <p className="zh text-footnote text-muted">{dest.address}</p>
                {actions(dest)}
              </Card>
            )}
          </Section>
          {dest && !restaurant && <Section>{routes(dest)}</Section>}
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
                    <Row key={x.id} onClick={() => { setDest(x); scrollTop(); }}
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
          {view === "restaurants" ? (
            <Section>
              <AwardRestaurants adcode={city.a} cityEn={city.e} onPick={pickRestaurant} />
            </Section>
          ) : hot ? (
            <Section>
              <CityGuide adcode={city.a} cityEn={city.e} tab={view}
                onFindDish={(zh) => { setQ(zh); search(zh, Boolean(here), true); scrollTop(); }} onRestaurants={() => show("restaurants")} />
            </Section>
          ) : (
            <Section>
              {/* No city guide here, but the city may still have Michelin / Must-Eat restaurants. */}
              <AwardRestaurants adcode={city.a} cityEn={city.e} listedOnly onPick={pickRestaurant} />
              <a href={goLink("trip", "attraction", { cityEn: city.e, city: city.s }, "explore_top", "explore-top")} target="_blank" rel="noopener" className="flex min-h-11 items-center gap-1 px-1 text-subhead font-semibold text-cobalt">
                {fmt(t.guide.topTrip, { city: city.e })}<ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            </Section>
          )}
          {nearby}
        </>
      )}
      {card && <ShowCard kind="taxi" lines={card} sub={restaurant?.nameEn ?? dest?.pinyin} onClose={() => setCard(null)} />}
    </Screen>
  );
}

export default function ExplorePage() {
  return <Suspense><Explore /></Suspense>;
}
