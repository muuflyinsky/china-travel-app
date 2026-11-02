import { NextResponse } from "next/server";

// Approximate CNY per unit, used only when the live rate can't be fetched (and for RUB / VND, which
// the ECB doesn't publish). Every currency in Settings is listed. Last set 2026-11-02 from the ECB.
const FALLBACK: Record<string, number> = {
  USD: 6.65, EUR: 7.46, GBP: 8.92, JPY: 0.0421, KRW: 0.00495, AUD: 4.66, CAD: 4.76, SGD: 5.2, HKD: 0.847, CHF: 8.11, THB: 0.197,
  MYR: 1.63, NZD: 3.74, SEK: 0.681, INR: 0.07, BRL: 1.22, MXN: 0.355, RUB: 0.082, TRY: 0.133, IDR: 0.000367, VND: 0.000258, PHP: 0.105,
};

// Free ECB reference rates via Frankfurter (no key). Cached for 6 hours.
export async function GET(req: Request) {
  const base = (new URL(req.url).searchParams.get("base") ?? "USD").toUpperCase().slice(0, 3);
  try {
    const r = await fetch(`https://api.frankfurter.dev/v1/latest?from=${base}&to=CNY`, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    const rate = d.rates?.CNY;
    // A live rate far from the reference is a bad answer, not a market move: use the reference instead.
    const ref = FALLBACK[base];
    if (rate > 0 && (!ref || (rate > ref / 2 && rate < ref * 2))) return NextResponse.json({ base, rate, date: d.date });
  } catch {}
  return NextResponse.json({ base, rate: FALLBACK[base] ?? null, approximate: true });
}
