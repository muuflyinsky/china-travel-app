import { searchPlaces, type Place } from "./amap";
import { stationName, stationPinyin } from "./metro";
import { demo } from "./config";
import { TRIP_CITY_ID } from "./affiliate";
import * as mock from "./demo";
import { cacheRead, cacheWrite } from "./cache";
import { HOT_CITIES } from "./hot-cities";
import { logRow } from "./supabase";
import { TIER_IDS, tierBounds, tierOf, type CityPicks, type HotelPick, type TierId } from "./hotel-tiers";

export { tierBounds };
export type { CityPicks, HotelPick, TierId };

// Automatic hotel picks per city and price tier (SPEC v0.4 · Stay). No human curation:
// candidates come from Amap hotel POIs and are kept only if they very likely accept foreign
// guests — an international or large domestic chain, or a 4/5-star hotel in a major city.
// We never claim a hotel is "verified"; the UI says "usually accepts foreign guests".

// Brand fragments as they appear in Chinese hotel names, with the English brand for display.
// Longer fragments first, so 智选假日 wins over 假日 and 希尔顿花园 over 希尔顿.
const INTERNATIONAL: [string, string][] = [
  ["丽思卡尔顿", "Ritz-Carlton"], ["JW万豪", "JW Marriott"], ["瑞吉", "St. Regis"], ["W酒店", "W Hotels"], ["艾迪逊", "EDITION"],
  ["福朋喜来登", "Four Points"], ["喜来登", "Sheraton"], ["威斯汀", "Westin"], ["艾美", "Le Méridien"], ["万丽", "Renaissance"],
  ["万怡", "Courtyard"], ["雅乐轩", "Aloft"], ["源宿", "Element"], ["万枫", "Fairfield"], ["万豪", "Marriott"],
  ["华尔道夫", "Waldorf Astoria"], ["康莱德", "Conrad"], ["希尔顿逸林", "DoubleTree"], ["希尔顿花园", "Hilton Garden Inn"], ["希尔顿欢朋", "Hampton"], ["欢朋", "Hampton"], ["希尔顿", "Hilton"],
  ["洲际", "InterContinental"], ["华邑", "Hualuxe"], ["英迪格", "Indigo"], ["金普顿", "Kimpton"], ["皇冠假日", "Crowne Plaza"], ["智选假日", "Holiday Inn Express"], ["假日", "Holiday Inn"],
  ["柏悦", "Park Hyatt"], ["君悦", "Grand Hyatt"], ["安达仕", "Andaz"], ["凯悦嘉轩", "Hyatt Place"], ["凯悦嘉寓", "Hyatt House"], ["凯悦", "Hyatt"],
  ["莱佛士", "Raffles"], ["费尔蒙", "Fairmont"], ["索菲特", "Sofitel"], ["铂尔曼", "Pullman"], ["美爵", "Grand Mercure"], ["诺富特", "Novotel"], ["美居", "Mercure"], ["宜必思", "ibis"],
  ["香格里拉", "Shangri-La"], ["嘉里", "Kerry"], ["半岛", "Peninsula"], ["文华东方", "Mandarin Oriental"], ["四季", "Four Seasons"], ["瑰丽", "Rosewood"], ["朗廷", "Langham"], ["丽晶", "Regent"],
];
const DOMESTIC: [string, string][] = [
  ["全季", "Ji Hotel"], ["汉庭", "Hanting"], ["桔子", "Orange Hotel"], ["漫心", "Manxin"], ["美仑", "Joya"], ["禧玥", "Joya"],
  ["亚朵", "Atour"], ["锦江之星", "Jinjiang Inn"], ["锦江", "Jin Jiang"], ["丽枫", "Lavande"], ["麗枫", "Lavande"], ["维也纳", "Vienna"], ["喆啡", "James Joyce"],
  ["希岸", "Xana"], ["如家", "Home Inn"], ["和颐", "Yitel"], ["首旅建国", "Jianguo"], ["建国饭店", "Jianguo"], ["开元", "New Century"], ["维景", "Metropark"],
  ["城际", "CityGo"], ["秋果", "Qiuguo"], ["宜尚", "Echarm"], ["7天", "7 Days"], ["康铂", "Campanile"], ["郁锦香", "Golden Tulip"], ["华住", "H World"],
];

// Fragments that are also ordinary words or place names (四季青, 锦江区, 半岛, 假日广场): too
// unsure to decide a brand, so such hotels qualify by stars only. The longer forms (皇冠假日,
// 智选假日, 锦江之星) are listed separately and still count.
const AMBIGUOUS = new Set(["半岛", "丽晶", "四季", "假日", "锦江", "嘉里", "开元", "维景", "城际", "美居"]);

