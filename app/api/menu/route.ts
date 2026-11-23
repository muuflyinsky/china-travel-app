import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limit";
import { useQuota, type Use } from "@/lib/quota";
import { readMenu, type MenuEvent } from "@/lib/dishes";
import { demo } from "@/lib/config";
import { demoMenu } from "@/lib/demo-dishes";

export const maxDuration = 120;

/**
 * Menu photo or typed dish names → NDJSON stream of MenuEvent lines, one dish per line as soon
 * as it's known. Errors before the first line keep their status (503 unavailable, 422
 * unreadable); later ones arrive as an {"type":"error"} line.
 */
export async function POST(req: Request) {
  const limited = rateLimit(req, "menu");
  if (limited) return limited;
  const body = (await req.json()) as { image?: string; mediaType?: string; text?: string; lang?: string; city?: string; adcode?: string; from?: string };
  if (!body.image && !body.text?.trim()) return NextResponse.json({ error: "Send a photo or dish names" }, { status: 400 });
  // A restaurant's signature dishes (components/RestaurantDetail.tsx): dishes already in the cache are
  // free; one typed lookup is counted only if some have to be generated (DECISIONS D23, Veer 11-23).
  // Marking a typed lookup this way gains nothing: whatever needs the AI is still counted.
  const restaurant = !body.image && body.from === "restaurant";
  let use: Use | null = null;
  if (!demo.ai && !restaurant) {
    const u = await useQuota(req, body.image ? "menu_photo" : "menu_text");
    if (u instanceof NextResponse) return u;
    use = u;
  }
  const beforeModel = restaurant && !demo.ai ? async () => {
    const u = await useQuota(req, "menu_text");
    if (u instanceof NextResponse) return false;
    use = u;
    return true;
  } : undefined;
  const events = demo.ai ? demoMenu() : readMenu({
    image: body.image ? { data: body.image, mediaType: body.mediaType ?? "image/jpeg" } : undefined,
    text: body.text?.slice(0, 2000), lang: body.lang ?? "en", city: body.city?.slice(0, 80), adcode: body.adcode?.slice(0, 6), beforeModel,
  });
  let first: IteratorResult<MenuEvent>;
  try { first = await events.next(); } catch (e) { await use?.refund(); return errorResponse(e, "menu"); }

  const enc = new TextEncoder();
  const line = (o: object) => enc.encode(JSON.stringify(o) + "\n");
  const stream = new ReadableStream({
    async start(c) {
      if (demo.ai) c.enqueue(line({ type: "demo" }));
      if (!first.done) c.enqueue(line(first.value));
      try {
        for await (const ev of events) c.enqueue(line(ev));
      } catch (e) {
        console.error("[menu] stream:", e);
        c.enqueue(line({ type: "error" }));
      }
      c.enqueue(line({ type: "done" }));
      c.close();
    },
    cancel() { events.return(undefined); },
  });
  return new Response(stream, { headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store", "x-accel-buffering": "no" } });
}
