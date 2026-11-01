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
/** The app version can sell passes (1.0 can't: it has no Passes plugin). */
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

/** Sends the phone's pass transactions to the server; keeps the token if one is active. */
async function exchange(transactions: string[]): Promise<Saved | null> {
  if (!transactions.length) return null;
  const { apiHeaders } = await import("./device");
  const r = await fetch("/api/pass", { method: "POST", headers: { "content-type": "application/json", ...apiHeaders() }, body: JSON.stringify({ transactions }) });
  if (!r.ok) return null;
  const s = (await r.json()) as Saved;
  try { localStorage.setItem("ctg.pass", JSON.stringify(s)); } catch {}
  return s;
}

export type BuyResult = { status: "purchased"; pass: Saved | null } | { status: "cancelled" | "pending" | "failed" };

export async function buy(id: string): Promise<BuyResult> {
  try {
    const r = await call<{ status: "purchased" | "cancelled" | "pending"; jws?: string }>("buy", { id });
    if (r.status !== "purchased") return { status: r.status };
    const isPass = PASSES.some((p) => p.id === id);
    return { status: "purchased", pass: isPass && r.jws ? await exchange([r.jws]) : null };
  } catch { return { status: "failed" }; }
}

/** Restore Purchases: asks the App Store, then exchanges any pass still running. */
export async function restore(): Promise<Saved | null> {
  const r = await call<{ transactions: string[] }>("restore").catch(() => ({ transactions: [] as string[] }));
  return exchange(r.transactions);
}

/** On launch: picks up a pass bought on another device or before reinstalling, without prompting. */
export async function refreshPass() {
  if (!hasPasses() || savedPass()) return;
  const r = await call<{ transactions: string[] }>("entitlements").catch(() => ({ transactions: [] as string[] }));
  await exchange(r.transactions);
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
