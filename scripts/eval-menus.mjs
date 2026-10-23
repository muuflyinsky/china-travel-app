#!/usr/bin/env node
// Allergen check on real menus: sends each photo to /api/menu and compares the allergens the
// model reports with the ones you expect. Missed allergens (false negatives) are what matter.
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
const rows = [["file", "dish", "found", "expected", "reported", "missed", "extra"]];
let missed = 0, notFound = 0, failed = 0;

for (const file of files) {
  if (!known.has(file)) { console.error(`✗ ${file}: not in ${dir}`); failed++; continue; }
  const image = (await readFile(join(dir, file))).toString("base64");
  const mediaType = extname(file).toLowerCase() === ".png" ? "image/png" : "image/jpeg";
  const res = await fetch(`${base}/api/menu`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ image, mediaType, lang: "en" }) });
  const menu = await res.json().catch(() => ({}));
  if (!res.ok || menu.demo) { console.error(`✗ ${file}: ${menu.error ?? (menu.demo ? "app is on sample data" : res.status)}`); failed++; continue; }
  for (const e of expected.filter((x) => x.file === file)) {
    const d = menu.dishes.find((x) => x.original.includes(e.dish) || e.dish.includes(x.original));
    const got = d?.allergens ?? [];
    const miss = e.allergens.filter((a) => !got.includes(a));
    const extra = got.filter((a) => !e.allergens.includes(a));
    if (!d) notFound++;
    missed += miss.length;
    rows.push([file, e.dish, d ? "yes" : "no", e.allergens.join(";"), got.join(";"), miss.join(";"), extra.join(";")]);
    console.log(`${d ? (miss.length ? "!" : "✓") : "?"} ${file} · ${e.dish}${miss.length ? ` · missed: ${miss.join(", ")}` : ""}${d ? "" : " · dish not found"}`);
  }
}
const out = join(dir, `report-${new Date().toISOString().slice(0, 10)}.csv`);
await writeFile(out, rows.map((r) => r.join(",")).join("\n") + "\n");
console.log(`\n${expected.length} dishes · ${missed} missed allergens · ${notFound} dishes not found · ${failed} menus failed\nReport: ${out}`);
