"use client";
// Trip passes, the free 3-day trial and tips through the app's native StoreKit 2 plugin ("Passes",
// ios/App/App/PassesPlugin.swift), called over the bridge the app injects (like lib/location.ts).
// A bought pass or a started trial is exchanged at /api/pass for a token the AI routes accept; the
// token is kept here until it ends.
import { PASSES, TRIAL } from "./products";
import type { QuotaKind } from "./products";

type Bridge = { isNativePlatform?: () => boolean; nativePromise?: <T>(plugin: string, method: string, options?: object) => Promise<T>; PluginHeaders?: { name: string }[] };
export type StoreProduct = { id: string; displayPrice: string; price: number; currency: string };
export type Saved = { token: string; ends: number; productId: string };

function bridge(): Bridge | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: Bridge }).Capacitor;
  return cap?.isNativePlatform?.() && cap.nativePromise ? cap : null;
}

export const inApp = () => typeof navigator !== "undefined" && /ChinaTravelBuddy-iOS/.test(navigator.userAgent);
/**
 * True when the app has the native Passes plugin, which every build so far does, 1.0 (1) included.
 * Purchase rows still only appear once the App Store returns the products, and none exist in App
 * Store Connect before 1.0 is approved (LAUNCH-TODO §三), so 1.0 shows nothing to buy.
 */
export const hasPasses = () => Boolean(bridge()?.PluginHeaders?.some((h) => h.name === "Passes"));
const call = <T,>(method: string, options?: object) => bridge()!.nativePromise!<T>("Passes", method, options);

export function savedPass(): Saved | null {
  try {
    const s = JSON.parse(localStorage.getItem("ctg.pass") ?? "null") as Saved | null;
    return s && s.ends > Date.now() ? s : null;
  } catch { return null; }
}
export const passToken = () => savedPass()?.token ?? null;

/** True when the saved unlimited period is the free trial, not a bought pass. */
export const isTrial = (s: Saved | null) => s?.productId === TRIAL.id;

const TRIAL_KEY = "ctg.trial";

/**
 * Reads a StoreKit transaction without checking Apple's signature: only to tell whether this Apple
 * ID has taken the trial, so the page stops offering it. Nothing is unlocked from this; /api/pass
 * checks the signature before issuing a token.
 */
function peek(jws: string): { productId?: string; purchaseDate?: number; originalPurchaseDate?: number } | null {
  try { return JSON.parse(atob(jws.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); } catch { return null; }
}

/** Remembers that the trial was taken (and when it started) if one of these transactions is it. */
function noteTrial(transactions: string[]) {
  for (const jws of transactions) {
    const p = peek(jws);
    if (p?.productId !== TRIAL.id) continue;
    const start = Math.min(Number(p.purchaseDate) || Infinity, Number(p.originalPurchaseDate) || Infinity);
    if (Number.isFinite(start)) try { localStorage.setItem(TRIAL_KEY, JSON.stringify({ start })); } catch {}
    changed();
  }
}

/** Tells the page (TrialHint) that the pass or trial state changed. */
export const PASS_EVENT = "ctg:pass";
const changed = () => window.dispatchEvent(new Event(PASS_EVENT));

/** When this Apple ID first took the trial (ms), or null if it hasn't (as far as this phone knows). */
export function trialStart(): number | null {
  try { return Number(JSON.parse(localStorage.getItem(TRIAL_KEY) ?? "null")?.start) || null; } catch { return null; }
}

export const products = (ids: readonly string[]) => call<{ products: StoreProduct[] }>("products", { ids: [...ids] }).then((r) => r.products);

/** Our server couldn't be reached or failed (offline, 5xx): says nothing about the purchase itself. */
class Unreachable extends Error {}

/**
 * Sends the phone's pass transactions to the server; keeps the token if one is active.
 * null = the server answered and no pass is running; throws Unreachable when it didn't answer.
 */
async function exchange(transactions: string[]): Promise<Saved | null> {
  if (!transactions.length) return null;
  const { apiHeaders } = await import("./device");
  let r: Response;
  try {
    r = await fetch("/api/pass", { method: "POST", headers: { "content-type": "application/json", ...apiHeaders() }, body: JSON.stringify({ transactions }) });
  } catch { throw new Unreachable(); }
  if (r.status === 404) return null;
  if (!r.ok) throw new Unreachable();
  const s = (await r.json().catch(() => null)) as Saved | null;
  if (!s?.token) throw new Unreachable();
  // A pass bought during the trial (or a short pass during a longer one) never shortens what's running.
  const cur = savedPass();
  if (cur && cur.ends > s.ends) return cur;
  try { localStorage.setItem("ctg.pass", JSON.stringify(s)); } catch {}
  changed();
  return s;
}

/**
 * "unlinked": Apple took the payment (or the trial) but our server didn't switch it on (no
 * connection, server error). It's safe on the Apple ID; Restore purchases switches it on later.
 * Never reported as "failed", which tells the traveller they weren't charged.
 * "trialUsed": this Apple ID took the trial before and its 3 days are over.
 */
export type BuyResult = { status: "purchased"; pass: Saved | null } | { status: "unlinked" | "trialUsed" | "cancelled" | "pending" | "failed" };

export async function buy(id: string): Promise<BuyResult> {
  let r: { status: "purchased" | "cancelled" | "pending"; jws?: string };
  try { r = await call<typeof r>("buy", { id }); } catch { return { status: "failed" }; }
  if (r.status !== "purchased") return { status: r.status };
  const trial = id === TRIAL.id;
  if (!trial && !PASSES.some((p) => p.id === id)) return { status: "purchased", pass: null }; // a tip
  if (!r.jws) return { status: "unlinked" };
  if (trial) noteTrial([r.jws]);
  try {
    const pass = await exchange([r.jws]);
    // Taking the trial again returns its first transaction; the server says it has ended.
    return pass ? { status: "purchased", pass } : { status: trial ? "trialUsed" : "unlinked" };
  } catch { return { status: "unlinked" }; }
}

/** Restore Purchases: asks the App Store, then exchanges any pass still running. "unreachable" = our server didn't answer. */
export async function restore(): Promise<Saved | null | "unreachable"> {
  // Syncing with the App Store fails offline or when Apple ID sign-in is cancelled; the passes
  // already on this phone (Transaction.all) can still be switched on, or reported as unreachable.
  const r = await call<{ transactions: string[] }>("restore")
    .catch(() => call<{ transactions: string[] }>("entitlements"))
    .catch(() => ({ transactions: [] as string[] }));
  noteTrial(r.transactions);
  try { return await exchange(r.transactions); } catch { return "unreachable"; }
}

/**
 * On launch: picks up a pass bought, or a trial taken, on another device or before reinstalling,
 * without prompting; also learns whether the trial was taken, so it isn't offered again.
 */
export async function refreshPass() {
  if (!hasPasses() || (savedPass() && trialStart())) return;
  const r = await call<{ transactions: string[] }>("entitlements").catch(() => ({ transactions: [] as string[] }));
  noteTrial(r.transactions);
  if (!savedPass()) await exchange(r.transactions).catch(() => null);
}

/** Opens the trip pass sheet (components/Paywall.tsx). */
export function showPaywall(kind: QuotaKind | "none" = "none") {
  window.dispatchEvent(new CustomEvent("ctg:paywall", { detail: kind }));
}

/** true when an AI route answered 402 (today's free uses are gone); the pass sheet is then open. */
export async function quotaHit(r: Response) {
  if (r.status !== 402) return false;
  const b = (await r.clone().json().catch(() => ({}))) as { kind?: QuotaKind };
  showPaywall(b.kind ?? "none");
  return true;
}
