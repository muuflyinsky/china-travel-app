import { NextResponse } from "next/server";
import { appendFile, mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { buildPartnerUrl, type LinkKind, type LinkParams } from "@/lib/affiliate";

const PARTNERS = ["trip", "fliggy", "airalo"] as const;
const KINDS: LinkKind[] = ["hotel_list", "hotel_search", "train", "flight", "attraction", "esim"];

// Tracked affiliate redirect. Only builds URLs for known partners, so it is not an open redirect.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const partner = q.get("partner") as (typeof PARTNERS)[number];
  const kind = q.get("kind") as LinkKind;
  if (!PARTNERS.includes(partner) || !KINDS.includes(kind)) return NextResponse.json({ error: "bad partner/kind" }, { status: 400 });

  const p: LinkParams = {
    city: q.get("city") ?? undefined, keyword: q.get("keyword") ?? undefined,
    checkin: q.get("checkin") ?? undefined, checkout: q.get("checkout") ?? undefined,
    adults: q.get("adults") ? Number(q.get("adults")) : undefined,
    from: q.get("from") ?? undefined, to: q.get("to") ?? undefined, date: q.get("date") ?? undefined,
  };
  const clickId = randomUUID().replaceAll("-", "").slice(0, 12);
  const url = buildPartnerUrl(partner, kind, p, clickId);

  // Click log for commission reconciliation. Swap for a database / analytics in production.
  const row = { ts: new Date().toISOString(), clickId, partner, kind, src: q.get("src"), ...p, ua: req.headers.get("user-agent") };
  try {
    await mkdir("data", { recursive: true });
    await appendFile("data/clicks.jsonl", JSON.stringify(row) + "\n");
  } catch {
    console.log("click", row);
  }
  return NextResponse.redirect(url, 302);
}
