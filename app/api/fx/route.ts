import { NextResponse } from "next/server";

// Approximate CNY per unit, used only when the live rate can't be fetched.
const FALLBACK: Record<string, number> = {
  USD: 7.1, EUR: 8.2, GBP: 9.5, JPY: 0.047, KRW: 0.0051, AUD: 4.7, CAD: 5.1, SGD: 5.5, HKD: 0.91, CHF: 8.9, THB: 0.22, MYR: 1.68,
};

// Free ECB reference rates (no key). Cached for 6 hours.
export async function GET(req: Request) {
  const base = (new URL(req.url).searchParams.get("base") ?? "USD").toUpperCase().slice(0, 3);
  try {
    const r = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=CNY`, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(5000) });
    const d = await r.json();
    if (d.rates?.CNY) return NextResponse.json({ base, rate: d.rates.CNY, date: d.date });
  } catch {}
  return NextResponse.json({ base, rate: FALLBACK[base] ?? null, approximate: true });
}
