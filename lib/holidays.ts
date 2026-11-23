// China's public holidays, for "this is a very busy time" and train-ticket reminders on Today.
// Days are the legal ones from the 全国年节及纪念日放假办法 (revised, in force 2025-01-01): New Year
// 1, Spring Festival 4 (eve + first three days), Qingming 1, Labour Day 2, Dragon Boat 1,
// Mid-Autumn 1, National Day 3. The State Council publishes the full breaks (longer, with swapped
// workdays) each November; `days` below are the official 2027 breaks from 国办发明电〔2026〕10号
// (2026-11-05, https://www.news.cn/politics/20261105/f90cd6ad4df94ab4833b141e52ccfc13/c.html).
// Swapped workdays (not shown): 1-31, 2-14, 5-8, 9-26, 10-9. For 2028, set OFFICIAL to false with
// the legal days until the next notice, then replace them again.

export const HOLIDAYS_CHECKED = "2026-11-23";
/** True once the State Council's notice for these dates is in `days`. */
export const OFFICIAL = true;

export type HolidayId = "newYear" | "spring" | "qingming" | "labour" | "dragon" | "midAutumn" | "national";
export type Holiday = { id: HolidayId; zh: string; days: [string, string] };

/** The three week-long rushes; the others are short breaks that crowd sights but not the whole country. */
export const isMajor = (h: Holiday) => h.id === "spring" || h.id === "labour" || h.id === "national";

export const HOLIDAYS: Holiday[] = [
  { id: "newYear", zh: "元旦", days: ["2027-01-01", "2027-01-03"] },
  { id: "spring", zh: "春节", days: ["2027-02-05", "2027-02-13"] },
  { id: "qingming", zh: "清明节", days: ["2027-04-03", "2027-04-05"] },
  { id: "labour", zh: "劳动节", days: ["2027-05-01", "2027-05-05"] },
  { id: "dragon", zh: "端午节", days: ["2027-06-09", "2027-06-09"] },
  { id: "midAutumn", zh: "中秋节", days: ["2027-09-15", "2027-09-15"] },
  { id: "national", zh: "国庆节", days: ["2027-10-01", "2027-10-07"] },
];

const DAY = 864e5;
const num = (iso: string) => Math.floor(Date.parse(`${iso}T00:00:00Z`) / DAY);
const iso = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);

/**
 * When it's busy: the break plus the travel rush around it. With the official break in `days` that's
 * a day either side (the Spring Festival rush runs weeks: 10 days before, 7 after). With legal days
 * only, the pads also cover the rest of the likely break (golden weeks run ~7 days).
 */
export function busyRange(h: Holiday): [string, string] {
  const [a, b] = [num(h.days[0]), num(h.days[1])];
  const pad = OFFICIAL
    ? (h.id === "spring" ? [10, 7] : [1, 1])
    : (h.id === "spring" ? [10, 10] : h.id === "national" || h.id === "labour" ? [1, 5] : [1, 2]);
  return [iso(a - pad[0]), iso(b + pad[1])];
}

/**
 * Holidays to warn about: those whose busy time overlaps the trip, or — without trip dates — those
 * starting within the next 45 days. At most two, soonest first.
 */
export function holidaysAhead(today: string, trip?: { from: string; to: string }) {
  const t = num(today);
  return HOLIDAYS.filter((h) => {
    const [a, b] = busyRange(h).map(num);
    if (b < t) return false;
    if (trip?.from && trip.to) return a <= num(trip.to) && b >= num(trip.from);
    return a - t <= 45;
  }).slice(0, 2);
}

/** China Railway sells tickets 15 days before travel (each station opens at its own hour). */
export const TRAIN_PRESALE_DAYS = 15;
export const trainSaleDay = (travel: string) => iso(num(travel) - TRAIN_PRESALE_DAYS);
