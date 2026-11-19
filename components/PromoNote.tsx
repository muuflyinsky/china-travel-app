"use client";
import { useEffect, useState } from "react";
import { Gift, X } from "lucide-react";
import { useT } from "./useT";
import { useProfile } from "./useProfile";
import { usePromo } from "./usePromo";
import { inApp } from "@/lib/passes";
import { fmt } from "@/lib/i18n";
import { promoDate } from "@/lib/promo";

const KEY = "ctg.promoNote";

/**
 * One calm line on Today during the launch period (D21): free until the date, and what comes
 * after. No countdown, no "was" price. Hidden for good with ×; shown again only if the date changes.
 */
export function PromoNote() {
  const t = useT();
  const [p] = useProfile();
  const ends = usePromo();
  const [hidden, setHidden] = useState(true);
  const [app, setApp] = useState(false);
  useEffect(() => {
    setApp(inApp());
    try { setHidden(localStorage.getItem(KEY) === ends); } catch { setHidden(false); }
  }, [ends]);
  if (!ends || hidden) return null;
  const hide = () => { try { localStorage.setItem(KEY, ends); } catch {} setHidden(true); };
  return (
    <div className="mb-3 flex items-start gap-2 rounded-control bg-cobalt-soft p-3 text-subhead text-ink">
      <Gift className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden />
      <p className="flex-1">{fmt(app ? t.promo.app : t.promo.web, { date: promoDate(ends, p.lang) })}</p>
      <button onClick={hide} aria-label={t.promo.hide} className="-m-2 grid h-touch w-touch shrink-0 place-items-center text-muted">
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
