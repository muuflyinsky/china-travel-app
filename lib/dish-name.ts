// Dish names as cache keys (SPEC v0.5 P1.7 #29).

// Traditional → Simplified for characters common on menus (Hong Kong / Taiwan style boards).
const T2S: Record<string, string> = Object.fromEntries(
  "雞鸡 鴨鸭 魚鱼 蝦虾 蠔蚝 餃饺 麵面 飯饭 湯汤 燒烧 滷卤 醬酱 鮮鲜 魷鱿 鵝鹅 豬猪 鍋锅 炒炒 燉炖 蘿萝 蔔卜 檸柠 糖糖 雜杂 腸肠 東东 門门 鳳凤 龍龙 蓮莲 糰团 點点 餅饼 籠笼 碗碗 雲云 鹹咸 涼凉 醃腌 腳脚 煲煲 蔥葱 薑姜 蒜蒜 鹵卤 釀酿 齋斋 菜菜 撈捞 燜焖 鍋锅 頭头 腦脑 葉叶 筍笋 臘腊 魚鱼 鮑鲍 參参 遼辽 熱热 煎煎 雙双 椒椒 貝贝 螺螺 蟶蛏 蠣蛎 鱔鳝 鰻鳗 鱸鲈 鯉鲤 鯽鲫 鱖鳜 鴿鸽 驢驴 囉啰 滑滑 塊块 絲丝 條条 樣样 魚鱼 粉粉 蘭兰 宮宫 爐炉 盤盘 嫩嫩 醋醋 麥麦 蠶蚕 鐵铁 板板 燴烩 煙烟 燻熏 蝦虾 薯薯 鍋锅 飲饮 茶茶 糕糕 齊齐 黃黄 紅红 綠绿 銀银 涼凉 檔档 師师 傅傅 單单 價价"
    .split(" ").map((p) => [p[0], p[1]]),
);

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
  n = n.replace(/^(招牌|特色|秘制|精品|本店|特价|推荐|主厨)+/, "");
  n = n.replace(/[\s\p{P}\p{S}]/gu, "");
  return n;
}

/** Province code for regional versions: the first two digits of the city adcode ('51' Sichuan). */
export const regionOf = (adcode?: string) => (adcode && /^\d{6}$/.test(adcode) ? adcode.slice(0, 2) : "");
