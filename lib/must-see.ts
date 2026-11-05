// Must-see lists for the Explore city picks (SPEC §3.2.1, workspace DECISIONS: Veer 2026-11-04).
// Per hot city, 3–6 sights that appear in ≥ 3 independent public travel guides, drafted by AI and
// reviewed by Veer. The picks show a city's reviewed list first; Amap's automatic picks only fill
// the slots left (lib/city-guide.ts). Amap never chooses a listed sight, it only locates it.
//
// The data lives in Supabase (`must_see`, supabase/migrations/0011), cached an hour per server
// instance, with lib/data/must-see.json as the bundled fallback (D6: no runtime file writes).
// Only reviewed rows (`reviewed_on` set) are ever used: drafts stay in the data, invisible.
import { createHash } from "node:crypto";
import DATA from "./data/must-see.json";
import { rest, supabaseReadOn } from "./supabase";

export type MustSee = {
  city: string; // city adcode
  ord: number; // 1 = first
  zh: string; // Chinese full name: the taxi card and the Amap search use it
  en: string;
  why: string; // reviewed English "why go" line
  outside?: boolean; // outside the centre: the card shows centreH
  centreKm?: number;
  centreH?: number; // reviewed travel time from the centre, hours; never computed
  sources: string[];
  reviewedOn: string | null;
  reviewedBy: string | null;
};

type Row = {
  city: string; ord: number; name_zh: string; name_en: string; why_en: string;
  outside: boolean; centre_km: number | null; centre_h: number | string | null;
  sources: string[] | null; reviewed_on: string | null; reviewed_by: string | null;
};

const fromRow = (r: Row): MustSee => ({
  city: r.city, ord: r.ord, zh: r.name_zh, en: r.name_en, why: r.why_en,
  ...(r.outside ? { outside: true } : {}),
  ...(r.centre_km != null ? { centreKm: r.centre_km } : {}),
  ...(r.centre_h != null ? { centreH: Number(r.centre_h) } : {}),
  sources: r.sources ?? [], reviewedOn: r.reviewed_on, reviewedBy: r.reviewed_by,
});

export const BUNDLED: MustSee[] = (DATA as { entries: MustSee[] }).entries;

/** Thrown when the lists can't be read: the caller must not build a guide without them. */
export class MustSeeUnavailable extends Error {}

// The table doesn't exist yet (migration 0011 not applied): the bundled list, as intended.
const TABLE_MISSING = /PGRST205|42P01|does not exist|Could not find the table/;
let lastGood: MustSee[] | null = null;
let cache: { at: number; ttl: number; data: Promise<MustSee[]> } | null = null;
async function all(): Promise<MustSee[]> {
  if (!supabaseReadOn) return BUNDLED;
  if (!cache || Date.now() - cache.at > cache.ttl) {
    const next = { at: Date.now(), ttl: 36e5, data: Promise.resolve<MustSee[]>([]) };
    next.data = (rest("must_see?select=*&order=city,ord") as Promise<Row[]>).then((rows) => (lastGood = rows.map(fromRow))).catch((e) => {
      const msg = (e as Error).message;
      console.error("[must-see]", msg);
      next.ttl = 3e5; // retry in 5 minutes
      if (TABLE_MISSING.test(msg)) return BUNDLED;
      // Supabase slow or down: the last good read. Never the bundled snapshot, which may be
      // behind what Veer reviewed in Supabase: a guide built from it would drop a live list.
      if (lastGood) return lastGood;
      cache = null;
      throw new MustSeeUnavailable(msg);
    });
    cache = next;
  }
  return cache.data;
}

/** The reviewed list for a city, in order, at most 6. `drafts` includes unreviewed rows (tests only). */
export function listFor(entries: MustSee[], adcode: string, { drafts = false } = {}) {
  return entries.filter((e) => e.city === adcode && (drafts || Boolean(e.reviewedOn))).sort((a, b) => a.ord - b.ord).slice(0, 6);
}
export const mustSeeFor = async (adcode: string) => listFor(await all(), adcode);

/** Changes when anything shown from the list changes, so the cron knows to regenerate the city. "" = no list. */
export const listSig = (list: MustSee[]) =>
  list.length ? createHash("sha1").update(JSON.stringify(list.map((e) => [e.ord, e.zh, e.en, e.why, e.outside ?? false, e.centreH ?? null]))).digest("hex").slice(0, 12) : "";

/** Every hot city's current signature, for the cron; null when the lists can't be read (then nothing counts as changed). */
export async function listSigs(adcodes: string[]) {
  const entries = await all().catch(() => null);
  return entries ? new Map(adcodes.map((a) => [a, listSig(listFor(entries, a))])) : null;
}

// ---- matching -------------------------------------------------------------------------------

/** Metres between two "lng,lat" points (equirectangular: fine at city scale). */
export function metres(a: string, b: string) {
  const [x1, y1] = a.split(",").map(Number), [x2, y2] = b.split(",").map(Number);
  if (![x1, y1, x2, y2].every(Number.isFinite)) return Infinity;
  const k = Math.PI / 180, R = 6371e3;
  return R * Math.hypot((x2 - x1) * k * Math.cos(((y1 + y2) / 2) * k), (y2 - y1) * k);
}

const core = (name: string) => name.replace(/[（(].*$/, "").replace(/[-－].*$/, "").replace(/\s+/g, "");
const NOT_THE_SIGHT = /停车|售票|入口|出口|检票|厕所|管理处|派出所|游客中心|服务中心|公交|地铁|码头|店|宾馆|餐|小吃|美食|民宿|客栈|公寓|超市|商场|东馆|分馆/;

/**
 * The Amap result that is this listed sight: the same name (西安城墙 = 西安城墙-永宁门, the part
 * after a dash or bracket aside), else a name that starts with it (西安城墙南门), and never a car
 * park, gate, shop, restaurant or another branch (上海博物馆东馆, 南锣鼓巷文宇奶酪店). A shorter
 * name (天安门 for 天安门广场) is a different place. null = not found: shown without a route.
 */
export function locate<P extends { name: string }>(e: Pick<MustSee, "zh">, found: P[]): P | null {
  const want = core(e.zh);
  const ok = found.filter((p) => !(NOT_THE_SIGHT.test(p.name) && !NOT_THE_SIGHT.test(e.zh)));
  return ok.find((p) => core(p.name) === want) ?? ok.find((p) => core(p.name).startsWith(want)) ?? null;
}

/**
 * The picks: every listed sight in order, then automatic picks up to `total`, without anything
 * the list already has (same name core, the same Amap place, or within 200 m of a listed one:
 * 大雁塔 inside 大慈恩寺; wider would drop real neighbours such as the National Museum).
 */
export function mergePicks<P extends { id: string; name: string; location: string }>(listed: { e: MustSee; poi: P | null }[], auto: P[], total = 5) {
  const taken = listed.map(({ e, poi }) => ({ core: core(e.zh), id: poi?.id, location: poi?.location }));
  const dup = (p: P) => taken.some((t) => {
    const c = core(p.name);
    return t.id === p.id || (c.length >= 2 && (c.includes(t.core) || t.core.includes(c))) || (t.location ? metres(t.location, p.location) < 200 : false);
  });
  return { listed, fill: auto.filter((p) => !dup(p)).slice(0, Math.max(0, total - listed.length)) };
}
