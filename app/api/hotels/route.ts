import { NextResponse } from "next/server";
import { cityPicks, tierBounds } from "@/lib/hotels";
import { demo } from "@/lib/config";

// GET /api/hotels?city=<adcode>&name=<short Chinese name> → picks per price tier.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const adcode = q.get("city") ?? "";
  const name = q.get("name") ?? "";
  if (!/^\d{6}$/.test(adcode)) return NextResponse.json({ error: "city must be an adcode" }, { status: 400 });
  try {
    const picks = await cityPicks(adcode, name);
    return NextResponse.json({ ...picks, bounds: tierBounds(name), demo: demo.maps }, { headers: { "cache-control": "public, max-age=3600" } });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
