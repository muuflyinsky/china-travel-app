#!/usr/bin/env node
// Compares two recorded runs of the dish-list prompt (scripts/eval-dishes.mjs) on the 72-dish
// allergen test set. Fails when the candidate leaks something the baseline didn't, or misses dishes.
// Workflow: .claude/skills/dish-prompt-eval/SKILL.md
//
//   node scripts/compare-dish-evals.mjs <baseline.json> <candidate.json> [--md report.md]
import { readFile, writeFile } from "node:fs/promises";
import { appLogic, loadTests, score } from "./lib/allergen-eval.mjs";

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
  ...(b.missing.length ? [`## Not answered by the candidate`, ...b.missing.map((m) => `- ${m}`), ``] : []),
  `## Dish names that changed (${changedNames.length}) — check by hand`,
  `| id | 中文 | test set English | baseline | candidate |`, `|---|---|---|---|---|`,
  ...changedNames.map((n) => `| ${n.join(" | ")} |`), ``,
  `Verdict: ${newLeaks.length || b.missing.length ? "**FAIL** — the candidate leaks what the baseline didn't, or misses dishes. Re-run the listed dishes (--ids) to rule out noise before deciding." : "no new leaks; the allergen-safety review and the name check still decide."}`,
].join("\n");

console.log(md);
if (mdAt > 0) { await writeFile(process.argv[mdAt + 1], md + "\n"); console.log(`\nreport written to ${process.argv[mdAt + 1]}`); }
if (newLeaks.length || b.missing.length) process.exit(1);
