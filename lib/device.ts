"use client";
// Headers the AI routes use for free limits (lib/quota.ts): a random id this app or website makes
// for itself (never sent anywhere else), which client is asking, and the trip pass token if any.
import { hasPasses, inApp, passToken } from "./passes";

export function deviceId() {
  try {
    let id = localStorage.getItem("ctg.device");
    if (!id || !/^[a-z0-9]{16}$/.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) => "abcdefghijklmnopqrstuvwxyz0123456789"[b % 36]).join("");
      localStorage.setItem("ctg.device", id);
    }
    return id;
  } catch { return ""; }
}

export function apiHeaders(): Record<string, string> {
  const h: Record<string, string> = { "x-ctg-device": deviceId(), "x-ctg-client": !inApp() ? "web" : hasPasses() ? "app" : "app-old" };
  const pass = passToken();
  if (pass) h["x-ctg-pass"] = pass;
  return h;
}
