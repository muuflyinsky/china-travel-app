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
// It checks what the app does with the model's answer, not the model: to test a prompt or model
// change, record a new run with scripts/eval-dishes.mjs (see .claude/skills/dish-prompt-eval).
//   node scripts/check-allergens.mjs --output eval/allergens/model-output-<run>.json
//                                               # same check on another saved run (scripts/eval-dishes.mjs)
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { EVAL_DIR, appLogic, loadTests, score } from "./lib/allergen-eval.mjs";

const dir = EVAL_DIR;
const { verdict, withDetailAllergens, tighten } = await appLogic();
const at = process.argv.indexOf("--output");
const outputFile = at > 0 ? resolve(process.argv[at + 1]) : new URL("model-output-2026-10-25.json", dir);

const tests = await loadTests();
const output = JSON.parse(await readFile(outputFile, "utf8"));
const known = new Set(JSON.parse(await readFile(new URL("known-leaks.json", dir), "utf8").catch(() => "[]")));
const { checked, seen, leaks, missing } = score(tests, output, { verdict, tighten });
if (missing.length) console.log(`  no answer for ${missing.length} dishes: ${missing.join("、")}`);
// known-leaks.json describes the run CI checks; a candidate run must never rewrite it.
if (at > 0 && process.argv.includes("--write-known")) { console.log("--write-known only works on the default run"); process.exit(1); }

// Dish details merged into a list answer only ever make it stricter (withDetailAllergens).
const base = { zh: "宫保鸡丁", pinyin: "", price: "", name: "Kung Pao Chicken", short: "", spice: 1, vegetarian: false, meat: ["chicken"], alcohol: false, confidence: "high" };
const peanutGarnish = { id: "peanut", role: "garnish", via: "peanuts", via_zh: "花生" };
const detailCases = [
  // The list says 花生 is a garnish; the detail says it's a main ingredient → don't order.
  ["garnish → main", { ...base, allergens: [peanutGarnish] }, [{ zh: "花生", name: "peanuts", role: "main", allergens: ["peanut"] }], "no"],
  // Same, but the detail forgot the allergen id: the word list still makes 花生 a main ingredient.
  ["garnish → main (word list)", { ...base, allergens: [peanutGarnish] }, [{ zh: "花生米", name: "peanuts", role: "main", allergens: [] }], "no"],
  // Same ingredient, detail says sauce: nothing new, still one "leave it out".
  ["same ingredient, not main", { ...base, allergens: [peanutGarnish] }, [{ zh: "花生", name: "peanuts", role: "sauce", allergens: ["peanut"] }], "ask"],
  // Already main: a sauce mention can't make it look removable.
  ["main stays main", { ...base, allergens: [{ ...peanutGarnish, role: "main" }] }, [{ zh: "花生酱", name: "peanut sauce", role: "sauce", allergens: ["peanut"] }], "no"],
  // An allergen the list missed, in a sauce → ask first, not ok.
  ["new allergen in sauce", { ...base, allergens: [] }, [{ zh: "花生酱", name: "peanut sauce", role: "sauce", allergens: ["peanut"] }], "ask"],
];
let detailFails = 0;
for (const [name, dish, ings, want] of detailCases) {
  const v = verdict(withDetailAllergens(dish, ings), { allergens: ["peanut"], diets: [], severe: [] });
  // "Don't order" must also take away "add, without peanuts".
  const ok = v.kind === want && (want !== "no" || v.removable.length === 0) && (want !== "ask" || v.removable.length === 1);
  if (!ok) { detailFails++; console.log(`  DETAIL MERGE  ${name}: ${v.kind} (removable ${v.removable.length}), expected ${want}`); }
}

// Never rewrite the known leaks while a detail-merge case fails.
if (process.argv.includes("--write-known") && detailFails) { console.log(`detail merge: ${detailCases.length - detailFails}/${detailCases.length} ok — fix before --write-known`); process.exit(1); }
if (process.argv.includes("--write-known")) {
  await writeFile(new URL("known-leaks.json", dir), JSON.stringify(leaks.sort(), null, 1) + "\n");
  console.log(`known-leaks.json: ${leaks.length} leaks written`);
  process.exit(0);
}
const fresh = leaks.filter((l) => !known.has(l));
const fixed = [...known].filter((l) => !leaks.includes(l));
console.log(`detail merge: ${detailCases.length - detailFails}/${detailCases.length} ok`);
console.log(`allergen check: ${checked} answers where the recipe contains it · ok ${seen.ok} · ask ${seen.ask} · no ${seen.no} · leaks ${leaks.length} (known ${leaks.length - fresh.length}, new ${fresh.length})`);
for (const l of fresh) console.log(`  NEW LEAK  ${l}`);
if (fixed.length) console.log(`  fixed since known-leaks.json (run --write-known): ${fixed.join("; ")}`);
// A saved run with dishes missing can't be called clean: unanswered dishes aren't scored at all.
if (detailFails || (at > 0 && missing.length) || (process.argv.includes("--strict") ? leaks.length : fresh.length)) {
  if (process.argv.includes("--strict")) for (const l of leaks.filter((l) => known.has(l))) console.log(`  leak      ${l}`);
  process.exit(1);
}
