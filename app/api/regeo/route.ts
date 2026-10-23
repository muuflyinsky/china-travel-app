import { NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/amap";
import { wgs84ToGcj02 } from "@/lib/coords";

// Accepts raw browser GPS (WGS-84) and returns GCJ-02 + city info.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const lng = Number(q.get("lng")), lat = Number(q.get("lat"));
  if (!lng || !lat) return NextResponse.json({ error: "lng, lat required" }, { status: 400 });
  const [gLng, gLat] = wgs84ToGcj02(lng, lat);
  try {
    const info = await reverseGeocode(`${gLng},${gLat}`);
    return NextResponse.json({ location: `${gLng},${gLat}`, ...info });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
