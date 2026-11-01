import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { deviceOf } from "@/lib/quota";
import { passEnds, passToken, verifyTransaction } from "@/lib/passes-server";

/**
 * Trip pass bought in the app → token for unlimited AI on this phone until the pass ends.
 * Body: { transactions: [<StoreKit 2 JWS>…] } from lib/passes.ts; the latest-ending valid pass wins.
 */
export async function POST(req: Request) {
  const limited = rateLimit(req, "pass");
  if (limited) return limited;
  const b = (await req.json().catch(() => ({}))) as { transactions?: string[] };
  const device = deviceOf(req);
  if (device.startsWith("ip:")) return NextResponse.json({ error: "device id required" }, { status: 400 });
  let best: { ends: number; productId: string } | null = null;
  for (const jws of (b.transactions ?? []).slice(0, 20)) {
    const t = verifyTransaction(jws);
    const ends = t && passEnds(t);
    if (t && ends && ends > Date.now() && (!best || ends > best.ends)) best = { ends, productId: t.productId };
  }
  if (!best) return NextResponse.json({ error: "no active pass" }, { status: 404 });
  return NextResponse.json({ token: passToken(device, best.ends), ends: best.ends, productId: best.productId });
}
