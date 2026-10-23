// How long a traveller may stay, from the entry date and the kind of entry.
// China counts the permitted stay from 00:00 on the day AFTER entry, so a 30-day stay that
// starts on 1 May ends at 24:00 on 31 May. Always double-check the date on the entry stamp.
export type EntryType = "visa_free_30" | "transit_240" | "visa";

export const ENTRY_DAYS: Record<Exclude<EntryType, "visa">, number> = {
  visa_free_30: 30,
  transit_240: 10, // 240 hours = 10 full days from 00:00 the day after entry
};

const DAY = 864e5;
const parse = (iso: string) => new Date(`${iso}T00:00:00`);
const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function stayStatus(entryDate: string, type: EntryType, visaDays: number, today = new Date()) {
  if (!entryDate) return null;
  const days = type === "visa" ? Math.max(1, visaDays) : ENTRY_DAYS[type];
  const entry = parse(entryDate);
  const lastDay = new Date(entry.getTime() + days * DAY); // must leave by 24:00 on this date
  const todayMid = parse(iso(today));
  const daysLeft = Math.round((lastDay.getTime() - todayMid.getTime()) / DAY);
  const dayOfStay = Math.round((todayMid.getTime() - entry.getTime()) / DAY) + 1;
  return { lastDay: iso(lastDay), daysLeft, dayOfStay, allowed: days, overdue: daysLeft < 0 };
}

/** A calendar file with two alerts: 3 days before and on the last day. */
export function stayReminderIcs(lastDay: string, title: string, description: string) {
  const d = lastDay.replaceAll("-", "");
  const next = iso(new Date(parse(lastDay).getTime() + DAY)).replaceAll("-", "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//China Travel Buddy//EN", "BEGIN:VEVENT",
    `UID:stay-${d}@chinatravelbuddy`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${d}`, `DTEND;VALUE=DATE:${next}`,
    `SUMMARY:${title}`, `DESCRIPTION:${description}`,
    "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", `DESCRIPTION:${title}`, "END:VALARM",
    "BEGIN:VALARM", "TRIGGER:PT9H", "ACTION:DISPLAY", `DESCRIPTION:${title}`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}
