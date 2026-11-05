#!/usr/bin/env node
// Must-see lists (lib/must-see.ts): Supabase table `must_see` (supabase/migrations/0011) is the
// source Veer edits; lib/data/must-see.json is the bundled fallback the app uses when Supabase
// is unreachable. This script copies one to the other.
//
//   node scripts/sync-must-see.mjs --sql > must-see.sql   # JSON → SQL for the Supabase SQL editor (upsert, one transaction)
//   SUPABASE_URL=… SUPABASE_ANON_KEY=… node scripts/sync-must-see.mjs --pull   # Supabase → JSON (commit the result)
//
// --sql replaces every row of the cities in the file (rows of other cities are left alone) and
// writes reviewed_on / reviewed_by as the file has them. Careful: once Veer reviews in Supabase,
// the table is ahead of the file — run --pull first, or a stale file puts his reviews back to drafts.
import { readFile, writeFile } from "node:fs/promises";

const file = new URL("../lib/data/must-see.json", import.meta.url);
const data = JSON.parse(await readFile(file, "utf8"));

if (process.argv.includes("--pull")) {
  const url = (process.env.SUPABASE_URL ?? "").replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!url || !key) { console.error("SUPABASE_URL and a key must be set"); process.exit(1); }
  const res = await fetch(`${url}/rest/v1/must_see?select=*&order=city,ord`, { headers: { apikey: key } });
  if (!res.ok) { console.error(`supabase ${res.status}: ${await res.text()}`); process.exit(1); }
  const rows = await res.json();
  data.entries = rows.map((r) => ({
    city: r.city, ord: r.ord, zh: r.name_zh, en: r.name_en, why: r.why_en,
    ...(r.outside ? { outside: true } : {}),
    ...(r.centre_km != null ? { centreKm: r.centre_km } : {}),
    ...(r.centre_h != null ? { centreH: Number(r.centre_h) } : {}),
    sources: r.sources ?? [], reviewedOn: r.reviewed_on, reviewedBy: r.reviewed_by,
  }));
  await writeFile(file, JSON.stringify(data, null, 1) + "\n");
  console.log(`${rows.length} rows, ${rows.filter((r) => r.reviewed_on).length} reviewed → lib/data/must-see.json`);
  process.exit(0);
}

if (process.argv.includes("--sql")) {
  const q = (v) => (v === null || v === undefined ? "null" : typeof v === "number" || typeof v === "boolean" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
  const arr = (xs) => `array[${xs.map(q).join(", ")}]::text[]`;
  const cities = [...new Set(data.entries.map((e) => e.city))];
  const values = data.entries.map((e) => `(${[q(e.city), e.ord, q(e.zh), q(e.en), q(e.why), Boolean(e.outside), q(e.centreKm ?? null), q(e.centreH ?? null), arr(e.sources ?? []), q(e.reviewedOn), q(e.reviewedBy)].join(", ")})`);
  console.log(`begin;
delete from must_see where city in (${cities.map(q).join(", ")});
insert into must_see (city, ord, name_zh, name_en, why_en, outside, centre_km, centre_h, sources, reviewed_on, reviewed_by) values
${values.join(",\n")};
commit;`);
  process.exit(0);
}

console.error("usage: node scripts/sync-must-see.mjs --sql | --pull");
process.exit(1);
