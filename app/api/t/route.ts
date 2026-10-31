import { NextResponse } from "next/server";
import { EVENTS } from "@/lib/track";
import { logRow } from "@/lib/supabase";
import { allowed } from "@/lib/rate-limit";

// Collects anonymous events from lib/track.ts: into Supabase when it is configured, otherwise
// data/events.jsonl (or the server log on read-only hosts such as Vercel). Unknown events and
// non-primitive properties are dropped.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  // Over the limit: answered the same way, just not stored, so the page never notices.
  if (!b || !EVENTS.includes(b.e) || !allowed(req, "events")) return new NextResponse(null, { status: 204 });
  const p: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(b.p ?? {}).slice(0, 8)) {
    if (/^[a-z_]{1,20}$/.test(k) && ["string", "number", "boolean"].includes(typeof v)) p[k] = typeof v === "string" ? v.slice(0, 40) : (v as number | boolean);
  }
  await logRow("events", { e: b.e, p, sid: String(b.sid ?? "").slice(0, 12) });
  return new NextResponse(null, { status: 204 });
}
