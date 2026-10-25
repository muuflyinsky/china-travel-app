// Fixed word list for hidden ingredients (allergen review R4, 2026-10-25). A model can miss an
// allergen, mislabel one (芝麻油 as tree nut, 猪油 as milk) or drop lard and meat stock; these
// words are checked on every dish after the model, from the dish name and from the ingredient
// each allergen came from. It only ever adds: a word never removes what the model said.
// No imports, so scripts can load it directly (scripts/check-allergens.mjs).

type Found = { allergens: { id: string; word: string; en: string }[]; meat: string[]; animal: boolean; alcohol: boolean };

// Removed before the fish test: they say 鱼 but aren't fish (鱼香 is a sauce with no fish in it).
const NOT_FISH = /鱿鱼|墨鱼|鲍鱼|章鱼|八爪鱼|甲鱼|娃娃鱼|鱼香/g;
// 腐乳 is fermented tofu, 乳鸽/乳猪 are young pigeon and pig: not milk.
const NOT_MILK = /豆腐乳|腐乳|乳鸽|乳猪|乳鸭/g;

const ALLERGEN_WORDS: [string, RegExp, string][] = [
  ["peanut", /花生/, "peanuts"],
  ["sesame", /芝麻|香油|麻酱|麻油|沙茶/, "sesame"],
  ["crustacean", /虾(?!夷)|蟹|沙茶|XO酱/, "shrimp or crab"],
  ["mollusc", /蚝|牡蛎|鲍|扇贝|干贝|瑶柱|蛤|蚬|蛏|鱿|墨鱼|乌贼|章鱼|八爪|螺|贻贝|青口|花甲|XO酱/, "shellfish (mollusc)"],
  ["fish", /鱼|鳕|鲈|鳜|鲫|鳗|鳝|鲶|鲳|三文|金枪|沙茶/, "fish"],
  ["soy", /酱油|生抽|老抽|豆瓣|豆豉|黄豆|大豆|豆腐|豆干|干丝|腐竹|腐乳|豆浆|豆皮|味噌|甜面酱|毛豆|沙茶/, "soy"],
  ["gluten", /酱油|生抽|老抽|甜面酱|豆瓣|面|麦|馒头|包子|饺|馄饨|烧麦|烧卖|油条|饼|烤麸/, "wheat"],
  ["egg", /蛋|鸡子/, "egg"],
  ["milk", /奶|乳|芝士|奶酪|黄油|酸奶/, "milk"],
  ["tree_nut", /核桃|腰果|杏仁|松子|榛子|开心果|碧根果|夏威夷果/, "tree nuts"],
  ["mustard", /芥末|芥辣/, "mustard"],
  ["celery", /芹/, "celery"],
  ["msg", /味精|鸡精|鸡粉/, "MSG"],
];

// "肉" on its own means pork in Chinese cooking (肉末, 肉丝), unless another meat comes first.
const MEAT_WORDS: [string, RegExp][] = [
  ["pork", /猪|豚|五花|排骨|腊肉|腊肠|香肠|火腿|叉烧|培根|荤油|肥膘|东坡肉|红烧肉|回锅肉|狮子头|(?<![牛羊鸡鸭鱼驴兔鹅狗蛙])肉(末|丝|片|馅|丁|丸|饼|松)/],
  ["beef", /牛(?!油果|蛙|奶|乳|肝菌)/],
  ["lamb", /羊(?!肚菌|奶)/],
  ["chicken", /鸡(?!蛋|精|粉|头米|枞|腿菇|子)/],
  ["duck", /鸭(?!梨|蛋)/],
  ["fish", /鱼|鳕|鲈|鳜|鲫|鳗|鳝|三文|金枪/],
  ["seafood", /虾(?!夷)|蟹|蚝|牡蛎|鲍|扇贝|干贝|瑶柱|蛤|蛏|鱿|墨鱼|章鱼|螺|海参/],
  ["other", /鸽|兔|驴|鹅|蛙|鹿|甲鱼/],
];
// Animal fat, stock and chicken flavouring: not vegetarian, whatever the meat list says.
const ANIMAL = /猪油|荤油|板油|肥膘|牛油(?!果)|鸡油|高汤|骨汤|上汤|鸡汤|老汤|汤底|鸡精|鸡粉|蚝油|鱼露|虾酱|虾皮|虾米/;
const ALCOHOL = /料酒|黄酒|花雕|白酒|米酒|酒酿|醪糟|绍兴酒|啤酒|红酒|糟/;

/** Everything the words in `zh` say about a dish. */
export function lookup(zh: string): Found {
  const fishText = zh.replace(NOT_FISH, ""), milkText = zh.replace(NOT_MILK, "");
  const allergens = ALLERGEN_WORDS.flatMap(([id, re, en]) => {
    const text = id === "fish" ? fishText : id === "milk" ? milkText : zh;
    const m = text.match(re);
    return m ? [{ id, word: m[0], en }] : [];
  });
  const meat = MEAT_WORDS.filter(([id, re]) => (id === "fish" ? fishText : zh).match(re)).map(([id]) => id);
  return { allergens, meat, animal: ANIMAL.test(zh), alcohol: ALCOHOL.test(zh) };
}

type Role = "main" | "sauce" | "garnish";
type DishLike = {
  zh: string; meat: string[]; vegetarian: boolean; alcohol: boolean;
  allergens: { id: string; role: Role; via_zh: string; via?: string }[];
};

/**
 * The dish with what the word list adds: allergens and meat named in the dish name or in an
 * ingredient the model listed (`extra`: ingredients from the dish detail), and the fields made
 * consistent (fish means not vegetarian, and so on). Never removes anything.
 */
export function tighten<D extends DishLike>(d: D, extra: { zh: string; name?: string; role: Role }[] = []): D {
  const allergens = [...d.allergens];
  const meat = new Set(d.meat);
  let vegetarian = d.vegetarian, alcohol = d.alcohol;
  const has = (id: string) => allergens.some((a) => a.id === id);
  const sources = [
    { zh: d.zh, role: "main" as Role, via: undefined as string | undefined },
    ...d.allergens.map((a) => ({ zh: a.via_zh, role: a.role, via: a.via })),
    ...extra.map((i) => ({ zh: i.zh, role: i.role, via: i.name })),
  ];
  for (const s of sources) {
    if (!s.zh) continue;
    const f = lookup(s.zh);
    for (const a of f.allergens) {
      if (has(a.id)) continue;
      // From the dish name the word itself is the ingredient; otherwise the ingredient listed.
      const fromName = s === sources[0];
      allergens.push({ id: a.id, role: s.role, via_zh: fromName ? a.word : s.zh, via: fromName ? a.en : s.via || a.en } as D["allergens"][number]);
    }
    for (const m of f.meat) meat.add(m);
    if (f.animal) vegetarian = false;
    if (f.alcohol) alcohol = true;
  }
  if (has("fish")) meat.add("fish");
  if (has("crustacean") || has("mollusc")) meat.add("seafood");
  if (meat.size) vegetarian = false;
  return { ...d, allergens, meat: [...meat], vegetarian, alcohol };
}
