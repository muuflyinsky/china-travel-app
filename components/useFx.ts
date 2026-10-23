"use client";
import { useEffect, useState } from "react";

const KEY = "ctg.fx";

/** CNY per 1 unit of the home currency, cached for 6 hours so prices convert offline. */
export function useFx(base: string) {
  const [rate, setRate] = useState<{ value: number; approx: boolean } | null>(null);
  useEffect(() => {
    try {
      const c = JSON.parse(localStorage.getItem(KEY) ?? "null");
      if (c?.base === base) setRate({ value: c.rate, approx: c.approx });
      if (c?.base === base && Date.now() - c.at < 6 * 36e5) return;
    } catch {}
    fetch(`/api/fx?base=${base}`).then((r) => r.json()).then((d) => {
      if (!d.rate) return;
      setRate({ value: d.rate, approx: Boolean(d.approximate) });
      try { localStorage.setItem(KEY, JSON.stringify({ base, rate: d.rate, approx: Boolean(d.approximate), at: Date.now() })); } catch {}
    }).catch(() => {});
  }, [base]);
  return rate;
}

/** "¥48/份" → 48. Returns null when there is no price in the text. */
export function parseCny(text: string): number | null {
  const m = text.replace(/,/g, "").match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

export function formatMoney(amount: number, currency: string, lang = "en") {
  try {
    return new Intl.NumberFormat(lang, { style: "currency", currency, maximumFractionDigits: amount < 20 ? 2 : 0 }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
