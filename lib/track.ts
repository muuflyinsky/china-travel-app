// Anonymous product events (SPEC v0.5 P2). No personal data: an event name, a few small
// properties (card type, tier, position…) and a random id that changes every day, so we can count
// how often one phone uses a feature in a day (to set free daily limits) but never follow it across
// days. Nothing about allergies, dates or locations is sent.
export const EVENTS = [
  "menu_scan", "order_card_shown", "staff_reply", "taxi_card_shown", "hotel_card_shown",
  "hotel_pick_click", "resv_alarm_added", "app_open", "menu_first_dish", "menu_done", "dish_flagged", "restaurant_open",
  "dish_detail", "translate", "hotel_read",
] as const;
export type EventName = (typeof EVENTS)[number];

/** Random id for today, made anew on the first event of each local day. */
function dayId() {
  const today = new Date().toLocaleDateString("en-CA");
  try {
    const saved = JSON.parse(localStorage.getItem("ctg.day") ?? "null") as { d: string; id: string } | null;
    if (saved?.d === today) return saved.id;
    const id = Math.random().toString(36).slice(2, 10);
    localStorage.setItem("ctg.day", JSON.stringify({ d: today, id }));
    return id;
  } catch { return ""; }
}

export function track(e: EventName, p: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  const sid = dayId();
  const body = JSON.stringify({ e, p, sid });
  try {
    if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "application/json" }))) {
      fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  } catch {}
}
