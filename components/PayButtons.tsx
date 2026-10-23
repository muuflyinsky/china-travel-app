"use client";
import { QrCode, ScanLine } from "lucide-react";
import { AppIcon } from "./AppIcon";
import { useT } from "./useT";
import { appStoreUrl, playStoreUrl, type AppId } from "@/lib/apps";

// App deep links. Alipay's documented platformapi routes open the pay code (20000056) and the
// scanner (10000007); WeChat only exposes "open app", so we tell the traveller where to tap.
const LINKS = {
  alipayPay: "alipays://platformapi/startapp?appId=20000056",
  alipayScan: "alipays://platformapi/startapp?saId=10000007",
  wechat: "weixin://",
};

/** Try the app; if the page is still visible after 1.6 s the app isn't installed → open the store. */
function openApp(scheme: string, app: AppId) {
  const started = Date.now();
  window.location.href = scheme;
  setTimeout(() => {
    if (document.visibilityState === "visible" && Date.now() - started < 2500) {
      const android = /android/i.test(navigator.userAgent);
      window.location.href = (android && playStoreUrl(app)) || appStoreUrl(app);
    }
  }, 1600);
}

export function PayButtons({ compact }: { compact?: boolean }) {
  const t = useT();
  const btn = "flex min-h-14 w-full flex-1 items-center gap-3 rounded-2xl border border-line bg-card px-3 text-left";
  return (
    <div className="space-y-2">
      <div className={compact ? "grid grid-cols-2 gap-2" : "space-y-2"}>
        <button className={btn} onClick={() => openApp(LINKS.alipayPay, "alipay")}>
          <AppIcon id="alipay" size={36} />
          <span className="min-w-0 flex-1 text-[15px] leading-tight font-semibold">{compact ? "Alipay" : t.pay.openAlipay}</span>
          <QrCode className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
        </button>
        {!compact && (
          <button className={btn} onClick={() => openApp(LINKS.alipayScan, "alipay")}>
            <AppIcon id="alipay" size={36} />
            <span className="flex-1 text-[15px] font-semibold">{t.pay.scanAlipay}</span>
            <ScanLine className="h-5 w-5 text-cobalt" aria-hidden />
          </button>
        )}
        <button className={btn} onClick={() => openApp(LINKS.wechat, "wechat")}>
          <AppIcon id="wechat" size={36} />
          <span className="min-w-0 flex-1 text-[15px] leading-tight font-semibold">{compact ? "WeChat Pay" : t.pay.openWechat}</span>
          <QrCode className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
        </button>
      </div>
      {!compact && <p className="px-1 text-[13px] text-muted">{t.pay.wechatHint} {t.pay.notInstalled}</p>}
    </div>
  );
}
