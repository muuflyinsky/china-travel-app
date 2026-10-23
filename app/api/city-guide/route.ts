import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { cityGuide } from "@/lib/city-guide";
import { HOT_CITIES } from "@/lib/hot-cities";
import { demo } from "@/lib/config";

// GET /api/city-guide?city=<adcode> → top sights + signature dishes for a hot city.
// Generation costs model and map calls, so only cities in lib/data/hot-cities.json are served,
// and a forced refresh (?refresh=1) needs the CITY_GUIDE_TOKEN used by the monthly job.
export const maxDuration = 120;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const city = HOT_CITIES.find((c) => c.a === q.get("city"));
  if (!city) return NextResponse.json({ error: "not_hot" }, { status: 404 });
  const token = process.env.CITY_GUIDE_TOKEN;
  const refresh = q.get("refresh") === "1" && Boolean(token) && req.headers.get("authorization") === `Bearer ${token}`;
  try {
    const guide = await cityGuide(city.a, city.s, city.e, refresh);
    return NextResponse.json({ ...guide, demo: demo.maps || demo.ai }, { headers: { "cache-control": "public, max-age=3600" } });
  } catch (e) {
    return errorResponse(e, "city-guide");
  }
}
