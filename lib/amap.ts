import { pinyin } from "pinyin-pro";
import { config, demo } from "./config";
import * as mock from "./demo";
import { Unavailable } from "./errors";

// Amap (高德) Web Service API. Docs: https://lbs.amap.com/api/webservice/summary
// AMAP_BASE_URL is for tests against a local mock; production uses the default.
const BASE = process.env.AMAP_BASE_URL || "https://restapi.amap.com";

export type Place = {
  id: string;
  name: string;
  pinyin: string;
  address: string;
  city: string;
  citycode: string;
  location: string; // "lng,lat" GCJ-02
  type: string;
  typecode?: string;
  tel?: string;
  rating?: string;
  cost?: string;
  photo?: string;
  distance?: string;
  district?: string;
  adcode?: string; // district adcode
  awards?: import("./restaurant-awards").Award[];
};

async function amap<T>(path: string, params: Record<string, string | undefined>): Promise<T> {
  if (!config.amapKey) throw new Unavailable("map");
  const qs = new URLSearchParams({ key: config.amapKey });
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  const res = await fetch(`${BASE}${path}?${qs}`, { next: { revalidate: 300 } });
  const data = await res.json();
  if (data.status !== "1") throw new Error(`Amap ${path}: ${data.info ?? "error"} (${data.infocode ?? ""})`);
  return data as T;
}

