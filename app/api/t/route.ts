import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { EVENTS } from "@/lib/track";

// Collects anonymous events from lib/track.ts into data/events.jsonl (or the server log on
// read-only hosts such as Vercel). Unknown events and non-primitive properties are dropped.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  if (!b || !EVENTS.includes(b.e)) return new NextResponse(null, { status: 204 });
  const p: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(b.p ?? {}).slice(0, 8)) {
    if (/^[a-z_]{1,20}$/.test(k) && ["string", "number", "boolean"].includes(typeof v)) p[k] = typeof v === "string" ? v.slice(0, 40) : (v as number | boolean);
  }
  const line = JSON.stringify({ ts: new Date().toISOString(), e: b.e, p, sid: String(b.sid ?? "").slice(0, 12) });
  try { await mkdir("data", { recursive: true }); await appendFile("data/events.jsonl", line + "\n"); } catch { console.log("event", line); }
  return new NextResponse(null, { status: 204 });
}
