import { NextResponse } from "next/server";

/**
 * Per-IP limits so a script can't run up the AI bill, use up the Amap quota for everyone, or fill
 * the tables. Counts live in the function instance's memory: Vercel reuses instances, so this stops
 * a single client hammering one route, but it is not a global cap (that's a Vercel Firewall rule).
 * Limits are generous for a traveller, and mobile carriers put many phones behind one IP.
 */
const W = 10 * 60_000;
const LIMITS = {
  // AI model: a menu every half minute, a sentence every few seconds.
  menu: { max: 20, windowMs: W },
  dish: { max: 60, windowMs: W },
  hotel: { max: 10, windowMs: W },
  translate: { max: 60, windowMs: W },
  // Amap (shared daily quota and per-second limit) and the database reads behind it.
  places: { max: 150, windowMs: W },
  route: { max: 60, windowMs: W },
  geocode: { max: 60, windowMs: W },
  regeo: { max: 30, windowMs: W },
  weather: { max: 30, windowMs: W },
  restaurants: { max: 150, windowMs: W },
  hotels: { max: 60, windowMs: W },
  cityGuide: { max: 60, windowMs: W },
  // Writes.
  events: { max: 300, windowMs: W },
  feedback: { max: 30, windowMs: W },
  flag: { max: 20, windowMs: W },
  clicks: { max: 60, windowMs: W },
} as const;

type Route = keyof typeof LIMITS;

const hits = new Map<string, { n: number; reset: number }>();

function clientIp(req: Request) {
  // Vercel sets x-forwarded-for to the real client first; x-real-ip as a fallback.
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}

/** true while this client is under the limit for the route; counts the request. */
export function allowed(req: Request, route: Route) {
  return rateLimit(req, route) === null;
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
