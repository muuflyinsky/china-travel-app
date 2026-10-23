import { addDays, todayIso } from "./stay";

/**
 * Where the traveller is in their trip, worked out from dates and location — never asked.
 * - before:   arrival is in the future, not set, or the last trip is over
 * - arrival:  arrival day
 * - in_china: entered (or seen in China), not yet in the last 3 days
 * - leaving:  the last 3 days before departure
 */
export type Phase = "before" | "arrival" | "in_china" | "leaving";

export function tripPhase(
  p: { arrival: string; departure: string; entryDate: string; locatedInChina: boolean },
  today = todayIso(),
): Phase {
  const over = Boolean(p.departure && today > p.departure);
  if (p.departure && !over && today >= addDays(p.departure, -3) && (p.entryDate || (p.arrival && p.arrival <= today) || p.locatedInChina)) return "leaving";
  if (p.arrival === today) return "arrival";
  if (over) return "before";
  if (p.entryDate && p.entryDate <= today) return "in_china";
  if (p.arrival && p.arrival < today) return "in_china";
  if (p.locatedInChina) return "in_china";
  return "before";
}
