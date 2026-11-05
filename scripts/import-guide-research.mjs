// Turns a research JSON (sources + facts, see the workspace inbox note on guides) into
// lib/guides/content/<topic>.ts. Sources come in unverified; mark `verified` by hand after opening each one.
// Usage: node scripts/import-guide-research.mjs <research.json> <topic> <exportName> <appPath> <sectionTitles.json>
import { readFileSync, writeFileSync } from "node:fs";

const [file, topic, name, appPath, titlesFile] = process.argv.slice(2);
const d = JSON.parse(readFileSync(file, "utf8"));
const titles = JSON.parse(readFileSync(titlesFile, "utf8"))[topic];
const used = new Set(d.facts.flatMap((f) => f.sources));
const sources = Object.fromEntries(d.sources.filter((s) => used.has(s.id)).map((s) => [s.id, {
  title: s.title, publisher: s.publisher, url: s.url, ...(s.published ? { published: s.published } : {}), kind: s.kind,
}]));
const order = Object.keys(titles);
const sections = order.map((key) => ({
  key, title: titles[key],
  facts: d.facts.filter((f) => f.section === key).map((f) => ({
    applies: f.applies, text: { en: f.text }, src: f.sources, ...(f.note ? { note: f.note } : {}),
  })),
}));
const missing = d.facts.filter((f) => !order.includes(f.section));
if (missing.length) throw new Error(`no section title for: ${[...new Set(missing.map((f) => f.section))]}`);
const body = `import type { TopicContent } from "../types";

// Imported from the research draft (${d.facts.length} facts). Sources were only seen in search results:
// open each one, check the facts that cite it, then set \`verified: "YYYY-MM-DD"\`. Until then the facts
// show on preview builds only. Gaps the research couldn't source: see the workspace inbox note.
export const ${name}: TopicContent = ${JSON.stringify({ checked: "2026-11-05", appPath, sources, sections }, null, 2)};
`;
writeFileSync(`lib/guides/content/${topic}.ts`, body);
console.log(topic, d.facts.length, "facts,", Object.keys(sources).length, "sources");
