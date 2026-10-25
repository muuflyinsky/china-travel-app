import DATA from "./data/restaurant-awards.json";
import PLACES from "./data/restaurant-places.json";
import CITIES from "./data/cities.json";
import type { City } from "./cities";
import { py, searchPlaces, type Place } from "./amap";
import { cuisineKey } from "./cuisines";
import { restaurantNameEn } from "./restaurant-names";
import { demo } from "./config";
import { rest, supabaseOn, supabaseReadOn } from "./supabase";
import { after } from "next/server";
import { awardScore, cityAdcode, sameRestaurant, type Award, type AwardList, type AwardRestaurant } from "./restaurant-awards";

type ListMeta = { name: string; edition: string; source: string; checked: string };

/**
 * Amap data for a listed restaurant, looked up once and kept (Supabase columns, or the bundled
 * file from scripts/enrich-restaurants.mjs). Restaurants don't move, so nothing is re-queried.
 * `photos`: Amap's (they come with the same search), or added by hand with their source.
 */
type Stored = {
  id: string; name?: string; location: string; address: string; district?: string; typecode?: string;
  tag?: string; rating?: number | null; cost?: number | null;
  opentime?: string; confidence?: string; photos?: string[]; photoSource?: string;
};
/**
 * `tried`: already looked up, so it isn't searched again. `photos`: added by hand for a
 * restaurant Amap has no photo (or no listing) for, with their source.
 */
type Known = AwardRestaurant & { place?: Stored; tried?: boolean; photos?: string[]; photoSource?: string };
type Data = { lists: Record<AwardList, ListMeta>; restaurants: Known[] };

type Row = {
  city: string; name_zh: string; name_en: string | null; cuisine: string | null; awards: Award[];
  // From migration 0005; absent until it is applied.
  amap_id?: string | null; location?: string | null; address?: string | null; district?: string | null; amap_type?: string | null;
  tags?: string | null; rating?: number | null; cost?: number | null; opentime?: string | null;
  match?: { confidence?: string | null } | null;
  photos?: string[] | null; photo_source?: string | null; // migration 0006
};

const FILE_PLACES = (PLACES as { places: Record<string, Partial<Stored> & { none?: boolean }> }).places;
/** Only high- and medium-confidence matches are shown; low ones wait for a manual check. */
const usable = (p?: Partial<Stored> & { none?: boolean } | null): Stored | undefined =>
  p && !p.none && p.id && p.location && p.confidence !== "low" ? (p as Stored) : undefined;
const fromFile = (r: AwardRestaurant) => usable(FILE_PLACES[`${r.city}:${r.zh}`]);
const triedInFile = (r: AwardRestaurant) => Boolean(FILE_PLACES[`${r.city}:${r.zh}`]);
/** Hand-added photos stand on their own; Amap's only count for a usable match. */
const filePhotos = (r: AwardRestaurant) => {
  const e = FILE_PLACES[`${r.city}:${r.zh}`];
  return e?.photos?.length && e.photoSource && e.photoSource !== "Amap" ? { photos: e.photos, photoSource: e.photoSource } : {};
};
const withFilePlaces = (d: { lists: Data["lists"]; restaurants: AwardRestaurant[] }): Data => ({ ...d, restaurants: d.restaurants.map((r) => ({ ...r, place: fromFile(r), tried: triedInFile(r), ...filePhotos(r) })) });

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
        confidence: r.match?.confidence ?? undefined, photos: r.photos ?? undefined, photoSource: r.photo_source ?? undefined,
      }) : undefined;
      const manual = r.photos?.length && r.photo_source && r.photo_source !== "Amap" ? { photos: r.photos, photoSource: r.photo_source } : filePhotos(base);
      return { ...base, place: db ?? fromFile(base), tried: Boolean(r.match) || triedInFile(base), ...manual };
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
  photos: string[]; photoSource?: string; // "Amap" unless added by hand from another source
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
    cost: p.cost ? String(p.cost) : undefined, tag: p.tag, opentime: p.opentime, photos: p.photos, photo: p.photos?.[0],
  };
}

