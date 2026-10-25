import DATA from "./data/restaurant-awards.json";
import PLACES from "./data/restaurant-places.json";
import CITIES from "./data/cities.json";
import type { City } from "./cities";
import { py, searchPlaces, type Place } from "./amap";
import { cuisineKey } from "./cuisines";
import { restaurantNameEn } from "./restaurant-names";
import { demo } from "./config";
import { rest, supabaseReadOn } from "./supabase";
import { awardScore, cityAdcode, sameRestaurant, type Award, type AwardList, type AwardRestaurant } from "./restaurant-awards";

type ListMeta = { name: string; edition: string; source: string; checked: string };

/** Amap data matched by scripts/enrich-restaurants.mjs (Supabase columns, or the bundled file). */
type Stored = {
  id: string; name?: string; location: string; address: string; district?: string; typecode?: string;
  tag?: string; rating?: number | null; cost?: number | null;
  opentime?: string; confidence?: string;
};
type Known = AwardRestaurant & { place?: Stored };
type Data = { lists: Record<AwardList, ListMeta>; restaurants: Known[] };

type Row = {
  city: string; name_zh: string; name_en: string | null; cuisine: string | null; awards: Award[];
  // From migration 0005; absent until it is applied.
  amap_id?: string | null; location?: string | null; address?: string | null; district?: string | null; amap_type?: string | null;
  tags?: string | null; rating?: number | null; cost?: number | null; opentime?: string | null;
  match?: { confidence?: string } | null;
};

const FILE_PLACES = (PLACES as { places: Record<string, Stored & { none?: boolean }> }).places;
/** Only high- and medium-confidence matches are shown; low ones wait for a manual check. */
const usable = (p?: Stored & { none?: boolean } | null): Stored | undefined =>
  p && !p.none && p.id && p.confidence !== "low" ? p : undefined;
const fromFile = (r: AwardRestaurant) => usable(FILE_PLACES[`${r.city}:${r.zh}`]);
const withFilePlaces = (d: { lists: Data["lists"]; restaurants: AwardRestaurant[] }): Data => ({ ...d, restaurants: d.restaurants.map((r) => ({ ...r, place: fromFile(r) })) });

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
    all<Row>("restaurants?select=*,awards:restaurant_awards(list,level,edition)&order=id"),
  ]);
  return {
    lists: Object.fromEntries(lists.map(({ list, ...m }) => [list, { ...m, source: m.source ?? "", checked: m.checked ?? "" }])) as Data["lists"],
    restaurants: rows.filter((r) => r.awards.length).map((r) => {
      const base = { city: r.city, zh: r.name_zh, en: r.name_en ?? undefined, cuisine: r.cuisine ?? undefined, awards: r.awards };
      const db = r.amap_id && r.location ? usable({
        id: r.amap_id, location: r.location, address: r.address ?? "", district: r.district ?? undefined, typecode: r.amap_type ?? undefined,
        tag: r.tags ?? undefined, rating: r.rating, cost: r.cost, opentime: r.opentime ?? undefined,
        confidence: r.match?.confidence,
      }) : undefined;
      return { ...base, place: db ?? fromFile(base) };
    }),
  };
}

