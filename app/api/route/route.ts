import { NextResponse } from "next/server";
import { planRoutes } from "@/lib/amap";
import { demo } from "@/lib/config";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const origin = q.get("origin"), destination = q.get("destination"), citycode = q.get("citycode");
  if (!origin || !destination || !citycode) return NextResponse.json({ error: "origin, destination, citycode required" }, { status: 400 });
  try {
    const routes = await planRoutes({ origin, destination, citycode, destCitycode: q.get("destCitycode") ?? undefined });
    return NextResponse.json({ routes, demo: demo.maps });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
