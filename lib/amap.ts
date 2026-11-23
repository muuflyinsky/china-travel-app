import { pinyin } from "pinyin-pro";
import { config, demo } from "./config";
import * as mock from "./demo";
import { after } from "next/server";
import { Unavailable } from "./errors";
import { countRows, logRow, supabaseOn } from "./supabase";

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
  photos?: string[]; // up to 3
  tag?: string; // business.tag: for restaurants, usually signature dishes
  opentime?: string;
  distance?: string;
  district?: string;
  adcode?: string; // district adcode
  awards?: import("./restaurant-awards").Award[];
};

/** What a call is for; the baseline for moving recommendations off live Amap search. */
export type AmapPurpose = "search" | "category" | "nearby" | "guide" | "restaurants" | "hotels" | "route" | "weather" | "geocode";

/**
 * One `amap_call` row per request this code makes (into the events table, see lib/supabase.ts),
 * after the response is sent. Requests answered from Next's 5-minute fetch cache are counted
 * too, so this is an upper bound on what Amap bills.
 */
function count(api: string, purpose: AmapPurpose, ok: boolean) {
  used.local++;
  // env tells production from preview deploys and local runs, which may share the key and quota.
  const row = { e: "amap_call", p: { api, purpose, ok, env: process.env.VERCEL_ENV ?? "local" }, sid: null };
  try { after(() => logRow("events", row)); } catch { void logRow("events", row); }
}

// Throttle: requests are spaced at least this far apart within this process, in order. 0 online;
// the daily guide job turns it on while it runs (setAmapGap) to stay under the key's QPS.
let gap = Number(process.env.AMAP_MIN_INTERVAL_MS) || 0;
let nextSlot = 0;
export const setAmapGap = (ms: number) => { gap = ms; };
async function slot() {
  if (!gap) return;
  const now = Date.now(), at = Math.max(now, nextSlot);
  nextSlot = at + gap;
  if (at > now) await new Promise((r) => setTimeout(r, at - now));
}
/** Amap answered with a web page (its firewall), not data. */
export class AmapBlocked extends Error {
  constructor(path: string) { super(`Amap ${path}: blocked (HTML instead of JSON)`); }
}

// ---- Daily budget ------------------------------------------------------------------------
// The key's quota is small (personal account, about 5,000 searches a month; workspace inbox/
// 2026-11-19-dev-高德调用量.md). Past AMAP_DAILY_BUDGET calls in a Beijing day, or once Amap
// says the quota is used up, every call fails as Unavailable("map") until the next day, and pages
// fall back (Stay: Trip.com; Explore and routes: a short note). Nothing from Amap is stored.
const BUDGET = Number(process.env.AMAP_DAILY_BUDGET) || 150;
// Amap's "daily / monthly quota used up" answers.
const QUOTA_CODES = new Set(["10003", "10044", "10045"]);
const beijingDay = () => new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);
/** Today's count from Supabase (all instances), refreshed at most once a minute, plus calls since. */
const used = { day: "", base: 0, local: 0, at: 0, out: "" };
async function overBudget() {
  const day = beijingDay();
  if (used.out === day) return true;
  if (used.day !== day) Object.assign(used, { day, base: 0, local: 0, at: 0 });
  if (supabaseOn && Date.now() - used.at > 60_000) {
    used.at = Date.now();
    const since = new Date(Date.parse(`${day}T00:00:00+08:00`)).toISOString();
    const n = await countRows("events", `e=eq.amap_call&ts=gte.${since}`).catch(() => null);
    if (n !== null) { used.base = n; used.local = 0; }
  }
  if (used.base + used.local < BUDGET) return false;
  if (used.out !== day) console.warn(`[amap] daily budget of ${BUDGET} calls reached; map features fall back until tomorrow`);
  used.out = day;
  return true;
}

