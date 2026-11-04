#!/usr/bin/env node
// Records one model run of the dish-list prompt (lib/dishes.ts generateFacts) over the 72-dish
// allergen test set, so a prompt or model change can be scored offline and compared with the
// run before it. Calls the configured model for real (AI_API_KEY, or ANTHROPIC_API_KEY), the same
// way /api/menu does, but never reads or writes the dish cache in Supabase.
// Workflow: .claude/skills/dish-prompt-eval/SKILL.md
//
//   node scripts/eval-dishes.mjs --label main             # → eval/allergens/runs/<date>-main.json
//   node scripts/eval-dishes.mjs --label v2 --ids 1,4,17  # only these test ids (re-checking a leak)
//   node scripts/eval-dishes.mjs --label v2 --lang fr     # answers in another language (default en)
//
// Reads .env.local (then .env) when present. Costs about 36 model calls for the full set.
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { loadTests } from "./lib/allergen-eval.mjs";

const arg = (name, fallback) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1] : fallback; };
const label = arg("label");
if (!label || !/^[\w.-]+$/.test(label)) { console.error("usage: node scripts/eval-dishes.mjs --label <name> [--ids 1,2] [--lang en]"); process.exit(2); }
const lang = arg("lang", "en");
const ids = arg("ids") ? new Set(arg("ids").split(",").map((x) => x.trim())) : null;

// The model settings must be in the environment before lib/config.ts is first imported.
for (const f of [".env.local", ".env"]) if (existsSync(f)) process.loadEnvFile(f);
// Never touch the shared dish cache from an evaluation run.
delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.SUPABASE_ANON_KEY;

const { createJiti } = await import("jiti").catch(() => { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); });
const jiti = createJiti(import.meta.url);
const { generateFacts } = await jiti.import(new URL("../lib/dishes.ts", import.meta.url).pathname);
const { currentModel } = await jiti.import(new URL("../lib/llm.ts", import.meta.url).pathname);
const { aiProvider, config } = await jiti.import(new URL("../lib/config.ts", import.meta.url).pathname);
const { PROMPT_VERSION } = await jiti.import(new URL("../lib/dish-cache.ts", import.meta.url).pathname);
const cities = (await jiti.import(new URL("../lib/data/cities.json", import.meta.url).pathname)).default;
if (!aiProvider) { console.error("no model configured: set AI_API_KEY (or ANTHROPIC_API_KEY) in .env.local"); process.exit(2); }

const tests = (await loadTests()).filter((t) => !ids || ids.has(t.id));
const cityOf = (adcode) => cities.find((c) => c.a === adcode)?.e;

// Same batching as /api/menu (lib/dishes.ts CHUNK = 2), dishes grouped by city so each call has one region.
const CHUNK = 2, PARALLEL = 6;
const groups = new Map();
for (const t of tests) { const c = cityOf(t.test_adcode) ?? ""; groups.set(c, [...(groups.get(c) ?? []), t]); }
const batches = [];
for (const [city, list] of groups) for (let k = 0; k < list.length; k += CHUNK) batches.push({ city, list: list.slice(k, k + CHUNK) });

const output = {}, failed = [];
const t0 = Date.now();
let next = 0;
async function worker() {
  while (next < batches.length) {
    const { city, list } = batches[next++];
    try {
      const out = await generateFacts(list.map((t) => ({ zh: t.dish_zh, printed: "" })), lang, city || undefined, false);
      for (const [j, t] of list.entries()) {
        const d = out.dishes.find((x) => x.zh.trim() === t.dish_zh) ?? out.dishes[j];
        if (d) output[t.id] = { ...d, zh: t.dish_zh, price: "" };
        else failed.push(`${t.id} ${t.dish_zh}: not in the answer`);
      }
    } catch (e) {
      for (const t of list) failed.push(`${t.id} ${t.dish_zh}: ${e.message.slice(0, 160)}`);
    }
    process.stdout.write(".");
  }
}
await Promise.all(Array.from({ length: PARALLEL }, worker));
console.log("");

let commit = "";
try { commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim() + (execSync("git status --porcelain lib", { encoding: "utf8" }).trim() ? "+uncommitted" : ""); } catch {}
const meta = {
  label, lang, date: new Date().toISOString(), prompt_version: PROMPT_VERSION, commit,
  provider: aiProvider, model: aiProvider === "openai" ? currentModel("text") : config.model,
  dishes: tests.length, answered: Object.keys(output).length, failed, seconds: Math.round((Date.now() - t0) / 1000),
};
await mkdir(new URL("../eval/allergens/runs/", import.meta.url), { recursive: true });
const file = `eval/allergens/runs/${meta.date.slice(0, 10)}-${label}.json`;
await writeFile(new URL(`../${file}`, import.meta.url), JSON.stringify({ _meta: meta, ...output }, null, 1) + "\n");
console.log(`${file}: ${meta.answered}/${meta.dishes} dishes · ${meta.model} · prompt ${PROMPT_VERSION} · ${commit} · ${meta.seconds}s`);
for (const f of failed) console.log(`  FAILED  ${f}`);
if (failed.length) process.exit(1);
