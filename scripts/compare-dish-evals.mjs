#!/usr/bin/env node
// Compares two recorded runs of the dish-list prompt (scripts/eval-dishes.mjs) on the 72-dish
// allergen test set. Fails when the candidate leaks something the baseline didn't, misses dishes,
// answers any check less strictly than the baseline, loses a hidden allergen, or has a severe-allergy
// miss that isn't already in known-leaks.json.
// Workflow: .claude/skills/dish-prompt-eval/SKILL.md
//
//   node scripts/compare-dish-evals.mjs <baseline.json> <candidate.json> [--md report.md]
import { readFile, writeFile } from "node:fs/promises";
import { EVAL_DIR, appLogic, loadTests, score } from "./lib/allergen-eval.mjs";

const [baseFile, candFile] = process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && all[i - 1] !== "--md");
if (!baseFile || !candFile) { console.error("usage: node scripts/compare-dish-evals.mjs <baseline.json> <candidate.json> [--md report.md]"); process.exit(2); }
const mdAt = process.argv.indexOf("--md");

const logic = await appLogic();
const tests = await loadTests();
const load = async (f) => JSON.parse(await readFile(f, "utf8"));
const base = await load(baseFile), cand = await load(candFile);
const a = score(tests, base, logic), b = score(tests, cand, logic);

const label = (run, file) => run._meta ? `${run._meta.label} (${run._meta.model}, prompt ${run._meta.prompt_version}, ${run._meta.commit})` : file;
const pct = (x, n) => (n ? `${Math.round((100 * x) / n)}%` : "–");
const severeNotNo = (s) => s.leaks.filter((l) => l.includes("(severe)")).length;
const rows = [
  ["Leaks (recipe has it, app says ok / severe not \"don't order\")", a.leaks.length, b.leaks.length, "lower"],
  ["  of which severe allergy not \"don't order\"", severeNotNo(a), severeNotNo(b), "lower"],
  ["Hidden-variant allergens caught (H, not \"ok\")", `${a.hiddenCaught}/${a.hidden} ${pct(a.hiddenCaught, a.hidden)}`, `${b.hiddenCaught}/${b.hidden} ${pct(b.hiddenCaught, b.hidden)}`, "higher"],
  ["Extra allergens flagged (neither D nor H: one more question each)", a.extra, b.extra, "lower, never at the cost of leaks"],
  ["Dishes answered", tests.length - a.missing.length, tests.length - b.missing.length, `all ${tests.length}`],
  ["Confidence high / medium / low", `${a.confidence.high}/${a.confidence.medium}/${a.confidence.low}`, `${b.confidence.high}/${b.confidence.medium}/${b.confidence.low}`, "low only for unclear names"],
  ["Verdicts ok / ask / no (where the recipe has it)", `${a.seen.ok}/${a.seen.ask}/${a.seen.no}`, `${b.seen.ok}/${b.seen.ask}/${b.seen.no}`, ""],
];
const newLeaks = b.leaks.filter((l) => !a.leaks.includes(l));
const fixed = a.leaks.filter((l) => !b.leaks.includes(l));

// Step backs that are not leaks: "don't order" becoming "ask first" also offers "without X" on a main ingredient.
const RANK = { ok: 0, ask: 1, no: 2 };
const isHidden = (k) => k.endsWith(" (hidden)");
const stepBacks = Object.keys(a.checks).filter((k) => k in b.checks && RANK[b.checks[k]] < RANK[a.checks[k]]);
const hiddenLost = stepBacks.filter((k) => isHidden(k) && b.checks[k] === "ok").map((k) => `${k}: ${a.checks[k]} → ok`);
const loosened = stepBacks.filter((k) => !isHidden(k) && !newLeaks.includes(`${k} → ${b.checks[k]}`)).map((k) => `${k}: ${a.checks[k]} → ${b.checks[k]}`);

// The severe-allergy misses already recorded may stay until they are fixed; the list may not grow.
const known = new Set(JSON.parse(await readFile(new URL("known-leaks.json", EVAL_DIR), "utf8")));
const severe = b.leaks.filter((l) => l.includes("(severe)"));
const knownSevere = severe.filter((l) => known.has(l)), unknownSevere = severe.filter((l) => !known.has(l));

// Runs are only comparable in the same language and close together (SKILL.md, "Before running").
const metaProblems = [];
if (base._meta && cand._meta) {
  if (base._meta.lang !== cand._meta.lang) metaProblems.push(`different languages: ${base._meta.lang} and ${cand._meta.lang}`);
  const days = Math.abs(new Date(base._meta.date) - new Date(cand._meta.date)) / 86400000;
  if (days > 2) metaProblems.push(`recorded ${Math.round(days)} days apart`);
}
const failed = newLeaks.length || b.missing.length || loosened.length || hiddenLost.length || unknownSevere.length || metaProblems.length;

// Names side by side, for the human spot check (the script can't judge translation quality).
const names = tests.filter((t) => base[t.id] || cand[t.id]).map((t) => [t.id, t.dish_zh, t.english, base[t.id]?.name ?? "–", cand[t.id]?.name ?? "–"]);
const changedNames = names.filter((n) => n[3] !== n[4]);

const md = [
  `# Dish prompt evaluation`, ``,
  `- Baseline: ${label(base, baseFile)}`, `- Candidate: ${label(cand, candFile)}`, `- Test set: ${tests.length} dishes (eval/allergens/testset.csv)`, ``,
  `| Metric | Baseline | Candidate | Better is |`, `|---|---|---|---|`,
  ...rows.map((r) => `| ${r.join(" | ")} |`), ``,
  `## New leaks in the candidate (${newLeaks.length})`, ...(newLeaks.length ? newLeaks.map((l) => `- ${l}`) : ["- none"]), ``,
  `## Leaks fixed by the candidate (${fixed.length})`, ...(fixed.length ? fixed.map((l) => `- ${l}`) : ["- none"]), ``,
  `## Less strict than the baseline (${loosened.length})`, ...(loosened.length ? loosened.map((l) => `- ${l}`) : ["- none"]), ``,
  `## Hidden allergens the candidate lost (${hiddenLost.length})`, ...(hiddenLost.length ? hiddenLost.map((l) => `- ${l}`) : ["- none"]), ``,
  `## Severe-allergy misses not in known-leaks.json (${unknownSevere.length})`, ...(unknownSevere.length ? unknownSevere.map((l) => `- ${l}`) : ["- none"]), ``,
  `## Known severe-allergy misses still present (${knownSevere.length}, may not grow)`, ...(knownSevere.length ? knownSevere.map((l) => `- ${l}`) : ["- none"]), ``,
  ...(metaProblems.length ? [`## These runs can't be compared`, ...metaProblems.map((m) => `- ${m}`), ``] : []),
  ...(b.missing.length ? [`## Not answered by the candidate`, ...b.missing.map((m) => `- ${m}`), ``] : []),
  `## Dish names that changed (${changedNames.length}) — check by hand`,
  `| id | 中文 | test set English | baseline | candidate |`, `|---|---|---|---|---|`,
  ...changedNames.map((n) => `| ${n.join(" | ")} |`), ``,
  `Verdict: ${failed ? "**FAIL** — see the sections above. Re-run the listed dishes (--ids) to rule out noise before deciding." : "no step back on safety; the allergen-safety review and the name check still decide."}`,
].join("\n");

console.log(md);
if (mdAt > 0) { await writeFile(process.argv[mdAt + 1], md + "\n"); console.log(`\nreport written to ${process.argv[mdAt + 1]}`); }
if (failed) process.exit(1);
