"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { promoActive } from "@/lib/promo";

/** PROMO_ENDS from the server (app/(app)/layout.tsx → AppShell). */
export const PromoContext = createContext<string | null>(null);

/** The launch period's last day while it runs, else null. Decided after mount (the phone's clock). */
export function usePromo() {
  const ends = useContext(PromoContext);
  const [on, setOn] = useState(false);
  useEffect(() => setOn(promoActive(ends)), [ends]);
  return on ? ends : null;
}
