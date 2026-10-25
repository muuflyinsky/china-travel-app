#!/usr/bin/env node
// Allergen regression (review R6): the 72-dish test set from the 2026-10-25 safety review,
// answered by stored model output, through the app's own word list (lib/ingredients.ts) and
// verdict (lib/verdict.ts). No model or network calls, so it runs anywhere in a second.
//
//   node scripts/check-allergens.mjs            # fails on a leak not in known-leaks.json
//   node scripts/check-allergens.mjs --strict   # fails on any leak (the bar for lifting the veto)
//   node scripts/check-allergens.mjs --write-known   # rewrite known-leaks.json from this run
//
// A leak is a dish the standard recipe says contains something ("D" in testset.csv) that the
// app answers "ok" for, or, with a severe allergy, anything but "don't order".
// It checks what the app does with the model's answer, not the model: new model output
// (scripts-run.py in the review assets) has to be saved here to test that.
import { readFile, writeFile } from "node:fs/promises";

const dir = new URL("../eval/allergens/", import.meta.url);
let createJiti;
try { ({ createJiti } = await import("jiti")); } catch { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); }
const jiti = createJiti(import.meta.url);
const { verdict } = await jiti.import(new URL("../lib/verdict.ts", import.meta.url).pathname);
const { tighten } = await jiti.import(new URL("../lib/ingredients.ts", import.meta.url).pathname);

function parseCsv(text) {
  const rows = [];
  let row = [], cell = "", q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell.replace(/\r$/, "")); rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const [head, ...body] = rows;
  return body.filter((r) => r.some(Boolean)).map((r) => Object.fromEntries(head.map((h, i) => [h.replace(/^﻿/, ""), r[i] ?? ""])));
}

const tests = parseCsv(await readFile(new URL("testset.csv", dir), "utf8"));
const output = JSON.parse(await readFile(new URL("model-output-2026-10-25.json", dir), "utf8"));
const known = new Set(JSON.parse(await readFile(new URL("known-leaks.json", dir), "utf8").catch(() => "[]")));

const ALLERGENS = ["peanut", "crustacean", "sesame", "soy", "gluten", "egg", "fish", "mollusc", "tree_nut", "milk", "celery", "mustard", "sulphites", "lupin"];
const DIETS = ["vegetarian", "vegan", "no_pork", "halal", "no_beef", "no_spicy", "no_alcohol"];
const words = (s) => new Set(s.split(/\s+/).filter(Boolean));

/** Truth for one diet: D = the standard recipe breaks it. Same rules as the review's score.py. */
function dietTruth(t, diet) {
  const meat = words(t.meat_D), alc = t["alcohol(D/H/N)"], spice = Number(t["spice0-3"]);
  if (diet === "vegetarian") return t.vegetarian !== "True" ? "D" : "N";
  if (diet === "vegan") return t.vegan !== "True" ? "D" : "N";
  if (diet === "no_pork") return meat.has("pork") ? "D" : "N";
  if (diet === "no_beef") return meat.has("beef") ? "D" : "N";
  if (diet === "halal") return meat.has("pork") || alc === "D" || [...meat].some((m) => m !== "fish" && m !== "seafood") ? "D" : "N";
  if (diet === "no_alcohol") return alc === "D" ? "D" : "N";
  if (diet === "no_spicy") return spice >= 2 ? "D" : "N";
}

const leaks = [], seen = { ok: 0, ask: 0, no: 0 };
let checked = 0;
for (const t of tests) {
  const raw = output[t.id];
  if (!raw) continue;
  const dish = tighten({ ...raw, zh: t.dish_zh });
  const D = words(t.allergens_D_standard);
  for (const a of ALLERGENS) {
    if (!D.has(a)) continue;
    for (const severe of [false, true]) {
      const v = verdict(dish, { allergens: [a], diets: [], severe: severe ? [a] : [] });
      checked++; seen[v.kind]++;
      if (v.kind === "ok" || (severe && v.kind !== "no")) leaks.push(`${t.dish_zh} · ${a}${severe ? " (severe)" : ""} → ${v.kind}`);
    }
  }
  for (const diet of DIETS) {
    if (dietTruth(t, diet) !== "D") continue;
    const v = verdict(dish, { allergens: [], diets: [diet], severe: [] });
    checked++; seen[v.kind]++;
    if (v.kind === "ok") leaks.push(`${t.dish_zh} · ${diet} → ok`);
  }
}

if (process.argv.includes("--write-known")) {
  await writeFile(new URL("known-leaks.json", dir), JSON.stringify(leaks.sort(), null, 1) + "\n");
  console.log(`known-leaks.json: ${leaks.length} leaks written`);
  process.exit(0);
}
const fresh = leaks.filter((l) => !known.has(l));
const fixed = [...known].filter((l) => !leaks.includes(l));
console.log(`allergen check: ${checked} answers where the recipe contains it · ok ${seen.ok} · ask ${seen.ask} · no ${seen.no} · leaks ${leaks.length} (known ${leaks.length - fresh.length}, new ${fresh.length})`);
for (const l of fresh) console.log(`  NEW LEAK  ${l}`);
if (fixed.length) console.log(`  fixed since known-leaks.json (run --write-known): ${fixed.join("; ")}`);
if (process.argv.includes("--strict") ? leaks.length : fresh.length) {
  if (process.argv.includes("--strict")) for (const l of leaks.filter((l) => known.has(l))) console.log(`  leak      ${l}`);
  process.exit(1);
}
