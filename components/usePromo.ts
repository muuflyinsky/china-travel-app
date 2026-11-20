"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { promoActive } from "@/lib/promo";

/** PROMO_ENDS from the server (app/(app)/layout.tsx → AppShell). */
export const PromoContext = createContext<string | null>(null);

/**
 * The launch period's last day while it runs, else null. Decided after mount (the phone's clock)
 * and again whenever the app comes back to the front, so a WebView left open across the last day
 * stops saying "free" (iOS resumes it without reloading).
 */
export function usePromo() {
  const ends = useContext(PromoContext);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => setOn(promoActive(ends));
    check();
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, [ends]);
  return on ? ends : null;
}
