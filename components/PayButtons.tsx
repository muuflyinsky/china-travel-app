"use client";
import { useState } from "react";
import { Sheet } from "konsta/react";
import { QrCode, ScanLine, CirclePlus, X } from "lucide-react";
import { Button } from "./ui";
import { AppIcon } from "./AppIcon";
import { useT } from "./useT";
import { openApp } from "@/lib/openApp";

// App deep links. Alipay's documented platformapi routes open the pay code (20000056) and the
// scanner (10000007); WeChat only exposes "open app", so we tell the traveller where to tap.
const LINKS = {
  alipayPay: "alipays://platformapi/startapp?appId=20000056",
  alipayScan: "alipays://platformapi/startapp?saId=10000007",
  wechat: "weixin://",
};

export { LINKS as PAY_LINKS };

/**
 * WeChat can't be opened at its pay code from outside (SPEC v0.5 P1.6 #25), so the two taps are
 * shown first, then WeChat opens. Drawn steps, not screenshots: WeChat's own UI isn't ours to copy.
 */
export function WechatGuide({ onClose }: { onClose: () => void }) {
  const t = useT();
  const steps = [
    { n: 1, text: t.pay.wechatStep1, art: <CirclePlus className="h-7 w-7" aria-hidden /> },
    { n: 2, text: t.pay.wechatStep2, art: <span className="zh text-subhead font-semibold" lang="zh-CN">收付款</span> },
  ];
  return (
    <Sheet opened onBackdropClick={onClose}>
      <div className="bg-card px-4 pt-4 pb-[calc(16px+env(safe-area-inset-bottom))] text-ink">
        <div className="flex items-start gap-3">
          <AppIcon id="wechat" size={36} />
          <h2 className="flex-1 text-title">{t.pay.wechatGuideTitle}</h2>
          <button onClick={onClose} aria-label={t.common.close} className="-mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-porcelain"><X className="h-5 w-5" /></button>
        </div>
        <ol className="mt-4 space-y-3">
          {steps.map((s) => (
            <li key={s.n} className="flex items-center gap-3 rounded-card border border-line p-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-cobalt-soft text-subhead font-semibold text-cobalt">{s.n}</span>
              <span className="flex-1 text-body">{s.text}</span>
              <span className="grid h-12 min-w-12 shrink-0 place-items-center rounded-control bg-porcelain px-2 text-ink">{s.art}</span>
            </li>
          ))}
        </ol>
        <p className="mt-3 px-1 text-footnote text-muted">{t.pay.wechatWhy}</p>
        <Button className="mt-4 w-full" onClick={() => { onClose(); openApp("wechat", LINKS.wechat); }}>{t.pay.wechatOpen}</Button>
      </div>
    </Sheet>
  );
}

export function PayButtons({ compact }: { compact?: boolean }) {
  const t = useT();
  const [guide, setGuide] = useState(false);
  const btn = "flex min-h-14 w-full flex-1 items-center gap-3 rounded-card border border-line bg-card px-3 text-left";
  return (
    <div className="space-y-2">
      <div className={compact ? "grid grid-cols-2 gap-2" : "space-y-2"}>
        <button className={btn} onClick={() => openApp("alipay", LINKS.alipayPay)}>
          <AppIcon id="alipay" size={36} />
          <span className="min-w-0 flex-1 text-subhead font-semibold">{compact ? "Alipay" : t.pay.openAlipay}</span>
          <QrCode className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
        </button>
        {!compact && (
          <button className={btn} onClick={() => openApp("alipay", LINKS.alipayScan)}>
            <AppIcon id="alipay" size={36} />
            <span className="flex-1 text-subhead font-semibold">{t.pay.scanAlipay}</span>
            <ScanLine className="h-5 w-5 text-cobalt" aria-hidden />
          </button>
        )}
        <button className={btn} onClick={() => setGuide(true)}>
          <AppIcon id="wechat" size={36} />
          <span className="min-w-0 flex-1 text-subhead font-semibold">{compact ? "WeChat Pay" : t.pay.openWechat}</span>
          <QrCode className="h-5 w-5 shrink-0 text-cobalt" aria-hidden />
        </button>
      </div>
      {!compact && <p className="px-1 text-footnote text-muted">{t.pay.notInstalled}</p>}
      {guide && <WechatGuide onClose={() => setGuide(false)} />}
    </div>
  );
}
