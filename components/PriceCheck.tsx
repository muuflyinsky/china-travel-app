"use client";
import { useState } from "react";
import { useProfile } from "./useProfile";
import { useFx, formatMoney } from "./useFx";
import { useT } from "./useT";
import { fmt } from "@/lib/i18n";

// Alipay charges foreign cards ~3% on single payments above ¥200 (shown in-app before paying).
const FEE_THRESHOLD = 200;
const FEE = 0.03;

/** ¥ → home currency, with the foreign-card fee once it applies. */
export function PriceCheck() {
  const t = useT();
  const [p] = useProfile();
  const fx = useFx(p.homeCurrency);
  const [amt, setAmt] = useState("100");
  const cny = Number(amt) || 0;
  const home = fx ? cny / fx.value : null;
  return (
    <div>
      <div className="flex items-end gap-3">
        <label className="min-w-0 flex-1">
          <span className="text-footnote text-muted">{t.pay.amount}</span>
          <span className="flex items-baseline gap-1 border-b border-line pb-1">
            <span className="text-title text-muted">¥</span>
            <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))}
              className="w-full min-w-0 bg-transparent text-title tabular-nums outline-none" aria-label={t.pay.amount} />
          </span>
        </label>
        <div className="min-w-0 flex-1 text-right">
          <span className="text-footnote text-muted">{t.pay.youPay}</span>
          <p className="text-title tabular-nums">{home !== null ? formatMoney(home, p.homeCurrency, p.lang) : "…"}</p>
        </div>
      </div>
      {home !== null && cny > FEE_THRESHOLD && (
        <p className="mt-2 text-subhead text-warn">{fmt(t.pay.withFee, { amount: formatMoney(home * (1 + FEE), p.homeCurrency, p.lang) })}</p>
      )}
      {fx && (
        <p className="mt-2 text-footnote text-muted">
          {fmt(t.pay.rate, { base: p.homeCurrency, rate: fx.value.toFixed(3) })} · {fx.approx ? t.pay.approxRate : t.pay.liveRate}
        </p>
      )}
    </div>
  );
}
