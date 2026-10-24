#!/usr/bin/env node
// The other direction from scripts/sync-awards.mjs: writes the award tables in Supabase back to
// lib/data/restaurant-awards.json, the bundled fallback. Run it after editing restaurants in the
// Supabase dashboard; otherwise the next sync-awards run (which makes the database match the
// file, deleting what the file lacks) would undo those edits.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/export-awards.mjs
//   … node scripts/export-awards.mjs --duplicates data/award-duplicates.csv
//
// The file keeps import-awards.mjs's shape and order (city, then name in Chinese collation), so
// a run with no database changes leaves it byte-identical. --duplicates also writes a CSV of
// restaurant pairs in the same city that look like one place listed twice (usually because two
// guides spell the branch differently). It never merges anything: fill in the `decision` column
// and fix the rows in Supabase yourself.
import { readFile, writeFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const out = new URL("lib/data/restaurant-awards.json", root);
const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
// Reads only: the service role key, or an anon/publishable key while the tables allow public reads.
const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || "").trim();
if (!url || !key) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY)."); process.exit(1); }
const dupArg = process.argv.indexOf("--duplicates");
const dupPath = dupArg > 0 ? process.argv[dupArg + 1] : null;

/** Every row of a table, 1000 at a time (PostgREST's default page cap). */
async function all(path) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers: { apikey: key, authorization: `Bearer ${key}`, range: `${from}-${from + 999}` } });
    if (!res.ok) throw new Error(`GET ${path.split("?")[0]} ${res.status}: ${(await res.text()).slice(0, 300)}`);
    const page = await res.json();
    rows.push(...page);
    if (page.length < 1000) return rows;
  }
}

const [lists, restaurants, awards] = await Promise.all([
  all("award_lists?select=list,name,edition,source,checked&order=list"),
  all("restaurants?select=id,city,name_zh,name_en,cuisine&order=id"),
  all("restaurant_awards?select=restaurant_id,list,level,edition&order=restaurant_id"),
]);

// Lists in the file's existing order, with the file's empty-string convention for missing values.
const prev = JSON.parse(await readFile(out, "utf8"));
const LIST_ORDER = ["michelin", "black_pearl", "dianping"];
const byList = new Map(lists.map((l) => [l.list, l]));
const outLists = {};
for (const id of [...new Set([...Object.keys(prev.lists), ...LIST_ORDER, ...byList.keys()])]) {
  const l = byList.get(id);
  if (!l) continue;
  outLists[id] = { name: l.name, edition: l.edition ?? "", source: l.source ?? "", checked: l.checked ?? "" };
}

const awardsOf = new Map();
for (const a of awards) {
  if (!awardsOf.has(a.restaurant_id)) awardsOf.set(a.restaurant_id, []);
  awardsOf.get(a.restaurant_id).push({ list: a.list, level: a.level, edition: a.edition });
}
const rows = restaurants.map((r) => {
  const x = { city: r.city, zh: r.name_zh, awards: (awardsOf.get(r.id) ?? []).sort((a, b) => LIST_ORDER.indexOf(a.list) - LIST_ORDER.indexOf(b.list)) };
  if (r.name_en) x.en = r.name_en;
  if (r.cuisine) x.cuisine = r.cuisine;
  return { id: r.id, x };
});
const noAward = rows.filter((r) => !r.x.awards.length);
const outRestaurants = rows.filter((r) => r.x.awards.length).map((r) => r.x)
  .sort((a, b) => a.city.localeCompare(b.city) || a.zh.localeCompare(b.zh, "zh"));

const text = JSON.stringify({ lists: outLists, restaurants: outRestaurants }, null, 2) + "\n";
const before = await readFile(out, "utf8");
await writeFile(out, text);
console.log(`${outRestaurants.length} restaurants · ${awards.length} awards · lists: ${Object.entries(outLists).map(([k, l]) => `${k} ${l.edition || "–"}`).join(", ")}`);
console.log(before === text ? "restaurant-awards.json unchanged" : "restaurant-awards.json updated — review with git diff");
if (noAward.length) console.warn(`skipped ${noAward.length} restaurants with no award: ${noAward.slice(0, 5).map((r) => r.x.zh).join(", ")}${noAward.length > 5 ? " …" : ""}`);

