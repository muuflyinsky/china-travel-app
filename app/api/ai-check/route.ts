import { NextResponse } from "next/server";
import { aiProvider, config } from "@/lib/config";
import { checkAi } from "@/lib/llm";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

let lastRun = 0;

/**
 * Setup check: open /api/ai-check after adding AI_API_KEY to see whether the key, region and
 * model names work. Shows endpoints and model names only, never the key. One run per 10 s.
 */
export async function GET() {
  if (aiProvider !== "openai") return NextResponse.json({ provider: aiProvider ?? "none", note: aiProvider ? "Using ANTHROPIC_API_KEY" : "AI_API_KEY is not set in this deployment" });
  if (Date.now() - lastRun < 10_000) return NextResponse.json({ error: "Try again in a few seconds" }, { status: 429 });
  lastRun = Date.now();
  const result = await checkAi();
  return NextResponse.json({
    provider: "openai-compatible",
    endpoints: config.ai.baseUrls.map((u) => new URL(u).host),
    textModel: config.ai.textModel,
    visionModel: config.ai.visionModel,
    ...result,
  }, { headers: { "cache-control": "no-store" } });
}
