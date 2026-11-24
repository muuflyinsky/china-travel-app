#!/usr/bin/env node
// Amap line names → route number and kind (lib/line-name.ts). No network.
//   node scripts/check-line-names.mjs
let createJiti;
try { ({ createJiti } = await import("jiti")); } catch { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); }
const { parseLine } = await createJiti(import.meta.url).import(new URL("../lib/line-name.ts", import.meta.url).pathname);
const cases = [
  ["metro", "地铁10号线", "10"], ["metro", "地铁2号线", "2"], ["metro", "地铁浦江线", null],
  ["bus", "71路", "71"], ["bus", "71路区间", "71 short"], ["bus", "123路", "123"],
  ["bus", "夜宵15路", "15 night"], ["bus", "N15", "15 night"], ["bus", "320路夜宵", "320 night"],
  ["bus", "911路快线", "911 express"], ["bus", "1路大站车", "1 express"], ["bus", "58路支线", "58 branch"],
  ["bus", "旅游1线", null], ["bus", "隧道三线", null], ["bus", "B11路", "B11"], ["bus", "71路东段", null],
];
const show = (r) => (r.n === null ? null : r.variant ? `${r.n} ${r.variant}` : r.n);
const fails = cases.filter(([k, name, want]) => show(parseLine(k, name)) !== want)
  .map(([k, name, want]) => `${k} ${name}: got ${show(parseLine(k, name))}, want ${want}`);
if (fails.length) { console.error(`line names: ${fails.length} wrong\n  ${fails.join("\n  ")}`); process.exit(1); }
console.log(`line names: ${cases.length}/${cases.length} ok`);
