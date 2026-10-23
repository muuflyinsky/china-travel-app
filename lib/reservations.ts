// Sights that need an advance, real-name reservation: when tickets open and how foreigners book.
//
// SOURCE — "Awesome China Travel Booking" by Xiaocong (Simple China Trip),
// https://github.com/caistrong/awesome-china-travel-booking, licensed CC BY 4.0. The author checked
// the facts on official sites on 5–8 October 2026. We only restructure them; we never generate
// release times. Re-import when the upstream README changes, and update CHECKED.
//
// Release rule: tickets for visit day D go on sale `days` before D, at `time` Beijing time
// (UTC+8). Without a fixed time, booking simply opens about `days` ahead.

export const RESERVATION_SOURCE = {
  name: "Awesome China Travel Booking (Xiaocong, Simple China Trip)",
  url: "https://github.com/caistrong/awesome-china-travel-booking",
  license: "CC BY 4.0",
  checked: "2026-10-08",
};

export type Channel = "official" | "trip" | "wechat" | "alipay_wechat" | "hotel" | "agency";

export type Reservation = {
  id: string;
  city: string; // adcode
  zh: string;
  en: string;
  /** Fragments that identify this sight in an Amap POI name; `not` excludes look-alikes. */
  match: string[];
  not?: string[];
  release: { days: number; time?: string } | null;
  channel: Channel;
  url?: string; // official booking site, when there is a web one
  noSameDay?: boolean;
  closedMondays?: boolean;
  noShow?: { count: number; windowDays?: number; banDays: number };
  guide: string;
};

const G = "https://simplechinatrip.com/guides/";

export const RESERVATIONS: Reservation[] = [
  { id: "forbidden_city", city: "110000", zh: "故宫博物院", en: "Forbidden City (Palace Museum)", match: ["故宫"],
    release: { days: 7, time: "20:00" }, channel: "official", url: "https://bookingticket.dpm.org.cn", noSameDay: true, closedMondays: true,
    noShow: { count: 3, windowDays: 180, banDays: 60 }, guide: `${G}forbidden-city-tickets-foreigners/` },
  { id: "national_museum", city: "110000", zh: "中国国家博物馆", en: "National Museum of China", match: ["国家博物馆"],
    release: { days: 7, time: "17:00" }, channel: "official", url: "https://pcticket.chnmuseum.cn/museum-en", guide: `${G}national-museum-china-reservation-passport/` },
  { id: "tiananmen", city: "110000", zh: "天安门广场", en: "Tiananmen Square", match: ["天安门广场"],
    release: { days: 7, time: "12:00" }, channel: "hotel", guide: `${G}tiananmen-square-reservation-foreigners/` },
  { id: "mutianyu", city: "110000", zh: "慕田峪长城", en: "Mutianyu Great Wall", match: ["慕田峪"],
    release: { days: 15 }, channel: "official", url: "https://en.mutianyugreatwall.com", guide: `${G}mutianyu-great-wall-tickets-foreigners/` },
  { id: "shanghai_museum", city: "310000", zh: "上海博物馆（人民广场馆）", en: "Shanghai Museum (People's Square)", match: ["上海博物馆"], not: ["东馆"],
    release: null, channel: "trip", closedMondays: true, guide: `${G}shanghai-museum-tickets-foreigners/` },
  { id: "terracotta", city: "610100", zh: "秦始皇帝陵博物院（兵马俑）", en: "Terracotta Army", match: ["兵马俑", "秦始皇帝陵"],
    release: null, channel: "trip", guide: `${G}terracotta-army-tickets-foreigners/` },
  { id: "shaanxi_history", city: "610100", zh: "陕西历史博物馆", en: "Shaanxi History Museum", match: ["陕西历史博物馆"],
    release: { days: 5, time: "17:00" }, channel: "wechat", noShow: { count: 1, banDays: 180 }, guide: `${G}shaanxi-history-museum-tickets-foreigners/` },
  { id: "panda_base", city: "510100", zh: "成都大熊猫繁育研究基地", en: "Chengdu Panda Base", match: ["大熊猫繁育研究基地", "熊猫基地"],
    release: { days: 14 }, channel: "trip", guide: `${G}chengdu-panda-base-tickets-foreigners/` },
  { id: "lingyin", city: "330100", zh: "灵隐寺 / 飞来峰", en: "Lingyin Temple / Feilai Feng", match: ["灵隐", "飞来峰"],
    release: { days: 7, time: "08:00" }, channel: "alipay_wechat", noSameDay: true, guide: `${G}lingyin-temple-tickets-foreigners/` },
  { id: "nanjing_museum", city: "320100", zh: "南京博物院", en: "Nanjing Museum", match: ["南京博物院"],
    release: { days: 7, time: "18:00" }, channel: "wechat", guide: `${G}nanjing-museum-tickets-foreigners/` },
  { id: "potala", city: "540100", zh: "布达拉宫", en: "Potala Palace", match: ["布达拉宫"],
    release: { days: 10 }, channel: "agency", guide: `${RESERVATION_SOURCE.url}#tibet` },
];

export function reservationFor(city: string, poiName: string) {
  return RESERVATIONS.find((r) => r.city === city && r.match.some((m) => poiName.includes(m)) && !r.not?.some((n) => poiName.includes(n)));
}

/** When tickets for `visit` (YYYY-MM-DD) go on sale, as an absolute time. Without a fixed time: 09:00 Beijing. */
export function releaseAt(r: Reservation, visit: string): Date | null {
  if (!r.release) return null;
  const [y, m, d] = visit.split("-").map(Number);
  const [hh, mm] = (r.release.time ?? "09:00").split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, d - r.release.days, hh - 8, mm));
}
