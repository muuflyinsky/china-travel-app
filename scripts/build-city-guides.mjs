#!/usr/bin/env node
// Generates the city guide for every hot city, one city at a time, and stores each in Supabase
// (app_cache, see lib/cache.ts), which the live app only reads. The daily Vercel Cron
// (app/api/cron/city-guides) does this a few cities at a time; this script is the manual way to
// do all of them at once, e.g. after a prompt change.
//
//   CITY_GUIDE_TOKEN=… node scripts/build-city-guides.mjs http://localhost:3000 [adcode …]
//
// Needs a running app (`next start`) with AMAP_KEY, an AI key (AI_API_KEY or ANTHROPIC_API_KEY),
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (where the guides are written) and the same
// CITY_GUIDE_TOKEN. Set AMAP_MIN_INTERVAL_MS on that app to stay under the Amap key's QPS.
import { readFile } from "node:fs/promises";

const [base = "http://localhost:3000", ...only] = process.argv.slice(2);
const token = process.env.CITY_GUIDE_TOKEN;
if (!token) { console.error("CITY_GUIDE_TOKEN is not set"); process.exit(1); }
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set for the app: without them guides go to data/ and are lost.");
  process.exit(1);
}

const cities = JSON.parse(await readFile(new URL("../lib/data/hot-cities.json", import.meta.url), "utf8"))
  .filter((c) => !only.length || only.includes(c.a));

let ok = 0, low = 0;
const failed = [];
for (const c of cities) {
  const t0 = Date.now();
  const res = await fetch(`${base}/api/city-guide?city=${c.a}&refresh=1`, { headers: { authorization: `Bearer ${token}` } }).catch((e) => ({ ok: false, json: async () => ({ error: e.message }) }));
  const g = await res.json().catch(() => ({}));
  const s = ((Date.now() - t0) / 1000).toFixed(0);
  // A map-only (partial) guide isn't stored, so it counts as a failure here.
  if (!res.ok || g.demo || g.partial || !g.sights?.length) {
    failed.push(c.e);
    console.error(`✗ ${c.e} (${s}s): ${g.error ?? (g.demo ? "app is in demo mode" : g.partial ? "map data only: no AI text" : "no sights")}`);
    continue;
  }
  ok++;
  const lowHere = [...g.sights, ...g.dishes].filter((x) => x.confidence === "low").length;
  low += lowHere;
  console.log(`✓ ${c.e} (${s}s): ${g.sights.length} sights, ${g.dishes.length} dishes, ${g.areas?.length ?? 0} areas${lowHere ? `, ${lowHere} low-confidence` : ""}`);
}
console.log(`\n${ok}/${cities.length} cities stored in Supabase · ${low} low-confidence items${failed.length ? ` · failed: ${failed.join(", ")}` : ""}`);
process.exit(ok ? 0 : 1);
