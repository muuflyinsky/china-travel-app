import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { cityGuide } from "@/lib/city-guide";
import { HOT_CITIES } from "@/lib/hot-cities";
import { demo } from "@/lib/config";

// GET /api/city-guide?city=<adcode> → top sights + signature dishes for a hot city, as stored
// by the monthly batch job (lib/city-guide.ts). Only cities in lib/data/hot-cities.json are
// served. ?refresh=1 with the CITY_GUIDE_TOKEN generates and stores one city: that is what the
// job calls, on its own server in GitHub Actions, where Vercel's time limit doesn't apply.
export const maxDuration = 120;

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const city = HOT_CITIES.find((c) => c.a === q.get("city"));
  if (!city) return NextResponse.json({ error: "not_hot" }, { status: 404 });
  const token = process.env.CITY_GUIDE_TOKEN;
  const refresh = q.get("refresh") === "1" && Boolean(token) && req.headers.get("authorization") === `Bearer ${token}`;
  try {
    const { guide } = await cityGuide(city.a, city.s, city.e, refresh);
    const partial = Boolean((guide as { partial?: boolean }).partial);
    return NextResponse.json({ ...guide, demo: demo.maps }, { headers: { "cache-control": partial ? "no-store" : "public, max-age=3600" } });
  } catch (e) {
    return errorResponse(e, "city-guide");
  }
}
