"use client";
import { useEffect, useId, useState } from "react";
import { Sheet } from "konsta/react";
import { Button, DateInput } from "@/components/ui";
import { useProfile } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { fmt } from "@/lib/i18n";
import { visaFreeDays, VERIFIED_ON } from "@/lib/visa";
import { fmtDay } from "./Plan";

type Choice = "free" | "transit" | "visa" | "extended";

/** The passport country in the traveller's language. */
export function countryName(code: string, lang: string) {
  try { return new Intl.DisplayNames([lang, "en"], { type: "region" }).of(code) ?? code; } catch { return code; }
}

/**
 * "How are you staying in China?" (D17, design §4.7): the stay-limit reminder can't be turned
 * off, but the traveller can correct what it is based on. Saved on this phone only.
 */
export function StaySheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const h = t.home;
  const [p, set] = useProfile();
  const [choice, setChoice] = useState<Choice>("free");
  const [days, setDays] = useState(30);
  const [until, setUntil] = useState("");
  const group = useId(); // the sheet is mounted twice (reminder card, editor): radio groups must not merge
  useEffect(() => {
    if (!open) return;
    setChoice(p.stayUntil ? "extended" : p.entryType === "transit_240" ? "transit" : p.entryType === "visa" ? "visa" : "free");
    setDays(p.visaDays || 30);
    setUntil(p.stayUntil);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = choice === "extended" ? Boolean(until) : choice === "visa" ? days >= 1 : true;
  const save = () => {
    if (!valid) return;
    if (choice === "extended") set({ stayUntil: until });
    else set({ stayUntil: "", entryType: choice === "free" ? "visa_free_30" : choice === "transit" ? "transit_240" : "visa", ...(choice === "visa" ? { visaDays: days } : {}) });
    onClose();
  };

  const option = (value: Choice, title: string, sub: string, extra?: React.ReactNode) => {
    const on = choice === value;
    return (
      <div className={`rounded-card border bg-card ${on ? "border-cobalt" : "border-line"}`}>
        <label className="flex min-h-touch cursor-pointer items-start gap-3 p-3">
          {/* Drawn by hand: in dark mode the native radio is a filled black circle that reads as "selected". */}
          <input type="radio" name={group} checked={on} onChange={() => setChoice(value)}
            className="mt-1 h-5 w-5 shrink-0 appearance-none rounded-full border-2 border-line bg-transparent checked:border-cobalt checked:bg-cobalt checked:shadow-[inset_0_0_0_3px_var(--card)]" />
          <span className="min-w-0 flex-1">
            <span className="block text-headline">{title}</span>
            <span className="block text-footnote text-muted">{sub}</span>
          </span>
        </label>
        {on && extra && <div className="px-3 pb-3 pl-11">{extra}</div>}
      </div>
    );
  };

  return (
    <Sheet opened={open} onBackdropClick={onClose} className="pb-safe" style={{ maxHeight: "92vh" }}>
      <div className="flex max-h-[92vh] flex-col bg-porcelain text-ink">
        <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-line" aria-hidden />
        <div className="overflow-auto px-4 pt-3 pb-4">
          <h2 className="text-title">{h.vTitle}</h2>
          <p className="mt-1 text-subhead text-muted">{h.vSub}</p>
          <div className="mt-4 space-y-2" role="radiogroup" aria-label={h.vTitle}>
            {option("free", fmt(h.vFree, { n: visaFreeDays(p.nationality) }), p.nationality ? `${countryName(p.nationality, p.lang)} · ${h.vFreeSub}` : h.vFreeSub)}
            {option("transit", h.vTransit, h.vTransitSub)}
            {option("visa", h.vVisa, h.vVisaSub,
              <label className="flex items-center gap-2 text-subhead">
                <span className="text-muted">{h.vVisaDays}</span>
                <input type="number" inputMode="numeric" min={1} max={180} value={days} onChange={(e) => setDays(Number(e.target.value) || 0)}
                  className="w-20 rounded-control border border-line bg-card px-2 py-1.5 text-body tabular-nums" />
              </label>)}
            {option("extended", h.vExt, h.vExtSub,
              <label className="flex flex-wrap items-center gap-2 text-subhead">
                <span className="text-muted">{h.vExtUntil}</span>
                <DateInput value={until} onChange={(e) => setUntil(e.target.value)} hintPad="px-2" wrapClassName="inline-block"
                  className="rounded-control border border-line bg-card px-2 py-1.5 text-body" />
              </label>)}
          </div>
          <Button onClick={save} disabled={!valid} className="mt-4 w-full">{h.vSave}</Button>
          <p className="mt-3 text-center text-footnote text-muted">{fmt(h.vSource, { date: fmtDay(VERIFIED_ON, p.lang, "long") })}</p>
        </div>
      </div>
    </Sheet>
  );
}
