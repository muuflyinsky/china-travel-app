// Anonymous product events (SPEC v0.5 P2). No personal data: an event name, a few small
// properties (card type, tier, position…) and a random per-session id that is never stored
// beyond the browser tab. Nothing about allergies, dates or locations is sent.
export const EVENTS = [
  "menu_scan", "order_card_shown", "staff_reply", "taxi_card_shown", "hotel_card_shown",
  "hotel_pick_click", "resv_alarm_added", "app_open", "menu_first_dish", "menu_done", "dish_flagged", "restaurant_open",
] as const;
export type EventName = (typeof EVENTS)[number];

let sid = "";
export function track(e: EventName, p: Record<string, string | number | boolean> = {}) {
  if (typeof window === "undefined") return;
  try {
    sid ||= sessionStorage.getItem("ctg.sid") ?? "";
    if (!sid) { sid = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("ctg.sid", sid); }
  } catch {}
  const body = JSON.stringify({ e, p, sid });
  try {
    if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "application/json" }))) {
      fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => {});
    }
  } catch {}
}
