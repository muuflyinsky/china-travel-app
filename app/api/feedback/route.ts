import { NextResponse } from "next/server";
import { review } from "@/lib/city-guide";
import { logRow } from "@/lib/supabase";

const KINDS = ["sight", "guide_dish", "menu_dish", "resv"];
const VOTES = ["yes", "no"];
const REPORTS = ["outdated", "wrong"];

// Feedback on one piece of content (components/Feedback.tsx): helpful yes/no, or a report that
// it's outdated or wrong. Only content ids, nothing about the traveller.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const s = (v: unknown, n = 80) => (typeof v === "string" && v ? v.slice(0, n) : null);
  const one = (v: unknown, list: string[]) => (typeof v === "string" && list.includes(v) ? v : null);
  const kind = one(b?.kind, KINDS), item = s(b?.id), version = s(b?.version, 40);
  const vote = one(b?.vote, VOTES), prev = one(b?.prev, VOTES), report = one(b?.report, REPORTS);
  if (!kind || !item || !version || !(vote || report)) return NextResponse.json({ error: "kind, id, version and a vote or report required" }, { status: 400 });
  const row = { kind, item, version, vote, prev, report, city: s(b.city, 12), lang: s(b.lang, 8) };
  await logRow("content_feedback", row);
  // City-guide items that miss the mark go to the review queue, as 👎 did before.
  if ((vote === "no" || report) && (kind === "sight" || kind === "guide_dish")) {
    await review(null, { kind, city: row.city, name: item, lang: row.lang, reason: report ?? "thumbs_down" });
  }
  return NextResponse.json({ ok: true });
}
