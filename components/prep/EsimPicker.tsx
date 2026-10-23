"use client";
import { useState } from "react";
import { Check, ChevronDown, ExternalLink } from "lucide-react";
import { AppIcon } from "../AppIcon";
import { useT } from "../useT";
import { ESIM_PROVIDERS } from "@/lib/esim";
import { APPS } from "@/lib/apps";
import { goLink } from "@/lib/affiliate";
import { fmt } from "@/lib/i18n";

/** The one provider we recommend; it gets the screen's single gold button. */
const RECOMMENDED = "airalo";

/** Travel eSIM: one recommendation, the rest behind "Other options" (was the Mobile data page). */
export function EsimPicker() {
  const t = useT();
  const [more, setMore] = useState(false);
  const top = ESIM_PROVIDERS.find((p) => p.id === RECOMMENDED)!;
  const rest = ESIM_PROVIDERS.filter((p) => p.id !== RECOMMENDED);
  return (
    <div className="space-y-3">
      <p className="text-subhead">{t.esim.intro}</p>
      <div className="rounded-2xl border border-line p-4">
        <p className="text-footnote text-muted">{fmt(t.esim.recommended, { name: APPS[top.app].name })}</p>
        <div className="mt-2 flex items-center gap-3">
          <AppIcon id={top.app} size={44} />
          <div className="min-w-0 flex-1">
            <h3 className="text-headline">{APPS[top.app].name}</h3>
            <p className="flex items-center gap-1 text-footnote text-muted"><Check className="h-3.5 w-3.5 text-cobalt" aria-hidden />{t.esim.roaming} · {top.features.map((f) => t.esim.features[f]).join(" · ")}</p>
          </div>
        </div>
        <a href={goLink("esim", "esim", { provider: top.id }, "today_esim")} target="_blank" rel="noopener"
          className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-cta text-headline text-cta-ink">
          {t.esim.seePlans} <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
      <button onClick={() => setMore(!more)} aria-expanded={more} className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">
        {t.esim.others} <ChevronDown className={`h-4 w-4 transition-transform ${more ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {more && (
        <ul className="divide-y divide-line">
          {rest.map((p) => (
            <li key={p.id}>
              <a href={goLink("esim", "esim", { provider: p.id }, "today_esim_other")} target="_blank" rel="noopener" className="flex min-h-14 items-center gap-3 py-2">
                <AppIcon id={p.app} size={36} />
                <span className="min-w-0 flex-1">
                  <span className="block text-body">{APPS[p.app].name}</span>
                  <span className="block text-footnote text-muted">{p.features.map((f) => t.esim.features[f]).join(" · ")}</span>
                </span>
                <ExternalLink className="h-4 w-4 shrink-0 text-cobalt" aria-label={t.esim.seePlans} />
              </a>
            </li>
          ))}
        </ul>
      )}
      <p className="text-footnote text-muted">{t.esim.localBody}</p>
      <p className="text-footnote text-muted">{t.common.commission}</p>
    </div>
  );
}
