"use client";
// "Back to my hotel" without a connection (app 1.1, DECISIONS: Veer 11-19, B6). The offline page
// (native/www/offline.html) is bundled in the app and can't read this site's localStorage, so a
// text-only copy of the saved hotel is kept in native storage (@capacitor/preferences, key
// "offlineHotel"): Chinese name, address, English name and the interface language. Never the
// coordinates or a map image (Amap terms 3.5: no caching of their data or images; PROJECT §5-15).
// Stays on the phone. Builds without the Preferences plugin (1.0) and the website do nothing.

type Bridge = { isNativePlatform?: () => boolean; nativePromise?: (plugin: string, method: string, options?: object) => Promise<unknown>; PluginHeaders?: { name: string }[] };
type Hotel = { name: string; address: string; nameEn?: string } | null;

const KEY = "offlineHotel";
let last: string | undefined;

function bridge(): Bridge | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: Bridge }).Capacitor;
  return cap?.isNativePlatform?.() && cap.nativePromise && cap.PluginHeaders?.some((h) => h.name === "Preferences") ? cap : null;
}

/** Saves (or, with no hotel, removes) the native copy; skips the call when nothing changed. */
export function syncOfflineHotel(hotel: Hotel, lang: string) {
  const b = bridge();
  if (!b) return;
  const value = hotel?.name ? JSON.stringify({ name: hotel.name, address: hotel.address ?? "", nameEn: hotel.nameEn ?? "", lang }) : "";
  if (value === last) return;
  last = value;
  const done = value ? b.nativePromise!("Preferences", "set", { key: KEY, value }) : b.nativePromise!("Preferences", "remove", { key: KEY });
  done.catch(() => { last = undefined; });
}
