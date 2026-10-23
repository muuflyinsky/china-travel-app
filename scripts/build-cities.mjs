// Builds lib/data/cities.json from the `china-division` dataset (MIT, National Bureau of
// Statistics codes). The dataset is 180 MB, so it is not a dependency; download it once:
//   npm pack china-division && tar xzf china-division-*.tgz
//   node scripts/build-cities.mjs ./package/dist
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pinyin } from "pinyin-pro";

const dir = process.argv[2];
if (!dir) throw new Error("usage: node scripts/build-cities.mjs <china-division/dist>");
const load = (f) => JSON.parse(readFileSync(join(dir, f), "utf8"));
const provinces = load("provinces.json");
const cities = load("cities.json");
const areas = load("areas.json");

const PROVINCE_EN = {
  北京市: "Beijing", 天津市: "Tianjin", 河北省: "Hebei", 山西省: "Shanxi", 内蒙古自治区: "Inner Mongolia",
  辽宁省: "Liaoning", 吉林省: "Jilin", 黑龙江省: "Heilongjiang", 上海市: "Shanghai", 江苏省: "Jiangsu",
  浙江省: "Zhejiang", 安徽省: "Anhui", 福建省: "Fujian", 江西省: "Jiangxi", 山东省: "Shandong",
  河南省: "Henan", 湖北省: "Hubei", 湖南省: "Hunan", 广东省: "Guangdong", 广西壮族自治区: "Guangxi",
  海南省: "Hainan", 重庆市: "Chongqing", 四川省: "Sichuan", 贵州省: "Guizhou", 云南省: "Yunnan",
  西藏自治区: "Tibet", 陕西省: "Shaanxi", 甘肃省: "Gansu", 青海省: "Qinghai", 宁夏回族自治区: "Ningxia",
  新疆维吾尔自治区: "Xinjiang",
};

// Established English names that differ from plain pinyin.
const EN_OVERRIDE = {
  呼和浩特: "Hohhot", 乌鲁木齐: "Urumqi", 拉萨: "Lhasa", 喀什: "Kashgar", 西双版纳: "Xishuangbanna",
  香格里拉: "Shangri-La", 日喀则: "Shigatse", 林芝: "Nyingchi", 吐鲁番: "Turpan", 和田: "Hotan",
  阿克苏: "Aksu", 伊犁: "Ili", 巴音郭楞: "Bayingolin", 包头: "Baotou", 鄂尔多斯: "Ordos",
  呼伦贝尔: "Hulunbuir", 锡林郭勒: "Xilingol", 甘孜: "Garze", 阿坝: "Ngawa", 迪庆: "Diqing",
  德宏: "Dehong", 大理: "Dali", 丽江: "Lijiang", 陕西: "Shaanxi", 塔什库尔干: "Tashkurgan",
  哈尔滨: "Harbin", 齐齐哈尔: "Qiqihar", 巴彦淖尔: "Bayannur", 克拉玛依: "Karamay", 阿勒泰: "Altay",
  博尔塔拉: "Bortala", 那曲: "Nagqu", 昌都: "Qamdo", 阿里: "Ngari", 果洛: "Golog", 稻城: "Daocheng",
};

// Names whose characters differ from the ethnic list (variant code points in the source data).
const SHORT_OVERRIDE = { 彭水苗族土家族自治县: "彭水", 西盟佤族自治县: "西盟" };

// The 56 recognised ethnic groups, longest first, so "西双版纳傣族自治州" → "西双版纳".
const ETHNIC = "蒙古 回 藏 维吾尔 苗 彝 壮 布依 朝鲜 满 侗 瑶 白 土家 哈尼 哈萨克 傣 黎 傈僳 佤 畲 高山 拉祜 水 东乡 纳西 景颇 柯尔克孜 土 达斡尔 仫佬 羌 布朗 撒拉 毛南 仡佬 锡伯 阿昌 普米 塔吉克 怒 乌孜别克 俄罗斯 鄂温克 德昂 保安 裕固 京 塔塔尔 独龙 鄂伦春 赫哲 门巴 珞巴 基诺"
  .split(" ")
  .sort((a, b) => b.length - a.length);
// "族" is sometimes omitted (伊犁哈萨克自治州) and "各族" means several groups (龙胜各族自治县).
const AUTONOMOUS = new RegExp(`(?:(?:${ETHNIC.join("|")}|各)族?)+(自治州|自治县|自治旗)$`);

const stripSuffix = (name) => {
  if (SHORT_OVERRIDE[name]) return SHORT_OVERRIDE[name];
  // When the place is named after the group itself (东乡族自治县), keep the group name.
  if (name.replace(AUTONOMOUS, "").length < 2) return name.replace(/族?(自治州|自治县|自治旗)$/, "");
  let s = name
    .replace(AUTONOMOUS, "")
    .replace(/(市|地区|盟|县|旗|林区|特区)$/, "");
  return s.length >= 2 ? s : name.replace(/(市|地区)$/, "");
};

const toEn = (short) => {
  if (EN_OVERRIDE[short]) return EN_OVERRIDE[short];
  const syl = pinyin(short, { toneType: "none", type: "array", v: true }).map((x) => x.replace("v", "u"));
  return syl
    .map((x, i) => (i > 0 && /^[aoe]/.test(x) ? "'" + x : x))
    .join("")
    .replace(/^./, (c) => c.toUpperCase());
};

const provByCode = Object.fromEntries(provinces.map((p) => [p.code, p.name]));
const out = [];
const add = (name, adcode, provinceName, type, parent) => {
  const s = stripSuffix(name);
  out.push({
    n: name,
    s,
    a: adcode,
    p: PROVINCE_EN[provinceName] ?? provinceName,
    e: toEn(s),
    py: pinyin(s, { toneType: "none", separator: "" }).replace(/v/g, "u"),
    t: type,
    ...(parent ? { c: parent, ce: toEn(parent) } : {}),
  });
};

for (const c of cities) {
  const prov = provByCode[c.provinceCode];
  if (c.name === "市辖区") add(prov, `${c.provinceCode}0000`, prov, "city"); // municipalities
  // "县" is Chongqing's grouping of its counties, not a place; the counties are added below.
  else if (!c.name.includes("直辖县级") && c.name !== "县") add(c.name, `${c.code}00`, prov, "city");
}
const cityName = Object.fromEntries(cities.map((c) => [c.code, c.name]));
for (const a of areas) {
  if (/区$/.test(a.name) && a.name !== "神农架林区") continue; // urban districts are not destinations
  const prov = provByCode[a.provinceCode];
  const parentRaw = cityName[a.cityCode];
  const direct = !parentRaw || parentRaw === "市辖区" || parentRaw === "县" || parentRaw.includes("直辖县级");
  const parent = direct ? (parentRaw === "市辖区" || parentRaw === "县" ? prov : undefined) : parentRaw;
  add(a.name, a.code, prov, direct && !parent ? "city" : "county", parent && stripSuffix(parent));
}

writeFileSync(new URL("../lib/data/cities.json", import.meta.url), JSON.stringify(out));
console.log(`${out.length} places (${out.filter((x) => x.t === "city").length} cities)`);
