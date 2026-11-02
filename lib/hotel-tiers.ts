// Price tiers and hotel pick types, shared by the server picker (lib/hotels.ts) and the UI.

export const TIER_IDS = ["economy", "comfort", "upscale", "luxury"] as const;
export type TierId = (typeof TIER_IDS)[number];

/** Nightly price bounds in CNY: economy < b0 ≤ comfort < b1 ≤ upscale < b2 ≤ luxury. */
const DEFAULT_BOUNDS: [number, number, number] = [400, 800, 1500];
/** Per-city overrides, keyed by the short Chinese city name (e.g. 上海). Add only from real price data. */
const CITY_BOUNDS: Record<string, [number, number, number]> = {};
export const tierBounds = (cityShort: string) => CITY_BOUNDS[cityShort] ?? DEFAULT_BOUNDS;

export function tierOf(cny: number, bounds: [number, number, number]): TierId {
  // A price of 0 means "unknown": callers with a star class should fall back to starsForTier
  // instead of dumping the hotel into "economy".
  if (!cny) return "comfort";
  return cny < bounds[0] ? "economy" : cny < bounds[1] ? "comfort" : cny < bounds[2] ? "upscale" : "luxury";
}

/** Star-class fallback when Amap gives no price: 5★→luxury, 4★→upscale, 3★→comfort, else economy. */
export function starsTier(stars: number): TierId {
  return stars >= 5 ? "luxury" : stars >= 4 ? "upscale" : stars >= 3 ? "comfort" : "economy";
}

export type HotelPick = {
  id: string; name: string; pinyin: string; address: string; district?: string; location: string;
  rating?: number; cny: number; tier: TierId; stars: number;
  chain: "international" | "domestic" | null; brand?: string;
  metro: { name: string; meters: number } | null;
};
export type CityPicks = { city: string; generatedAt: string; source: "amap"; tiers: Record<TierId, HotelPick[]> };