function brandOf(name: string): { kind: "international" | "domestic"; brand: string } | null {
  // The branch in brackets is a place, not the brand: 汉庭酒店(杭州四季青店) is a Hanting.
  const n = name.replace(/[(（][^)）]*[)）]/g, "");
  for (const [list, kind] of [[INTERNATIONAL, "international"], [DOMESTIC, "domestic"]] as const) {
    for (const [frag, en] of list) if (!AMBIGUOUS.has(frag) && n.includes(frag)) return { kind, brand: en };
  }
  return null;
}
// Without a price (Amap often has none for hotels), a brand's usual class places it in a tier.
const BRAND_TIER: Record<string, TierId> = Object.fromEntries([
  ...["Ritz-Carlton", "JW Marriott", "St. Regis", "W Hotels", "EDITION", "Waldorf Astoria", "Conrad", "Park Hyatt", "Grand Hyatt", "Raffles", "Fairmont",
    "Shangri-La", "Kerry", "Peninsula", "Mandarin Oriental", "Four Seasons", "Rosewood", "Langham", "Regent"].map((b) => [b, "luxury"]),
  ...["Sheraton", "Westin", "Le Méridien", "Renaissance", "Marriott", "DoubleTree", "Hilton", "InterContinental", "Hualuxe", "Indigo", "Kimpton",
    "Crowne Plaza", "Andaz", "Hyatt", "Sofitel", "Pullman", "Grand Mercure", "Jianguo"].map((b) => [b, "upscale"]),
  ...["Four Points", "Courtyard", "Aloft", "Element", "Fairfield", "Hilton Garden Inn", "Hampton", "Holiday Inn", "Holiday Inn Express", "Hyatt Place", "Hyatt House",
    "Novotel", "Mercure", "Ji Hotel", "Atour", "Joya", "Manxin", "Orange Hotel", "Lavande", "James Joyce", "Xana", "Yitel", "New Century", "Metropark", "Golden Tulip", "Jin Jiang"].map((b) => [b, "comfort"]),
  ...["ibis", "Hanting", "Jinjiang Inn", "Vienna", "Home Inn", "CityGo", "Qiuguo", "Echarm", "7 Days", "Campanile", "H World"].map((b) => [b, "economy"]),
]);
const starsTier = (stars: number): TierId => (stars >= 5 ? "luxury" : stars >= 4 ? "upscale" : stars >= 3 ? "comfort" : "economy");

const starsOf = (type: string) => (type.includes("五星级") ? 5 : type.includes("四星级") ? 4 : type.includes("三星级") ? 3 : 0);

/** Lower is better: how sure we are that a foreign guest can check in. */
const trust = (h: HotelPick) => (h.chain === "international" ? 0 : h.chain === "domestic" ? 1 : 2);
/** Metro distance in coarse bands, so 320 m vs 380 m doesn't outrank a better-rated hotel. */
const metroBand = (h: HotelPick) => (!h.metro ? 3 : h.metro.meters <= 500 ? 0 : h.metro.meters <= 1000 ? 1 : 2);

export function rank(a: HotelPick, b: HotelPick) {
  return trust(a) - trust(b) || metroBand(a) - metroBand(b) || (b.rating ?? 0) - (a.rating ?? 0) || (a.cny || Infinity) - (b.cny || Infinity);
}

// Not a hotel room a traveller books here: serviced apartments, and duplicate POIs for a hotel's
// lobby, entrance or car park.
const NOT_A_HOTEL = /公寓|大堂|入口|停车场|会所|写字楼/;
const RULES = "r4"; // r4: station names ending in 口 kept, pinyin as one word

export function candidate(p: Place, cityShort: string, bounds: [number, number, number]): HotelPick | null {
  if (NOT_A_HOTEL.test(p.name)) return null;
  const b = brandOf(p.name);
  const stars = starsOf(p.type);
  const majorCity = cityShort in TRIP_CITY_ID;
  if (!b && !(majorCity && stars >= 4)) return null;
  // Amap's price is often missing (or a junk value): then the brand's class, or the star class,
  // decides the tier, and the card says "price on Trip.com" (cny 0) instead of a number.
  const raw = Number(p.cost);
  const cny = raw >= 80 ? raw : 0;
  const tier = cny ? tierOf(cny, bounds) : (b && BRAND_TIER[b.brand]) || starsTier(stars);
  return {
    id: p.id, name: p.name, pinyin: p.pinyin, address: p.address, district: p.district, location: p.location,
    rating: p.rating ? Number(p.rating) : undefined, cny, tier, stars,
    chain: b?.kind ?? null, brand: b?.brand, metro: null,
  };
}

async function nearestMetro(location: string) {
  const [s] = await searchPlaces({ around: location, types: "150500", radius: 1500, pageSize: 1, purpose: "hotels" }).catch(() => []);
  if (!s?.distance) return null;
  // The nearest point is often an exit ("广济街地铁站D1口"): name the station.
  const name = stationName(s.name);
  return { name, pinyin: stationPinyin(name), meters: Number(s.distance) };
}

