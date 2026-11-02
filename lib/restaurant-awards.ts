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

// Words a map listing adds to a brand that the guide leaves out: 宝丽轩 → 宝丽轩中餐厅,
// Da Vittorio → DA VITTORIO SHANGHAI. Stripped from the end, repeatedly.
const GENERIC = /(中餐厅|中餐|中菜|西餐厅|餐厅|饭店|酒家|酒楼|餐馆|菜馆|私房菜|restaurant|餐吧)$/;

const norm = (s: string) => s.toLowerCase().replace(/[\s·・.,'’\-–—&]/g, "");
// Never down to nothing: a place called just 餐厅 keeps its name.
const stripGeneric = (s: string) => { while (s.replace(GENERIC, "") && s.replace(GENERIC, "") !== s) s = s.replace(GENERIC, ""); return s; };

/** A name without its bracketed branch, before splitName drops 餐厅 (宝丽轩中餐厅 must stay whole). */
const rawBrand = (name: string) => name.replace(/[（(].*$/, "");

/**
 * Ways a brand can be written: lower case, no punctuation, generic words off. A map listing may
 * also carry the city name (DA VITTORIO SHANGHAI), a sub-name after a dot (马旺子·川小馆) or both
 * scripts (SIR ELLY'S艾利爵士餐厅); the guide's own name is kept whole (上海老饭店, 漾亚·雍雅合鲜).
 */
function brandKeys(brand: string, cityWords: string[], listing = false) {
  const keys = new Set([stripGeneric(norm(brand))]);
  if (!listing) return keys;
  for (const part of [brand, brand.split(/[·・]/)[0]]) {
    let k = stripGeneric(norm(part));
    keys.add(k);
    for (const c of cityWords.map(norm).filter(Boolean)) {
      if (k.length > c.length && k.endsWith(c)) k = stripGeneric(k.slice(0, -c.length));
      else if (k.length > c.length && k.startsWith(c)) k = stripGeneric(k.slice(c.length));
    }
    keys.add(k);
  }
  // Latin and Chinese run together (鹿园MOOSE): each half is a name of its own, unless the Latin
  // half says it is something else (悦轩SPA is a spa).
  for (const k of [...keys]) {
    const m = k.match(/^([a-z0-9]{3,})([\u4e00-\u9fff]{2,})$/) ?? k.match(/^([\u4e00-\u9fff]{2,})([a-z0-9]{3,})$/);
    if (m && !m.slice(1).some((h) => /^(spa|ktv|gym|hotel|club|shop|mall)$/.test(h))) for (const half of m.slice(1)) keys.add(stripGeneric(half));
  }
  return keys;
}

/**
 * Same brand, and the same branch when the guide names one (a list entry is usually one branch).
 * `cityWords` (the city's Chinese and English names) may be added to a map listing's brand.
 * A guide branch can also be the listing's district (马旺子(锦江) → 锦江区) or the street in its
 * address (阿勇面馆(东书房路) → 东书房路…号).
 */
export function sameRestaurant(guideName: string, poiName: string, opts: { cityWords?: string[]; district?: string; address?: string } = {}) {
  const g = splitName(guideName), p = splitName(poiName);
  const gk = brandKeys(rawBrand(guideName), []), pk = brandKeys(rawBrand(poiName), opts.cityWords ?? [], true);
  // Both name what kind of place they are, and differently: 南园酒家 is not 南园饭店.
  const kind = (n: string) => norm(rawBrand(n)).match(GENERIC)?.[0] ?? "";
  if (kind(guideName) && kind(poiName) && kind(guideName) !== kind(poiName)) return false;
  const branch = g.branch.replace(/(店|区|县)$/, "");
  const sameBranch = Boolean(branch) && ((Boolean(p.branch) && (p.branch.includes(branch) || g.branch.includes(p.branch)))
    || Boolean(opts.district && opts.district.replace(/(区|县)$/, "") === branch)
    || Boolean(branch.length >= 3 && opts.address?.includes(branch)));
  if (![...gk].some((k) => pk.has(k))) {
    // A place-name prefix the guide drops (海宁阿月煲(海阳路店) for 阿月煲(海阳路店)): only with the
    // same named branch, and a brand of three characters or more.
    return sameBranch && Boolean(p.branch) && [...gk].some((k) => k.length >= 3 && [...pk].some((x) => x.endsWith(k)));
  }
  // The guide names a branch: the map result must name the same one (an unbranded result could be any outlet).
  return !g.branch || sameBranch;
}

const CLOSED = /暂停营业|已关闭|停业|歇业|已搬迁/;

/**
 * The map result that is this listed restaurant, and which name matched: the Chinese name, or
 * the English one (蔻 is on the map as "Co- Restaurant"). Closed listings never match.
 */
export function pickListing<P extends { name: string; district?: string; address?: string }>(r: { zh: string; en?: string }, found: P[], cityWords: string[]) {
  const open = found.filter((p) => !CLOSED.test(p.name));
  for (const [by, name] of [["zh", r.zh], ["en", r.en]] as const) {
    const hit = name ? open.find((p) => sameRestaurant(name, p.name, { cityWords, district: p.district, address: p.address })) : undefined;
    if (hit) return { poi: hit, by };
  }
  return null;
}

/** City adcode from a district adcode (municipalities: 11/12/31/50). */
export function cityAdcode(adcode?: string) {
  if (!adcode) return "";
  return ["11", "12", "31", "50"].includes(adcode.slice(0, 2)) ? `${adcode.slice(0, 2)}0000` : `${adcode.slice(0, 4)}00`;
}
