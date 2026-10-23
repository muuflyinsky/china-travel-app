#!/usr/bin/env node
// Allergen check on real menus: sends each photo to /api/menu and compares the allergens the
// model reports with the ones you expect. Missed allergens (false negatives) are what matter.
// Each matched dish must also have a translated name, pinyin and at least 3 ingredients.
//
//   node scripts/eval-menus.mjs http://localhost:3000 eval/menus
//
// eval/menus/ holds the photos (jpg/png) and expected.csv:
//   file,dish,allergens
//   sichuan-1.jpg,宫保鸡丁,peanut;soy;gluten
//   handwritten-2.jpg,葱油拌面,gluten;soy
// Allergen ids: see lib/allergens.ts. Results go to eval/menus/report-<date>.csv.
import { readFile, readdir, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";

const [base = "http://localhost:3000", dir = "eval/menus"] = process.argv.slice(2);
const expected = (await readFile(join(dir, "expected.csv"), "utf8")).trim().split(/\r?\n/).slice(1).map((l) => {
  const [file, dish, allergens = ""] = l.split(",");
  return { file, dish: dish.trim(), allergens: allergens.split(";").map((a) => a.trim()).filter(Boolean) };
});
const files = [...new Set(expected.map((e) => e.file))];
const known = new Set(await readdir(dir));
const rows = [["file", "dish", "found", "translated", "pinyin", "ingredients", "complete", "expected", "reported", "missed", "extra"]];
let missed = 0, notFound = 0, failed = 0, incomplete = 0;

for (const file of files) {
  if (!known.has(file)) { console.error(`✗ ${file}: not in ${dir}`); failed++; continue; }
  const image = (await readFile(join(dir, file))).toString("base64");
  const mediaType = extname(file).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const t0 = Date.now();
  const res = await fetch(`${base}/api/menu`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image, mediaType, lang: "en" }) });
  if (!res.ok) { console.error(`✗ ${file}: ${(await res.json().catch(() => ({}))).error ?? res.status}`); failed++; continue; }
  // NDJSON stream: one dish per line. Ingredients come from /api/dish (the detail view).
  const events = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
  if (events.some((e) => e.type === "demo")) { console.error(`✗ ${file}: app is on sample data`); failed++; continue; }
  const list = events.filter((e) => e.type === "dish").map((e) => e.dish);
  console.log(`  ${file}: ${list.length} dishes in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  const menu = { dishes: [] };
  for (const d of list) {
    const det = await fetch(`${base}/api/dish`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ zh: d.zh, printed: d.printed, lang: "en" }) }).then((r) => r.json()).catch(() => ({}));
    const allergens = [...new Set([...d.allergens.map((a) => a.id), ...(det.ingredients ?? []).flatMap((i) => i.allergens)])];
    menu.dishes.push({ original: d.zh, translated: d.name, pinyin: d.pinyin, ingredients: det.ingredients ?? [], allergens });
  }
  for (const e of expected.filter((x) => x.file === file)) {
    const d = menu.dishes.find((x) => x.original.includes(e.dish) || e.dish.includes(x.original));
    const got = d?.allergens ?? [];
    const miss = e.allergens.filter((a) => !got.includes(a));
    const extra = got.filter((a) => !e.allergens.includes(a));
    // Completeness: a dish the traveller can't name or check isn't useful even if allergens match.
    const gaps = d ? [!d.translated?.trim() && "name", !d.pinyin?.trim() && "pinyin", (d.ingredients?.length ?? 0) < 3 && "ingredients<3"].filter(Boolean) : [];
    if (!d) notFound++;
    if (gaps.length) incomplete++;
    missed += miss.length;
    const cell = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
    rows.push([file, e.dish, d ? "yes" : "no", cell(d?.translated), cell(d?.pinyin), d?.ingredients?.length ?? 0, gaps.length ? gaps.join(";") : d ? "yes" : "",
      e.allergens.join(";"), got.join(";"), miss.join(";"), extra.join(";")]);
    console.log(`${d ? (miss.length || gaps.length ? "!" : "✓") : "?"} ${file} · ${e.dish}${miss.length ? ` · missed: ${miss.join(", ")}` : ""}${gaps.length ? ` · missing: ${gaps.join(", ")}` : ""}${d ? "" : " · dish not found"}`);
  }
}
const out = join(dir, `report-${new Date().toISOString().slice(0, 10)}.csv`);
await writeFile(out, rows.map((r) => r.join(",")).join("\n") + "\n");
console.log(`\n${expected.length} dishes · ${missed} missed allergens · ${incomplete} incomplete (name/pinyin/≥3 ingredients) · ${notFound} dishes not found · ${failed} menus failed\nReport: ${out}`);
