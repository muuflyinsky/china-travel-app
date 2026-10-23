/** One calendar event with an alarm, as an .ics file body. Times are UTC. */
export function icsEvent(o: { start: Date; minutes?: number; title: string; body: string; alarmBefore?: number; uid: string; url?: string }) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = new Date(o.start.getTime() + (o.minutes ?? 15) * 6e4);
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  return [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//China Travel Buddy//EN", "BEGIN:VEVENT",
    `UID:${o.uid}@china-travel-buddy`, `DTSTAMP:${stamp(new Date())}`, `DTSTART:${stamp(o.start)}`, `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(o.title)}`, `DESCRIPTION:${esc(o.body)}`, ...(o.url ? [`URL:${o.url}`] : []),
    "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(o.title)}`, `TRIGGER:-PT${o.alarmBefore ?? 10}M`, "END:VALARM",
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
}

export function downloadIcs(body: string, filename: string) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(new Blob([body], { type: "text/calendar" })), download: filename });
  a.click();
}
