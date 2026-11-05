import { mkdir, appendFile } from "node:fs/promises";
import { searchPlaces, py, type Place } from "./amap";
import { analyzeMenu, currentModel, translateLines, writeCityGuide } from "./llm";
import { aiProvider, config, demo } from "./config";
import { Unavailable } from "./errors";
import { RESERVATION_SOURCE, reservationFor } from "./reservations";
import * as mock from "./demo";
import { cacheList, cacheRead, cacheWrite } from "./cache";
import { HOT_CITIES } from "./hot-cities";
import { logRow } from "./supabase";
import { listSig, listSigs, locate, mergePicks, mustSeeFor, type MustSee } from "./must-see";
import type { CityGuide, GuideArea, GuideDish, GuideSight, L10n } from "./city-guide-types";

// Automatic city guides (SPEC v0.4 · Explore). Facts come from data, words from the model:
// - Sights: the city's reviewed must-see list first (lib/must-see.ts; Amap only locates them),
//   then Amap scenic-spot and museum POIs, ranked by national status and rating, fill up to 5.
// - Text: the model writes intros / best time / visit length from those fields only (lib/llm.ts).
// - Dishes: the model names 5 local dishes; allergens and spice come from the same pipeline as
//   menu reading; typical spend comes from Amap restaurants that serve the dish.
// - Reservations: matched to the hand-imported, CC BY data in lib/reservations.ts.
// Apart from the must-see lists, nobody curates this. Low-confidence items and 👎 feedback are logged for a passive review.

