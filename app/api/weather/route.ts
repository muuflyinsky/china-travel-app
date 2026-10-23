import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { weather } from "@/lib/amap";

export async function GET(req: Request) {
  const adcode = new URL(req.url).searchParams.get("adcode") ?? "310000";
  try {
    return NextResponse.json(await weather(adcode));
  } catch (e) {
    return errorResponse(e, "weather");
  }
}