// The award tables in Supabase are the source (supabase/migrations/0004, loaded by
// scripts/sync-awards.mjs), cached for an hour per server instance. Without Supabase, or while it
// is unreachable, the bundled snapshot is used so restaurants never disappear. Awards are
// published data, so they are real in demo mode too; only the Amap matching is skipped there.
let cache: { at: number; ttl: number; data: Promise<Data> } | null = null;
const BUNDLED = withFilePlaces(DATA as { lists: Data["lists"]; restaurants: AwardRestaurant[] });
async function data(): Promise<Data> {
  if (!supabaseReadOn) return BUNDLED;
  if (!cache || Date.now() - cache.at > cache.ttl) {
    const next = { at: Date.now(), ttl: 36e5, data: fromSupabase() };
    next.data = next.data.catch((e) => {
      console.error("[awards]", (e as Error).message);
      next.ttl = 3e5; // retry in 5 minutes
      return BUNDLED;
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
    // A stored Amap id is exact; the name match covers restaurants not matched yet.
    const byId = restaurants.filter((r) => r.place?.id === p.id).flatMap((r) => r.awards);
    const awards = byId.length ? byId : awardsFor(p, restaurants);
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

/** What the list and detail need; `poi` drives routes and the taxi card. */
export type ListedRestaurant = AwardRestaurant & {
  poi: Place | null; rating?: number; cost?: number;
  nameEn: string; cuisineKey?: string;
  dishes: string[]; // signature dishes from Amap's business.tag, at most 5
  opentime?: string;
};

// business.tag mixes dishes with features ("包间", "环境优雅"); only dish-like entries are kept.
const NOT_DISH = /包间|包厢|停车|环境|服务|wifi|聚会|约会|景观|夜景|江景|海景|露台|排队|适合|商务|宴请|老字号|网红|打卡|性价比|分量|味道|好吃|干净|实惠|装修|氛围|儿童|宠物|免费|刷卡|外卖|预订|预定|大厅|朋友|家庭|情侣|下午茶|早茶|夜宵|自助|套餐|团购|优惠|推荐|必吃|榜|米其林|黑珍珠|连锁|品牌|营业|小时|人均/i;
export function signatureDishes(tag?: string) {
  const seen = new Set<string>();
  return (tag ?? "").split(/[,，、;；|/\s]+/).map((x) => x.trim())
    .filter((x) => x.length >= 2 && x.length <= 10 && /^[\u4e00-\u9fa5·]+$/.test(x) && !NOT_DISH.test(x) && !seen.has(x) && seen.add(x))
    .slice(0, 5);
}

function storedPoi(r: AwardRestaurant, p: Stored, city: string): Place {
  return {
    id: p.id, name: p.name ?? r.zh, pinyin: py(p.name ?? r.zh), address: p.address, city: "", citycode: "", location: p.location,
    type: "", typecode: p.typecode, district: p.district, adcode: city, rating: p.rating ? String(p.rating) : undefined,
    cost: p.cost ? String(p.cost) : undefined, tag: p.tag, opentime: p.opentime,
  };
}

function listed(r: Known, poi: Place | null): ListedRestaurant {
  const p = r.place;
  // No photos (Amap quota): the list and detail show the cuisine tile. Drop any a live search returned.
  const place = poi && { ...poi, photo: undefined, photos: undefined };
  return {
    city: r.city, zh: r.zh, en: r.en, cuisine: r.cuisine, awards: r.awards, poi: place,
    rating: Number(p?.rating ?? poi?.rating) || undefined, cost: Number(p?.cost ?? poi?.cost) || undefined,
    nameEn: restaurantNameEn(r.zh, r.en), cuisineKey: cuisineKey(r.cuisine, p?.typecode ?? poi?.typecode),
    dishes: signatureDishes(p?.tag ?? poi?.tag), opentime: p?.opentime || poi?.opentime || undefined,
  };
}

/** Stored match first; otherwise a live Amap search (cached a day), for the top of the list only. */
async function resolve(r: Known, city: string): Promise<ListedRestaurant> {
  if (r.place) return listed(r, storedPoi(r, r.place, city));
  if (demo.maps) return listed(r, null);
  const key = `${city}:${r.zh}`;
  const hit = resolved.get(key);
  if (hit && Date.now() - hit.at < 864e5) return listed(r, hit.poi);
  const found = await searchPlaces({ keywords: r.zh, types: "050000", city, purpose: "restaurants" }).catch(() => []);
  const poi = found.find((p) => sameRestaurant(r.zh, p.name)) ?? null;
  resolved.set(key, { at: Date.now(), poi });
  return listed(r, poi);
}

/** Well-rated restaurants straight from Amap, with guide badges where a listed restaurant matches. */
async function amapRestaurants(city: string): Promise<ListedRestaurant[]> {
  const pages = await Promise.all([1, 2].map((page) => searchPlaces({ keywords: "美食", types: "050000", city, page, purpose: "restaurants" }).catch(() => [])));
  const seen = new Set<string>();
  return (await withAwards(pages.flat()))
    .filter((p) => p.rating && !seen.has(p.id) && seen.add(p.id))
    .sort((a, b) => Number(b.rating) - Number(a.rating) || Number(a.cost ?? 1e9) - Number(b.cost ?? 1e9))
    .map((p) => listed({ city, zh: p.name, awards: p.awards ?? [] }, p));
}

/**
 * Restaurants for Explore → Eat: every guide-listed one in the city (Michelin, Black Pearl,
 * Must-Eat), best first, the top `featured` matched to Amap for rating, price and hours. With fewer
 * than 5 listed, well-rated Amap restaurants fill the list so it is never empty.
 */
export async function awardRestaurants(city: string, { featured = 8, listedOnly = false } = {}): Promise<{ restaurants: ListedRestaurant[]; source: "awards" | "mixed" | "amap" }> {
  const all = (await data()).restaurants.filter((r) => r.city === city).sort((a, b) => awardScore(b.awards) - awardScore(a.awards));
  // Stored matches cost nothing, so every restaurant that has one gets it; live search only for the top.
  const list = await Promise.all(all.map((r, i) => (r.place || i < featured ? resolve(r, city) : listed(r, null))));
  if (list.length >= 5 || demo.maps || listedOnly) return { restaurants: list, source: "awards" };
  const extra = (await amapRestaurants(city)).filter((x) => !list.some((l) => l.poi?.id === x.poi?.id || sameRestaurant(l.zh, x.zh)));
  const restaurants = [...list, ...extra].slice(0, featured);
  return { restaurants, source: list.length ? "mixed" : "amap" };
}
