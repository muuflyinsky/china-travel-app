import { NextResponse } from "next/server";
import { analyzeMenu } from "@/lib/llm";
import { demo } from "@/lib/config";
import { menu as demoMenu } from "@/lib/demo";

export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json()) as { image?: string; mediaType?: string; text?: string; lang?: string; city?: string };
  if (!body.image && !body.text?.trim()) return NextResponse.json({ error: "Send a photo or dish names" }, { status: 400 });
  if (demo.ai) return NextResponse.json({ ...demoMenu, demo: true });
  try {
    const menu = await analyzeMenu({ imageBase64: body.image, mediaType: body.mediaType, text: body.text, lang: body.lang ?? "en", city: body.city?.slice(0, 80) });
    return NextResponse.json(menu);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
