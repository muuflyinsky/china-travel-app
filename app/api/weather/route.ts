import { NextResponse } from "next/server";
import { weather } from "@/lib/amap";

export async function GET(req: Request) {
  const adcode = new URL(req.url).searchParams.get("adcode") ?? "310000";
  try {
    return NextResponse.json(await weather(adcode));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
