// Cuisine names for foreign travellers (lib/data/cuisines.json): a guide's Chinese cuisine label
// (潮州菜) or an Amap restaurant typecode (050123) → a short name in each interface language, a
// one-line explanation for the detail page, and an icon + tone for the tile shown when a
// restaurant has no photo. A label we can't map is dropped rather than shown in Chinese.
import DATA from "./data/cuisines.json";

type Entry = { icon: string; tone: number; short: Record<string, string>; about: Record<string, string> };
const C = DATA.cuisines as Record<string, Entry>;
const ALIASES = DATA.aliases as Record<string, string>;
const AMAP = DATA.amapTypes as Record<string, string>;

export type CuisineInfo = { key: string; icon: string; tone: number; short: string; about: string };

/** The cuisine key for a restaurant: the guide's label first, else the Amap type. */
export function cuisineKey(label?: string, amapType?: string): string | undefined {
  const l = label?.trim();
  if (l && C[l]) return l;
  if (l && ALIASES[l]) return ALIASES[l];
  // Amap typecodes can be several, "050117|050102": the first one we know.
  for (const code of amapType?.split("|") ?? []) {
    const k = AMAP[code] ?? AMAP[`${code.slice(0, 4)}00`];
    if (k) return k;
  }
  return undefined;
}

export function cuisineInfo(key: string | undefined, lang: string): CuisineInfo | undefined {
  const e = key ? C[key] : undefined;
  if (!e) return undefined;
  return { key: key!, icon: e.icon, tone: e.tone, short: e.short[lang] ?? e.short.en, about: e.about[lang] ?? e.about.en };
}