if (dupPath) {
  // Brand: the name before the branch brackets, without a "·tagline" or a generic suffix; a
  // leading descriptor ("清真·老毛手抓") is skipped so it doesn't pair unrelated restaurants.
  // Branch: without generic words, so "建国门外大街" and "金融大街" don't match on "大街".
  const norm = (s) => s.replace(/\s+/g, "").replace(/（/g, "(").replace(/）/g, ")");
  const DESCRIPTORS = /^(清真|老字号|非遗)$/;
  const parts = (name) => {
    const n = norm(name), m = n.match(/^(.*?)\((.*)\)$/);
    const segs = (m ? m[1] : n).split("·").filter(Boolean);
    const brand = (segs.find((x) => !DESCRIPTORS.test(x)) ?? segs[0] ?? "").replace(/(餐厅|饭店|饭庄|酒家|酒楼|餐馆|菜馆)$/, "");
    const branch = (m?.[2] ?? "").replace(/(总店|分店|店|大街|东路|西路|南路|北路|路|街|广场|中心|小区)/g, "");
    return { brand, branch };
  };
  // Branches that share a run of 2+ characters ("肇嘉浜店" / "肇嘉浜路") probably name the same place.
  const overlap = (a, b) => { for (let i = 0; i + 2 <= a.length; i++) if (b.includes(a.slice(i, i + 2))) return true; return false; };
  const label = (aw) => aw.map((a) => `${a.list}:${a.level}`).join(" + ");
  const pairs = [];
  const byCity = Map.groupBy ? Map.groupBy(outRestaurants, (r) => r.city) : outRestaurants.reduce((m, r) => m.set(r.city, [...(m.get(r.city) ?? []), r]), new Map());
  for (const [, list] of byCity) {
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j], pa = parts(a.zh), pb = parts(b.zh);
      if (pa.brand.length < 2 || pa.brand !== pb.brand) continue;
      const lists = new Set([...a.awards, ...b.awards].map((x) => x.list));
      const shared = a.awards.some((x) => b.awards.some((y) => y.list === x.list));
      let likely, why;
      if (!shared && (!pa.branch || !pb.branch || overlap(pa.branch, pb.branch))) { likely = "same"; why = "different guides; branch missing or similar"; }
      else if (!shared) { likely = "check"; why = "different guides; branches differ"; }
      // The same guide naming two distinct branches is the guide saying they are two restaurants.
      else if (pa.branch && pb.branch && !overlap(pa.branch, pb.branch)) continue;
      else { likely = "check"; why = "same guide; branch missing or similar"; }
      pairs.push({ city: a.city, a: a.zh, a_awards: label(a.awards), b: b.zh, b_awards: label(b.awards), likely, why, lists: lists.size });
    }
  }
  const rank = { same: 0, check: 1 };
  pairs.sort((x, y) => rank[x.likely] - rank[y.likely] || x.city.localeCompare(y.city) || x.a.localeCompare(y.a, "zh"));
  const cities = JSON.parse(await readFile(new URL("lib/data/cities.json", root), "utf8"));
  const cityName = (a) => cities.find((c) => c.a === a)?.s ?? a;
  const q = (v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const csv = ["city,name_a,awards_a,name_b,awards_b,likely,why,decision",
    ...pairs.map((p) => [cityName(p.city), p.a, p.a_awards, p.b, p.b_awards, p.likely, p.why, ""].map(q).join(","))].join("\n") + "\n";
  await writeFile(dupPath, "﻿" + csv); // BOM so Excel/Numbers open the Chinese correctly
  const n = (k) => pairs.filter((p) => p.likely === k).length;
  console.log(`${pairs.length} pairs to review → ${dupPath} (likely same ${n("same")} · check ${n("check")})`);
}
