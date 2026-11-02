"use client";
import { useEffect, useState } from "react";

const KEY = "ctg.fx.v2";
const TTL = 6 * 36e5;

type Cached = { rate: number; approx: boolean; at: number };

function readCache(): Record<string, Cached> {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? "null");
    return c && typeof c === "object" ? c : {};
  } catch {
    return {};
  }
}

/**
 * CNY per 1 unit of the home currency, cached per currency for 6 hours so prices convert offline.
 * Only ever returns the rate for `base`: the profile loads after the first render (default USD),
 * so a USD request can still be in flight, or answer last, after the traveller's own currency.
 */
export function useFx(base: string) {
  const [rate, setRate] = useState<{ base: string; value: number; approx: boolean } | null>(null);
  useEffect(() => {
    if (base === "CNY") return;
    let live = true;
    const c = readCache()[base];
    if (c) setRate({ base, value: c.rate, approx: c.approx });
    // An approximate (offline) rate is shown but not trusted: try again on the next visit.
    if (c && !c.approx && Date.now() - c.at < TTL) return;
    fetch(`/api/fx?base=${base}`).then((r) => r.json()).then((d) => {
      if (!live || d.base !== base || !(d.rate > 0)) return;
      const approx = Boolean(d.approximate);
      setRate({ base, value: d.rate, approx });
      try { localStorage.setItem(KEY, JSON.stringify({ ...readCache(), [base]: { rate: d.rate, approx, at: Date.now() } })); } catch {}
    }).catch(() => {});
    return () => { live = false; };
  }, [base]);
  return rate?.base === base ? { value: rate.value, approx: rate.approx } : null;
}

/** "1 GBP = ¥8.922", "1 KRW = ¥0.004951": four significant digits, so small units don't read as ¥0.000. */
export function formatRate(rate: number) {
  return String(Number(rate.toPrecision(4)));
}

/**
 * "¥48/份" → 48. Prefers the number marked as yuan, so "每100g ¥28" or "2两 28元" give 28, not the
 * weight. Returns null when there is no price in the text.
 */
export function parseCny(text: string): number | null {
  const t = text.replace(/,/g, "");
  const m = t.match(/[¥￥]\s*(\d+(?:\.\d+)?)/) ?? t.match(/(\d+(?:\.\d+)?)\s*(?:元|块)/) ?? t.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export function formatMoney(amount: number, currency: string, lang = "en", digits?: number) {
  try {
    const d = digits ?? (amount < 20 ? 2 : 0);
    return new Intl.NumberFormat(lang, { style: "currency", currency, minimumFractionDigits: Math.min(d, 2), maximumFractionDigits: d }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
