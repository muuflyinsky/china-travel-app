import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { awardCities, awardLists, awardRestaurants } from "@/lib/restaurants";

// GET /api/restaurants?city=<adcode> → restaurants on the Michelin / Black Pearl / Must-Eat lists,
// plus every city that has listed restaurants (for the city switcher). `listed=1`: no Amap fill-in.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const city = q.get("city") ?? "";
  if (!/^\d{6}$/.test(city)) return NextResponse.json({ error: "city must be an adcode" }, { status: 400 });
  try {
    const [{ restaurants, source }, lists, cities] = await Promise.all([awardRestaurants(city, { listedOnly: q.get("listed") === "1" }), awardLists(), awardCities()]);
    return NextResponse.json({ restaurants, source, lists, cities }, { headers: { "cache-control": "public, max-age=3600" } });
  } catch (e) {
    return errorResponse(e, "restaurants");
  }
}
