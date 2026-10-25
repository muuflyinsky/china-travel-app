import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { searchPlaces, cleanResults } from "@/lib/amap";
import { demo } from "@/lib/config";
import { withAwards } from "@/lib/restaurants";
import { cacheRead, cacheWrite } from "@/lib/cache";
import type { Place } from "@/lib/amap";

// The first page of a category (museums, temples… best rated first, see Explore) changes slowly:
// stored in Supabase for 30 days the first time anyone opens it, so later visitors cost no Amap call.
const CATEGORY_TTL = 30 * 864e5;
type CategoryPage = { generatedAt: string; places: Place[] };

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const category = !q.get("around") && q.get("sort") === "rating" && q.get("types") && q.get("city") && Number(q.get("page") ?? 1) === 1;
  const key = category ? `${q.get("city")}:${q.get("types")}:${q.get("q") ?? ""}` : "";
  try {
    if (category && !demo.maps) {
      const hit = await cacheRead<CategoryPage>("category", key);
      if (hit && Date.now() - Date.parse(hit.generatedAt) < CATEGORY_TTL) return NextResponse.json({ places: await withAwards(hit.places), demo: false });
    }
    const places = await searchPlaces({
      keywords: q.get("q") ?? undefined,
      city: q.get("city") ?? undefined,
      around: q.get("around") ?? undefined,
      types: q.get("types") ?? undefined,
      page: Number(q.get("page") ?? 1),
      purpose: q.get("around") ? "nearby" : q.get("sort") === "rating" && q.get("types") ? "category" : "search",
    });
    // Searches are cleaned and ordered (#21): `sort=rating` for category browsing, otherwise sights,
    // hotels, food and metro first. "Nearby" (around) keeps everything, nearest first.
    const list = q.get("around") ? places : cleanResults(places, { byRating: q.get("sort") === "rating" });
    if (category && !demo.maps && list.length) await cacheWrite("category", key, { generatedAt: new Date().toISOString(), places: list });
    return NextResponse.json({ places: await withAwards(list), demo: demo.maps });
  } catch (e) {
    return errorResponse(e, "places");
  }
}
