"use client";
// App Store rating prompt (native "Review" plugin, ios/App/App/ReviewPlugin.swift, from app 1.1).
//
// When: a task has just worked (a menu read, a sentence translated: noteWin), the traveller has
// had at least WINS_NEEDED of them, and they're back on Today, a calm screen between tasks
// (Apple: don't interrupt a task). Never more than once in 90 days, and never while a card is
// being shown to staff or a driver (ShowCard holds it), on the emergency screen, or with the
// trip pass sheet open. iOS adds its own limit (3 a year) and may show nothing at all; it never
// tells us, so nothing here depends on the answer.
//
// Builds without the plugin (1.0) and the website do nothing. State stays on the phone
// (localStorage), so the app target needs no UserDefaults entry in PrivacyInfo.xcprivacy.

const KEY = "ctg.review";
const GAP = 90 * 24 * 60 * 60 * 1000;
const WINS_NEEDED = 3;

type State = { wins: number; last: number; pending: boolean };
type Bridge = { isNativePlatform?: () => boolean; nativePromise?: (plugin: string, method: string) => Promise<unknown>; PluginHeaders?: { name: string }[] };

function bridge(): Bridge | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: Bridge }).Capacitor;
  return cap?.isNativePlatform?.() && cap.nativePromise && cap.PluginHeaders?.some((h) => h.name === "Review") ? cap : null;
}

function read(): State {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<State> | null;
    return { wins: Number(s?.wins) || 0, last: Number(s?.last) || 0, pending: Boolean(s?.pending) };
  } catch { return { wins: 0, last: 0, pending: false }; }
}
function write(s: State) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

/** Open safety moments (cards shown to staff, the pass sheet): no prompt while any is open. */
let holds = 0;
export function holdReview() { holds++; return () => { holds = Math.max(0, holds - 1); }; }

/** A task just worked. Only counts inside the app; the prompt itself waits for Today. */
export function noteWin() {
  if (!bridge()) return;
  const s = read();
  write({ ...s, wins: s.wins + 1, pending: true });
}

/** Today calls this when it opens; asks iOS for the prompt if everything above allows it. */
export function maybeAskForReview(now = Date.now()) {
  const b = bridge();
  if (!b) return;
  const s = read();
  if (!s.pending || s.wins < WINS_NEEDED || now - s.last < GAP) return;
  // A moment later, so Today has drawn first; re-check in case a card opened or the app went away.
  setTimeout(() => {
    if (holds > 0 || document.visibilityState !== "visible" || /^\/(app\/)?sos(\/|$)/.test(location.pathname)) return;
    write({ ...read(), last: Date.now(), pending: false });
    b.nativePromise!("Review", "request").catch(() => {});
  }, 1500);
}
