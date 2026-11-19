"use client";
// Trip passes and tips through the app's native StoreKit 2 plugin ("Passes", ios/App/App/PassesPlugin.swift),
// called over the bridge the app injects (like lib/location.ts). A bought pass is exchanged at
// /api/pass for a token the AI routes accept; the token is kept here until the pass ends.
import { PASSES } from "./products";
import type { QuotaKind } from "./products";

type Bridge = { isNativePlatform?: () => boolean; nativePromise?: <T>(plugin: string, method: string, options?: object) => Promise<T>; PluginHeaders?: { name: string }[] };
export type StoreProduct = { id: string; displayPrice: string; price: number; currency: string };
type Saved = { token: string; ends: number; productId: string };

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
  try { localStorage.setItem("ctg.pass", JSON.stringify(s)); } catch {}
  return s;
}

/**
 * "unlinked": Apple took the payment but our server didn't switch the pass on (no connection,
 * server error). The pass is safe on the Apple ID; Restore purchases switches it on later.
 * Never reported as "failed", which tells the traveller they weren't charged.
 */
export type BuyResult = { status: "purchased"; pass: Saved | null } | { status: "unlinked" | "cancelled" | "pending" | "failed" };

export async function buy(id: string): Promise<BuyResult> {
  let r: { status: "purchased" | "cancelled" | "pending"; jws?: string };
  try { r = await call<typeof r>("buy", { id }); } catch { return { status: "failed" }; }
  if (r.status !== "purchased") return { status: r.status };
  if (!PASSES.some((p) => p.id === id)) return { status: "purchased", pass: null }; // a tip
  if (!r.jws) return { status: "unlinked" };
  try {
    const pass = await exchange([r.jws]);
    return pass ? { status: "purchased", pass } : { status: "unlinked" };
  } catch { return { status: "unlinked" }; }
}

/** Restore Purchases: asks the App Store, then exchanges any pass still running. "unreachable" = our server didn't answer. */
export async function restore(): Promise<Saved | null | "unreachable"> {
  // Syncing with the App Store fails offline or when Apple ID sign-in is cancelled; the passes
  // already on this phone (Transaction.all) can still be switched on, or reported as unreachable.
  const r = await call<{ transactions: string[] }>("restore")
    .catch(() => call<{ transactions: string[] }>("entitlements"))
    .catch(() => ({ transactions: [] as string[] }));
  try { return await exchange(r.transactions); } catch { return "unreachable"; }
}

/** On launch: picks up a pass bought on another device or before reinstalling, without prompting. */
export async function refreshPass() {
  if (!hasPasses() || savedPass()) return;
  const r = await call<{ transactions: string[] }>("entitlements").catch(() => ({ transactions: [] as string[] }));
  await exchange(r.transactions).catch(() => null);
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