/** Amap photo URLs are often http://; the page is https, so ask for the same image over https. */
export const httpsImg = (url?: string) => (url ? url.replace(/^http:\/\//, "https://") : undefined);

// Search results a traveller never wants: exits, car parks, bus stops, ticket windows.
const JUNK_NAME = /停车场|停车库|出入口|[A-Z]\d*口$|\d+号口$|公交站|售票|检票|收费站|充电站/;
const JUNK_TYPE = /^(1509|1507|1508|1906|0111)/; // parking, bus stop, coach stop, gates/entrances, charging
// Sights, hotels, restaurants and metro stations first, in that order; everything else after.
const PRIORITY = ["11", "14", "10", "05", "1505"];
const rank = (type: string) => {
  const code = type.match(/\d{6}/)?.[0] ?? "";
  const i = PRIORITY.findIndex((p) => code.startsWith(p));
  return i < 0 ? PRIORITY.length : i;
};

/**
 * Drops clutter from search results and puts places people go to first. A sight or museum with
 * no rating is usually a check-in spot or a sub-entrance, so it is dropped too.
 */
export function cleanResults(places: Place[], opts: { byRating?: boolean } = {}) {
  const typeCode = (p: Place) => p.typecode ?? "";
  const kept = places.filter((p) => !JUNK_NAME.test(p.name) && !JUNK_TYPE.test(typeCode(p)) &&
    !(/^(11|14)/.test(typeCode(p)) && !(Number(p.rating) > 0)));
  return kept
    .map((p, i) => ({ p, i }))
    .sort((a, b) => opts.byRating
      ? Number(b.p.rating ?? 0) - Number(a.p.rating ?? 0) || a.i - b.i
      : rank(typeCode(a.p)) - rank(typeCode(b.p)) || a.i - b.i)
    .map(({ p }) => p);
}

export function py(s: string) {
  return pinyin(s, { toneType: "none", type: "array" })
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .replace(/\s+([^A-Za-z])/g, "$1");
}

type RawPoi = {
  id: string; name: string; address: string | []; location: string; type: string; typecode?: string;
  cityname: string; citycode: string; adname: string; adcode?: string; distance?: string;
  business?: { tel?: string; rating?: string; cost?: string };
  photos?: { url: string }[];
};

function toPlace(p: RawPoi): Place {
  const address = Array.isArray(p.address) ? "" : p.address;
  return {
    id: p.id,
    name: p.name,
    pinyin: py(p.name),
    address: [p.cityname, p.adname, address].filter(Boolean).join(""),
    city: p.cityname,
    citycode: p.citycode,
    location: p.location,
    type: p.type,
    typecode: p.typecode,
    tel: p.business?.tel,
    rating: p.business?.rating,
    cost: p.business?.cost,
    photo: httpsImg(p.photos?.[0]?.url),
    distance: p.distance,
    district: p.adname,
    adcode: p.adcode,
  };
}

export async function searchPlaces(q: { keywords?: string; city?: string; around?: string; types?: string; page?: number; radius?: number; pageSize?: number }) {
  if (demo.maps) return mock.places(q.keywords, q.types);
  const fields = { show_fields: "business,photos", page_size: String(q.pageSize ?? 20), page_num: String(q.page ?? 1) };
  const data = q.around
    ? await amap<{ pois: RawPoi[] }>("/v5/place/around", {
        location: q.around, keywords: q.keywords, types: q.types, radius: String(q.radius ?? 5000), sortrule: "distance", ...fields,
      })
    : await amap<{ pois: RawPoi[] }>("/v5/place/text", {
        keywords: q.keywords, types: q.types, region: q.city, city_limit: q.city ? "true" : undefined, ...fields,
      });
  return data.pois.map(toPlace);
}

/** Chinese address → "lng,lat" (GCJ-02), or null when Amap can't place it. */
export async function geocode(address: string): Promise<string | null> {
  if (demo.maps) return "121.4910,31.2454";
  const d = await amap<{ geocodes: { location: string }[] }>("/v3/geocode/geo", { address });
  return d.geocodes?.[0]?.location || null;
}

export async function reverseGeocode(location: string) {
  if (demo.maps) return mock.regeo;
  const d = await amap<{ regeocode: { formatted_address: string; addressComponent: { city: string | []; province: string; citycode: string; adcode: string } } }>(
    "/v3/geocode/regeo", { location },
  );
  const c = d.regeocode.addressComponent;
  return {
    address: d.regeocode.formatted_address,
    city: Array.isArray(c.city) ? c.province : c.city, // municipalities return [] for city
    citycode: c.citycode,
    adcode: c.adcode,
  };
}

export async function weather(adcode: string) {
  if (demo.maps) return mock.weather;
  const d = await amap<{ forecasts: { city: string; casts: { date: string; dayweather: string; daytemp: string; nighttemp: string }[] }[] }>(
    "/v3/weather/weatherInfo", { city: adcode, extensions: "all" },
  );
  return d.forecasts[0];
}

// ---- routes (SPEC v0.5 P1.6 #23) ------------------------------------------------------------

/** One leg of a public-transport plan. Names stay in Chinese; the UI words them in the traveller's language. */
export type RouteStep =
  | { kind: "walk"; meters: number }
  | { kind: "metro" | "bus"; line: string; from: string; to: string; fromPy: string; toPy: string; stops: number }
  | { kind: "rail"; line: string; from: string; to: string; fromPy: string; toPy: string };

export type TransitPlan = { minutes: number; cost?: number; walkMeters: number; steps: RouteStep[] };
export type Routes = { transit: TransitPlan[]; taxi: { minutes: number; cost?: number; km: number } | null };

type RawTransit = {
  cost: string | []; duration: string; walking_distance: string;
  segments: {
    walking?: { distance?: string };
    bus?: { buslines?: { name: string; type: string; via_num: string; departure_stop: { name: string }; arrival_stop: { name: string } }[] };
    railway?: { name?: string; trip?: string; departure_stop?: { name: string }; arrival_stop?: { name: string } };
  }[];
};

const num = (v: unknown) => (typeof v === "string" && v !== "" ? Number(v) : undefined);

function toPlan(t: RawTransit): TransitPlan {
  const steps: RouteStep[] = [];
  for (const seg of t.segments) {
    const walk = num(seg.walking?.distance);
    if (walk && walk >= 50) steps.push({ kind: "walk", meters: Math.round(walk / 10) * 10 });
    const line = seg.bus?.buslines?.[0];
    if (line) {
      steps.push({
        kind: line.type.includes("地铁") ? "metro" : "bus",
        // "地铁2号线(浦东国际机场--徐泾东)" → "地铁2号线": the direction is in from/to.
        line: line.name.replace(/\(.*$/, ""), from: line.departure_stop.name, to: line.arrival_stop.name,
        fromPy: py(line.departure_stop.name), toPy: py(line.arrival_stop.name),
        stops: (num(line.via_num) ?? 0) + 1,
      });
    }
    const rail = seg.railway;
    if (rail?.departure_stop && rail.arrival_stop) steps.push({
      kind: "rail", line: rail.trip || rail.name || "", from: rail.departure_stop.name, to: rail.arrival_stop.name,
      fromPy: py(rail.departure_stop.name), toPy: py(rail.arrival_stop.name),
    });
  }
  return { minutes: Math.round(Number(t.duration) / 60), cost: num(t.cost), walkMeters: Number(t.walking_distance) || 0, steps };
}

/**
 * Public transport (up to 3 plans) and a taxi estimate between two GCJ-02 points.
 * `city`/`cityTo`: adcode or citycode of each end (needed by Amap for transit).
 */
export async function routes(origin: string, destination: string, city: string, cityTo?: string): Promise<Routes> {
  if (demo.maps) return mock.routes;
  const [transit, drive] = await Promise.all([
    amap<{ route: { taxi_cost?: string; transits?: RawTransit[] } }>("/v3/direction/transit/integrated", {
      origin, destination, city, cityd: cityTo ?? city, strategy: "0", nightflag: "1",
    }).catch((e) => { console.error("[route] transit:", (e as Error).message); return null; }),
    amap<{ route: { taxi_cost?: string; paths?: { distance: string; duration: string }[] } }>("/v3/direction/driving", {
      origin, destination, strategy: "10", extensions: "base",
    }).catch((e) => { console.error("[route] driving:", (e as Error).message); return null; }),
  ]);
  if (!transit && !drive) throw new Error("Amap routes unavailable");
  const path = drive?.route.paths?.[0];
  const taxiCost = num(drive?.route.taxi_cost) ?? num(transit?.route.taxi_cost);
  return {
    transit: (transit?.route.transits ?? []).slice(0, 3).map(toPlan).filter((p) => p.steps.some((s) => s.kind !== "walk")),
    taxi: path ? { minutes: Math.round(Number(path.duration) / 60), km: Math.round(Number(path.distance) / 100) / 10, cost: taxiCost ? Math.round(taxiCost) : undefined } : null,
  };
}
