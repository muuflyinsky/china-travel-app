// Sample data so the prototype works without API keys (shown with a DEMO badge).
import type { Place, RouteOption } from "./amap";
import type { Menu } from "./llm";

const P = (id: string, name: string, pinyin: string, address: string, location: string, type: string, extra: Partial<Place> = {}): Place => ({
  id, name, pinyin, address, city: "上海市", citycode: "021", location, type, ...extra,
});

const HOTELS: Place[] = [
  P("B0FFG1", "上海外滩茂悦大酒店", "Shang Hai Wai Tan Mao Yue Da Jiu Dian", "上海市虹口区黄浦路199号", "121.491,31.2454", "住宿服务;宾馆酒店;五星级宾馆", { rating: "4.8", cost: "1450", tel: "021-63931234" }),
  P("B0FFG2", "上海和平饭店", "Shang Hai He Ping Fan Dian", "上海市黄浦区南京东路20号", "121.4878,31.2410", "住宿服务;宾馆酒店;五星级宾馆", { rating: "4.8", cost: "2100" }),
  P("B0FFG3", "全季酒店(上海人民广场店)", "Quan Ji Jiu Dian (Shang Hai Ren Min Guang Chang Dian)", "上海市黄浦区西藏中路", "121.4766,31.2340", "住宿服务;宾馆酒店;经济型连锁酒店", { rating: "4.7", cost: "520" }),
  P("B0FFG4", "上海静安香格里拉大酒店", "Shang Hai Jing An Xiang Ge Li La Da Jiu Dian", "上海市静安区延安中路1218号", "121.4500,31.2240", "住宿服务;宾馆酒店;五星级宾馆", { rating: "4.8", cost: "1680" }),
];

const SIGHTS: Place[] = [
  P("B0FFS1", "外滩", "Wai Tan (The Bund)", "上海市黄浦区中山东一路", "121.4905,31.2397", "风景名胜;风景名胜;国家级景点", { rating: "4.9" }),
  P("B0FFS2", "豫园", "Yu Yuan (Yu Garden)", "上海市黄浦区福佑路168号", "121.4921,31.2272", "风景名胜;公园广场;园林", { rating: "4.7", cost: "40" }),
  P("B0FFS3", "上海虹桥站", "Shang Hai Hong Qiao Zhan", "上海市闵行区申贵路1500号", "121.3200,31.1940", "交通设施服务;火车站;火车站"),
  P("B0FFS4", "浦东国际机场", "Pu Dong Guo Ji Ji Chang", "上海市浦东新区迎宾大道", "121.8053,31.1443", "交通设施服务;机场相关;飞机场"),
];

export function places(keywords?: string, types?: string): Place[] {
  if (types?.startsWith("10") || /酒店|hotel/i.test(keywords ?? "")) return HOTELS;
  const k = keywords?.toLowerCase() ?? "";
  const hits = SIGHTS.filter((p) => p.name.includes(k) || p.pinyin.toLowerCase().includes(k));
  return hits.length ? hits : SIGHTS;
}

export const regeo = { address: "上海市黄浦区南京东路街道人民广场", city: "上海市", citycode: "021", adcode: "310101" };

export const routes: RouteOption[] = [
  {
    mode: "transit", minutes: 24, meters: 4300, priceCny: 3,
    summary: "Metro Line 2 → Metro Line 10",
    steps: [
      { kind: "walk", text: "Walk 350 m" },
      { kind: "subway", text: "Metro Line 2: Ren Min Guang Chang → Nan Jing Dong Lu (1 stops)", zh: "地铁2号线：人民广场 → 南京东路" },
      { kind: "subway", text: "Metro Line 10: Nan Jing Dong Lu → Yu Yuan (1 stops)", zh: "地铁10号线：南京东路 → 豫园" },
      { kind: "walk", text: "Walk 420 m" },
    ],
  },
  { mode: "walking", minutes: 38, meters: 2900, summary: "Walk", steps: [] },
  { mode: "driving", minutes: 14, meters: 3800, priceCny: 18, summary: "Taxi / DiDi", steps: [] },
];

export const weather = {
  city: "上海市",
  casts: [
    { date: "2026-10-23", dayweather: "晴", daytemp: "23", nighttemp: "16" },
    { date: "2026-10-24", dayweather: "多云", daytemp: "22", nighttemp: "17" },
    { date: "2026-10-25", dayweather: "小雨", daytemp: "19", nighttemp: "15" },
    { date: "2026-10-26", dayweather: "阴", daytemp: "20", nighttemp: "14" },
  ],
};

