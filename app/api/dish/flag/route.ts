import { NextResponse } from "next/server";
import { flagDish } from "@/lib/dish-cache";
import { regionOf } from "@/lib/dish-name";

// "This dish info is wrong". Anonymous: the dish name, region and language, nothing about the traveller.
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { zh?: string; adcode?: string; lang?: string; reason?: string };
  const zh = b.zh?.trim().slice(0, 40);
  if (!zh) return NextResponse.json({ error: "zh required" }, { status: 400 });
  try {
    await flagDish(zh, regionOf(b.adcode), (b.lang ?? "").slice(0, 8), (b.reason ?? "wrong").slice(0, 200));
  } catch (e) {
    console.error("[dish/flag]", (e as Error).message);
  }
  return NextResponse.json({ ok: true });
}
