import { NextResponse } from "next/server";
import { demo, config } from "@/lib/config";

export function GET() {
  return NextResponse.json({ demoAi: demo.ai, demoMaps: demo.maps, affiliate: Boolean(config.trip.allianceId) });
}
