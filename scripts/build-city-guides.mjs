#!/usr/bin/env node
// Pre-generates the city guide for every hot city into public/city-guide/<adcode>.json, so the
// app serves them as static files and only falls back to /api/city-guide for new cities.
//
//   CITY_GUIDE_TOKEN=… node scripts/build-city-guides.mjs http://localhost:3000 [adcode …]
//
// Needs a running app with ANTHROPIC_API_KEY, AMAP_KEY and the same CITY_GUIDE_TOKEN. Run by
// .github/workflows/city-guides.yml once a month; it commits the files and Vercel redeploys.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const [base = "http://localhost:3000", ...only] = process.argv.slice(2);
const token = process.env.CITY_GUIDE_TOKEN;
if (!token) { console.error("CITY_GUIDE_TOKEN is not set"); process.exit(1); }

const cities = JSON.parse(await readFile(new URL("../lib/data/hot-cities.json", import.meta.url), "utf8"))
  .filter((c) => !only.length || only.includes(c.a));
await mkdir("public/city-guide", { recursive: true });

let failed = 0, low = 0;
for (const c of cities) {
  const res = await fetch(`${base}/api/city-guide?city=${c.a}&refresh=1`, { headers: { authorization: `Bearer ${token}` } });
  const g = await res.json().catch(() => ({}));
  if (!res.ok || g.demo || !g.sights?.length) { failed++; console.error(`✗ ${c.e}: ${g.error ?? (g.demo ? "app is in demo mode" : "no sights")}`); continue; }
  delete g.demo;
  const lowHere = [...g.sights, ...g.dishes].filter((x) => x.confidence === "low").length;
  low += lowHere;
  await writeFile(`public/city-guide/${c.a}.json`, JSON.stringify(g));
  console.log(`✓ ${c.e}: ${g.sights.length} sights, ${g.dishes.length} dishes${lowHere ? `, ${lowHere} low-confidence` : ""}`);
}
console.log(`\n${cities.length - failed}/${cities.length} cities written · ${low} low-confidence items (see data/review.jsonl on the server)`);
process.exit(failed === cities.length ? 1 : 0);
