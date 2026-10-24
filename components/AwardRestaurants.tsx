"use client";
import { useEffect, useRef, useState } from "react";
import { Star, ChevronRight } from "lucide-react";
import { Group, Button } from "./ui";
import { SourceLine } from "./SourceLine";
import { AwardBadges } from "./AwardBadges";
import { AwardIcon, BibGourmand, MichelinPlate } from "./AwardIcon";
import { AppIcon } from "./AppIcon";
import { Photo } from "./Photo";
import { useCity } from "./useCity";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";
import type { AwardRestaurant } from "@/lib/restaurant-awards";
import type { Place } from "@/lib/amap";
import type { City } from "@/lib/cities";

type Listed = AwardRestaurant & { poi: Place | null; rating?: number; cost?: number };
type Lists = Record<string, { name: string; edition: string; checked: string }>;
type Data = { restaurants: Listed[]; source: "awards" | "mixed" | "amap"; lists: Lists; cities: { city: City; n: number }[] };

// One filter per award, best first; a filter shows only when the city has a restaurant with it.
const FILTERS = [
  { id: "m3", list: "michelin", level: "3" },
  { id: "m2", list: "michelin", level: "2" },
  { id: "m1", list: "michelin", level: "1" },
  { id: "bib", list: "michelin", level: "bib" },
  { id: "selected", list: "michelin", level: "selected" },
  { id: "bp", list: "black_pearl", level: "" },
  { id: "must_eat", list: "dianping", level: "must_eat" },
] as const;
type FilterId = (typeof FILTERS)[number]["id"] | "all";
const PAGE = 20;

const has = (r: Listed, id: FilterId) => {
  const f = FILTERS.find((x) => x.id === id);
  return !f || r.awards.some((a) => a.list === f.list && (!f.level || a.level === f.level));
};

/**
 * Restaurants on the Michelin / Black Pearl / Must-Eat lists for one city, with a switcher for every
 * city we have lists for and a filter per award. Hidden when the city has none (`listedOnly`), or
 * filled with well-rated Amap restaurants otherwise.
 */
export function AwardRestaurants({ adcode, cityEn, listedOnly, onPick }: {
  adcode: string; cityEn: string; listedOnly?: boolean; onPick: (p: Place | string) => void;
}) {
  const t = useT();
  const { setCity } = useCity();
  const [d, setD] = useState<Data | null>(null);
  const [filter, setFilter] = useState<FilterId>("all");
  const [shown, setShown] = useState(PAGE);
  const cityRow = useRef<HTMLDivElement>(null);
  useEffect(() => {
    setD(null); setFilter("all"); setShown(PAGE);
    fetch(`/api/restaurants?city=${adcode}${listedOnly ? "&listed=1" : ""}`).then((r) => r.json()).then(setD).catch(() => {});
  }, [adcode, listedOnly]);
  // Keep the current city's chip in view (it may be far along the row).
  useEffect(() => {
    const row = cityRow.current, on = row?.querySelector<HTMLElement>("[aria-pressed=true]");
    if (!row || !on) return;
    const r = row.getBoundingClientRect(), c = on.getBoundingClientRect();
    row.scrollLeft += c.left - r.left - (r.width - c.width) / 2;
  }, [d]);
  if (!d?.restaurants.length) return null;

  const awarded = d.source !== "amap";
  const list = d.restaurants.filter((r) => has(r, filter));
  const filters = FILTERS.map((f) => ({ ...f, n: d.restaurants.filter((r) => has(r, f.id)).length })).filter((f) => f.n > 0);
  const used = [...new Set(d.restaurants.flatMap((r) => r.awards.map((a) => a.list)))];
  const chip = (f: (typeof filters)[number]) =>
    f.id === "bib" ? <><BibGourmand />{t.awards.bibShort}</>
    : f.id === "selected" ? <><MichelinPlate />{t.awards.selectedShort}</>
    : f.id === "must_eat" ? <><AppIcon id="dianping" size={16} className="border-0" />{t.awards.mustEatShort}</>
    : f.id === "bp" ? <>{fmt(t.awards.blackPearl, { d: "" }).trim()}</>
    : <span className="inline-flex" aria-label={fmt(t.awards.stars, { n: f.level })}><AwardIcon a={{ list: "michelin", level: f.level, edition: "" }} /></span>;

  return (
    <>
      <h3 className="mt-2 flex items-baseline justify-between gap-2 px-1 text-subhead font-semibold text-muted">
        <span>{awarded ? t.awards.title : t.awards.amapTitle}</span>
        {awarded && <span className="text-footnote font-normal tabular-nums">{fmt(t.awards.inCity, { n: d.restaurants.length, city: cityEn })}</span>}
      </h3>
      {d.cities.length > 1 && (
        <div ref={cityRow} className="chip-row" role="group" aria-label={t.awards.cities}>
          {d.cities.map(({ city, n }) => (
            <button key={city.a} className="pill" aria-pressed={city.a === adcode} onClick={() => city.a !== adcode && setCity(city)}>
              {city.e}<span className="tabular-nums opacity-70">{n}</span>
            </button>
          ))}
        </div>
      )}
      {awarded && filters.length > 1 && (
        <div className="chip-row" role="group" aria-label={t.awards.filter}>
          <button className="pill" aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setShown(PAGE); }}>{t.awards.all}</button>
          {filters.map((f) => (
            <button key={f.id} className="pill" aria-pressed={filter === f.id} onClick={() => { setFilter(filter === f.id ? "all" : f.id); setShown(PAGE); }}>
              {chip(f)}<span className="tabular-nums opacity-70">{f.n}</span>
            </button>
          ))}
        </div>
      )}
      {list.length === 0 ? <p className="px-1 text-subhead text-muted">{fmt(t.awards.noneHere, { city: cityEn })}</p> : (
        <Group>
          {list.slice(0, shown).map((r) => (
            <li key={r.zh}>
              <button onClick={() => onPick(r.poi ?? r.zh)} className="flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left">
                {r.poi?.photo && <Photo src={r.poi.photo} alt="" shape="square" />}
                <span className="min-w-0 flex-1">
                  <span className="zh block text-body">{r.zh}</span>
                  {(r.en || r.cuisine) && <span className="block text-footnote text-muted">{[r.en, r.cuisine && <span key="c" className="zh">{r.cuisine}</span>].filter(Boolean).reduce<React.ReactNode[]>((a, x, i) => (i ? [...a, " · ", x] : [x]), [])}</span>}
                  {(r.rating || r.cost) && (
                    <span className="flex items-center gap-1 text-footnote text-muted tabular-nums">
                      {r.rating && <><Star className="h-3.5 w-3.5 fill-current text-ink" aria-hidden />{fmt(t.awards.amapRating, { n: r.rating.toFixed(1) })}</>}
                      {r.rating && r.cost ? " · " : ""}{r.cost ? fmt(t.awards.perPerson, { n: r.cost }) : ""}
                    </span>
                  )}
                  <AwardBadges awards={r.awards} />
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted opacity-60" aria-hidden />
              </button>
            </li>
          ))}
        </Group>
      )}
      {list.length > shown && <Button variant="ghost" className="w-full" onClick={() => setShown((n) => n + PAGE)}>{t.go.showMore}</Button>}
      {used.map((l) => <SourceLine key={l} name={`${d.lists[l].name} ${d.lists[l].edition}`} date={d.lists[l].checked || undefined} />)}
      {d.source !== "awards" && <SourceLine name="Amap" extra={t.awards.amapNote} />}
      {used.length > 0 && <p className="px-1 text-footnote text-muted">{t.awards.note}</p>}
    </>
  );
}
