import { NextResponse } from "next/server";

/**
 * Per-IP limit for the routes that call the AI model, so a script can't run up the model bill.
 * Counts live in the function instance's memory: Vercel reuses instances, so this stops a single
 * client hammering one route, but it is not a global cap (that's a Vercel Firewall rate-limit rule).
 * Limits are generous for a traveller: a menu every half minute, a sentence every few seconds.
 */
const LIMITS = {
  menu: { max: 20, windowMs: 10 * 60_000 },
  dish: { max: 60, windowMs: 10 * 60_000 },
  hotel: { max: 10, windowMs: 10 * 60_000 },
  translate: { max: 60, windowMs: 10 * 60_000 },
} as const;

type Route = keyof typeof LIMITS;

const hits = new Map<string, { n: number; reset: number }>();

function clientIp(req: Request) {
  // Vercel sets x-forwarded-for to the real client first; x-real-ip as a fallback.
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

/** null when the request may go ahead, otherwise a 429 response to return as is. */
export function rateLimit(req: Request, route: Route): NextResponse | null {
  const { max, windowMs } = LIMITS[route];
  const now = Date.now();
  const key = `${route}:${clientIp(req)}`;
  const h = hits.get(key);
  if (!h || h.reset <= now) {
    hits.set(key, { n: 1, reset: now + windowMs });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.reset <= now) hits.delete(k);
    return null;
  }
  if (++h.n <= max) return null;
  console.warn(`[rate-limit] ${key} over ${max}/${windowMs / 60_000}min`);
  return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "retry-after": String(Math.ceil((h.reset - now) / 1000)) } });
}