// Amap's "too many requests" answers (QPS limits): wait and try again, 3 times at most.
const QPS_CODES = new Set(["10019", "10020", "10021", "10022", "10029"]);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function amap<T>(path: string, params: Record<string, string | undefined>, purpose: AmapPurpose, fresh = false): Promise<T> {
  if (!config.amapKey) throw new Unavailable("map");
  if (await overBudget()) throw new Unavailable("map");
  const qs = new URLSearchParams({ key: config.amapKey });
  for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
  for (let attempt = 0; ; attempt++) {
    await slot();
    // A QPS refusal comes back as HTTP 200, so retries skip Next's 5-minute fetch cache.
    const res = await fetch(`${BASE}${path}?${qs}`, attempt || fresh ? { cache: "no-store" } : { next: { revalidate: 300 } });
    const text = await res.text();
    // Amap's firewall sometimes answers a server with an HTML "verify you're human" page instead
    // of JSON (seen on /v5/place/* from Vercel, 2026-11-03). Callers can fall back to v3.
    if (text.trimStart().startsWith("<")) { count(path, purpose, false); throw new AmapBlocked(path); }
    const data = JSON.parse(text);
    count(path, purpose, data.status === "1");
    if (data.status === "1") return data as T;
    if (QPS_CODES.has(String(data.infocode)) && attempt < 3) { await sleep(1000 * 2 ** attempt); continue; }
    if (QUOTA_CODES.has(String(data.infocode))) {
      used.out = beijingDay();
      console.warn(`[amap] quota used up (${data.infocode}); map features fall back until tomorrow`);
      throw new Unavailable("map");
    }
    throw new Error(`Amap ${path}: ${data.info ?? "error"} (${data.infocode ?? ""})`);
  }
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

// Sights (11) and museums (1401) with no rating are usually check-in spots or side entrances.
// Only those: the rest of 14 is schools and universities, which Amap rarely rates (北京大学 has
// no rating and was dropped from every search, 2026-11-04).
const UNRATED_JUNK = /^(11|1401)/;

/**
 * Drops clutter from search results and puts places people go to first. A sight or museum with
 * no rating is usually a check-in spot or a sub-entrance, so it is dropped too.
 */
export function cleanResults(places: Place[], opts: { byRating?: boolean; query?: string } = {}) {
  const typeCode = (p: Place) => p.typecode ?? "";
  const kept = places.filter((p) => !JUNK_NAME.test(p.name) && !JUNK_TYPE.test(typeCode(p)) &&
    !(UNRATED_JUNK.test(typeCode(p)) && !(Number(p.rating) > 0)));
  // What was typed comes first: 北京大学 itself before a sight inside the campus.
  const q = opts.query?.trim().toLowerCase();
  const match = (p: Place) => (!q ? 2 : p.name.toLowerCase() === q ? 0 : p.name.toLowerCase().startsWith(q) ? 1 : 2);
  return kept
    .map((p, i) => ({ p, i }))
    .sort((a, b) => opts.byRating
      ? Number(b.p.rating ?? 0) - Number(a.p.rating ?? 0) || a.i - b.i
      : match(a.p) - match(b.p) || rank(typeCode(a.p)) - rank(typeCode(b.p)) || a.i - b.i)
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
  business?: { tel?: string; rating?: string; cost?: string; tag?: string; opentime_week?: string; opentime_today?: string };
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
    photos: p.photos?.slice(0, 3).map((x) => httpsImg(x.url)!).filter(Boolean),
    tag: typeof p.business?.tag === "string" ? p.business.tag : undefined,
    opentime: (typeof p.business?.opentime_week === "string" && p.business.opentime_week) || (typeof p.business?.opentime_today === "string" ? p.business.opentime_today : undefined),
    distance: p.distance,
    district: p.adname,
    adcode: p.adcode,
  };
}

// ---- v3 fallback: the same search on Amap's older API, when v5 is blocked ----------------------

