// Launch period (DECISIONS D21, Veer 11-20): 1.1 sells passes, but for a while after launch
// everything is free. PROMO_ENDS=YYYY-MM-DD (Vercel env, last free day, Beijing time, inclusive).
// While it runs the free limits are off even with QUOTA=on; the day after, they apply by
// themselves (D3/D8). Not set, or a bad value: no launch period, QUOTA alone decides.
// Passes and tips can still be bought throughout (App Review must be able to test them).
// The date must be real and kept (consumer law): no fake "was" prices, no rolling extensions.

/** Last free day from the environment (server only; the app gets it from the root layout). */
export function promoEnds(): string | null {
  const v = process.env.PROMO_ENDS?.trim() ?? "";
  // Round trip, so an impossible day such as 2026-02-31 is refused rather than rolled into March.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v ? v : null;
}

const beijingDay = (now: Date) => now.toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });

/** True on every day up to and including `ends` (Beijing time). */
export const promoActive = (ends: string | null | undefined, now = new Date()) => !!ends && beijingDay(now) <= ends;

/** "20 December 2026" in the traveller's language. */
export const promoDate = (ends: string, lang: string) =>
  new Date(`${ends}T12:00:00+08:00`).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Shanghai" });
