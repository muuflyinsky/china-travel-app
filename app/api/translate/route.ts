import { NextResponse } from "next/server";
import { translate } from "@/lib/llm";
import { demo } from "@/lib/config";
import { py } from "@/lib/amap";

export async function POST(req: Request) {
  const { text, from, to } = (await req.json()) as { text: string; from: string; to: string };
  if (!text?.trim()) return NextResponse.json({ error: "Empty text" }, { status: 400 });
  if (demo.ai) {
    const zh = "请带我去这个地址，谢谢。";
    return NextResponse.json({ demo: true, translation: to === "zh" ? zh : "Please take me to this address, thank you.", pinyin: to === "zh" ? py(zh) : "", note: "" });
  }
  try {
    return NextResponse.json(await translate(text.slice(0, 2000), from, to));
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