type RawPoiV3 = {
  id: string; name: string; address: string | []; location: string; type: string; typecode?: string;
  cityname: string | []; citycode: string | []; adname: string | []; adcode?: string | []; distance?: string | [];
  tel?: string | []; tag?: string | []; photos?: { url: string }[];
  biz_ext?: { rating?: string | []; cost?: string | []; open_time?: string | []; opentime2?: string | [] } | [];
};
/** v3 writes an empty field as []. */
const str = (v: unknown) => (typeof v === "string" && v ? v : undefined);
const fromV3 = (p: RawPoiV3): RawPoi => {
  const biz = Array.isArray(p.biz_ext) ? {} : p.biz_ext ?? {};
  return {
    id: p.id, name: p.name, address: str(p.address) ?? "", location: p.location, type: p.type, typecode: str(p.typecode),
    cityname: str(p.cityname) ?? "", citycode: str(p.citycode) ?? "", adname: str(p.adname) ?? "", adcode: str(p.adcode), distance: str(p.distance),
    // v3 keeps a restaurant's signature dishes in a top-level `tag`, opening hours in biz_ext.
    business: { tel: str(p.tel), rating: str(biz.rating), cost: str(biz.cost), tag: str(p.tag), opentime_week: str(biz.opentime2) ?? str(biz.open_time) },
    photos: p.photos,
  };
};
// Once v5 is blocked, go straight to v3 for a while instead of paying for a failed call each time.
let v5BlockedUntil = 0;
async function v5OrV3<T>(v5: () => Promise<T>, v3: () => Promise<T>) {
  if (Date.now() < v5BlockedUntil) return v3();
  try { return await v5(); } catch (e) {
    if (!(e instanceof AmapBlocked)) throw e;
    // Blocked from Vercel almost every time since 2026-11-03: try v5 again only after 6 hours,
    // instead of spending an extra request on most searches.
    console.warn("[amap] v5 blocked, using v3 for 6 h");
    v5BlockedUntil = Date.now() + 6 * 3600_000;
    return v3();
  }
}

/** One place by its Amap id (B0FFHOVBNT, the id in an amap.com place link). */
export async function placeById(id: string, purpose: AmapPurpose = "restaurants") {
  if (demo.maps) return null;
  const pois = await v5OrV3(
    async () => (await amap<{ pois: RawPoi[] }>("/v5/place/detail", { id, show_fields: "business,photos" }, purpose)).pois,
    async () => ((await amap<{ pois: RawPoiV3[] }>("/v3/place/detail", { id, extensions: "all" }, purpose)).pois ?? []).map(fromV3),
  );
  return pois?.[0] ? toPlace(pois[0]) : null;
}

export async function searchPlaces(q: { keywords?: string; city?: string; around?: string; types?: string; page?: number; radius?: number; pageSize?: number; purpose?: AmapPurpose }) {
  if (demo.maps) return mock.places(q.keywords, q.types);
  const size = String(q.pageSize ?? 20), page = String(q.page ?? 1), purpose = q.purpose ?? (q.around ? "nearby" : "search");
  const pois = await v5OrV3(
    async () => {
      const fields = { show_fields: "business,photos", page_size: size, page_num: page };
      const data = q.around
        ? await amap<{ pois: RawPoi[] }>("/v5/place/around", { location: q.around, keywords: q.keywords, types: q.types, radius: String(q.radius ?? 5000), sortrule: "distance", ...fields }, purpose)
        : await amap<{ pois: RawPoi[] }>("/v5/place/text", { keywords: q.keywords, types: q.types, region: q.city, city_limit: q.city ? "true" : undefined, ...fields }, purpose);
      return data.pois;
    },
    async () => {
      const fields = { extensions: "all", offset: size, page };
      const data = q.around
        ? await amap<{ pois: RawPoiV3[] }>("/v3/place/around", { location: q.around, keywords: q.keywords, types: q.types, radius: String(q.radius ?? 5000), sortrule: "distance", ...fields }, purpose)
        : await amap<{ pois: RawPoiV3[] }>("/v3/place/text", { keywords: q.keywords, types: q.types, city: q.city, citylimit: q.city ? "true" : undefined, ...fields }, purpose);
      return (data.pois ?? []).map(fromV3);
    },
  );
  return pois.map(toPlace);
}

