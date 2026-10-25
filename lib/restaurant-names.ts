// English names for guide-listed restaurants. The guide's own English name (Michelin publishes
// one) is used as is; otherwise the Chinese name in pinyin, with the branch put into English
// the way addresses are written: 新源南路店 → "Xinyuan South Rd". Only the name: no guide text.
import { pinyin } from "pinyin-pro";
import CITIES from "./data/cities.json";
import { splitName } from "./restaurant-awards";

const syllables = (s: string) => pinyin(s, { toneType: "none", type: "array", nonZh: "consecutive" }).filter((x) => x.trim());
/** One word: 大牌档 → "Dapaidang". */
const word = (s: string) => { const w = syllables(s).join(""); return w.charAt(0).toUpperCase() + w.slice(1); };

// Words that read better on their own in a romanised name: city names and common food words.
const CITY_NAMES = [...new Set((CITIES as { s: string; t: string }[]).filter((c) => c.t === "city").map((c) => c.s))].filter((s) => s.length >= 2);
const FOOD = ["炸酱面", "本帮菜", "烤鸭", "烤肉", "涮肉", "火锅", "小馆", "饭馆", "面馆", "酒家", "酒楼", "饭店", "餐厅", "食府", "海鲜", "饺子", "包子", "砂锅粥", "米粉", "米线", "拉面", "烧烤", "串串", "招待所", "羊汤", "烧饼", "烤串", "菜馆", "私房菜", "牛肉面", "小吃"];
const SPLIT = new RegExp(`(${[...FOOD, ...CITY_NAMES].sort((a, b) => b.length - a.length).join("|")}|\\d+号?)`);

/** Romanises a name in word chunks: 方砖厂69号炸酱面 → "Fangzhuanchang No. 69 Zhajiangmian". */
function romanise(s: string) {
  const out: string[] = [];
  for (const part of s.split(/[\s·・•]+/).flatMap((x) => x.split(SPLIT)).filter((x) => x && x.trim())) {
    const n = part.match(/^(\d+)号$/);
    if (n) { out.push(`No. ${n[1]}`); continue; }
    if (/^[\x00-\x7f]+$/.test(part)) { out.push(part.trim()); continue; }
    if (SPLIT.test(part) && part.length >= 2) { out.push(word(part)); continue; }
    // Anything else: two-character words, a last odd character joins the word before it.
    const chars = [...part];
    for (let i = 0; i < chars.length; i += 2) {
      const rest = chars.length - i;
      out.push(word(chars.slice(i, rest === 3 ? i + 3 : i + 2).join("")));
      if (rest === 3) break;
    }
  }
  return out.join(" ").replace(/\s+/g, " ").trim();
}

const DIRECTION: Record<string, string> = { 东: "East", 西: "West", 南: "South", 北: "North", 中: "Middle" };
const STREET: [RegExp, string][] = [[/大街$/, "Ave"], [/大道$/, "Blvd"], [/路$/, "Rd"], [/街$/, "St"], [/胡同$/, "Hutong"], [/巷$/, "Lane"]];
const PLACE: [RegExp, string][] = [[/购物中心$/, "Mall"], [/商场$/, "Mall"], [/广场$/, "Plaza"], [/中心$/, "Center"], [/大厦$/, "Tower"], [/机场$/, "Airport"], [/酒店$/, "Hotel"], [/公园$/, "Park"], [/火车站$/, "Railway Station"], [/站$/, "Station"]];

/** 新源南路店 → "Xinyuan South Rd" · 德基广场店 → "Deji Plaza" · 工体店 → "Gongti". */
export function branchEn(branch: string) {
  let b = branch.replace(/(总店|分店|旗舰店|创始店|店)$/, "");
  if (!b) return "";
  for (const [re, en] of STREET) {
    if (!re.test(b)) continue;
    b = b.replace(re, "");
    const dir = b.length > 1 && DIRECTION[b.slice(-1)] ? DIRECTION[b.slice(-1)] : "";
    if (dir) b = b.slice(0, -1);
    return [romanise(b), dir, en].filter(Boolean).join(" ");
  }
  for (const [re, en] of PLACE) if (re.test(b)) return `${romanise(b.replace(re, ""))} ${en}`.trim();
  return romanise(b);
}

export function restaurantNameEn(zh: string, en?: string) {
  if (en?.trim()) return en.trim();
  const { brand, branch } = splitName(zh);
  // splitName drops a generic suffix (餐厅, 饭店…) from the brand for matching; keep the full name here.
  const full = zh.replace(/（/g, "(").replace(/）/g, ")").replace(/\(.*\)$/, "").replace(/(?<=..)店$/, "").trim() || brand;
  const b = branch ? branchEn(branch) : "";
  return b ? `${romanise(full)} (${b})` : romanise(full);
}
