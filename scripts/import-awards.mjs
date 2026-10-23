#!/usr/bin/env node
// Imports one award list into lib/data/restaurant-awards.json from a CSV you compile from the
// official publication. A new edition replaces that list's previous entries; other lists stay.
//
//   node scripts/import-awards.mjs <file.csv> --list michelin --edition 2026 \
//        --source https://guide.michelin.com/... --checked 2026-10-23
//
// CSV columns (header row required; see scripts/awards-template.csv):
//   city      Chinese short name (上海) or adcode (310000)
//   name_zh   exactly as the guide lists it; include the branch in brackets when the guide names one
//   name_en   optional
//   cuisine   optional, Chinese (本帮菜, 粤菜 …)
//   level     michelin: 3 | 2 | 1 | bib | selected · black_pearl: 3 | 2 | 1 · dianping: must_eat
//
// Lists: michelin (MICHELIN Guide), black_pearl (黑珍珠餐厅指南), dianping (大众点评必吃榜).
// Only import what the publisher has made public, and check their terms before importing a whole
// list (see docs/SPEC.md §3.2.2).
import { readFile, writeFile } from "node:fs/promises";

const LEVELS = { michelin: ["3", "2", "1", "bib", "selected"], black_pearl: ["3", "2", "1"], dianping: ["must_eat"] };
const [file, ...rest] = process.argv.slice(2);
const opt = Object.fromEntries(rest.join(" ").split("--").filter(Boolean).map((s) => s.trim().split(/\s+/)).map(([k, ...v]) => [k, v.join(" ")]));
if (!file || !LEVELS[opt.list] || !opt.edition || !opt.checked) {
  console.error("usage: import-awards.mjs <file.csv> --list michelin|black_pearl|dianping --edition 2026 --checked YYYY-MM-DD [--source URL]");
  process.exit(1);
}

// Minimal CSV: commas, double-quoted fields allowed.
const parse = (text) => text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim()).map((line) => {
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
const path = new URL("lib/data/restaurant-awards.json", root);
const data = JSON.parse(await readFile(path, "utf8"));
const [head, ...rows] = parse(await readFile(file, "utf8"));
const col = (name) => head.indexOf(name);
for (const c of ["city", "name_zh", "level"]) if (col(c) < 0) { console.error(`missing column: ${c}`); process.exit(1); }

const cityCode = (v) => (/^\d{6}$/.test(v) ? v : cities.find((c) => c.s === v.replace(/市$/, "") && c.t !== "county")?.a);
const errors = [];
const incoming = rows.map((r, i) => {
  const city = cityCode(r[col("city")] ?? ""), zh = r[col("name_zh")], level = r[col("level")];
  if (!city) errors.push(`row ${i + 2}: unknown city "${r[col("city")]}"`);
  if (!zh) errors.push(`row ${i + 2}: empty name_zh`);
  if (!LEVELS[opt.list].includes(level)) errors.push(`row ${i + 2}: level "${level}" is not valid for ${opt.list}`);
  return { city, zh, en: r[col("name_en")] || undefined, cuisine: r[col("cuisine")] || undefined, level };
});
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }

// Drop this list's old entries, then merge the new edition by (city, name).
for (const r of data.restaurants) r.awards = r.awards.filter((a) => a.list !== opt.list);
for (const n of incoming) {
  let r = data.restaurants.find((x) => x.city === n.city && x.zh === n.zh);
  if (!r) data.restaurants.push(r = { city: n.city, zh: n.zh, awards: [] });
  if (n.en) r.en = n.en;
  if (n.cuisine) r.cuisine = n.cuisine;
  r.awards.push({ list: opt.list, level: n.level, edition: opt.edition });
}
data.restaurants = data.restaurants.filter((r) => r.awards.length).sort((a, b) => a.city.localeCompare(b.city) || a.zh.localeCompare(b.zh, "zh"));
data.lists[opt.list] = { ...data.lists[opt.list], edition: opt.edition, checked: opt.checked, ...(opt.source ? { source: opt.source } : {}) };
await writeFile(path, JSON.stringify(data, null, 2) + "\n");
console.log(`${opt.list} ${opt.edition}: ${incoming.length} entries · ${data.restaurants.length} restaurants in the file`);