const NOISE = /停车|售票|入口|出口|游客中心|服务中心|码头|检票|厕所|管理处|派出所|国客中心|客运中心|游客集散/;
const base = (name: string) => name.replace(/[（(].*$/, "").replace(/-.*$/, "");

/** Top `n` sights: national-level scenic spots and well-rated museums first. */
export function rankSights(places: Place[], n = 5) {
  const seen = new Set<string>();
  return places
    .filter((p) => !NOISE.test(p.name) && p.rating && !seen.has(base(p.name)) && seen.add(base(p.name)))
    .map((p, i) => ({ p, score: Number(p.rating) + (p.type.includes("国家级") ? 0.5 : 0) + (p.type.includes("博物馆") ? 0.1 : 0) - i * 0.01 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
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
    sources: sourcesFor(top),
    sights: top.picks.map((x) => sightOf(adcode, x)),
    dishes: [], areas: [], ...mustSeeMeta(top),
  };
}

/** One pick: a listed sight (located by Amap, or `p: null` if Amap didn't find it) or an automatic one. */
type SightPick = { p: Place | null; e?: MustSee };
type Top = { picks: SightPick[]; list: MustSee[]; unlocated: string[] };

/**
 * The picks: the city's reviewed must-see list in order (all of it, up to 6), each located by
 * its Chinese full name, then Amap's automatic picks up to 5 in all, without repeats. A city
 * without a list gets exactly the automatic top 5, as before.
 */
async function topSights(adcode: string): Promise<Top> {
  const [pages, list] = await Promise.all([
    Promise.all([
      searchPlaces({ keywords: "景点", types: "110000", city: adcode, page: 1, purpose: "guide" }),
      searchPlaces({ keywords: "景点", types: "110000", city: adcode, page: 2, purpose: "guide" }).catch(() => []),
      searchPlaces({ keywords: "博物馆", types: "140100", city: adcode, page: 1, purpose: "guide" }).catch(() => []),
    ]),
    mustSeeFor(adcode),
  ]);
  if (!list.length) return { picks: rankSights(pages.flat()).map((p) => ({ p })), list, unlocated: [] };
  const located = [];
  for (const e of list) {
    // One at a time: the cron throttles Amap calls, and a list is at most 6.
    const found = await searchPlaces({ keywords: e.zh.replace(/[（(].*?[)）]/g, " ").trim(), city: adcode, pageSize: 10, purpose: "guide" }).catch(() => []);
    located.push({ e, poi: locate(e, found) });
  }
  const { fill } = mergePicks(located, rankSights(pages.flat(), 20));
  return {
    picks: [...located.map(({ e, poi }) => ({ p: poi, e })), ...fill.map((p) => ({ p }))],
    list,
    unlocated: located.filter((x) => !x.poi).map((x) => x.e.zh),
  };
}

const sourcesFor = (top: Top) => [
  ...(top.list.length ? ["HaodeGo must-see list, compiled from public travel guides (sources per sight in Supabase must_see)"] : []),
  "Amap (高德) POI data", `${RESERVATION_SOURCE.name}, ${RESERVATION_SOURCE.license}`,
];

const mustSeeMeta = (top: Top): Pick<CityGuide, "mustSee"> => top.list.length
  ? { mustSee: { sig: listSig(top.list), reviewedOn: top.list.map((e) => e.reviewedOn ?? "").sort().at(-1) ?? "", unlocated: top.unlocated } }
  : {};

type Written = NonNullable<Awaited<ReturnType<typeof writeCityGuide>>>["sights"][number];

/**
 * A pick as a guide sight. Listed sights keep the list's reviewed names, "why go" line and time
 * from the centre; Amap gives location, address, rating and photo when it found the place.
 * `w` is the model's text for it (absent in the map-only guide).
 */
function sightOf(adcode: string, { p, e }: SightPick, w?: Written, why?: L10n): GuideSight {
  const zh = e?.zh ?? p!.name;
  const resv = reservationFor(adcode, zh) ?? (p ? reservationFor(adcode, p.name) : undefined);
  return {
    id: p?.id ?? `must-see-${adcode}-${e!.ord}`, zh,
    // Without the model there is no English name for automatic picks; the reservation data has one for the big sights.
    en: e?.en ?? w?.en ?? resv?.en ?? p!.pinyin,
    location: p?.location ?? "", address: p?.address ?? "",
    rating: p?.rating ? Number(p.rating) : undefined, national: Boolean(p?.type.includes("国家级")), photo: p?.photo,
    intro: w?.intro ?? { en: "" }, bestTime: w?.best_time ?? { en: "" },
    hours: w ? Math.min(8, Math.max(0.5, Math.round((w.hours ?? 2) * 2) / 2)) : 0,
    confidence: w?.confidence === "high" ? "high" : "low",
    reservation: resv?.id,
    ...(e ? { why: why ?? { en: e.why } } : {}),
    ...(e?.outside && e.centreH ? { centreH: e.centreH } : {}),
  };
}

/** Full guide: Amap facts plus the model's text, dishes and areas. Falls back to the basic guide if the model fails. */
export async function generateGuide(adcode: string, cityZh: string, cityEn: string): Promise<CityGuide> {
  if (!aiProvider) return basicGuide(adcode, cityZh, cityEn);
  const top = await topSights(adcode);
  const [text, whys] = await Promise.all([
    writeCityGuide({
      cityZh, cityEn,
      sights: top.picks.map(({ p, e }) => ({ zh: e?.zh ?? p!.name, type: p?.type ?? "", address: p?.address ?? "", rating: p?.rating ? Number(p.rating) : undefined })),
    }).catch((e) => { console.error("[city-guide] model failed, keeping map data only:", (e as Error).message); return null; }),
    // The reviewed English lines in the other five languages (not reviewed again: a short intro, not safety information).
    top.list.length ? translateLines(top.list.map((e) => e.why)).catch((e) => { console.error("[city-guide] why lines not translated:", (e as Error).message); return null; }) : null,
  ]);
  if (!text) return basicGuide(adcode, cityZh, cityEn);

  const sights: GuideSight[] = top.picks.map((x) => {
    const zh = x.e?.zh ?? x.p!.name;
    return sightOf(adcode, x, text.sights.find((w) => w.zh === zh), x.e && whys ? whys[top.list.indexOf(x.e)] : undefined);
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
    sources: sourcesFor(top),
    sights, dishes, ...mustSeeMeta(top),
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
      await logRow("events", { e: "guide_generated", p: { city: adcode, ok: true, ms: Date.now() - t0, partial: Boolean((g as { partial?: boolean }).partial), ...(g.mustSee?.unlocated.length ? { unlocated: g.mustSee.unlocated } : {}) }, sid: null });
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

/**
 * The daily job (app/api/cron/city-guides): cities whose must-see list changed since their guide
 * was made first, then hot cities with no guide, then the oldest, skipping any refreshed within
 * `maxAgeDays`. Generates one city at a time and stops starting new ones once `budgetMs` has
 * passed, so the run ends inside the function's time limit. Listed sights Amap couldn't find
 * are reported per city (`unlocated`).
 */
export async function refreshStaleGuides({ budgetMs, maxAgeDays = 30 }: { budgetMs: number; maxAgeDays?: number }) {
  const t0 = Date.now();
  const rows = await cacheList("city_guide", "value->mustSee->>sig");
  const stored = new Map(rows.map((r) => [r.key, Date.parse(r.generatedAt)]));
  const storedSig = new Map(rows.map((r) => [r.key, r.extra ?? ""]));
  const sigs = await listSigs(HOT_CITIES.map((c) => c.a));
  const due = HOT_CITIES
    .map((c) => ({ c, at: stored.get(c.a) ?? 0, changed: stored.has(c.a) && (storedSig.get(c.a) ?? "") !== (sigs.get(c.a) ?? "") }))
    .filter(({ at, changed }) => changed || Date.now() - at > maxAgeDays * 864e5)
    .sort((a, b) => Number(b.changed) - Number(a.changed) || a.at - b.at);
  const done: { city: string; ok: boolean; s: number; error?: string; listChanged?: boolean; unlocated?: string[] }[] = [];
  for (const { c, changed } of due) {
    if (Date.now() - t0 > budgetMs) break;
    const t = Date.now();
    try {
      const { guide } = await cityGuide(c.a, c.s, c.e, true);
      done.push({
        city: c.e, ok: !(guide as { partial?: boolean }).partial, s: Math.round((Date.now() - t) / 1000),
        ...(changed ? { listChanged: true } : {}), ...(guide.mustSee?.unlocated.length ? { unlocated: guide.mustSee.unlocated } : {}),
      });
    } catch (e) {
      done.push({ city: c.e, ok: false, s: Math.round((Date.now() - t) / 1000), error: String((e as Error).message ?? e).slice(0, 80) });
    }
  }
  return { done, remaining: due.length - done.length, total: HOT_CITIES.length };
}
