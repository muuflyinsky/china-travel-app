#!/usr/bin/env node
// Pre-generates Explore's category lists (museums, temples, parks…) for every hot city into
// public/categories/<adcode>.json: the first page of each, best rated first, exactly as
// /api/places returns it. The app reads these as static files and only asks Amap live for
// later pages (infinite scroll), other cities, and searches people type.
//
//   node scripts/build-category-lists.mjs http://localhost:3000 [adcode …]
//
// Needs a running app with AMAP_KEY. Run by .github/workflows/city-guides.yml once a month.
import { readFile, writeFile, mkdir } from "node:fs/promises";

const [base = "http://localhost:3000", ...only] = process.argv.slice(2);
const read = async (p) => JSON.parse(await readFile(new URL(p, import.meta.url), "utf8"));
const cities = (await read("../lib/data/hot-cities.json")).filter((c) => !only.length || only.includes(c.a));
const cats = await read("../lib/data/categories.json");
await mkdir("public/categories", { recursive: true });

let written = 0;
for (const c of cities) {
  const out = { adcode: c.a, generatedAt: new Date().toISOString(), cats: {} };
  for (const k of cats) {
    const qs = new URLSearchParams({ q: k.q, city: c.a, types: k.types, sort: "rating", page: "1" });
    const res = await fetch(`${base}/api/places?${qs}`);
    const d = await res.json().catch(() => null);
    if (!res.ok || !d || d.demo) { console.error(`✗ ${c.e} · ${k.key}: ${d?.error ?? (d?.demo ? "app is in demo mode" : res.status)}`); continue; }
    if (d.places.length) out.cats[k.key] = d.places;
  }
  const n = Object.keys(out.cats).length;
  if (!n) continue; // keep last month's file rather than writing an empty one
  await writeFile(`public/categories/${c.a}.json`, JSON.stringify(out));
  written++;
  console.log(`✓ ${c.e}: ${n}/${cats.length} categories`);
}
console.log(`\n${written}/${cities.length} cities written`);
process.exit(written ? 0 : 1);
