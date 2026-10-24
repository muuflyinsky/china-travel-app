"use client";
// The traveller's position. Inside the iOS app this goes through Capacitor's native Geolocation
// plugin, so iOS asks once, in the app's own words (Info.plist), instead of WebKit's extra
// "this website would like to use your location" prompt. On the website it's the browser API.
// The web bundle doesn't load @capacitor/core: the app injects window.Capacitor, and the plugin
// is called through its bridge.

type Coords = { longitude: number; latitude: number };
type Bridge = {
  isNativePlatform?: () => boolean;
  PluginHeaders?: { name: string }[];
  nativePromise?: <T>(plugin: string, method: string, options?: object) => Promise<T>;
};

function native(): Bridge | null {
  if (typeof window === "undefined") return null;
  const cap = (window as unknown as { Capacitor?: Bridge }).Capacitor;
  if (!cap?.isNativePlatform?.() || !cap.nativePromise) return null;
  return cap.PluginHeaders?.some((h) => h.name === "Geolocation") ? cap : null;
}

/** True when location was already allowed, so we can use it without prompting. */
export async function locationAllowed(): Promise<boolean> {
  const cap = native();
  if (cap) {
    const p = await cap.nativePromise!<{ location: string }>("Geolocation", "checkPermissions").catch(() => null);
    return p?.location === "granted";
  }
  const p = await navigator.permissions?.query({ name: "geolocation" }).catch(() => null);
  return p?.state === "granted";
}

/** Current position (WGS-84). Prompts for permission the first time. */
export async function currentPosition(opts: { highAccuracy?: boolean; maxAgeMs?: number; timeoutMs?: number } = {}): Promise<Coords> {
  const options = { enableHighAccuracy: opts.highAccuracy ?? false, maximumAge: opts.maxAgeMs ?? 60000, timeout: opts.timeoutMs ?? 10000 };
  const cap = native();
  if (cap) {
    const p = await cap.nativePromise!<{ coords: Coords }>("Geolocation", "getCurrentPosition", options);
    return { longitude: p.coords.longitude, latitude: p.coords.latitude };
  }
  if (!navigator.geolocation) throw new Error("no-geolocation");
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ longitude: coords.longitude, latitude: coords.latitude }),
      reject,
      options,
    ),
  );
}