function listed(r: Known, poi: Place | null): ListedRestaurant {
  const p = r.place;
  // Amap's photos from the stored match (or the live search), else ones added by hand.
  const amapPhotos = p?.photos?.length ? p.photos : poi?.photos ?? [];
  const photos = amapPhotos.length ? amapPhotos : r.photos ?? [];
  return {
    city: r.city, zh: r.zh, en: r.en, cuisine: r.cuisine, awards: r.awards, poi,
    photos, photoSource: amapPhotos.length ? p?.photoSource || "Amap" : photos.length ? r.photoSource : undefined,
    rating: Number(p?.rating ?? poi?.rating) || undefined, cost: Number(p?.cost ?? poi?.cost) || undefined,
    nameEn: restaurantNameEn(r.zh, r.en), cuisineKey: cuisineKey(r.cuisine, p?.typecode ?? poi?.typecode),
    dishes: signatureDishes(p?.tag ?? poi?.tag), opentime: p?.opentime || poi?.opentime || undefined,
  };
}

/**
 * Stored data first. Otherwise one Amap search, kept for good: written to Supabase (when the
 * service key is set) and to this instance's copy, found or not, so no restaurant is searched
 * twice. Without the service key it is remembered for a day per instance.
 */
async function resolve(r: Known, city: string): Promise<ListedRestaurant> {
  if (r.place) return listed(r, storedPoi(r, r.place, city));
  if (r.tried || demo.maps) return listed(r, null);
  const key = `${city}:${r.zh}`;
  const hit = resolved.get(key);
  if (hit && Date.now() - hit.at < 864e5) return listed(r, hit.poi);
  let found: Place[];
  try { found = await searchPlaces({ keywords: r.zh, types: "050000", city, purpose: "restaurants" }); }
  catch { return listed(r, null); } // quota or network: try again another time, nothing saved
  const poi = found.find((p) => sameRestaurant(r.zh, p.name)) ?? null;
  resolved.set(key, { at: Date.now(), poi });
  keep(r, city, poi);
  return listed(r, poi);
}

/** Saves one lookup on the restaurant's row (migration 0005/0006) after the response is sent. */
function keep(r: Known, city: string, poi: Place | null) {
  const stored: Stored | undefined = poi ? {
    id: poi.id, name: poi.name, location: poi.location, address: poi.address, district: poi.district, typecode: poi.typecode,
    tag: poi.tag, rating: Number(poi.rating) || null, cost: Math.round(Number(poi.cost)) || null, opentime: poi.opentime,
    confidence: "high", photos: poi.photos ?? [], photoSource: poi.photos?.length ? "Amap" : undefined,
  } : undefined;
  r.place = stored; r.tried = true; // this instance's cached copy
  if (!supabaseOn) return;
  const row = {
    amap_id: stored?.id ?? null, location: stored?.location ?? null, address: stored?.address ?? null, district: stored?.district ?? null,
    amap_type: stored?.typecode ?? null, tags: stored?.tag || null, rating: stored?.rating ?? null, cost: stored?.cost ?? null,
    opentime: stored?.opentime || null, photos: stored?.photos?.length ? stored.photos : null, photo_source: stored?.photoSource ?? null,
    match: { confidence: stored ? "high" : null, method: "live", amap_name: poi?.name ?? null, matched_at: new Date().toISOString() },
  };
  const save = () => rest(`restaurants?city=eq.${city}&name_zh=eq.${encodeURIComponent(r.zh)}`, { method: "PATCH", body: JSON.stringify(row), headers: { prefer: "return=minimal" } })
    .catch((e) => console.error("[restaurants] save:", (e as Error).message, "(migrations 0005 and 0006 applied?)"));
  try { after(save); } catch { void save(); }
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
  const list = await Promise.all(all.map((r, i) => (r.place || (i < featured && !r.tried) ? resolve(r, city) : listed(r, null))));
  if (list.length >= 5 || demo.maps || listedOnly) return { restaurants: list, source: "awards" };
  const extra = (await amapRestaurants(city)).filter((x) => !list.some((l) => l.poi?.id === x.poi?.id || sameRestaurant(l.zh, x.zh)));
  const restaurants = [...list, ...extra].slice(0, featured);
  return { restaurants, source: list.length ? "mixed" : "amap" };
}
