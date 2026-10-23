import { NextResponse } from "next/server";
import { extractHotel } from "@/lib/llm";
import { demo } from "@/lib/config";

export const maxDuration = 60;

// Booking screenshot → { name, address } in Chinese for the "back to my hotel" taxi card.
export async function POST(req: Request) {
  const body = (await req.json()) as { image?: string; mediaType?: string };
  if (!body.image) return NextResponse.json({ error: "Send a photo of the booking" }, { status: 400 });
  if (demo.ai) {
    return NextResponse.json({ demo: true, name: "上海外滩茂悦大酒店", address: "上海市虹口区黄浦路199号", nameEn: "Hyatt on the Bund" });
  }
  try {
    const h = await extractHotel(body.image, body.mediaType);
    if (!h.found || !h.name_zh || !h.address_zh) return NextResponse.json({ error: "not_found" }, { status: 422 });
    return NextResponse.json({ name: h.name_zh, address: h.address_zh, nameEn: h.name_en || undefined });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
