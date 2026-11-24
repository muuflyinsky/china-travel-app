// Reading Amap's Chinese line names into something a visitor can say or match on a sign.
// "地铁10号线" → metro 10; "71路" → bus 71; "71路区间" → bus 71, short route; "夜宵15路" → bus 15, night.
// Names without a route number ("隧道三线", "浦江线") return n = null: the UI falls back to pinyin,
// and the Chinese name is always shown under it as on the signs.

export type LineVariant = "short" | "night" | "express" | "branch" | "special";

const VARIANTS: [RegExp, LineVariant][] = [
  [/^区间/, "short"],
  [/^(夜宵|夜班|夜)/, "night"],
  [/^(快线|大站车|大站|快)/, "express"],
  [/^(支线|支)/, "branch"],
  [/^(专线|定制|专)/, "special"],
];

export function parseLine(kind: "metro" | "bus", name: string): { n: string | null; variant?: LineVariant } {
  const s = name.trim();
  if (kind === "metro") return { n: s.match(/(\d+)\s*号?线/)?.[1] ?? null };
  // A night prefix: "夜宵15路", "夜15路", "N15".
  const night = s.match(/^(?:夜宵|夜班|夜|N)\s*(\d+[A-Z]?)路?$/);
  if (night) return { n: night[1], variant: "night" };
  const m = s.match(/^([A-Z]{0,2}\d+[A-Z]?)路?(.*)$/);
  if (!m) return { n: null };
  const rest = m[2].trim();
  if (!rest) return { n: m[1] };
  const v = VARIANTS.find(([re]) => re.test(rest));
  // An unknown suffix carries meaning we can't word: fall back to pinyin rather than drop it.
  return v ? { n: m[1], variant: v[1] } : { n: null };
}
