import { addDays, stayWindow, todayIso, type EntryType } from "./stay";

/**
 * Where the traveller is in their trip, worked out from dates and location — never asked.
 * - before:   arrival is in the future, not set, or the last trip is over
 * - arrival:  arrival day
 * - in_china: entered (or seen in China), not yet in the last 3 days
 * - leaving:  the last 3 days before leaving — the earlier of the planned departure and the
 *             latest legal exit day
 */
export type Phase = "before" | "arrival" | "in_china" | "leaving";

export function tripPhase(
  p: { arrival: string; departure: string; entryDate: string; locatedInChina: boolean; entryType: EntryType; visaDays: number },
  today = todayIso(),
): Phase {
  const over = Boolean(p.departure && today > p.departure);
  const w = stayWindow(p, new Date(`${today}T12:00:00`));
  const inChina = Boolean(p.entryDate || (p.arrival && p.arrival <= today) || p.locatedInChina);
  if (w && !over && inChina && today >= addDays(w.lastDay, -3) && today <= w.lastDay) return "leaving";
  if (p.arrival === today) return "arrival";
  if (over) return "before";
  if (p.entryDate && p.entryDate <= today) return "in_china";
  if (p.arrival && p.arrival < today) return "in_china";
  if (p.locatedInChina) return "in_china";
  return "before";
}
