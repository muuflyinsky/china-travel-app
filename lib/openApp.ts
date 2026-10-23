"use client";
import { appStoreUrl, playStoreUrl, type AppId } from "./apps";
import { track } from "./track";

// URL schemes that open each app's home screen. Alipay and WeChat are documented; Amap's are
// its published URI schemes; DiDi's is widely used but not documented by DiDi (verify on a
// device). Trip.com uses its universal link (opens the app when installed, the site if not).
// 12306 has no public scheme, so it goes to the store page.
const SCHEMES: Partial<Record<AppId, { ios?: string; android?: string; web?: string }>> = {
  alipay: { ios: "alipays://", android: "alipays://" },
  wechat: { ios: "weixin://", android: "weixin://" },
  amap: { ios: "iosamap://", android: "androidamap://" },
  didi: { ios: "diditaxi://", android: "diditaxi://" },
  tripcom: { web: "https://www.trip.com/" },
};

const isAndroid = () => /android/i.test(navigator.userAgent);
const store = (app: AppId) => (isAndroid() && playStoreUrl(app)) || appStoreUrl(app);

/**
 * Open a Chinese app (optionally at `url`, e.g. Alipay's pay code); if the page is still
 * visible 1.6 s later the app isn't installed, so open its store page instead.
 */
export function openApp(app: AppId, url?: string) {
  track("app_open", { app });
  const s = SCHEMES[app];
  if (!url && s?.web) { window.open(s.web, "_blank", "noopener"); return; }
  const target = url ?? (isAndroid() ? s?.android : s?.ios);
  if (!target) { window.location.href = store(app); return; }
  const started = Date.now();
  window.location.href = target;
  setTimeout(() => {
    if (document.visibilityState === "visible" && Date.now() - started < 2500) window.location.href = store(app);
  }, 1600);
}
