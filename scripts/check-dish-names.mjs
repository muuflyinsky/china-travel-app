#!/usr/bin/env node
// A model answer must reach the dish it was written for (lib/dish-name.ts answerFor): getting this
// wrong shows one dish with another dish's allergens. No network, so it runs in `npm run verify`.
//
//   node scripts/check-dish-names.mjs
let createJiti;
try { ({ createJiti } = await import("jiti")); } catch { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); }
const jiti = createJiti(import.meta.url);
const { answerFor } = await jiti.import(new URL("../lib/dish-name.ts", import.meta.url).pathname);

const A = { zh: "宫保鸡丁" }, B = { zh: "麻婆豆腐" };
const cases = [
  ["in order", ["宫保鸡丁", "麻婆豆腐"], 0, [A, B], A],
  ["reordered", ["宫保鸡丁", "麻婆豆腐"], 0, [B, A], A],
  ["reordered, second dish", ["宫保鸡丁", "麻婆豆腐"], 1, [B, A], B],
  ["traditional characters and a price still match", ["宮保雞丁 ¥48"], 0, [A], A],
  // The bug this guards: A was skipped, and position 0 holds B's answer.
  ["first dish skipped", ["宫保鸡丁", "麻婆豆腐"], 0, [B], undefined],
  ["first dish skipped, the other is still found", ["宫保鸡丁", "麻婆豆腐"], 1, [B], B],
  ["second dish skipped", ["宫保鸡丁", "麻婆豆腐"], 1, [A], undefined],
  ["Chinese name changed by the model", ["宫爆鸡丁", "麻婆豆腐"], 0, [A, B], undefined],
  ["empty answer", ["宫保鸡丁"], 0, [], undefined],
  ["typed name, whole batch answered", ["kung pao", "mapo tofu"], 0, [A, B], A],
  ["typed name, batch incomplete", ["kung pao", "mapo tofu"], 0, [A], undefined],
  ["typed name, that answer belongs to another dish", ["kung pao", "麻婆豆腐"], 0, [B, A], undefined],
];

let fails = 0;
for (const [name, asked, j, answers, want] of cases) {
  const got = answerFor(asked, j, answers);
  if (got !== want) { fails++; console.log(`  FAIL  ${name}: got ${got?.zh ?? "nothing"}, expected ${want?.zh ?? "nothing"}`); }
}
console.log(`dish names: ${cases.length - fails}/${cases.length} ok`);
if (fails) process.exit(1);
