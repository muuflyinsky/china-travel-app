import { NextResponse, type NextRequest } from "next/server";
import { APPS, type AppId, type AppInfo } from "@/lib/apps";

type Hit = { artworkUrl512?: string; artworkUrl100?: string; trackViewUrl?: string };
const cache = new Map<string, Hit | null>();

async function lookup(app: AppInfo): Promise<Hit | null> {
  if (cache.has(app.id)) return cache.get(app.id)!;
  const country = app.ios?.country ?? "us";
  const url = app.ios?.bundleId
    ? `https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(app.ios.bundleId)}&country=${country}`
    : `https://itunes.apple.com/search?entity=software&limit=1&country=${country}&term=${encodeURIComponent(app.ios?.term ?? app.name)}`;
  let hit: Hit | null = null;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(4000), next: { revalidate: 86400 } });
    hit = ((await r.json()).results?.[0] as Hit) ?? null;
  } catch {}
  cache.set(app.id, hit);
  return hit;
}

function monogram(app: AppInfo) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${app.color}"/><text x="32" y="42" font-family="-apple-system,PingFang SC,sans-serif" font-size="${app.mono.length > 1 ? 24 : 30}" font-weight="700" text-anchor="middle" fill="#fff">${app.mono}</text></svg>`;
  return new NextResponse(svg, { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=3600" } });
}

/** App icon (PNG from the App Store, monogram fallback), or `?store=1` to redirect to the store page. */
export async function GET(req: NextRequest, ctx: RouteContext<"/api/app-icon/[id]">) {
  const { id } = await ctx.params;
  const app = APPS[id as AppId] as AppInfo | undefined;
  if (!app) return NextResponse.json({ error: "unknown app" }, { status: 404 });
  const hit = await lookup(app);

  if (req.nextUrl.searchParams.has("store")) {
    const fallback = app.web ?? `https://www.google.com/search?q=${encodeURIComponent(app.name + " app")}`;
    return NextResponse.redirect(hit?.trackViewUrl ?? fallback, 302);
  }
  const art = hit?.artworkUrl512 ?? hit?.artworkUrl100;
  if (!art) return monogram(app);
  try {
    const img = await fetch(art, { signal: AbortSignal.timeout(5000) });
    if (!img.ok) return monogram(app);
    return new NextResponse(img.body, {
      headers: { "content-type": img.headers.get("content-type") ?? "image/jpeg", "cache-control": "public, max-age=604800, immutable" },
    });
  } catch {
    return monogram(app);
  }
}
