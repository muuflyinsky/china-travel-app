// Free daily limits on the AI features (docs/MONETIZATION.md, DECISIONS D23). Off until QUOTA=on,
// which waits for iOS 1.1 (trial and passes) to be on sale. Counts live in Supabase (usage_counts);
// if it can't be reached the use is allowed, so an outage on our side never blocks a traveller.
// Not limited: a valid trip pass or trial token, an early device until 31 December (lib/early.ts),
// and an app build without the StoreKit plugin (none shipped: 1.0 already has it, so it counts as "app").
import { NextResponse } from "next/server";
import { FREE, type QuotaKind } from "./products";
import { passValid } from "./passes-server";
import { rest, supabaseOn } from "./supabase";
import { EARLY_FREE_UNTIL, beijingDay, earlyBefore, isEarly } from "./early";

// Early devices were promised free use until EARLY_FREE_UNTIL; without EARLY_BEFORE we can't tell
// them apart, so until then the limits stay off rather than break that promise.
const on = () => process.env.QUOTA === "on" && (earlyBefore() !== null || beijingDay() > EARLY_FREE_UNTIL);

/** The random id the app or website made for itself (lib/device.ts), or the IP without one. */
export function deviceOf(req: Request) {
  const d = req.headers.get("x-ctg-device") ?? "";
  if (/^[a-z0-9]{8,32}$/.test(d)) return d;
  return "ip:" + (req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown");
}

// An app build without the StoreKit plugin can't sell passes, so it isn't limited: the page tells us
// with x-ctg-client: app-old (lib/device.ts). Every shipped build, 1.0 included, has the plugin. Easy to fake, but the per-IP limits still cap a script.
// Stop honouring it once most phones have updated.
const limited = (req: Request) =>
  !(req.headers.get("x-ctg-client") === "app-old" && /ChinaTravelBuddy-iOS/.test(req.headers.get("user-agent") ?? ""));

const period = (kind: QuotaKind) => (FREE[kind].per === "ever" ? "ever" : beijingDay());

export type Use = { refund: () => Promise<void> };

/**
 * Counts one free use of an AI feature. Returns a 402 response to send back when today's free
 * uses are gone, otherwise a handle to give the use back if the AI call then fails.
 */
export async function useQuota(req: Request, kind: QuotaKind): Promise<NextResponse | Use> {
  const free: Use = { refund: async () => {} };
  if (!on() || !supabaseOn || !limited(req)) return free;
  const device = deviceOf(req);
  if (passValid(req.headers.get("x-ctg-pass"), device)) return free;
  if (isEarly(req.headers.get("x-ctg-since"), earlyBefore())) return free;
  const p = period(kind);
  const meal = kind === "menu_photo" ? FREE.menu_photo : null;
  // D23 3a: three menus a day once any allergy is saved. The limit is sent with each use, so saving
  // allergies after the first menu raises today's limit at once; nothing used is given back or reset.
  const max = meal && req.headers.get("x-ctg-allergies") === "1" ? meal.maxWithAllergies : FREE[kind].max;
  try {
    const ok = meal
      ? await rest("rpc/use_menu_photo", { method: "POST", body: JSON.stringify({ p_device: device, p_period: p, p_max: max, p_pages: meal.pages, p_minutes: meal.minutes }) })
      : await rest("rpc/use_quota", { method: "POST", body: JSON.stringify({ p_device: device, p_kind: kind, p_period: p, p_max: FREE[kind].max }) });
    if (ok === false) return NextResponse.json({ error: "quota", kind, max, per: FREE[kind].per }, { status: 402 });
  } catch (e) {
    console.error("[quota]", (e as Error).message);
    return free;
  }
  return {
    refund: async () => {
      const body = meal ? { p_device: device, p_period: p } : { p_device: device, p_kind: kind, p_period: p };
      await rest(meal ? "rpc/refund_menu_photo" : "rpc/refund_quota", { method: "POST", body: JSON.stringify(body) }).catch(() => {});
    },
  };
}

/** Daily counts older than 30 days are deleted (the daily cron); "ever" rows sort after dates and stay. */
export async function pruneUsage() {
  if (!supabaseOn) return;
  const cutoff = beijingDay(new Date(Date.now() - 30 * 86_400_000));
  await rest(`usage_counts?period=lt.${cutoff}`, { method: "DELETE" }).catch((e) => console.error("[quota] prune", (e as Error).message));
}
