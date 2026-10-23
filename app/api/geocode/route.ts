import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { geocode } from "@/lib/amap";

// GET /api/geocode?address=<Chinese address> → { location: "lng,lat" | null }. Used for hotels
// saved before we stored coordinates.
export async function GET(req: Request) {
  const address = new URL(req.url).searchParams.get("address")?.slice(0, 120);
  if (!address) return NextResponse.json({ error: "address required" }, { status: 400 });
  try {
    return NextResponse.json({ location: await geocode(address) });
  } catch (e) {
    return errorResponse(e, "geocode");
  }
}
