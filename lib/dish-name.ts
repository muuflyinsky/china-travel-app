// Dish names as cache keys (SPEC v0.5 P1.7 #29).

// Traditional → Simplified for characters common on menus (Hong Kong / Taiwan style boards).
const T2S: Record<string, string> = Object.fromEntries(
  "雞鸡 鴨鸭 魚鱼 蝦虾 蠔蚝 餃饺 麵面 飯饭 湯汤 燒烧 滷卤 醬酱 鮮鲜 魷鱿 鵝鹅 豬猪 鍋锅 炒炒 燉炖 蘿萝 蔔卜 檸柠 糖糖 雜杂 腸肠 東东 門门 鳳凤 龍龙 蓮莲 糰团 點点 餅饼 籠笼 碗碗 雲云 鹹咸 涼凉 醃腌 腳脚 煲煲 蔥葱 薑姜 蒜蒜 鹵卤 釀酿 齋斋 菜菜 撈捞 燜焖 鍋锅 頭头 腦脑 葉叶 筍笋 臘腊 魚鱼 鮑鲍 參参 遼辽 熱热 煎煎 雙双 椒椒 貝贝 螺螺 蟶蛏 蠣蛎 鱔鳝 鰻鳗 鱸鲈 鯉鲤 鯽鲫 鱖鳜 鴿鸽 驢驴 囉啰 滑滑 塊块 絲丝 條条 樣样 魚鱼 粉粉 蘭兰 宮宫 爐炉 盤盘 嫩嫩 醋醋 麥麦 蠶蚕 鐵铁 板板 燴烩 煙烟 燻熏 蝦虾 薯薯 鍋锅 飲饮 茶茶 糕糕 齊齐 黃黄 紅红 綠绿 銀银 涼凉 檔档 師师 傅傅 單单 價价"
    .split(" ").map((p) => [p[0], p[1]]),
);

const PREFIX = /^(招牌|特色|秘制|精品|本店|特价|推荐|主厨)+/;

/**
 * The cache key for a dish name: simplified characters, no spaces, punctuation, prices,
 * portion words or marketing prefixes, no "(branch)" suffix. "老" is kept on purpose: it's
 * part of real dish names (老醋花生, 老鸭汤).
 */
export function normalizeName(zh: string) {
  let n = [...zh].map((c) => T2S[c] ?? c).join("");
  n = n.replace(/[（(][^）)]*[)）]/g, "");
  n = n.replace(/[¥￥$]?\s*\d+(\.\d+)?\s*(元|块)?(\/\s*[份斤两位例只条个碗盘])?/g, "");
  n = n.replace(/(小份|中份|大份|半份|例牌|[大中小]例)/g, "");
  n = n.replace(PREFIX, "");
  n = n.replace(/[\s\p{P}\p{S}]/gu, "");
  return n;
}

/** Province code for regional versions: the first two digits of the city adcode ('51' Sichuan). */
export const regionOf = (adcode?: string) => (adcode && /^\d{6}$/.test(adcode) ? adcode.slice(0, 2) : "");

/**
 * The model's answer for dish j of a batch, found by name and never by position: the answer at the
 * same position could be another dish's, with another dish's allergens. No answer means undefined;
 * readMenu then asks about that dish alone, where the one answer can only be for it.
 */
export function answerFor<T extends { zh: string }>(asked: string[], j: number, answers: T[]): T | undefined {
  if (asked.length === 1 && answers.length === 1) return answers[0];
  const exact = answers.find((a) => a.zh.trim() === asked[j].trim());
  if (exact) return exact;
  const name = normalizeName(asked[j]);
  // Two dishes that normalize alike (\u5bab\u4fdd\u9e21\u4e01\uff08\u65e0\u82b1\u751f\uff09and \u5bab\u4fdd\u9e21\u4e01, 1\u53f7\u5957\u9910 and 2\u53f7\u5957\u9910) can't be told apart this way.
  if (!name || asked.some((zh, k) => k !== j && normalizeName(zh) === name)) return undefined;
  return answers.find((a) => normalizeName(a.zh) === name);
}

/**
 * A name normalizeName shortens into another dish's key: \u592b\u59bb\u80ba\u7247\uff08\u53bb\u82b1\u751f\uff09, \u62db\u724c\u7092\u996d, 1\u53f7\u5957\u9910. Its answer
 * describes that version, so it must not be stored as the answer for the plain dish.
 */
export const isVariantName = (zh: string) => /[\uff08(]|\d\s*\u53f7/.test(zh) || PREFIX.test(zh.trim());
