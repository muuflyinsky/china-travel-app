import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { errorResponse } from "@/lib/errors";
import { weather } from "@/lib/amap";

export async function GET(req: Request) {
  const limited = rateLimit(req, "weather");
  if (limited) return limited;
  const adcode = new URL(req.url).searchParams.get("adcode") ?? "310000";
  try {
    return NextResponse.json(await weather(adcode));
  } catch (e) {
    return errorResponse(e, "weather");
  }
}
