import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildPartnerUrl, type LinkKind, type LinkParams } from "@/lib/affiliate";
import { logRow } from "@/lib/supabase";

const clientType = (ua: string) =>
  /ChinaTravelBuddy-iOS/.test(ua) ? "ios-app" : /iPhone|iPad|iPod/.test(ua) ? "ios" : /Android/.test(ua) ? "android" : "desktop";

const PARTNERS = ["trip", "fliggy", "esim"] as const;
const KINDS: LinkKind[] = ["hotel_list", "hotel_search", "train", "flight", "attraction", "esim"];

// Tracked affiliate redirect. Only builds URLs for known partners, so it is not an open redirect.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const partner = q.get("partner") as (typeof PARTNERS)[number];
  const kind = q.get("kind") as LinkKind;
  if (!PARTNERS.includes(partner) || !KINDS.includes(kind)) return NextResponse.json({ error: "bad partner/kind" }, { status: 400 });

  const p: LinkParams = {
    city: q.get("city") ?? undefined, cityEn: q.get("cityEn") ?? undefined, keyword: q.get("keyword") ?? undefined,
    checkin: q.get("checkin") ?? undefined, checkout: q.get("checkout") ?? undefined,
    adults: q.get("adults") ? Number(q.get("adults")) : undefined,
    from: q.get("from") ?? undefined, to: q.get("to") ?? undefined, date: q.get("date") ?? undefined,
    provider: q.get("provider") ?? undefined,
  };
  const tag = q.get("tag") ?? "";
  const id = randomUUID().replaceAll("-", "").slice(0, 12);
  // trip_sub1 = "<placement tag>-<random id>", e.g. stay-comfort-1-3f9a0c2b7d1e
  const clickId = /^[a-z0-9-]{1,24}$/.test(tag) ? `${tag}-${id}` : id;
  const url = buildPartnerUrl(partner, kind, p, clickId);

  // Click log for commission reconciliation (Supabase `clicks`, else data/clicks.jsonl or the server
  // log). Link parameters only, and a coarse client type instead of the user agent.
  const params = Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== ""));
  await logRow("clicks", { click_id: clickId, tag: tag || null, partner, kind, src: q.get("src")?.slice(0, 40) ?? null, params, client: clientType(req.headers.get("user-agent") ?? "") });
  return NextResponse.redirect(url, 302);
}