/** Chinese address → "lng,lat" (GCJ-02), or null when Amap can't place it. */
export async function geocode(address: string): Promise<string | null> {
  if (demo.maps) return "121.4910,31.2454";
  const d = await amap<{ geocodes: { location: string }[] }>("/v3/geocode/geo", { address }, "geocode");
  return d.geocodes?.[0]?.location || null;
}

export async function reverseGeocode(location: string) {
  if (demo.maps) return mock.regeo;
  const d = await amap<{ regeocode: { formatted_address: string; addressComponent: { city: string | []; province: string; citycode: string; adcode: string } } }>(
    "/v3/geocode/regeo", { location }, "geocode",
  );
  const c = d.regeocode.addressComponent;
  return {
    address: d.regeocode.formatted_address,
    city: Array.isArray(c.city) ? c.province : c.city, // municipalities return [] for city
    citycode: c.citycode,
    adcode: c.adcode,
  };
}

type Forecast = { forecasts: { city: string; reporttime?: string; casts: { date: string; dayweather: string; daytemp: string; nighttemp: string }[] }[] };

const retried = new Map<string, number>();
const addDay = (iso: string, n: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);

/**
 * The forecast from today (Beijing) on. Next's fetch cache answers a stale entry first and
 * refreshes it in the background, so the first request could get an old report: from 11-11 for a
 * quiet city (11-23), or last evening's report just after midnight, whose first day is yesterday
 * (11-24 05:00 got 11-23 17:03). So: if the first day isn't today, ask once more without the
 * cache; then drop any day before today either way (Amap may not have the new report yet).
 */
export async function weather(adcode: string) {
  const today = beijingDay();
  // Sample data: same shape, dated from today.
  if (demo.maps) return { ...mock.weather, casts: mock.weather.casts.map((c, i) => ({ ...c, date: addDay(today, i) })) };
  const ask = (fresh: boolean) => amap<Forecast>("/v3/weather/weatherInfo", { city: adcode, extensions: "all" }, "weather", fresh);
  let f = (await ask(false)).forecasts[0];
  // At most one uncached retry per city per 30 minutes: after midnight Amap may keep yesterday's
  // report for hours, and every request would otherwise spend a call on the same answer.
  if (f?.casts?.[0]?.date !== today && Date.now() - (retried.get(adcode) ?? 0) > 30 * 60_000) {
    retried.set(adcode, Date.now());
    f = (await ask(true)).forecasts[0] ?? f;
  }
  return f && { ...f, casts: (f.casts ?? []).filter((c) => c.date >= today) };
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
    }, "route").catch((e) => { console.error("[route] transit:", (e as Error).message); return null; }),
    amap<{ route: { taxi_cost?: string; paths?: { distance: string; duration: string }[] } }>("/v3/direction/driving", {
      origin, destination, strategy: "10", extensions: "base",
    }, "route").catch((e) => { console.error("[route] driving:", (e as Error).message); return null; }),
  ]);
  if (!transit && !drive) throw new Error("Amap routes unavailable");
  const path = drive?.route.paths?.[0];
  const taxiCost = num(drive?.route.taxi_cost) ?? num(transit?.route.taxi_cost);
  return {
    transit: (transit?.route.transits ?? []).slice(0, 3).map(toPlan).filter((p) => p.steps.some((s) => s.kind !== "walk")),
    taxi: path ? { minutes: Math.round(Number(path.duration) / 60), km: Math.round(Number(path.distance) / 100) / 10, cost: taxiCost ? Math.round(taxiCost) : undefined } : null,
  };
}
