// How long a traveller may stay, from the entry date and the kind of entry.
// China counts the permitted stay from 00:00 on the day AFTER entry, so a 30-day stay that
// starts on 1 May ends at 24:00 on 31 May. Always double-check the date on the entry stamp.
export type EntryType = "visa_free_30" | "transit_240" | "visa";

export const ENTRY_DAYS: Record<Exclude<EntryType, "visa">, number> = {
  visa_free_30: 30,
  transit_240: 10, // 240 hours = 10 full days from 00:00 the day after entry
};

// Calendar-day arithmetic in UTC. Local-time Date maths drifts by a day across daylight-saving
// changes (a 30-day stay from 18 Oct came out as 16 Nov instead of 17 Nov in Europe).
const DAY = 864e5;
const dayNum = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY;
};
const fromDayNum = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);

/** Today's date on the traveller's device, as YYYY-MM-DD. */
export const todayIso = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
export const addDays = (iso: string, n: number) => fromDayNum(dayNum(iso) + n);
export const daysBetween = (from: string, to: string) => dayNum(to) - dayNum(from);

export const allowedDays = (type: EntryType, visaDays: number) => (type === "visa" ? Math.max(1, visaDays) : ENTRY_DAYS[type]);

type TripDates = { entryDate: string; arrival: string; departure: string; entryType: EntryType; visaDays: number };

/**
 * The stay that counts (SPEC v0.5 · P0-6). `legal` is the latest legal exit day, from the entry
 * date — or the planned arrival before entry. `lastDay` is the earlier of `legal` and the
 * planned departure: countdowns, the "leaving" phase and calendar reminders use it, never the
 * departure date alone. `overstay` = the planned departure is after the legal limit.
 */
export function stayWindow(p: TripDates, today = new Date()) {
  const base = p.entryDate || p.arrival;
  if (!base) return null;
  const allowed = allowedDays(p.entryType, p.visaDays);
  const legal = addDays(base, allowed);
  const overstay = Boolean(p.departure && p.departure > legal);
  const lastDay = p.departure && p.departure < legal ? p.departure : legal;
  const now = todayIso(today);
  return {
    base, allowed, legal, lastDay, overstay, planned: p.departure,
    entered: Boolean(p.entryDate),
    daysLeft: daysBetween(now, lastDay),
    dayOfStay: daysBetween(base, now) + 1,
    overdue: daysBetween(now, legal) < 0,
  };
}

export function stayStatus(entryDate: string, type: EntryType, visaDays: number, today = new Date()) {
  if (!entryDate) return null;
  const days = type === "visa" ? Math.max(1, visaDays) : ENTRY_DAYS[type];
  const lastDay = addDays(entryDate, days); // must leave by 24:00 on this date
  const now = todayIso(today);
  const daysLeft = daysBetween(now, lastDay);
  const dayOfStay = daysBetween(entryDate, now) + 1;
  return { lastDay, daysLeft, dayOfStay, allowed: days, overdue: daysLeft < 0 };
}

/** A calendar file with two alerts: 3 days before and on the last day. */
export function stayReminderIcs(lastDay: string, title: string, description: string) {
  const d = lastDay.replaceAll("-", "");
  const next = addDays(lastDay, 1).replaceAll("-", "");
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
