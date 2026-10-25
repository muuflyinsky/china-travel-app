"use client";
import { useEffect, useState } from "react";
import { UtensilsCrossed } from "lucide-react";
import { Preloader } from "konsta/react";
import { Button, EmptyState } from "./ui";
import { SourceLine } from "./SourceLine";
import { AwardIcon, BibGourmand, MichelinStar } from "./AwardIcon";
import { AppIcon } from "./AppIcon";
import { CuisineTile } from "./CuisineTile";
import { useCity } from "./useCity";
import { useProfile } from "./useProfile";
import { useFx, formatMoney } from "./useFx";
import { useT } from "./useT";
import { fmt, type Dict } from "@/lib/i18n";
import { cuisineInfo } from "@/lib/cuisines";
import { awardScore, type Award } from "@/lib/restaurant-awards";
import type { ListedRestaurant } from "@/lib/restaurants";
import type { City } from "@/lib/cities";

type Lists = Record<string, { name: string; edition: string; checked: string }>;
type Data = { restaurants: ListedRestaurant[]; source: "awards" | "mixed" | "amap"; lists: Lists; cities: { city: City; n: number }[] };

// Award filter: all, Michelin stars, Bib Gourmand, Black Pearl, Must-Eat. "Selected" has no filter
// of its own; those restaurants are under "All". A filter shows only when the city has one.
const FILTERS = [
  { id: "stars", list: "michelin", levels: ["3", "2", "1"] },
  { id: "bib", list: "michelin", levels: ["bib"] },
  { id: "bp", list: "black_pearl", levels: ["3", "2", "1"] },
  { id: "must_eat", list: "dianping", levels: ["must_eat"] },
] as const;
type FilterId = (typeof FILTERS)[number]["id"] | "all";
const PAGE = 20;

const has = (r: ListedRestaurant, id: FilterId) => {
  const f = FILTERS.find((x) => x.id === id);
  return !f || r.awards.some((a) => a.list === f.list && (f.levels as readonly string[]).includes(a.level));
};

/** Best award in words, the rest as symbols only: one short line under the name. */
export function awardShort(t: Dict, a: Award) {
  if (a.list === "michelin") return /^\d$/.test(a.level) ? t.awards.starsShort : a.level === "bib" ? t.awards.bibShort : t.awards.selectedShort;
  if (a.list === "black_pearl") return fmt(t.awards.blackPearl, { d: "◆".repeat(Number(a.level)) }).replace(/\s*黑珍珠\s*/, " ").trim();
  return t.awards.mustEatShort;
}

/** "¥120 ≈ €15" in the traveller's currency (offline rate is fine for a price level). */
export function usePerPerson() {
  const [p] = useProfile();
  const fx = useFx(p.homeCurrency);
  return (cny?: number) => {
    if (!cny) return "";
    // A price level, not a bill: whole units.
    const home = fx && p.homeCurrency !== "CNY" ? ` ≈ ${formatMoney(Math.max(1, Math.round(cny / fx.value)), p.homeCurrency, p.lang, 0)}` : "";
    return `¥${cny}${home}`;
  };
}

/**
 * Michelin / Black Pearl / Must-Eat restaurants in one city. Each card: a 96 px photo (stored with
 * the restaurant) or the cuisine tile, the Chinese name large, "English name · cuisine", "award · price".
 * All else is on the detail page. Filters: award, then cuisine (in the traveller's language).
 */
