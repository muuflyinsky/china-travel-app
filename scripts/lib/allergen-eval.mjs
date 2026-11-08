// Shared by scripts/check-allergens.mjs (CI gate) and scripts/compare-dish-evals.mjs (prompt
// evaluation): the 72-dish test set from the 2026-10-25 safety review and how a stored model
// answer is scored through the app's own word list (lib/ingredients.ts) and verdict (lib/verdict.ts).
import { readFile } from "node:fs/promises";

export const EVAL_DIR = new URL("../../eval/allergens/", import.meta.url);

export const ALLERGENS = ["peanut", "crustacean", "sesame", "soy", "gluten", "egg", "fish", "mollusc", "tree_nut", "milk", "celery", "mustard", "sulphites", "lupin"];
export const DIETS = ["vegetarian", "vegan", "no_pork", "halal", "no_beef", "no_spicy", "no_alcohol"];
export const words = (s) => new Set(String(s ?? "").split(/\s+/).filter(Boolean));

export function parseCsv(text) {
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

const COLUMNS = ["id", "dish_zh", "english", "test_adcode", "allergens_D_standard", "allergens_H_hidden", "meat_D", "vegetarian", "vegan", "alcohol(D/H/N)", "spice0-3"];

/** A renamed column would silently score as "this dish has none of it", so it stops the run instead. */
export async function loadTests() {
  const tests = parseCsv(await readFile(new URL("testset.csv", EVAL_DIR), "utf8"));
  const absent = COLUMNS.filter((c) => !(c in (tests[0] ?? {})));
  if (absent.length) throw new Error(`eval/allergens/testset.csv is missing columns: ${absent.join(", ")}`);
  return tests;
}

/** Truth for one diet: D = the standard recipe breaks it. Same rules as the review's score.py. */
export function dietTruth(t, diet) {
  const meat = words(t.meat_D), alc = t["alcohol(D/H/N)"], spice = Number(t["spice0-3"]);
  if (diet === "vegetarian") return t.vegetarian !== "True" ? "D" : "N";
  if (diet === "vegan") return t.vegan !== "True" ? "D" : "N";
  if (diet === "no_pork") return meat.has("pork") ? "D" : "N";
  if (diet === "no_beef") return meat.has("beef") ? "D" : "N";
  if (diet === "halal") return meat.has("pork") || alc === "D" || [...meat].some((m) => m !== "fish" && m !== "seafood") ? "D" : "N";
  if (diet === "no_alcohol") return alc === "D" ? "D" : "N";
  if (diet === "no_spicy") return spice >= 2 ? "D" : "N";
}

/** Loads lib/verdict.ts and lib/ingredients.ts through jiti (installed with the app's dev dependencies). */
export async function appLogic() {
  let createJiti;
  try { ({ createJiti } = await import("jiti")); } catch { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); }
  const jiti = createJiti(import.meta.url);
  const { verdict, withDetailAllergens } = await jiti.import(new URL("../../lib/verdict.ts", import.meta.url).pathname);
  const { tighten } = await jiti.import(new URL("../../lib/ingredients.ts", import.meta.url).pathname);
  return { verdict, withDetailAllergens, tighten, jiti };
}

/**
 * Scores one model output file (test id → list dish) against the test set.
 * leaks: the standard recipe contains it ("D") and the app says "ok", or anything but "no" with a severe allergy.
 * hidden: allergens that are only in common variants ("H"); caught = the app does not say "ok".
 * extra: allergens the model flagged that the test set has neither as D nor H (each costs the traveller a question).
 * checks: every verdict by name, so two runs can be compared dish by dish (a "no" becoming "ask" is not a leak but is a step back).
 */
export function score(tests, output, { verdict, tighten }) {
  const leaks = [], seen = { ok: 0, ask: 0, no: 0 }, missing = [], confidence = { high: 0, medium: 0, low: 0 }, checks = {};
  let checked = 0, hidden = 0, hiddenCaught = 0, extra = 0;
  for (const t of tests) {
    const raw = output[t.id];
    if (!raw) { missing.push(t.dish_zh); continue; }
    const dish = tighten({ ...raw, zh: t.dish_zh });
    confidence[dish.confidence] = (confidence[dish.confidence] ?? 0) + 1;
    const D = words(t.allergens_D_standard), H = words(t.allergens_H_hidden);
    for (const a of ALLERGENS) {
      if (D.has(a)) {
        for (const severe of [false, true]) {
          const v = verdict(dish, { allergens: [a], diets: [], severe: severe ? [a] : [] });
          checked++; seen[v.kind]++;
          const name = `${t.dish_zh} · ${a}${severe ? " (severe)" : ""}`;
          checks[name] = v.kind;
          if (v.kind === "ok" || (severe && v.kind !== "no")) leaks.push(`${name} → ${v.kind}`);
        }
      } else if (H.has(a)) {
        hidden++;
        const kind = verdict(dish, { allergens: [a], diets: [], severe: [] }).kind;
        checks[`${t.dish_zh} · ${a} (hidden)`] = kind;
        if (kind !== "ok") hiddenCaught++;
      }
    }
    for (const id of new Set((dish.allergens ?? []).map((x) => x.id))) if (ALLERGENS.includes(id) && !D.has(id) && !H.has(id)) extra++;
    for (const diet of DIETS) {
      if (dietTruth(t, diet) !== "D") continue;
      const v = verdict(dish, { allergens: [], diets: [diet], severe: [] });
      checked++; seen[v.kind]++;
      checks[`${t.dish_zh} · ${diet}`] = v.kind;
      if (v.kind === "ok") leaks.push(`${t.dish_zh} · ${diet} → ok`);
    }
  }
  return { checked, seen, leaks: leaks.sort(), missing, hidden, hiddenCaught, extra, confidence, checks };
}
