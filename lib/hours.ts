// Amap opening hours ("周一至周日 11:00-14:00,17:00-21:30") in the traveller's language. Only the
// common words are translated; anything else left in Chinese returns null so the caller can show
// the original (staff can read it) instead of a half-translated line.
const WEEKDAY = "一二三四五六日";

export function formatHours(raw: string | undefined, lang: string, words: { daily: string; closed: string }) {
  if (!raw?.trim()) return null;
  const day = (i: number) => new Intl.DateTimeFormat(lang, { weekday: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2024, 0, 1 + i))); // 2024-01-01 was a Monday
  const out = raw
    .replace(/(?:周|星期)([一二三四五六日天])/g, (_, d: string) => day(d === "天" ? 6 : WEEKDAY.indexOf(d)))
    .replace(/\s*(至|到|~|～)\s*/g, "–")
    .replace(/(每天|每日|全周|周一至周日)/g, words.daily)
    .replace(/(全天|24小时)(营业)?/g, "24 h")
    .replace(/营业/g, "")
    .replace(/\s*(休息|休业|闭店|不营业)/g, ` ${words.closed}`)
    .replace(/[；;]\s*/g, "; ").replace(/[，、]\s*/g, ", ")
    .replace(/\s+/g, " ").trim();
  return /[一-龥]/.test(out) ? null : out;
}
