"use client";
import { useState } from "react";
import { Banknote } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Section, Card, Group, Row, Note } from "@/components/ui";
import { PayButtons } from "@/components/PayButtons";
import { AppIcon } from "@/components/AppIcon";
import { useProfile } from "@/components/useProfile";
import { useFx, formatMoney } from "@/components/useFx";
import { useT } from "@/components/useT";
import { appStoreUrl } from "@/lib/apps";
import { fmt } from "@/lib/i18n";

// Alipay charges foreign cards ~3% on single payments above ¥200 (shown in-app before paying).
const FEE_THRESHOLD = 200;
const FEE = 0.03;

function PriceCheck() {
  const t = useT();
  const [p] = useProfile();
  const fx = useFx(p.homeCurrency);
  const [amt, setAmt] = useState("100");
  const cny = Number(amt) || 0;
  const home = fx ? cny / fx.value : null;
  return (
    <Card>
      <label className="block">
        <span className="text-[13px] text-muted">{t.pay.amount}</span>
        <span className="mt-1 flex items-baseline gap-1 border-b border-line pb-2">
          <span className="text-[28px] font-semibold text-muted">¥</span>
          <input inputMode="decimal" value={amt} onChange={(e) => setAmt(e.target.value.replace(/[^\d.]/g, ""))}
            className="w-full bg-transparent text-[34px] font-bold tabular-nums outline-none" aria-label={t.pay.amount} />
        </span>
      </label>
      <p className="mt-3 text-[13px] text-muted">{t.pay.youPay}</p>
      <p className="text-[28px] font-bold tabular-nums">{home !== null ? formatMoney(home, p.homeCurrency, p.lang) : "…"}</p>
      {home !== null && cny > FEE_THRESHOLD && (
        <p className="text-[15px] text-warn">{fmt(t.pay.withFee, { amount: formatMoney(home * (1 + FEE), p.homeCurrency, p.lang) })}</p>
      )}
      {fx && (
        <p className="mt-2 text-[13px] text-muted">
          {fmt(t.pay.rate, { base: p.homeCurrency, rate: fx.value.toFixed(3) })} · {fx.approx ? t.pay.approxRate : t.pay.liveRate}
        </p>
      )}
    </Card>
  );
}

export default function PayPage() {
  const t = useT();
  return (
    <Screen title={t.pay.title} back>
      <Section>
        <PayButtons />
      </Section>

      <Section title={t.pay.check} id="check">
        <PriceCheck />
      </Section>

      <Section title={t.pay.setup} id="setup">
        {([["alipay", "Alipay 支付宝", t.pay.alipaySteps], ["wechat", "WeChat 微信", t.pay.wechatSteps]] as const).map(([id, name, steps]) => (
          <Card key={id}>
            <div className="flex items-center gap-3">
              <AppIcon id={id} size={44} />
              <h3 className="zh flex-1 text-[17px] font-semibold">{name}</h3>
              <a href={appStoreUrl(id)} target="_blank" rel="noopener" className="rounded-full bg-cobalt-soft px-3 py-1.5 text-[15px] font-semibold text-cobalt">{t.common.getApp}</a>
            </div>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-[15px] leading-relaxed">
              {steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </Card>
        ))}
        <Note>{t.pay.feeNote}</Note>
      </Section>

      <Section>
        <Group>
          <Row icon={<Banknote className="h-5 w-5 text-cobalt" aria-hidden />} title={t.pay.cashNote} chevron={false} />
        </Group>
      </Section>
    </Screen>
  );
}
