import { NextResponse } from "next/server";
import { awardLists, awardRestaurants } from "@/lib/restaurants";
import { demo } from "@/lib/config";

// GET /api/restaurants?city=<adcode> → restaurants on the Michelin / Black Pearl / Must-Eat lists.
export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get("city") ?? "";
  if (!/^\d{6}$/.test(city)) return NextResponse.json({ error: "city must be an adcode" }, { status: 400 });
  try {
    return NextResponse.json({ restaurants: await awardRestaurants(city), lists: awardLists(), demo: demo.maps }, { headers: { "cache-control": "public, max-age=3600" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
