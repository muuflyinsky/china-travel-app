#!/usr/bin/env node
// A model answer must reach the dish it was written for (lib/dish-name.ts answerFor), and a variant's
// answer must not be stored for the plain dish (isVariantName): getting these wrong shows one dish
// with another dish's allergens. No network, so it runs in `npm run verify`.
//
//   node scripts/check-dish-names.mjs
let createJiti;
try { ({ createJiti } = await import("jiti")); } catch { console.error("needs jiti (installed with the app's dev dependencies)"); process.exit(2); }
const jiti = createJiti(import.meta.url);
const { answerFor, isVariantName } = await jiti.import(new URL("../lib/dish-name.ts", import.meta.url).pathname);

const A = { zh: "宫保鸡丁" }, B = { zh: "麻婆豆腐" };
const noPeanut = { zh: "宫保鸡丁（无花生）" }, one = { zh: "1号套餐" }, two = { zh: "2号套餐" };
const cases = [
  ["in order", ["宫保鸡丁", "麻婆豆腐"], 0, [A, B], A],
  ["reordered", ["宫保鸡丁", "麻婆豆腐"], 0, [B, A], A],
  ["reordered, second dish", ["宫保鸡丁", "麻婆豆腐"], 1, [B, A], B],
  ["traditional characters and a price still match", ["宮保雞丁 ¥48", "麻婆豆腐"], 0, [B, A], A],
  // The bug this guards: A was skipped, and position 0 holds B's answer.
  ["first dish skipped", ["宫保鸡丁", "麻婆豆腐"], 0, [B], undefined],
  ["first dish skipped, the other is still found", ["宫保鸡丁", "麻婆豆腐"], 1, [B], B],
  ["second dish skipped", ["宫保鸡丁", "麻婆豆腐"], 1, [A], undefined],
  ["Chinese name changed by the model", ["宫爆鸡丁", "麻婆豆腐"], 0, [A, B], undefined],
  ["empty answer", ["宫保鸡丁"], 0, [], undefined],
  // Dishes that normalize to the same name.
  ["variant and plain dish, plain", ["宫保鸡丁（无花生）", "宫保鸡丁"], 1, [noPeanut, A], A],
  ["variant and plain dish, variant", ["宫保鸡丁（无花生）", "宫保鸡丁"], 0, [A, noPeanut], noPeanut],
  ["two variants, one plain answer", ["宫保鸡丁（无花生）", "宫保鸡丁（少辣）"], 0, [A], undefined],
  ["numbered sets, reordered", ["1号套餐", "2号套餐"], 0, [two, one], one],
  // Typed names have no Chinese to compare: in a batch they are asked again, alone.
  ["typed name in a batch, answers in order", ["kung pao", "mapo tofu"], 0, [A, B], undefined],
  ["typed name in a batch, answers swapped", ["kung pao", "mapo tofu"], 0, [B, A], undefined],
  ["typed name, that answer belongs to another dish", ["kung pao", "麻婆豆腐"], 0, [B, A], undefined],
  // Asked alone, the one answer can only be for this dish.
  ["asked alone, typed name", ["kung pao"], 0, [A], A],
  ["asked alone, name changed by the model", ["宫爆鸡丁"], 0, [A], A],
  ["asked alone, two answers that don't match", ["宫爆鸡丁"], 0, [A, B], undefined],
];

const variants = [
  ["夫妻肺片（去花生）", true], ["夫妻肺片(去花生)", true], ["招牌炒饭", true], ["秘制红烧肉", true], ["1号套餐", true],
  ["夫妻肺片", false], ["宫保鸡丁 ¥48", false], ["宮保雞丁", false], ["小份水煮鱼", false], ["老醋花生", false],
];

let fails = 0;
for (const [name, asked, j, answers, want] of cases) {
  const got = answerFor(asked, j, answers);
  if (got !== want) { fails++; console.log(`  FAIL  ${name}: got ${got?.zh ?? "nothing"}, expected ${want?.zh ?? "nothing"}`); }
}
for (const [zh, want] of variants) if (isVariantName(zh) !== want) { fails++; console.log(`  FAIL  isVariantName(${zh}) should be ${want}`); }
const total = cases.length + variants.length;
console.log(`dish names: ${total - fails}/${total} ok`);
if (fails) process.exit(1);
