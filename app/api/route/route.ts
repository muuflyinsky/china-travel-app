import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { routes } from "@/lib/amap";
import { demo } from "@/lib/config";

const LNGLAT = /^\d{2,3}\.\d+,\d{1,2}\.\d+$/;

/** Public transport plans and a taxi estimate (SPEC v0.5 P1.6 #23). Coordinates are GCJ-02 "lng,lat". */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const from = q.get("from") ?? "", to = q.get("to") ?? "", city = q.get("city") ?? "";
  if (!LNGLAT.test(from) || !LNGLAT.test(to) || !city) return NextResponse.json({ error: "from, to (lng,lat) and city required" }, { status: 400 });
  try {
    return NextResponse.json({ ...(await routes(from, to, city.slice(0, 12), q.get("cityTo")?.slice(0, 12) || undefined)), demo: demo.maps });
  } catch (e) {
    return errorResponse(e, "route");
  }
}
