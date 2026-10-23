// The 14 EU-regulated allergens + common Asian-cuisine concerns, each with the
// Chinese a waiter will understand. Used for highlighting and the "show to staff" card.
// Ordered by how often they turn up in Chinese cooking; the first COMMON_ALLERGENS are shown
// up front and the rest sit behind "More".
export const ALLERGENS = [
  { id: "peanut", en: "Peanuts", zh: "花生" },
  { id: "crustacean", en: "Shellfish (shrimp, crab)", zh: "虾、蟹等甲壳类" },
  { id: "sesame", en: "Sesame", zh: "芝麻/芝麻油/芝麻酱" },
  { id: "soy", en: "Soy", zh: "大豆（豆腐、酱油、豆瓣酱）" },
  { id: "gluten", en: "Gluten / wheat", zh: "小麦/麸质（面粉、酱油、面筋）" },
  { id: "egg", en: "Egg", zh: "鸡蛋" },
  { id: "fish", en: "Fish", zh: "鱼（包括鱼露）" },
  { id: "mollusc", en: "Molluscs (squid, clam, oyster)", zh: "鱿鱼、蛤蜊、生蚝、蚝油等" },
  { id: "tree_nut", en: "Tree nuts", zh: "坚果（核桃、腰果、杏仁等）" },
  { id: "milk", en: "Milk / dairy", zh: "牛奶/乳制品" },
  { id: "msg", en: "MSG", zh: "味精/鸡精" },
  { id: "celery", en: "Celery", zh: "芹菜" },
  { id: "mustard", en: "Mustard", zh: "芥末" },
  { id: "sulphites", en: "Sulphites", zh: "亚硫酸盐（料酒、腌制品）" },
  { id: "lupin", en: "Lupin", zh: "羽扇豆" },
] as const;

export const COMMON_ALLERGENS = 11;

export type AllergenId = (typeof ALLERGENS)[number]["id"];

export const DIETS = [
  { id: "vegetarian", en: "Vegetarian", zh: "我吃素，不吃任何肉、鱼和海鲜（包括肉汤、猪油、鱼露、蚝油）" },
  { id: "vegan", en: "Vegan", zh: "我吃纯素，不吃肉、鱼、海鲜、蛋、奶、蜂蜜，也不要猪油和动物高汤" },
  { id: "no_pork", en: "No pork", zh: "我不吃猪肉（包括猪油、猪骨汤、火腿、培根）" },
  { id: "halal", en: "Halal", zh: "我只吃清真食品，不吃猪肉、猪油，也不能有酒（料酒）" },
  { id: "no_beef", en: "No beef", zh: "我不吃牛肉（包括牛油火锅底料、牛骨汤）" },
  { id: "no_spicy", en: "Not spicy", zh: "我不能吃辣，请一点辣椒和花椒都不要放" },
  { id: "no_alcohol", en: "No alcohol", zh: "我不能吃含酒精的食物，请不要放料酒、黄酒、白酒" },
] as const;

export type DietId = (typeof DIETS)[number]["id"];

type DishLike = { allergens: string[]; ingredients?: { role?: string; allergens?: string[] }[] };

/**
 * Allergens that come from a main ingredient — the dish can't be made without them, so "ask
 * them to leave it out" isn't a real option. Conservative: an allergen we can't trace to a
 * sauce or garnish counts as main.
 */
export function mainAllergens(d: DishLike) {
  const traced = new Map<string, boolean>(); // allergen → only in sauce/garnish?
  for (const ing of d.ingredients ?? []) {
    for (const a of ing.allergens ?? []) traced.set(a, (traced.get(a) ?? true) && (ing.role === "sauce" || ing.role === "garnish"));
  }
  return d.allergens.filter((a) => traced.get(a) !== true);
}

/** The traveller's severe allergens that are a main ingredient of this dish: don't let them order it. */
export const blockedBySevere = (d: DishLike, severe: string[]) => mainAllergens(d).filter((a) => severe.includes(a));

const zhShort = (a: { zh: string }) => a.zh.split("（")[0];

/**
 * Allergy and diet lines for staff cards, most important first:
 * `severe` is one short sentence for the top of the card; `rest` follows the dishes.
 */
export function allergyLinesZh(allergens: string[], diets: string[], severe: string[] = []) {
  const a = ALLERGENS.filter((x) => allergens.includes(x.id));
  const s = a.filter((x) => severe.includes(x.id));
  const mild = a.filter((x) => !severe.includes(x.id));
  const rest: string[] = [];
  if (mild.length) rest.push(`我对${mild.map((x) => x.zh).join("、")}过敏，请不要放。`);
  if (s.length) rest.push(`请用干净的锅和工具，也不要用接触过${s.map(zhShort).join("、")}的油和调料。`);
  for (const d of DIETS.filter((x) => diets.includes(x.id))) rest.push(d.zh + "。");
  return {
    severe: s.length ? `我对${s.map(zhShort).join("、")}严重过敏，一点点都不能吃！` : "",
    rest,
  };
}

/** The standalone allergy card (Talk, Eat): severe sentence first, then the rest. */
export function staffCardZh(allergens: string[], diets: string[], severe: string[] = []) {
  const { severe: top, rest } = allergyLinesZh(allergens, diets, severe);
  return [
    ...(top ? [top] : []),
    "您好！我有饮食限制，麻烦您帮忙确认，谢谢！",
    ...rest,
    "如果不确定菜里有没有，请告诉我，我换一道菜。非常感谢！",
  ];
}
