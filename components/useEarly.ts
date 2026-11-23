"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { EARLY_FREE_UNTIL, isEarly } from "@/lib/early";
import { sinceDay } from "@/lib/device";

/** EARLY_BEFORE from the server (app/(app)/layout.tsx → AppShell), or null when not set. */
export const EarlyContext = createContext<string | null>(null);

/**
 * EARLY_FREE_UNTIL while this device is an early one (lib/early.ts), else null. Decided after mount
 * and again whenever the app comes back to the front, so a WebView left open across 31 December
 * stops saying "unlimited" (iOS resumes it without reloading).
 */
export function useEarly() {
  const before = useContext(EarlyContext);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const check = () => setOn(isEarly(sinceDay(), before));
    check();
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, [before]);
  return on ? EARLY_FREE_UNTIL : null;
}
