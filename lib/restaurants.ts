import DATA from "./data/restaurant-awards.json";
import CITIES from "./data/cities.json";
import type { City } from "./cities";
import { searchPlaces, type Place } from "./amap";
import { demo } from "./config";
import { rest, supabaseReadOn } from "./supabase";
import { awardScore, cityAdcode, sameRestaurant, type Award, type AwardList, type AwardRestaurant } from "./restaurant-awards";

type ListMeta = { name: string; edition: string; source: string; checked: string };
type Data = { lists: Record<AwardList, ListMeta>; restaurants: AwardRestaurant[] };

type Row = { city: string; name_zh: string; name_en: string | null; cuisine: string | null; awards: Award[] };

/** Every row of a table: Supabase returns at most 1000 rows per request. */
async function all<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  for (let from = 0; ; from += 1000) {
    const page: T[] = await rest(path, { headers: { range: `${from}-${from + 999}` } });
    out.push(...page);
    if (page.length < 1000) return out;
  }
}

async function fromSupabase(): Promise<Data> {
  const [lists, rows] = await Promise.all([
    rest("award_lists?select=list,name,edition,source,checked") as Promise<({ list: AwardList } & ListMeta)[]>,
    all<Row>("restaurants?select=city,name_zh,name_en,cuisine,awards:restaurant_awards(list,level,edition)&order=id"),
  ]);
  return {
    lists: Object.fromEntries(lists.map(({ list, ...m }) => [list, { ...m, source: m.source ?? "", checked: m.checked ?? "" }])) as Data["lists"],
    restaurants: rows.filter((r) => r.awards.length).map((r) => ({ city: r.city, zh: r.name_zh, en: r.name_en ?? undefined, cuisine: r.cuisine ?? undefined, awards: r.awards })),
  };
}

// The award tables in Supabase are the source (supabase/migrations/0004, loaded by
// scripts/sync-awards.mjs), cached for an hour per server instance. Without Supabase, or while it
// is unreachable, the bundled snapshot is used so restaurants never disappear. Awards are
// published data, so they are real in demo mode too; only the Amap matching is skipped there.
let cache: { at: number; ttl: number; data: Promise<Data> } | null = null;
async function data(): Promise<Data> {
  if (!supabaseReadOn) return DATA as Data;
  if (!cache || Date.now() - cache.at > cache.ttl) {
    const next = { at: Date.now(), ttl: 36e5, data: fromSupabase() };
    next.data = next.data.catch((e) => {
      console.error("[awards]", (e as Error).message);
      next.ttl = 3e5; // retry in 5 minutes
      return DATA as Data;
    });
    cache = next;
  }
  return cache.data;
}
export const awardLists = async () => (await data()).lists;

/** Awards for a map result, if it matches a listed restaurant in the same city. */
function awardsFor(p: Place, restaurants: AwardRestaurant[]) {
  const city = cityAdcode(p.adcode);
  const hits = restaurants.filter((r) => (!city || r.city === city) && sameRestaurant(r.zh, p.name));
  return hits.flatMap((r) => r.awards);
}

export async function withAwards(places: Place[]) {
  const { restaurants } = await data();
  return places.map((p) => {
    const awards = awardsFor(p, restaurants);
    return awards.length ? { ...p, awards } : p;
  });
}

/** Cities with listed restaurants and how many, most first. */
export async function awardCities(): Promise<{ city: City; n: number }[]> {
  const count = new Map<string, number>();
  for (const r of (await data()).restaurants) count.set(r.city, (count.get(r.city) ?? 0) + 1);
  return [...count].flatMap(([a, n]) => {
    const city = (CITIES as City[]).find((c) => c.a === a && c.t === "city");
    return city ? [{ city, n }] : [];
  }).sort((x, y) => y.n - x.n);
}

const resolved = new Map<string, { at: number; poi: Place | null }>();

export type ListedRestaurant = AwardRestaurant & { poi: Place | null; rating?: number; cost?: number };

async function resolve(r: AwardRestaurant, city: string): Promise<ListedRestaurant> {
  if (demo.maps) return { ...r, poi: null };
  const key = `${city}:${r.zh}`;
  const hit = resolved.get(key);
  if (hit && Date.now() - hit.at < 864e5) return { ...r, poi: hit.poi, rating: Number(hit.poi?.rating) || undefined, cost: Number(hit.poi?.cost) || undefined };
  const found = await searchPlaces({ keywords: r.zh, types: "050000", city, purpose: "restaurants" }).catch(() => []);
  const poi = found.find((p) => sameRestaurant(r.zh, p.name)) ?? null;
  resolved.set(key, { at: Date.now(), poi });
  return { ...r, poi, rating: Number(poi?.rating) || undefined, cost: Number(poi?.cost) || undefined };
}

/** Well-rated restaurants straight from Amap, with guide badges where a listed restaurant matches. */
async function amapRestaurants(city: string): Promise<ListedRestaurant[]> {
  const pages = await Promise.all([1, 2].map((page) => searchPlaces({ keywords: "美食", types: "050000", city, page, purpose: "restaurants" }).catch(() => [])));
  const seen = new Set<string>();
  return (await withAwards(pages.flat()))
    .filter((p) => p.rating && !seen.has(p.id) && seen.add(p.id))
    .sort((a, b) => Number(b.rating) - Number(a.rating) || Number(a.cost ?? 1e9) - Number(b.cost ?? 1e9))
    .map((p) => ({ city, zh: p.name, awards: p.awards ?? [], poi: p, rating: Number(p.rating), cost: Number(p.cost) || undefined }));
}

/**
 * Restaurants for Explore → Eat: every guide-listed one in the city (Michelin, Black Pearl,
 * Must-Eat), best first, the top `featured` matched to Amap for photo, rating and price. With fewer
 * than 5 listed, well-rated Amap restaurants fill the list so it is never empty.
 */
export async function awardRestaurants(city: string, { featured = 8, listedOnly = false } = {}): Promise<{ restaurants: ListedRestaurant[]; source: "awards" | "mixed" | "amap" }> {
  const all = (await data()).restaurants.filter((r) => r.city === city).sort((a, b) => awardScore(b.awards) - awardScore(a.awards));
  const listed = [...await Promise.all(all.slice(0, featured).map((r) => resolve(r, city))), ...all.slice(featured).map((r) => ({ ...r, poi: null }))];
  if (listed.length >= 5 || demo.maps || listedOnly) return { restaurants: listed, source: "awards" };
  const extra = (await amapRestaurants(city)).filter((x) => !listed.some((l) => l.poi?.id === x.poi?.id || sameRestaurant(l.zh, x.zh)));
  const restaurants = [...listed, ...extra].slice(0, featured);
  return { restaurants, source: listed.length ? "mixed" : "amap" };
}
