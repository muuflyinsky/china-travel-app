#!/usr/bin/env node
// Copies lib/data/restaurant-awards.json (built by scripts/import-awards.mjs) into the Supabase
// tables from supabase/migrations/0004_restaurant_awards.sql, which the app reads. The database
// then matches the file: restaurants missing from the file are deleted, awards are replaced.
//
//   SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node scripts/sync-awards.mjs
//   node scripts/sync-awards.mjs --sql > awards.sql   # one transaction, for the SQL editor
import { readFile } from "node:fs/promises";

const root = new URL("..", import.meta.url);
const data = JSON.parse(await readFile(new URL("lib/data/restaurant-awards.json", root), "utf8"));
const cities = JSON.parse(await readFile(new URL("lib/data/cities.json", root), "utf8"));
const cityName = (a) => cities.find((c) => c.a === a)?.s ?? null;

const lists = Object.entries(data.lists).map(([list, m]) => ({ list, name: m.name, edition: m.edition || "", source: m.source || null, checked: m.checked || null }));
const restaurants = data.restaurants.map((r) => ({ city: r.city, city_name: cityName(r.city), name_zh: r.zh, name_en: r.en ?? null, cuisine: r.cuisine ?? null }));
const awards = data.restaurants.flatMap((r) => r.awards.map((a) => ({ city: r.city, name_zh: r.zh, ...a })));

if (process.argv.includes("--sql")) {
  const q = (v) => (v === null || v === undefined ? "null" : `'${String(v).replace(/'/g, "''")}'`);
  const rows = (xs, cols) => xs.map((x) => `(${cols.map((c) => q(x[c])).join(", ")})`).join(",\n");
  console.log(`begin;
insert into award_lists (list, name, edition, source, checked) values
${rows(lists, ["list", "name", "edition", "source", "checked"])}
on conflict (list) do update set name = excluded.name, edition = excluded.edition, source = excluded.source, checked = excluded.checked;
create temp table incoming (city text, city_name text, name_zh text, name_en text, cuisine text) on commit drop;
insert into incoming values
${rows(restaurants, ["city", "city_name", "name_zh", "name_en", "cuisine"])};
delete from restaurants r where not exists (select 1 from incoming i where i.city = r.city and i.name_zh = r.name_zh);
insert into restaurants (city, city_name, name_zh, name_en, cuisine) select * from incoming
on conflict (city, name_zh) do update set city_name = excluded.city_name, name_en = excluded.name_en, cuisine = excluded.cuisine, updated_at = now();
create temp table incoming_awards (city text, name_zh text, list text, level text, edition text) on commit drop;
insert into incoming_awards values
${rows(awards, ["city", "name_zh", "list", "level", "edition"])};
delete from restaurant_awards;
insert into restaurant_awards (restaurant_id, list, level, edition)
select r.id, a.list, a.level, a.edition from incoming_awards a join restaurants r on r.city = a.city and r.name_zh = a.name_zh;
commit;`);
  process.exit(0);
}

const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, ""), key = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();
if (!url || !key) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, or use --sql."); process.exit(1); }
async function rest(path, method, body, prefer = "return=minimal") {
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method, body: body && JSON.stringify(body),
    headers: { apikey: key, authorization: `Bearer ${key}`, "content-type": "application/json", prefer },
  });
  if (!res.ok) throw new Error(`${method} ${path.split("?")[0]} ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return prefer.includes("representation") ? res.json() : null;
}

await rest("award_lists?on_conflict=list", "POST", lists, "resolution=merge-duplicates,return=minimal");
const saved = await rest("restaurants?on_conflict=city,name_zh&select=id,city,name_zh", "POST",
  restaurants.map((r) => ({ ...r, updated_at: new Date().toISOString() })), "resolution=merge-duplicates,return=representation");
const id = new Map(saved.map((r) => [`${r.city}:${r.name_zh}`, r.id]));
await rest(`restaurants?id=not.in.(${saved.map((r) => r.id).join(",")})`, "DELETE");
await rest("restaurant_awards?restaurant_id=gt.0", "DELETE");
await rest("restaurant_awards", "POST", awards.map((a) => ({ restaurant_id: id.get(`${a.city}:${a.name_zh}`), list: a.list, level: a.level, edition: a.edition })));
console.log(`${saved.length} restaurants · ${awards.length} awards · lists: ${lists.map((l) => `${l.list} ${l.edition || "–"}`).join(", ")}`);
