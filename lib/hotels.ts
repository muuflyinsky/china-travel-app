import { readFile, writeFile, mkdir } from "node:fs/promises";
import { searchPlaces, type Place } from "./amap";
import { demo } from "./config";
import { TRIP_CITY_ID } from "./affiliate";
import * as mock from "./demo";
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

function brandOf(name: string): { kind: "international" | "domestic"; brand: string } | null {
  for (const [frag, en] of INTERNATIONAL) if (name.includes(frag)) return { kind: "international", brand: en };
  for (const [frag, en] of DOMESTIC) if (name.includes(frag)) return { kind: "domestic", brand: en };
  return null;
}
const starsOf = (type: string) => (type.includes("五星级") ? 5 : type.includes("四星级") ? 4 : type.includes("三星级") ? 3 : 0);

/** Lower is better: how sure we are that a foreign guest can check in. */
const trust = (h: HotelPick) => (h.chain === "international" ? 0 : h.chain === "domestic" ? 1 : 2);
/** Metro distance in coarse bands, so 320 m vs 380 m doesn't outrank a better-rated hotel. */
const metroBand = (h: HotelPick) => (!h.metro ? 3 : h.metro.meters <= 500 ? 0 : h.metro.meters <= 1000 ? 1 : 2);

export function rank(a: HotelPick, b: HotelPick) {
  return trust(a) - trust(b) || metroBand(a) - metroBand(b) || (b.rating ?? 0) - (a.rating ?? 0) || a.cny - b.cny;
}

export function candidate(p: Place, cityShort: string, bounds: [number, number, number]): HotelPick | null {
  const cny = Number(p.cost);
  if (!cny || cny < 80) return null; // no usable price → can't place it in a tier
  const b = brandOf(p.name);
  const stars = starsOf(p.type);
  const majorCity = cityShort in TRIP_CITY_ID;
  if (!b && !(majorCity && stars >= 4)) return null;
  return {
    id: p.id, name: p.name, pinyin: p.pinyin, address: p.address, district: p.district, location: p.location,
    rating: p.rating ? Number(p.rating) : undefined, cny, tier: tierOf(cny, bounds), stars,
    chain: b?.kind ?? null, brand: b?.brand, metro: null,
  };
}

async function nearestMetro(location: string) {
  const [s] = await searchPlaces({ around: location, types: "150500", radius: 1500, pageSize: 1 }).catch(() => []);
  return s?.distance ? { name: s.name.replace(/\(.*\)$/, ""), meters: Number(s.distance) } : null;
}

const PER_TIER = 3;
const TTL = 7 * 864e5;
const memory = new Map<string, CityPicks>();
const file = (key: string) => `data/hotels/${key.replace(/[^0-9a-z.@_-]/gi, "_")}.json`;

/** Picks for a city, cached in memory and on disk (data/hotels/<adcode>.json) for 7 days. */
/**
 * Picks for a city — or, with `around` ("lng,lat"), for the area within 2.5 km of that point
 * (the Stay page's "where to stay" areas).
 */
export async function cityPicks(adcode: string, cityShort: string, around?: string): Promise<CityPicks> {
  if (demo.maps) return adcode === "310000" ? mock.hotelPicks : { ...mock.hotelPicks, city: cityShort, tiers: { economy: [], comfort: [], upscale: [], luxury: [] } };
  const key = around ? `${adcode}@${around}` : adcode;
  const fresh = (c?: CityPicks) => c && Date.now() - Date.parse(c.generatedAt) < TTL;
  if (fresh(memory.get(key))) return memory.get(key)!;
  try {
    const disk = JSON.parse(await readFile(file(key), "utf8")) as CityPicks;
    if (fresh(disk)) { memory.set(key, disk); return disk; }
  } catch {}

  const bounds = tierBounds(cityShort);
  // A generic query plus the biggest brands, so chains aren't crowded out by guesthouses.
  const queries = [["酒店", 1], ["酒店", 2], ["万豪", 1], ["希尔顿", 1], ["洲际", 1], ["凯悦", 1], ["全季", 1], ["亚朵", 1]] as const;
  const pages = await Promise.all(queries.map(([keywords, page]) =>
    searchPlaces(around ? { keywords, types: "100100", around, radius: 2500, page } : { keywords, types: "100100", city: adcode, page }).catch(() => [])));
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
  try { await mkdir("data/hotels", { recursive: true }); await writeFile(file(key), JSON.stringify(picks, null, 2)); } catch {}
  return picks;
}
