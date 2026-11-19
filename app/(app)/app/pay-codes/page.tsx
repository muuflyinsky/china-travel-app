"use client";
import { QrCode, ScanLine, Smartphone } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Card, Section } from "@/components/ui";
import { PayButtons } from "@/components/PayButtons";
import { useT } from "@/components/useT";

/**
 * Pay (DECISIONS D19): the pay-code buttons, moved off the home screen into their own task page.
 * Three steps, the two pay codes, and what to do when paying doesn't work.
 */
export default function PayCodesPage() {
  const t = useT();
  const steps = [
    { Icon: Smartphone, text: t.inapp.step1 },
    { Icon: ScanLine, text: t.inapp.step2 },
    { Icon: QrCode, text: t.inapp.step3 },
  ];
  return (
    <Screen title={t.inapp.payTitle} back>
      <Section>
        <ol className="grid grid-cols-3 gap-2">
          {steps.map(({ Icon, text }) => (
            <li key={text} className="flex flex-col items-center gap-1.5 rounded-card border border-line bg-card p-3 text-center">
              <Icon className="h-5 w-5 text-cobalt" aria-hidden />
              <span className="text-footnote">{text}</span>
            </li>
          ))}
        </ol>
        <PayButtons scan={false} />
      </Section>
      <Section>
        <Card>
          <h2 className="text-headline">{t.inapp.cantPay}</h2>
          <p className="mt-1 text-subhead">{t.pay.feeNote}</p>
          <p className="mt-1 text-subhead">{t.pay.cashNote}</p>
          <p className="mt-1 text-subhead">{t.inapp.askCash}</p>
        </Card>
      </Section>
    </Screen>
  );
}
