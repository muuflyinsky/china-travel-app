import { mkdir, appendFile } from "node:fs/promises";
import { searchPlaces, py, type Place } from "./amap";
import { analyzeMenu, currentModel, writeCityGuide } from "./llm";
import { aiProvider, config, demo } from "./config";
import { Unavailable } from "./errors";
import { RESERVATION_SOURCE, reservationFor } from "./reservations";
import * as mock from "./demo";
import { cacheRead, cacheWrite } from "./cache";
import { logRow } from "./supabase";
import type { CityGuide, GuideArea, GuideDish, GuideSight } from "./city-guide-types";

// Automatic city guides (SPEC v0.4 · Explore). Facts come from data, words from the model:
// - Sights: Amap scenic-spot and museum POIs, ranked by national status and rating.
// - Text: the model writes intros / best time / visit length from those fields only (lib/llm.ts).
// - Dishes: the model names 5 local dishes; allergens and spice come from the same pipeline as
//   menu reading; typical spend comes from Amap restaurants that serve the dish.
// - Reservations: matched to the hand-imported, CC BY data in lib/reservations.ts.
// Nobody curates this. Low-confidence items and 👎 feedback are logged for a passive review.

const NOISE = /停车|售票|入口|出口|游客中心|服务中心|码头|检票|厕所|管理处|派出所/;
const base = (name: string) => name.replace(/[（(].*$/, "").replace(/-.*$/, "");

/** Top 5 sights: national-level scenic spots and well-rated museums first. */
export function rankSights(places: Place[]) {
  const seen = new Set<string>();
  return places
    .filter((p) => !NOISE.test(p.name) && p.rating && !seen.has(base(p.name)) && seen.add(base(p.name)))
    .map((p, i) => ({ p, score: Number(p.rating) + (p.type.includes("国家级") ? 0.5 : 0) + (p.type.includes("博物馆") ? 0.1 : 0) - i * 0.01 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(({ p }) => p);
}

/** Middle half of per-person spend at restaurants serving the dish, rounded to ¥10. */
async function spendFor(dish: string, adcode: string): Promise<[number, number] | undefined> {
  const shops = await searchPlaces({ keywords: dish, types: "050000", city: adcode, purpose: "guide" }).catch(() => []);
  const costs = shops.map((s) => Number(s.cost)).filter((c) => c > 0).sort((a, b) => a - b);
  if (costs.length < 3) return undefined;
  const q = (f: number) => Math.round(costs[Math.floor(f * (costs.length - 1))] / 10) * 10;
  return [Math.max(10, q(0.25)), Math.max(10, q(0.75))];
}

/**
 * The part that needs only Amap: the top 5 sights with real names, ratings, addresses and
 * reservation rules. Fast (three map calls), so the page never waits for the model.
 */
export async function basicGuide(adcode: string, cityZh: string, cityEn: string): Promise<CityGuide & { partial: true }> {
  const top = await topSights(adcode);
  return {
    city: cityZh, cityEn, adcode, generatedAt: new Date().toISOString(), model: "", partial: true,
    sources: ["Amap (高德) POI data", `${RESERVATION_SOURCE.name}, ${RESERVATION_SOURCE.license}`],
    sights: top.map((p) => ({
      // Without the model there is no English name; the reservation data has one for the big sights.
      id: p.id, zh: p.name, en: reservationFor(adcode, p.name)?.en ?? p.pinyin, location: p.location, address: p.address,
      rating: p.rating ? Number(p.rating) : undefined, national: p.type.includes("国家级"), photo: p.photo,
      intro: { en: "" }, bestTime: { en: "" }, hours: 0, confidence: "low",
      reservation: reservationFor(adcode, p.name)?.id,
    })),
    dishes: [], areas: [],
  };
}

async function topSights(adcode: string) {
  const pages = await Promise.all([
    searchPlaces({ keywords: "景点", types: "110000", city: adcode, page: 1, purpose: "guide" }),
    searchPlaces({ keywords: "景点", types: "110000", city: adcode, page: 2, purpose: "guide" }).catch(() => []),
    searchPlaces({ keywords: "博物馆", types: "140100", city: adcode, page: 1, purpose: "guide" }).catch(() => []),
  ]);
  return rankSights(pages.flat());
}

/** Full guide: Amap facts plus the model's text, dishes and areas. Falls back to the basic guide if the model fails. */
export async function generateGuide(adcode: string, cityZh: string, cityEn: string): Promise<CityGuide> {
  if (!aiProvider) return basicGuide(adcode, cityZh, cityEn);
  const top = await topSights(adcode);
  const text = await writeCityGuide({
    cityZh, cityEn,
    sights: top.map((p) => ({ zh: p.name, type: p.type, address: p.address, rating: p.rating ? Number(p.rating) : undefined })),
  }).catch((e) => { console.error("[city-guide] model failed, keeping map data only:", (e as Error).message); return null; });
  if (!text) return basicGuide(adcode, cityZh, cityEn);

  const sights: GuideSight[] = top.map((p) => {
    const w = text.sights.find((x) => x.zh === p.name);
    return {
      id: p.id, zh: p.name, en: w?.en ?? p.pinyin, location: p.location, address: p.address,
      rating: p.rating ? Number(p.rating) : undefined, national: p.type.includes("国家级"), photo: p.photo,
      intro: w?.intro ?? { en: "" }, bestTime: w?.best_time ?? { en: "" },
      hours: Math.min(8, Math.max(0.5, Math.round((w?.hours ?? 2) * 2) / 2)),
      confidence: w?.confidence === "high" ? "high" : "low",
      reservation: reservationFor(adcode, p.name)?.id,
    };
  });

  // Allergens and spice via the menu pipeline, so they match what Eat shows for the same dish.
  const names = text.dishes.slice(0, 5);
  const facts = await analyzeMenu({ text: names.map((d) => d.zh).join("\n"), lang: "en", city: cityEn }).catch(() => null);
  const dishes: GuideDish[] = await Promise.all(names.map(async (d) => {
    const f = facts?.dishes.find((x) => x.original === d.zh);
    return {
      zh: d.zh, pinyin: f?.pinyin ?? py(d.zh), name: d.name, intro: d.intro,
      allergens: f?.allergens ?? [], spice: f?.spice_level ?? 0, vegetarian: f?.vegetarian ?? false,
      spend: await spendFor(d.zh, adcode),
      confidence: d.confidence === "high" && f && f.confidence !== "low" ? "high" : "low",
    };
  }));

  // Areas: locate each suggestion's landmark, then count metro stations within 1 km of it.
  const located = await Promise.all((text.areas ?? []).slice(0, 3).map(async (a): Promise<GuideArea | null> => {
    const [spot] = await searchPlaces({ keywords: a.anchor_zh, city: adcode, pageSize: 1, purpose: "guide" }).catch(() => []);
    if (!spot) return null;
    const stations = await searchPlaces({ around: spot.location, types: "150500", radius: 1000, pageSize: 25, purpose: "guide" }).catch(() => []);
    return { zh: a.zh, name: a.name, reason: a.reason, location: spot.location, metro: stations.length };
  }));
  const areas = located.filter((a): a is GuideArea => a !== null);

  return {
    city: cityZh, cityEn, adcode, generatedAt: new Date().toISOString(), model: config.ai.key ? currentModel("text") : config.model, areas,
    sources: ["Amap (高德) POI data", `${RESERVATION_SOURCE.name}, ${RESERVATION_SOURCE.license}`],
    sights, dishes,
  };
}

// ---- cache ---------------------------------------------------------------------------------

const memory = new Map<string, CityGuide>();

/** Kept in memory and in the durable cache (lib/cache.ts), so every server instance can use it. */
const save = async (g: CityGuide) => {
  memory.set(g.adcode, g);
  await cacheWrite("city_guide", g.adcode, g);
};

/**
 * The guide for a hot city. Online this only reads: guides are generated in batch by the
 * monthly job (scripts/build-city-guides.mjs calls this with `refresh`, outside Vercel's time
 * limit and throttled to Amap's QPS) and stored in the durable cache. A stored guide is served
 * at any age; the job replaces it. A city the job hasn't reached yet gets the map-only guide
 * (a few Amap calls, kept in memory, never stored).
 */
export async function cityGuide(adcode: string, cityZh: string, cityEn: string, refresh = false): Promise<{ guide: CityGuide }> {
  if (demo.maps) return { guide: adcode === "310000" ? mock.cityGuide : { ...mock.cityGuide, city: cityZh, cityEn, adcode, sights: [], dishes: [], areas: [] } };
  if (!config.amapKey) throw new Unavailable("map");
  if (refresh) {
    // The batch job: one city at a time, logged so a failed run shows up in the events table.
    const t0 = Date.now();
    try {
      const g = await generateGuide(adcode, cityZh, cityEn);
      if (!(g as { partial?: boolean }).partial) await save(g);
      await review(g);
      await logRow("events", { e: "guide_generated", p: { city: adcode, ok: true, ms: Date.now() - t0, partial: Boolean((g as { partial?: boolean }).partial) }, sid: null });
      return { guide: g };
    } catch (e) {
      await logRow("events", { e: "guide_generated", p: { city: adcode, ok: false, ms: Date.now() - t0, error: String((e as Error).message ?? e).slice(0, 40) }, sid: null });
      throw e;
    }
  }
  const complete = (g?: CityGuide | null) => Boolean(g && !(g as { partial?: boolean }).partial);
  const inMemory = memory.get(adcode);
  if (complete(inMemory)) return { guide: inMemory! };
  const stored = await cacheRead<CityGuide>("city_guide", adcode);
  if (complete(stored)) { memory.set(adcode, stored!); return { guide: stored! }; }
  // Not generated yet: map data only, once per instance and day.
  if (inMemory && Date.now() - Date.parse(inMemory.generatedAt) < 864e5) return { guide: inMemory };
  const guide = await basicGuide(adcode, cityZh, cityEn);
  memory.set(adcode, guide);
  return { guide };
}

/** Passive review queue: low-confidence items and user 👎 go to data/review.jsonl (or the log). */
export async function review(g: CityGuide | null, extra?: Record<string, unknown>) {
  if (g && (g as { partial?: boolean }).partial) return; // map-only guide: nothing written by the model
  const rows = extra ? [extra] : [
    ...g!.sights.filter((s) => s.confidence === "low").map((s) => ({ kind: "sight", id: s.id, name: s.zh })),
    ...g!.dishes.filter((d) => d.confidence === "low").map((d) => ({ kind: "dish", name: d.zh })),
  ].map((r) => ({ ...r, city: g!.adcode, reason: "low_confidence" }));
  for (const r of rows) {
    const line = JSON.stringify({ ts: new Date().toISOString(), ...r });
    try { await mkdir("data", { recursive: true }); await appendFile("data/review.jsonl", line + "\n"); } catch { console.log("review", line); }
  }
}
