import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { searchPlaces, cleanResults } from "@/lib/amap";
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
    // Searches are cleaned and ordered (#21): `sort=rating` for category browsing, otherwise sights,
    // hotels, food and metro first. "Nearby" (around) keeps everything, nearest first.
    const list = q.get("around") ? places : cleanResults(places, { byRating: q.get("sort") === "rating" });
    return NextResponse.json({ places: withAwards(list), demo: demo.maps });
  } catch (e) {
    return errorResponse(e, "places");
  }
}
