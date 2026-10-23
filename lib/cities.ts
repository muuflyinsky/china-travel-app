// Every city and county in mainland China (lib/data/cities.json, built by scripts/build-cities.mjs).
export type City = {
  n: string; // official name, e.g. 西双版纳傣族自治州
  s: string; // short name, e.g. 西双版纳
  a: string; // adcode (Amap / NBS), e.g. 532800
  p: string; // province in English
  e: string; // English name
  py: string; // toneless pinyin, for search
  t: "city" | "county";
  c?: string; // parent city short name, for counties
  ce?: string; // parent city in English
};

export const DEFAULT_CITY: City = { n: "上海市", s: "上海", a: "310000", p: "Shanghai", e: "Shanghai", py: "shanghai", t: "city" };

/** Destinations travellers search for, ranked first when names collide (婺源 vs 五原 for "wuyuan"). */
const FAMOUS = new Set([
  "北京", "上海", "西安", "成都", "重庆", "广州", "深圳", "杭州", "苏州", "南京", "桂林", "阳朔", "张家界",
  "丽江", "大理", "昆明", "西双版纳", "香格里拉", "三亚", "厦门", "哈尔滨", "拉萨", "敦煌", "婺源", "凤凰",
  "九寨沟", "黄山", "平遥", "乐山", "峨眉山", "都江堰", "洛阳", "青岛", "武汉", "长沙", "贵阳", "腾冲", "稻城",
]);

export const POPULAR = ["北京", "上海", "西安", "成都", "重庆", "广州", "深圳", "杭州", "桂林", "阳朔", "张家界", "丽江", "大理", "昆明", "三亚", "哈尔滨"];

let cache: City[] | null = null;
/** 255 KB of JSON, so it is only loaded when someone opens the picker or detects location. */
export async function loadCities(): Promise<City[]> {
  cache ??= (await import("./data/cities.json")).default as City[];
  return cache;
}

export function searchCities(all: City[], query: string, limit = 40): City[] {
  const q = query.trim().toLowerCase().replace(/['\s-]/g, "");
  if (!q) return [];
  const score = (c: City) => {
    const en = c.e.toLowerCase().replace(/['\s-]/g, "");
    if (c.s === query.trim() || en === q || c.py === q) return 0;
    if (c.n.startsWith(query.trim()) || c.s.startsWith(query.trim()) || en.startsWith(q) || c.py.startsWith(q)) return 1;
    if (c.n.includes(query.trim()) || en.includes(q)) return 2;
    return 9;
  };
  return all
    .map((c) => ({ c, k: score(c) * 3 + (FAMOUS.has(c.s) ? 0 : c.t === "city" ? 1 : 2) }))
    .filter((x) => x.k < 27)
    .sort((a, b) => a.k - b.k)
    .slice(0, limit)
    .map((x) => x.c);
}

/** Maps an Amap adcode (district, county or city) to the most specific place we list. */
export function cityFromAdcode(all: City[], adcode: string): City | undefined {
  return (
    all.find((c) => c.a === adcode && c.t === "county") ??
    all.find((c) => c.a === `${adcode.slice(0, 4)}00`) ??
    all.find((c) => c.a === `${adcode.slice(0, 2)}0000`)
  );
}

export const cityLabel = (c: City) => `${c.e} · ${c.s}`;
