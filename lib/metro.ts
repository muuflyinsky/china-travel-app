// Metro near a point, counted by station, not by entrance (product walkthrough 11-04, B): Amap's
// metro type returns every exit as its own point ("钟楼(地铁站)A口", "广济街地铁站D1口"), so
// "25 stations within 1 km" was 25 exits of a few stations.
import { py, searchPlaces, type Place } from "./amap";
import { cacheRead, cacheWrite } from "./cache";

/**
 * One name per station, without the exit: "广济街地铁站D1口" / "钟楼(地铁站)A口" / "北京站(地铁站)"
 * → "广济街站" / "钟楼站" / "北京站". It always ends in 站, so 北京站 stays itself and nothing
 * reads "站站".
 */
export function stationName(name: string) {
  const base = name
    .replace(/[(（][^)）]*[)）]/g, "")
    .replace(/([A-Z]?\d*[A-Z]?|[东南西北]+|[东南西北]?[一二三四五六七八九十]+)号?(出入)?口$/, "")
    .replace(/地铁站?$/, "")
    .trim();
  return !base ? "" : base.endsWith("站") ? base : `${base}站`;
}

/** Line numbers when Amap lists them ("地铁2号线;地铁6号线"); none rather than a guess. */
export function stationLines(p: Place) {
  return [...new Set([...(p.address ?? "").matchAll(/(\d+)号线/g)].map((m) => m[1]))].sort((a, b) => Number(a) - Number(b));
}

export { walkMinutes, type MetroNear } from "./metro-shared";
import type { MetroNear } from "./metro-shared";

const TTL = 30 * 864e5;

/** Exits grouped into stations: the nearest one (by its closest exit), its lines, how many others. */
export function groupStations(points: Place[]): MetroNear | null {
  const stations = new Map<string, number>();
  for (const p of points) {
    const name = stationName(p.name);
    const meters = Number(p.distance);
    if (!name || !Number.isFinite(meters)) continue;
    stations.set(name, Math.min(meters, stations.get(name) ?? Infinity));
  }
  const [first, ...rest] = [...stations.entries()].sort((a, b) => a[1] - b[1]);
  if (!first) return null;
  // Lines may be on any exit of the station; take them from all of its points.
  const lines = [...new Set(points.filter((p) => stationName(p.name) === first[0]).flatMap(stationLines))].sort((a, b) => Number(a) - Number(b));
  return { name: first[0], pinyin: py(first[0].replace(/站$/, "")), meters: first[1], others: rest.length, lines };
}

/**
 * The nearest station within `radius` (its closest exit), its lines, and how many other stations
 * are that close. null: no station within the radius, which is worth saying. Cached for 30 days.
 */
export async function metroNear(location: string, radius = 1000): Promise<MetroNear | null> {
  const key = `${location}@${radius}`;
  const hit = await cacheRead<{ generatedAt: string; near: MetroNear | null }>("metro_near", key);
  if (hit && Date.now() - Date.parse(hit.generatedAt) < TTL) return hit.near;
  const points = await searchPlaces({ around: location, types: "150500", radius, pageSize: 25, purpose: "guide" });
  const near = groupStations(points);
  await cacheWrite("metro_near", key, { generatedAt: new Date().toISOString(), near });
  return near;
}
