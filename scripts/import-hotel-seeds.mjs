#!/usr/bin/env node
// Imports curated hotel seeds into lib/data/hotel-seeds.json from a CSV (idempotent, per-city).
// Used by the haode-hotel-curator agent: it collects candidates (double-signal curation), then
// this script validates and merges them into the seed file.
//
// These seeds serve TWO purposes (see 产品改进建议清单 #5):
//   1. Fallback when live Amap search returns nothing (so Stay never shows empty).
//   2. The "local picks" and "foreigners-stay/trending" curated groups (via `collection`).
//
//   node scripts/import-hotel-seeds.mjs <file.csv> --checked YYYY-MM-DD
//
// CSV columns (header row required):
//   city        adcode (310000) or Chinese short name (上海)
//   name_zh     hotel name exactly as guests will see it
//   name_en     optional
//   brand       optional English brand / descriptor
//   stars       optional 3 | 4 | 5
//   tier        optional economy | comfort | upscale | luxury
//   collection  local | trending | both   (required)
//   reason_en   optional one-line reason shown to travellers
//   evidence    optional internal sourcing note (not shown)
//   rating      optional number
//   cny         optional approximate nightly price
//   address     optional Chinese address
//   location    optional "lng,lat" GCJ-02
import { readFile, writeFile } from "node:fs/promises";

const [file, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.join(" ").split("--").filter(Boolean).map((s) => s.trim().split(/\s+/)).map(([k, ...v]) => [k, v.join(" ")]));
if (!file || !opt.checked) {
  console.error("usage: import-hotel-seeds.mjs <file.csv> --checked YYYY-MM-DD");
  process.exit(1);
}

const parse = (text) => text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((l) => l.trim()).map((line) => {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q && c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = !q;
    else if (c === "," && !q) { out.push(cur.trim()); cur = ""; } else cur += c;
  }
  out.push(cur.trim());
  return out;
});

const root = new URL("..", import.meta.url);
const cities = JSON.parse(await readFile(new URL("lib/data/cities.json", root), "utf8"));
const path = new URL("lib/data/hotel-seeds.json", root);
const data = JSON.parse(await readFile(path, "utf8"));
const [head, ...rows] = parse(await readFile(file, "utf8"));
const col = (name) => head.indexOf(name);
for (const c of ["city", "name_zh", "collection"]) if (col(c) < 0) { console.error(`missing column: ${c}`); process.exit(1); }

const cityCode = (v) => (/^\d{6}$/.test(v) ? v : cities.find((c) => c.s === v.replace(/市$/, "") && c.t !== "county")?.a);
const TIERS = ["economy", "comfort", "upscale", "luxury"];
const COLLECTIONS = ["local", "trending", "both"];
const num = (v) => (v && v !== "" ? Number(v) : undefined);
const errors = [];
const incoming = rows.map((r, i) => {
  const city = cityCode(r[col("city")] ?? ""), zh = r[col("name_zh")], collection = r[col("collection")];
  const stars = num(r[col("stars")]), tier = r[col("tier")], rating = num(r[col("rating")]), cny = num(r[col("cny")]);
  if (!city) errors.push(`row ${i + 2}: unknown city "${r[col("city")]}"`);
  if (!zh) errors.push(`row ${i + 2}: empty name_zh`);
  if (!COLLECTIONS.includes(collection)) errors.push(`row ${i + 2}: collection "${collection}" must be local|trending|both`);
  if (stars && ![3, 4, 5].includes(stars)) errors.push(`row ${i + 2}: stars must be 3|4|5`);
  if (tier && !TIERS.includes(tier)) errors.push(`row ${i + 2}: tier "${tier}" not valid`);
  if (rating && (rating < 0 || rating > 10)) errors.push(`row ${i + 2}: rating out of range`);
  return {
    city, zh, en: r[col("name_en")] || undefined, brand: r[col("brand")] || undefined,
    stars, tier, collection, reason_en: r[col("reason_en")] || undefined, evidence: r[col("evidence")] || undefined,
    rating, cny, address: r[col("address")] || undefined, location: r[col("location")] || undefined,
  };
});
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }

// Replace this city's entries with the incoming rows (idempotent), keep other cities.
const others = data.hotels.filter((h) => !incoming.some((n) => n.city === h.city));
const valid = incoming.filter((n) => n.city);
data.hotels = [...others, ...valid].sort((a, b) => (a.city || "").localeCompare(b.city || "") || a.zh.localeCompare(b.zh, "zh"));
data.checked = opt.checked;
await writeFile(path, JSON.stringify(data, null, 2) + "\n");
console.log(`${valid.length} hotels merged · ${data.hotels.length} total in hotel-seeds.json`);
