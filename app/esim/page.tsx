"use client";
import { CheckCircle2, ExternalLink, CardSim } from "lucide-react";
import { Screen } from "@/components/Shell";
import { Section, Card, Note } from "@/components/ui";
import { AppIcon } from "@/components/AppIcon";
import { useT } from "@/components/useT";
import { ESIM_PROVIDERS } from "@/lib/esim";
import { APPS } from "@/lib/apps";
import { goLink } from "@/lib/affiliate";

export default function EsimPage() {
  const t = useT();
  return (
    <Screen title={t.esim.title} back>
      <Section>
        <Note>{t.esim.intro}</Note>
      </Section>

      <Section>
        {ESIM_PROVIDERS.map((p) => (
          <Card key={p.id}>
            <div className="flex items-center gap-3">
              <AppIcon id={p.app} size={48} />
              <div className="min-w-0 flex-1">
                <h3 className="text-[17px] font-semibold">{APPS[p.app].name}</h3>
                <p className="flex items-center gap-1 text-[13px] text-ok"><CheckCircle2 className="h-3.5 w-3.5" aria-hidden />{t.esim.roaming}</p>
              </div>
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {p.features.map((f) => <li key={f} className="tag">{t.esim.features[f]}</li>)}
            </ul>
            <a href={goLink("esim", "esim", { provider: p.id }, "esim_page")} target="_blank" rel="noopener"
              className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cta text-[17px] font-semibold text-cta-ink">
              {t.esim.seePlans} <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </Card>
        ))}
        <p className="px-1 text-[13px] text-muted">{t.common.commission}</p>
      </Section>

      <Section title={t.esim.localTitle}>
        <Card>
          <div className="flex gap-3">
            <CardSim className="h-6 w-6 shrink-0 text-cobalt" aria-hidden />
            <p className="text-[15px] leading-relaxed">{t.esim.localBody}</p>
          </div>
        </Card>
        <Note>{t.esim.tips}</Note>
      </Section>
    </Screen>
  );
}
