import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { dishDetail } from "@/lib/dishes";
import { demo } from "@/lib/config";
import { demoDetail } from "@/lib/demo-dishes";

export const maxDuration = 60;

/** Details for one dish, fetched when it's opened: ingredients, literal meaning, notes. */
export async function POST(req: Request) {
  const b = (await req.json().catch(() => ({}))) as { zh?: string; printed?: string; lang?: string; city?: string; adcode?: string };
  const zh = b.zh?.trim().slice(0, 40);
  if (!zh) return NextResponse.json({ error: "zh required" }, { status: 400 });
  if (demo.ai) {
    const d = demoDetail(zh);
    return d ? NextResponse.json({ ...d, demo: true }) : NextResponse.json({ error: "unreadable" }, { status: 422 });
  }
  try {
    return NextResponse.json(await dishDetail({ zh, printed: b.printed?.slice(0, 200), lang: b.lang ?? "en", city: b.city?.slice(0, 80), adcode: b.adcode?.slice(0, 6) }));
  } catch (e) {
    return errorResponse(e, "dish");
  }
}
