// Restaurant awards from published guides: Michelin Guide, Black Pearl (黑珍珠, Meituan) and the
// Dianping Must-Eat List (大众点评必吃榜). Shared types, ranking and name matching; the data lives
// in Supabase (read by lib/restaurants.ts), with lib/data/restaurant-awards.json as the bundled
// fallback, imported with scripts/import-awards.mjs and synced with scripts/sync-awards.mjs.
//
// We never infer an award: a restaurant shows a badge only if it is in the data, which records the
// edition and where it was checked. Badges show the guide's symbol (components/AwardIcon.tsx).

export type AwardList = "michelin" | "black_pearl" | "dianping";
export type Award = { list: AwardList; level: string; edition: string };

/** Levels per list, best first. Michelin: 3/2/1 stars, Bib Gourmand, Selected. Black Pearl: 3/2/1 diamonds. */
export const LEVELS: Record<AwardList, string[]> = {
  michelin: ["3", "2", "1", "bib", "selected"],
  black_pearl: ["3", "2", "1"],
  dianping: ["must_eat"],
};

// One scale across lists, so a Michelin 2-star outranks a Black Pearl 1-diamond and so on.
const SCORE: Record<string, number> = {
  "michelin:3": 10, "black_pearl:3": 9, "michelin:2": 8, "black_pearl:2": 7, "michelin:1": 6, "black_pearl:1": 5,
  "michelin:bib": 4, "dianping:must_eat": 3, "michelin:selected": 2,
};
export const awardScore = (awards: Award[] = []) =>
  awards.reduce((best, a) => Math.max(best, SCORE[`${a.list}:${a.level}`] ?? 0), 0) + Math.min(awards.length - 1, 2) * 0.3;

export type AwardRestaurant = {
  city: string; // city adcode, e.g. 310000
  zh: string; // name as the guide lists it, branch in brackets if any: 南京大牌档(德基广场店)
  en?: string;
  cuisine?: string;
  awards: Award[];
};

/** "南京大牌档（德基广场店）" → { brand: "南京大牌档", branch: "德基广场店" } */
export function splitName(name: string) {
  const n = name.replace(/\s+/g, "").replace(/（/g, "(").replace(/）/g, ")");
  const m = n.match(/^(.*?)\((.*)\)$/);
  return { brand: (m ? m[1] : n).replace(/(餐厅|饭店|酒家|餐馆|菜馆)$/, ""), branch: m?.[2] ?? "" };
}

/** Same brand, and the same branch when the guide names one (a list entry is usually one branch). */
export function sameRestaurant(guideName: string, poiName: string) {
  const g = splitName(guideName), p = splitName(poiName);
  if (!g.brand || g.brand !== p.brand) return false;
  if (!g.branch) return true;
  // The guide names a branch: the map result must name the same one (an unbranded result could be any outlet).
  return Boolean(p.branch) && (p.branch.includes(g.branch) || g.branch.includes(p.branch));
}

/** City adcode from a district adcode (municipalities: 11/12/31/50). */
export function cityAdcode(adcode?: string) {
  if (!adcode) return "";
  return ["11", "12", "31", "50"].includes(adcode.slice(0, 2)) ? `${adcode.slice(0, 2)}0000` : `${adcode.slice(0, 4)}00`;
}
