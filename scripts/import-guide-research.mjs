// Turns a research JSON (sources + facts, see the workspace inbox note on guides) into
// lib/guides/content/<topic>.ts. Facts come in as drafts. With a verify file (per fact: each source's
// verdict, a reader-facing rewrite, stale flag) a fact that at least one source supports gets the
// rewrite, keeps only the supporting sources and `checked: <date>`; everything else stays a draft.
// Usage: node scripts/import-guide-research.mjs <research.json> <topic> <exportName> <appPath> <sectionTitles.json> [verify.json checkedDate]
import { readFileSync, writeFileSync } from "node:fs";

const [file, topic, name, appPath, titlesFile, verifyFile, checkedDate] = process.argv.slice(2);
const verify = verifyFile ? Object.fromEntries(JSON.parse(readFileSync(verifyFile, "utf8")).facts.map((v) => [v.id, v])) : {};
function convert(f) {
  const v = verify[f.id];
  const ok = (v?.checks ?? []).filter((c) => c.verdict === "supports" || c.verdict === "partial").map((c) => c.source);
  const contradicted = (v?.checks ?? []).some((c) => c.verdict === "contradicts");
  if (v && ok.length && v.rewrite && !v.stale && !contradicted) {
    return { applies: f.applies, text: { en: v.rewrite }, src: ok, checked: checkedDate };
  }
  const why = !v ? null : contradicted ? "a source contradicts it" : v.stale ? "stale (old source for a price or limit)" : "no fetched source states it";
  const note = [f.note, why && `Not live: ${why}.`, v?.comment].filter(Boolean).join(" ");
  return { applies: f.applies, text: { en: f.text }, src: f.sources, ...(note ? { note } : {}) };
}
const d = JSON.parse(readFileSync(file, "utf8"));
const titles = JSON.parse(readFileSync(titlesFile, "utf8"))[topic];
const facts = d.facts.map((f) => ({ section: f.section, ...convert(f) }));
const used = new Set(facts.flatMap((f) => f.src));
const sources = Object.fromEntries(d.sources.filter((s) => used.has(s.id)).map((s) => [s.id, {
  title: s.title, publisher: s.publisher, url: s.url, ...(s.published ? { published: s.published } : {}), kind: s.kind,
}]));
const order = Object.keys(titles);
const sections = order.map((key) => ({
  key, title: titles[key],
  facts: facts.filter((f) => f.section === key).map(({ section, ...f }) => f),
}));
const missing = d.facts.filter((f) => !order.includes(f.section));
if (missing.length) throw new Error(`no section title for: ${[...new Set(missing.map((f) => f.section))]}`);
const body = `import type { TopicContent } from "../types";

// Imported from the research draft: ${facts.filter((f) => f.checked).length} of ${facts.length} facts checked against the fetched
// source pages${checkedDate ? ` on ${checkedDate}` : ""}. Facts without \`checked\` are drafts (preview builds only); their
// \`note\` says why. Gaps the research couldn't source: see the workspace inbox note.
export const ${name}: TopicContent = ${JSON.stringify({ checked: checkedDate || "2026-11-05", appPath, sources, sections }, null, 2)};
`;
writeFileSync(`lib/guides/content/${topic}.ts`, body);
console.log(topic, facts.length, "facts,", facts.filter((f) => f.checked).length, "checked,", Object.keys(sources).length, "sources");
