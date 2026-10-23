"use client";
// Ticket-release alarms the traveller has set, kept in this browser only (ctg.reminders).
export type Reminder = { id: string; visit: string; at: string };
const KEY = "ctg.reminders";

export function getReminders(): Reminder[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}
export function saveReminder(r: Reminder) {
  const all = getReminders().filter((x) => !(x.id === r.id && x.visit === r.visit));
  try { localStorage.setItem(KEY, JSON.stringify([...all, r].sort((a, b) => a.at.localeCompare(b.at)))); } catch {}
}
/** Releases within the next 48 hours, or that opened less than an hour ago. */
export function upcomingReminders(now = Date.now()) {
  return getReminders().filter((r) => { const t = Date.parse(r.at); return t > now - 36e5 && t < now + 48 * 36e5; });
}
