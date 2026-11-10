"use client";
// Consent to send what the traveller picks (menu photo, dish names, a sentence, a booking
// screenshot) to the third-party AI service (App Store 5.1.2(i), docs/SPEC.md §8). Asked once,
// the first time an AI feature is used; stored on this device only, changeable in Settings.
// Bump VERSION when the AI provider or what is sent changes, so everyone is asked again.
import { useEffect, useState } from "react";

export type AiConsentState = "granted" | "denied" | null;
type Saved = { v: number; state: "granted" | "denied"; at: string };

const KEY = "ctg.aiConsent";
const EVENT = "ctg-ai-consent";
const ASK = "ctg:ai-consent-ask";
const VERSION = 1;

function read(): Saved | null {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Saved | null;
    return raw && raw.v === VERSION && (raw.state === "granted" || raw.state === "denied") ? raw : null;
  } catch { return null; }
}

export const aiConsent = (): AiConsentState => read()?.state ?? null;

export function setAiConsent(state: "granted" | "denied") {
  try { localStorage.setItem(KEY, JSON.stringify({ v: VERSION, state, at: new Date().toISOString() } satisfies Saved)); } catch {}
  window.dispatchEvent(new Event(EVENT));
}

/** Current answer and when it was given, live across screens. `loaded` is false until read. */
export function useAiConsent() {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const sync = () => { setSaved(read()); setLoaded(true); };
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  return { state: saved?.state ?? null, at: saved?.at, loaded };
}

/** What the consent sheet (components/AiConsent.tsx, mounted once in AppShell) runs on "Allow". */
export type AskDetail = { then?: () => void };

/**
 * Runs `then` only once the traveller has allowed the AI service; otherwise opens the consent
 * sheet and runs it from the "Allow" tap itself (still a user gesture, so a file picker can open).
 * Nothing is sent when they say no or close the sheet.
 */
export function withAi(then?: () => void) {
  if (aiConsent() === "granted") { then?.(); return; }
  window.dispatchEvent(new CustomEvent<AskDetail>(ASK, { detail: { then } }));
}

export const AI_CONSENT_ASK = ASK;