export const menu: Menu = {
  restaurant_type: "Sichuan",
  tips: [
    "Sichuan dishes marked with chili icons are numbing-spicy (麻辣). Say 微辣 (wēi là) for mild.",
    "Rice (米饭) is usually ordered separately, per bowl.",
  ],
  dishes: [
    {
      original: "宫保鸡丁", pinyin: "gōng bǎo jī dīng", translated: "Kung Pao Chicken", literal: "Palace-guardian chicken cubes",
      description: "Diced chicken stir-fried with roasted peanuts, dried chilies and Sichuan pepper in a sweet-sour-savory sauce.",
      category: "Meat", price: "¥48/份",
      ingredients: [
        { name: "Chicken thigh", zh: "鸡腿肉", source: "standard_recipe" },
        { name: "Roasted peanuts", zh: "花生米", source: "standard_recipe" },
        { name: "Dried chili", zh: "干辣椒", source: "standard_recipe" },
        { name: "Sichuan peppercorn", zh: "花椒", source: "standard_recipe" },
        { name: "Soy sauce", zh: "酱油", source: "standard_recipe" },
        { name: "Shaoxing wine", zh: "料酒", source: "standard_recipe" },
        { name: "Black vinegar, sugar, starch", zh: "香醋、白糖、淀粉", source: "standard_recipe" },
      ],
      allergens: ["peanut", "soy", "gluten", "sulphites"], meat: ["chicken"], vegetarian: false, contains_alcohol: true,
      spice_level: 2, confidence: "high", notes: "Can be ordered without peanuts: 不要花生 (bú yào huāshēng), but cross-contact is likely.",
    },
    {
      original: "麻婆豆腐", pinyin: "má pó dòu fu", translated: "Mapo Tofu", literal: "Pockmarked old lady's tofu",
      description: "Soft tofu simmered in a fiery, numbing sauce of chili bean paste with minced beef.",
      category: "Tofu", price: "¥32/份",
      ingredients: [
        { name: "Silken tofu", zh: "嫩豆腐", source: "standard_recipe" },
        { name: "Minced beef (sometimes pork)", zh: "牛肉末", source: "standard_recipe" },
        { name: "Chili bean paste (Pixian doubanjiang)", zh: "郫县豆瓣酱", source: "standard_recipe" },
        { name: "Fermented black beans", zh: "豆豉", source: "standard_recipe" },
        { name: "Sichuan peppercorn powder", zh: "花椒粉", source: "standard_recipe" },
      ],
      allergens: ["soy", "gluten"], meat: ["beef"], vegetarian: false, contains_alcohol: false,
      spice_level: 3, confidence: "high", notes: "Not vegetarian by default. Ask for 素麻婆豆腐 (no meat).",
    },
    {
      original: "蚂蚁上树", pinyin: "mǎ yǐ shàng shù", translated: "Glass Noodles with Minced Pork", literal: "Ants climbing a tree",
      description: "Mung-bean glass noodles braised with minced pork and chili bean paste. No ants — the pork bits look like ants on branches.",
      category: "Noodles", price: "¥28/份",
      ingredients: [
        { name: "Mung bean glass noodles", zh: "粉丝", source: "standard_recipe" },
        { name: "Minced pork", zh: "猪肉末", source: "standard_recipe" },
        { name: "Chili bean paste", zh: "豆瓣酱", source: "standard_recipe" },
        { name: "Soy sauce", zh: "酱油", source: "standard_recipe" },
      ],
      allergens: ["soy", "gluten"], meat: ["pork"], vegetarian: false, contains_alcohol: false,
      spice_level: 1, confidence: "high", notes: "",
    },
    {
      original: "清炒时蔬", pinyin: "qīng chǎo shí shū", translated: "Stir-fried Seasonal Greens", literal: "Plain-fried seasonal vegetables",
      description: "Whatever green vegetable is in season, quickly stir-fried with garlic and salt.",
      category: "Vegetables", price: "¥22/份",
      ingredients: [
        { name: "Seasonal greens (bok choy, water spinach…)", zh: "时令青菜", source: "standard_recipe" },
        { name: "Garlic", zh: "大蒜", source: "standard_recipe" },
        { name: "Vegetable oil, salt", zh: "植物油、盐", source: "standard_recipe" },
      ],
      allergens: ["msg"], meat: [], vegetarian: true, contains_alcohol: false,
      spice_level: 0, confidence: "medium", notes: "Some kitchens use lard or chicken powder; ask for 不放猪油和鸡精 if strict vegetarian.",
    },
  ],
};
