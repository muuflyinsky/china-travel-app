"use client";
import { useEffect, useState } from "react";
import { Ticket, X } from "lucide-react";
import { useT } from "./useT";
import { useEarly } from "./useEarly";
import { PASS_EVENT, hasPasses, products, savedPass, showPaywall, trialStart } from "@/lib/passes";
import { TRIAL } from "@/lib/products";

const KEY = "ctg.trialHint";

/**
 * One quiet line under the AI inputs on Eat and Talk (DECISIONS D23): the free 3-day trial, for
 * phones that can take it (app with StoreKit, the App Store has it, this Apple ID hasn't taken it,
 * no pass running, not an early device). Opens the pass sheet, which explains the trial before it
 * starts. Hidden for good with ×.
 */
export function TrialHint() {
  const t = useT();
  const early = useEarly();
  const [show, setShow] = useState(false);
  useEffect(() => {
    let hidden = false;
    try { hidden = localStorage.getItem(KEY) === "1"; } catch {}
    if (hidden || !hasPasses() || savedPass() || trialStart() !== null) return;
    let live = true;
    products([TRIAL.id]).then((p) => { if (live && p.length) setShow(true); }, () => {});
    const sync = () => { if (savedPass() || trialStart() !== null) setShow(false); };
    document.addEventListener("visibilitychange", sync);
    window.addEventListener(PASS_EVENT, sync);
    return () => { live = false; document.removeEventListener("visibilitychange", sync); window.removeEventListener(PASS_EVENT, sync); };
  }, []);
  if (!show || early) return null;
  const hide = () => { try { localStorage.setItem(KEY, "1"); } catch {} setShow(false); };
  return (
    <div className="flex items-center gap-1 rounded-control bg-cobalt-soft pl-3 text-subhead">
      <button onClick={() => showPaywall()} className="flex min-h-touch min-w-0 flex-1 items-center gap-2 text-left font-semibold text-cobalt">
        <Ticket className="h-4 w-4 shrink-0" aria-hidden /><span>{t.trial.hint}</span>
      </button>
      <button onClick={hide} aria-label={t.trial.hide} className="grid h-touch w-touch shrink-0 place-items-center text-muted">
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
