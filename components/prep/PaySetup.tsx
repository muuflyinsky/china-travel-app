"use client";
import { Banknote } from "lucide-react";
import { Note } from "../ui";
import { AppIcon } from "../AppIcon";
import { useT } from "../useT";
import { appStoreUrl } from "@/lib/apps";

/** How to set up Alipay and WeChat Pay with a foreign card (was the Pay page). */
export function PaySetup() {
  const t = useT();
  return (
    <div className="space-y-4">
      {([["alipay", "Alipay 支付宝", t.pay.alipaySteps], ["wechat", "WeChat 微信", t.pay.wechatSteps]] as const).map(([id, name, steps]) => (
        <div key={id}>
          <div className="flex items-center gap-3">
            <AppIcon id={id} size={40} />
            <h3 className="zh flex-1 text-headline">{name}</h3>
            <a href={appStoreUrl(id)} target="_blank" rel="noopener" className="flex min-h-11 items-center text-subhead font-semibold text-cobalt">{t.common.getApp}</a>
          </div>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-subhead">
            {steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </div>
      ))}
      <Note>{t.pay.feeNote}</Note>
      <p className="flex gap-2 text-subhead text-muted"><Banknote className="mt-0.5 h-4 w-4 shrink-0 text-cobalt" aria-hidden />{t.pay.cashNote}</p>
    </div>
  );
}
