#!/usr/bin/env node
// Transit plan order (lib/amap.ts orderPlans): fastest first, a metro plan first when it is at most
// 10 minutes slower than a bus-only fastest plan, three at most. No network.
//
//   node scripts/check-routes.mjs
let createJiti;
try { ({ createJiti } = await import("jiti")); } catch { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); }
const jiti = createJiti(import.meta.url, { alias: { "@": new URL("..", import.meta.url).pathname } });
const { orderPlans } = await jiti.import(new URL("../lib/amap.ts", import.meta.url).pathname);

const bus = (minutes, line) => ({ minutes, walkMeters: 300, steps: [{ kind: "bus", line, from: "", to: "", fromPy: "", toPy: "", stops: 3 }] });
const metro = (minutes, line) => ({ minutes, walkMeters: 300, steps: [{ kind: "metro", line, from: "", to: "", fromPy: "", toPy: "", stops: 3 }] });
const lines = (ps) => ps.map((p) => p.steps[0].line).join(",");
const cases = [
  ["Bund 11-24: metro 18 min slower stays behind", [metro(46, "M8"), bus(28, "71"), bus(31, "123")], "71,123,M8"],
  ["metro 8 min slower comes first", [bus(30, "71"), metro(38, "M2"), bus(33, "123")], "M2,71,123"],
  ["metro exactly 10 min slower comes first", [bus(20, "71"), metro(30, "M2")], "M2,71"],
  ["fastest is metro: plain time order", [bus(25, "71"), metro(22, "M2"), metro(24, "M10")], "M2,M10,71"],
  ["no metro: time order", [bus(40, "A"), bus(20, "B"), bus(30, "C")], "B,C,A"],
  ["three at most, from the whole list", [bus(50, "A"), bus(45, "B"), bus(40, "C"), bus(20, "D")], "D,C,B"],
  ["empty", [], ""],
];
const fails = cases.filter(([, input, want]) => lines(orderPlans(input)) !== want)
  .map(([name, input, want]) => `${name}: got ${lines(orderPlans(input))}, want ${want}`);
if (fails.length) { console.error(`route order: ${fails.length} wrong\n  ${fails.join("\n  ")}`); process.exit(1); }
console.log(`route order: ${cases.length}/${cases.length} ok`);
