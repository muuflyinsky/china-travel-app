// Free daily limits on the AI features (docs/MONETIZATION.md). Off until QUOTA=on, which waits
// for an app version that can sell passes. Counts live in Supabase (usage_counts); if it can't be
// reached the use is allowed, so an outage on our side never blocks a traveller.
import { NextResponse } from "next/server";
import { FREE, type QuotaKind } from "./products";
import { passValid } from "./passes-server";
import { rest, supabaseOn } from "./supabase";

const on = () => process.env.QUOTA === "on";

/** The random id the app or website made for itself (lib/device.ts), or the IP without one. */
export function deviceOf(req: Request) {
  const d = req.headers.get("x-ctg-device") ?? "";
  if (/^[a-z0-9]{8,32}$/.test(d)) return d;
  return "ip:" + (req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown");
}

// The first app version (1.0) can't sell passes, so it isn't limited: the page tells us with
// x-ctg-client: app-old (lib/device.ts). Easy to fake, but the per-IP limits still cap a script.
// Stop honouring it once most phones have updated.
const limited = (req: Request) =>
  !(req.headers.get("x-ctg-client") === "app-old" && /ChinaTravelBuddy-iOS/.test(req.headers.get("user-agent") ?? ""));

const period = (kind: QuotaKind) =>
  FREE[kind].per === "ever" ? "ever" : new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });

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
  const p = period(kind);
  try {
    const ok = await rest("rpc/use_quota", { method: "POST", body: JSON.stringify({ p_device: device, p_kind: kind, p_period: p, p_max: FREE[kind].max }) });
    if (ok === false) return NextResponse.json({ error: "quota", kind, max: FREE[kind].max, per: FREE[kind].per }, { status: 402 });
  } catch (e) {
    console.error("[quota]", (e as Error).message);
    return free;
  }
  return {
    refund: async () => {
      await rest("rpc/refund_quota", { method: "POST", body: JSON.stringify({ p_device: device, p_kind: kind, p_period: p }) }).catch(() => {});
    },
  };
}

/** Daily counts older than 30 days are deleted (the daily cron); "ever" rows sort after dates and stay. */
export async function pruneUsage() {
  if (!supabaseOn) return;
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });
  await rest(`usage_counts?period=lt.${cutoff}`, { method: "DELETE" }).catch((e) => console.error("[quota] prune", (e as Error).message));
}
