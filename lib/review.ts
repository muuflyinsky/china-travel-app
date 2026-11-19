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
type Bridge = { isNativePlatform?: () => boolean; nativePromise?: <T>(plugin: string, method: string) => Promise<T>; PluginHeaders?: { name: string }[] };

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

const due = (s: State, now: number) => s.pending && s.wins >= WINS_NEEDED && now - s.last >= GAP;
/** Today's address: "/" now, "/app" once the app moves there (the website takes "/"). */
const onToday = () => /^\/(app\/?)?$/.test(location.pathname);
let asking = false;

/**
 * Today calls this when it opens and the returned function when it closes, so leaving Today
 * within the delay cancels the ask. Asks iOS for the prompt if everything above allows it.
 */
export function maybeAskForReview(): () => void {
  const b = bridge();
  if (!b || !due(read(), Date.now())) return () => {};
  // A moment later, so Today has drawn first; everything is checked again then.
  const id = setTimeout(async () => {
    if (asking || holds > 0 || document.visibilityState !== "visible" || !onToday()) return;
    const s = read();
    if (!due(s, Date.now())) return;
    // Only ask if the 90-day mark can be kept: storage that can't be written would mean asking every visit.
    write({ ...s, pending: false });
    if (read().pending) return;
    asking = true;
    try {
      const r = await b.nativePromise!<{ requested?: boolean }>("Review", "request");
      // No active window (e.g. a system alert was up): nothing was shown, so the 90 days don't start.
      write({ ...read(), ...(r?.requested ? { last: Date.now() } : { pending: true }) });
    } catch {
      write({ ...read(), pending: true });
    } finally { asking = false; }
  }, 1500);
  return () => clearTimeout(id);
}
