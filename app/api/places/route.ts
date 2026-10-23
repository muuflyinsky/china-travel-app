import { NextResponse } from "next/server";
import { searchPlaces } from "@/lib/amap";
import { demo } from "@/lib/config";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  try {
    const places = await searchPlaces({
      keywords: q.get("q") ?? undefined,
      city: q.get("city") ?? undefined,
      around: q.get("around") ?? undefined,
      types: q.get("types") ?? undefined,
      page: Number(q.get("page") ?? 1),
    });
    return NextResponse.json({ places, demo: demo.maps });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
