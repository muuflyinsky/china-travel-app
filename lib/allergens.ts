// The 14 EU-regulated allergens + common Asian-cuisine concerns, each with the
// Chinese a waiter will understand. Used for highlighting and the "show to staff" card.
export const ALLERGENS = [
  { id: "peanut", en: "Peanuts", zh: "花生" },
  { id: "tree_nut", en: "Tree nuts", zh: "坚果（核桃、腰果、杏仁等）" },
  { id: "gluten", en: "Gluten / wheat", zh: "小麦/麸质（面粉、酱油、面筋）" },
  { id: "soy", en: "Soy", zh: "大豆（豆腐、酱油、豆瓣酱）" },
  { id: "egg", en: "Egg", zh: "鸡蛋" },
  { id: "milk", en: "Milk / dairy", zh: "牛奶/乳制品" },
  { id: "fish", en: "Fish", zh: "鱼（包括鱼露）" },
  { id: "crustacean", en: "Shellfish (shrimp, crab)", zh: "虾、蟹等甲壳类" },
  { id: "mollusc", en: "Molluscs (squid, clam, oyster)", zh: "鱿鱼、蛤蜊、生蚝、蚝油等" },
  { id: "sesame", en: "Sesame", zh: "芝麻/芝麻油/芝麻酱" },
  { id: "celery", en: "Celery", zh: "芹菜" },
  { id: "mustard", en: "Mustard", zh: "芥末" },
  { id: "sulphites", en: "Sulphites", zh: "亚硫酸盐（料酒、腌制品）" },
  { id: "lupin", en: "Lupin", zh: "羽扇豆" },
  { id: "msg", en: "MSG", zh: "味精/鸡精" },
] as const;

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

export function staffCardZh(allergens: string[], diets: string[]) {
  const lines: string[] = ["您好！我有饮食限制，麻烦您帮忙确认，谢谢！"];
  const a = ALLERGENS.filter((x) => allergens.includes(x.id));
  if (a.length) {
    lines.push(`我对以下食物严重过敏：${a.map((x) => x.zh).join("、")}。`);
    lines.push("请不要放这些材料，也请不要用接触过这些材料的油、锅和调料。");
  }
  for (const d of DIETS.filter((x) => diets.includes(x.id))) lines.push(d.zh + "。");
  lines.push("如果不确定菜里有没有，请告诉我，我换一道菜。非常感谢！");
  return lines;
}