export function AwardRestaurants({ adcode, cityEn, listedOnly, onPick }: {
  adcode: string; cityEn: string; listedOnly?: boolean; onPick: (r: ListedRestaurant) => void;
}) {
  const t = useT();
  const [p] = useProfile();
  const { setCity } = useCity();
  const perPerson = usePerPerson();
  const [d, setD] = useState<Data | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);
  useEffect(() => {
    setD(null); setFilter("all"); setCuisine(null); setShown(PAGE);
    fetch(`/api/restaurants?city=${adcode}${listedOnly ? "&listed=1" : ""}`).then((r) => r.json()).then(setD).catch(() => {});
  }, [adcode, listedOnly]);
  // As a section of another page (`listedOnly`) it stays out of the way; as Explore's
  // Restaurants view it is the page, so it never goes blank.
  if (listedOnly && !d?.restaurants.length) return null;
  if (!d) return <div className="flex justify-center py-6"><Preloader /></div>;
  const cityLinks = (cs: Data["cities"]) => cs.map(({ city, n }, i) => (
    <span key={city.a}>{i > 0 && " · "}<button onClick={() => setCity(city)} className="font-semibold text-cobalt">{city.e}</button> <span className="tabular-nums">{n}</span></span>
  ));
  if (!d.restaurants.length) {
    return (
      <EmptyState icon={<UtensilsCrossed className="h-6 w-6" aria-hidden />} title={fmt(t.awards.noneCity, { city: cityEn })}
        body={<>{t.awards.withLists} {cityLinks(d.cities.filter((c) => c.city.a !== adcode).slice(0, 6))}</>} />
    );
  }

  const awarded = d.source !== "amap";
  const byAward = d.restaurants.filter((r) => has(r, filter));
  const list = cuisine ? byAward.filter((r) => r.cuisineKey === cuisine) : byAward;
  const filters = FILTERS.map((f) => ({ ...f, n: d.restaurants.filter((r) => has(r, f.id)).length })).filter((f) => f.n > 0);
  // Cuisines in this city (within the award filter), most common first; only ones we can name.
  const counts = new Map<string, number>();
  for (const r of byAward) if (r.cuisineKey) counts.set(r.cuisineKey, (counts.get(r.cuisineKey) ?? 0) + 1);
  const cuisines = [...counts].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => ({ k, n, c: cuisineInfo(k, p.lang)! })).filter((x) => x.c);
  const used = [...new Set(d.restaurants.flatMap((r) => r.awards.map((a) => a.list)))];
  const chip = (f: (typeof filters)[number]) =>
    f.id === "stars" ? <><MichelinStar />{t.awards.starsShort}</>
    : f.id === "bib" ? <><BibGourmand />{t.awards.bibShort}</>
    : f.id === "must_eat" ? <><AppIcon id="dianping" size={16} className="border-0" />{t.awards.mustEatShort}</>
    : <>{fmt(t.awards.blackPearl, { d: "" }).trim()}</>;
  const others = d.cities.filter((c) => c.city.a !== adcode).slice(0, 6);
  const pickFilter = (id: FilterId) => { setFilter(filter === id ? "all" : id); setCuisine(null); setShown(PAGE); };

  return (
    <>
      <h3 className="mt-2 flex items-baseline justify-between gap-2 px-1 text-subhead font-semibold text-muted">
        <span>{awarded ? t.awards.title : t.awards.amapTitle}</span>
        {awarded && <span className="text-footnote font-normal tabular-nums">{fmt(t.awards.inCity, { n: d.restaurants.length, city: cityEn })}</span>}
      </h3>
      {!awarded && others.length > 0 && (
        <p className="px-1 text-footnote text-muted">{fmt(t.awards.noListsHere, { city: cityEn })} {cityLinks(others)}</p>
      )}
      {awarded && filters.length > 1 && (
        <div className="chip-row" role="group" aria-label={t.awards.filter}>
          <button className="pill" aria-pressed={filter === "all"} onClick={() => pickFilter("all")}>{t.awards.all}</button>
          {filters.map((f) => (
            <button key={f.id} className="pill" aria-pressed={filter === f.id} onClick={() => pickFilter(f.id)}>
              {chip(f)}<span className="tabular-nums opacity-70">{f.n}</span>
            </button>
          ))}
        </div>
      )}
      {cuisines.length > 1 && (
        <div className="chip-row" role="group" aria-label={t.awards.cuisine}>
          {cuisines.map(({ k, n, c }) => (
            <button key={k} className="pill" aria-pressed={cuisine === k} onClick={() => { setCuisine(cuisine === k ? null : k); setShown(PAGE); }}>
              {c.short}<span className="tabular-nums opacity-70">{n}</span>
            </button>
          ))}
        </div>
      )}
      {list.length === 0 ? <p className="px-1 text-subhead text-muted">{fmt(t.awards.noneHere, { city: cityEn })}</p> : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
          {list.slice(0, shown).map((r) => {
            const c = cuisineInfo(r.cuisineKey, p.lang);
            const awards = [...r.awards].sort((a, b) => awardScore([b]) - awardScore([a]));
            return (
              <li key={r.zh}>
                <button onClick={() => onPick(r)} className="flex w-full items-center gap-3 p-3 text-left">
                  {r.photos[0] ? <Thumb src={r.photos[0]} c={c} credit={r.photoSource === "Amap" ? "Amap" : t.awards.photoCredit} /> : <CuisineTile c={c} />}
                  <span className="min-w-0 flex-1">
                    <span className="zh line-clamp-2 text-headline" lang="zh-CN">{r.zh}</span>
                    <span className="mt-0.5 line-clamp-2 block text-subhead text-muted">{[r.nameEn, c?.short].filter(Boolean).join(" · ")}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-footnote text-muted">
                      {awards[0] && <span className="inline-flex items-center gap-1 font-semibold text-ink"><AwardIcon a={awards[0]} size={14} />{awardShort(t, awards[0])}</span>}
                      {awards.slice(1).map((a) => <span key={a.list + a.level} className="inline-flex" title={awardShort(t, a)} aria-label={awardShort(t, a)}><AwardIcon a={a} size={14} /></span>)}
                      {r.cost ? <span className="whitespace-nowrap tabular-nums">{perPerson(r.cost)}</span> : null}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {list.length > shown && <Button variant="ghost" className="w-full" onClick={() => setShown((n) => n + PAGE)}>{t.go.showMore}</Button>}
      {used.map((l) => <SourceLine key={l} name={`${d.lists[l].name} ${d.lists[l].edition}`} date={d.lists[l].checked || undefined} />)}
      <SourceLine name="Amap" extra={t.awards.amapNote} />
      {used.length > 0 && <p className="px-1 text-footnote text-muted">{t.awards.note}</p>}
    </>
  );
}

/** 96 px photo for the list, credited in the corner; one that fails to load becomes the cuisine tile. */
function Thumb({ src, c, credit }: { src: string; c?: ReturnType<typeof cuisineInfo>; credit: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <CuisineTile c={c} />;
  return (
    <span className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-control bg-line">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} className="h-full w-full object-cover" />
      <span className="absolute right-1 bottom-1 max-w-[88px] truncate rounded bg-black/55 px-1 text-[10px] leading-4 text-white">{credit}</span>
    </span>
  );
}
