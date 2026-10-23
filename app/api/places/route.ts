import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { searchPlaces } from "@/lib/amap";
import { demo } from "@/lib/config";
import { withAwards } from "@/lib/restaurants";

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
    return NextResponse.json({ places: withAwards(places), demo: demo.maps });
  } catch (e) {
    return errorResponse(e, "places");
  }
}
