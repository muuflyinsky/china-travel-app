import { NextResponse } from "next/server";
import { review } from "@/lib/city-guide";

// 👎 on a city-guide item. Only ids and names, nothing about the traveller.
export async function POST(req: Request) {
  const b = await req.json().catch(() => null);
  const clean = (v: unknown) => (typeof v === "string" ? v.slice(0, 80) : undefined);
  if (!b || !clean(b.city) || !clean(b.name)) return NextResponse.json({ error: "city and name required" }, { status: 400 });
  await review(null, { kind: clean(b.kind), city: clean(b.city), name: clean(b.name), lang: clean(b.lang), reason: "thumbs_down" });
  return NextResponse.json({ ok: true });
}