const PER_TIER = 3;
const TTL = 7 * 864e5;
const memory = new Map<string, CityPicks>();

/** Picks for a city, cached in memory and in the durable cache (lib/cache.ts) for 7 days. */
/**
 * Picks for a city — or, with `around` ("lng,lat"), for the area within 2.5 km of that point
 * (the Stay page's "where to stay" areas).
 */
export async function cityPicks(adcode: string, cityShort: string, around?: string): Promise<CityPicks> {
  if (demo.maps) return adcode === "310000" ? mock.hotelPicks : { ...mock.hotelPicks, city: cityShort, tiers: { economy: [], comfort: [], upscale: [], luxury: [] } };
  const key = around ? `${adcode}@${around}` : adcode;
  const fresh = (c?: CityPicks) => c && Date.now() - Date.parse(c.generatedAt) < TTL;
  if (fresh(memory.get(key))) return memory.get(key)!;
  // Bump when the picking rules change, so a week of old picks isn't served.
  const stored = await cacheRead<CityPicks>("hotel_picks", `${RULES}:${key}`);
  if (fresh(stored ?? undefined)) { memory.set(key, stored!); return stored!; }

  const bounds = tierBounds(cityShort);
  // A generic query plus the biggest brands, so chains aren't crowded out by guesthouses.
  // Economy chains (汉庭, 如家) too: without them the economy tier can be empty in Shanghai.
  const queries = [["酒店", 1], ["酒店", 2], ["万豪", 1], ["希尔顿", 1], ["洲际", 1], ["凯悦", 1], ["全季", 1], ["亚朵", 1], ["汉庭", 1], ["如家", 1]] as const;
  const pages = await Promise.all(queries.map(([keywords, page]) =>
    searchPlaces(around ? { keywords, types: "100100", around, radius: 2500, page, purpose: "hotels" } : { keywords, types: "100100", city: adcode, page, purpose: "hotels" }).catch(() => [])));
  const seen = new Set<string>();
  const pool = pages.flat().filter((p) => !seen.has(p.id) && seen.add(p.id))
    .map((p) => candidate(p, cityShort, bounds)).filter((h): h is HotelPick => h !== null);

  // Metro lookups are one request each, so only for the best few per tier before final ranking.
  const tiers = Object.fromEntries(TIER_IDS.map((id) => [id, [] as HotelPick[]])) as Record<TierId, HotelPick[]>;
  for (const id of TIER_IDS) {
    const short = pool.filter((h) => h.tier === id).sort(rank).slice(0, 6);
    await Promise.all(short.map(async (h) => { h.metro = await nearestMetro(h.location); }));
    tiers[id] = short.sort(rank).slice(0, PER_TIER);
  }
  const picks: CityPicks = { city: cityShort, generatedAt: new Date().toISOString(), source: "amap", tiers };
  memory.set(key, picks);
  // An empty result isn't stored: it would hide a fix (or a better Amap day) for a week.
  if (TIER_IDS.some((id) => tiers[id].length)) await cacheWrite("hotel_picks", `${RULES}:${key}`, picks);
  return picks;
}

// Beijing, Shanghai and Guangzhou every day, plus two more hot cities in turn.
const ALWAYS = ["110000", "310000", "440100"];

/**
 * Daily check (cron): builds or reads each city's picks and logs every empty tier as a
 * `hotel_gap` event, so an empty Stay page shows up in the data instead of in a review.
 */
export async function checkHotelPicks({ today = new Date(), deadline = Infinity }: { today?: Date; deadline?: number } = {}) {
  const rest = HOT_CITIES.filter((c) => !ALWAYS.includes(c.a));
  const day = Math.floor(today.getTime() / 864e5);
  const cities = [...ALWAYS.map((a) => HOT_CITIES.find((c) => c.a === a)).filter((c): c is (typeof HOT_CITIES)[number] => Boolean(c)),
    ...[0, 1].map((i) => rest[(day * 2 + i) % rest.length]).filter(Boolean)];
  const gaps: { city: string; tiers: TierId[] }[] = [];
  const checked: string[] = [];
  // A cold city is ~34 Amap calls (about 15 s at the cron's pace): stop well before the deadline.
  for (const c of cities) {
    if (Date.now() > deadline - 20_000) break;
    checked.push(c.e);
    const picks = await cityPicks(c.a, c.s);
    const empty = TIER_IDS.filter((id) => !picks.tiers[id].length);
    if (empty.length) {
      gaps.push({ city: c.e, tiers: empty });
      await logRow("events", { e: "hotel_gap", p: { city: c.a, tiers: empty.join(",") }, sid: null });
    }
  }
  return { checked, gaps };
}
