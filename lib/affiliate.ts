import { config } from "./config";

/**
 * Affiliate deep links. All outbound booking links go through /api/go so every click is
 * logged with a sub-id (trip_sub1) and commission can be reconciled against the partner report.
 *
 * Trip.com (携程国际站) is the primary partner for foreigners: English UI, foreign cards,
 * passport booking, and a filter for hotels that accept foreign guests.
 * Fliggy (飞猪) needs a Taobao account and Chinese UI, so it is the secondary option,
 * mainly for overseas Chinese / bilingual users.
 *
 * URL templates were taken from the public sites; confirm them with the link generator
 * in each affiliate backend before launch, since partners change paths.
 */

// Trip.com / Ctrip city IDs for the main inbound cities.
export const TRIP_CITY_ID: Record<string, number> = {
  北京: 1, 上海: 2, 天津: 3, 重庆: 4, 西安: 10, 南京: 12, 苏州: 14, 杭州: 17,
  厦门: 25, 成都: 28, 深圳: 30, 广州: 32, 桂林: 33, 昆明: 34, 三亚: 43, 青岛: 7,
  大连: 6, 哈尔滨: 5, 长沙: 206, 张家界: 27, 丽江: 37, 拉萨: 41, 武汉: 477,
};

export const CITY_EN: Record<string, string> = {
  北京: "Beijing", 上海: "Shanghai", 天津: "Tianjin", 重庆: "Chongqing", 西安: "Xi'an", 南京: "Nanjing",
  苏州: "Suzhou", 杭州: "Hangzhou", 厦门: "Xiamen", 成都: "Chengdu", 深圳: "Shenzhen", 广州: "Guangzhou",
  桂林: "Guilin", 昆明: "Kunming", 三亚: "Sanya", 青岛: "Qingdao", 大连: "Dalian", 哈尔滨: "Harbin",
  长沙: "Changsha", 张家界: "Zhangjiajie", 丽江: "Lijiang", 拉萨: "Lhasa", 武汉: "Wuhan",
};

const cityKey = (c: string) => c.replace(/市$/, "");

type Partner = "trip" | "fliggy" | "airalo";
export type LinkKind = "hotel_list" | "hotel_search" | "train" | "flight" | "attraction" | "esim";

export type LinkParams = {
  city?: string; // Chinese city name
  cityEn?: string; // English name, used when the city has no Trip.com ID in TRIP_CITY_ID
  keyword?: string;
  checkin?: string; // YYYY-MM-DD
  checkout?: string;
  adults?: number;
  from?: string;
  to?: string;
  date?: string;
};

function withTripAffiliate(url: URL, sub: string) {
  if (config.trip.allianceId) url.searchParams.set("Allianceid", config.trip.allianceId);
  if (config.trip.sid) url.searchParams.set("SID", config.trip.sid);
  url.searchParams.set("trip_sub1", sub); // our click id → appears in the Trip.com order report
  if (config.trip.sub3) url.searchParams.set("trip_sub3", config.trip.sub3);
  return url;
}

export function buildPartnerUrl(partner: Partner, kind: LinkKind, p: LinkParams, sub: string): string {
  const host = `https://${config.trip.host}`;
  if (partner === "trip") {
    let u: URL;
    const city = p.city ? cityKey(p.city) : "";
    switch (kind) {
      case "hotel_list":
      case "hotel_search": {
        u = new URL(`${host}/hotels/list`);
        const id = TRIP_CITY_ID[city];
        if (id) u.searchParams.set("city", String(id));
        if (kind === "hotel_search" && p.keyword) u.searchParams.set("keyword", p.keyword);
        else if (!id && city) u.searchParams.set("keyword", p.cityEn ?? CITY_EN[city] ?? city);
        if (p.checkin) u.searchParams.set("checkin", p.checkin.replaceAll("-", "/"));
        if (p.checkout) u.searchParams.set("checkout", p.checkout.replaceAll("-", "/"));
        u.searchParams.set("adult", String(p.adults ?? 2));
        u.searchParams.set("crn", "1");
        break;
      }
      case "train":
        u = new URL(`${host}/trains/china/list`);
        if (p.from) u.searchParams.set("departurecity", p.from);
        if (p.to) u.searchParams.set("arrivalcity", p.to);
        if (p.date) u.searchParams.set("departdate", p.date);
        break;
      case "flight":
        u = new URL(`${host}/flights/`);
        if (p.from) u.searchParams.set("dcity", p.from);
        if (p.to) u.searchParams.set("acity", p.to);
        if (p.date) u.searchParams.set("ddate", p.date);
        break;
      case "attraction":
        u = new URL(`${host}/things-to-do/list`);
        u.searchParams.set("keyword", p.keyword ?? p.cityEn ?? CITY_EN[city] ?? city);
        break;
      default:
        u = new URL(host);
    }
    return withTripAffiliate(u, sub).toString();
  }

  if (partner === "fliggy") {
    // Production: convert this URL to an s.click.taobao.com 淘宝客 link with the
    // Taobao Union API (taobao.tbk.* link convert) using FLIGGY_PID. The raw URL is used as a fallback.
    const u = new URL("https://hotel.fliggy.com/hotel_list3.htm");
    if (p.city) u.searchParams.set("cityName", cityKey(p.city));
    if (p.keyword) u.searchParams.set("keywords", p.keyword);
    if (p.checkin) u.searchParams.set("checkIn", p.checkin);
    if (p.checkout) u.searchParams.set("checkOut", p.checkout);
    if (config.fliggyPid) u.searchParams.set("pid", config.fliggyPid);
    return u.toString();
  }

  const u = new URL("https://www.airalo.com/china-esim");
  if (config.airaloRef) u.searchParams.set("ref", config.airaloRef);
  return u.toString();
}

/** Client-side helper: link to our tracked redirect. */
export function goLink(partner: Partner, kind: LinkKind, p: LinkParams, src: string) {
  const qs = new URLSearchParams({ partner, kind, src });
  for (const [k, v] of Object.entries(p)) if (v !== undefined && v !== "") qs.set(k, String(v));
  return `/api/go?${qs}`;
}
