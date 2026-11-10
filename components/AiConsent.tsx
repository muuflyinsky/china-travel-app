"use client";
import { useEffect, useRef, useState } from "react";
import NextLink from "next/link";
import { Sheet } from "konsta/react";
import { ArrowUpRight, Send, Server, Smartphone, WifiOff, ShieldAlert, Siren, CarTaxiFront, BookOpen, Compass } from "lucide-react";
import { Button, Card } from "./ui";
import { useT } from "./useT";
import { AI_CONSENT_ASK, setAiConsent, withAi, type AskDetail } from "@/lib/ai-consent";
import { track } from "@/lib/track";

/** The three facts: what is sent, who reads it, what stays on the phone. Also shown in Settings. */
export function AiConsentFacts() {
  const t = useT().aiConsent;
  const items = [
    { I: Send, h: t.sendH, b: t.send },
    { I: Server, h: t.whoH, b: t.who },
    { I: Smartphone, h: t.keepH, b: t.keep },
  ];
  return (
    <ul className="space-y-4">
      {items.map(({ I, h, b }) => (
        <li key={h} className="flex gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-cobalt-soft text-cobalt"><I className="h-5 w-5" aria-hidden /></span>
          <span className="min-w-0">
            <span className="block text-subhead font-semibold">{h}</span>
            <span className="mt-0.5 block text-subhead text-muted">{b}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * The one-time "third-party AI" notice (App Store 5.1.2(i)). Opened by withAi() before anything
 * is sent; mounted once in AppShell. Closing it without answering sends nothing and asks again
 * next time.
 */
export function AiConsentSheet() {
  const t = useT().aiConsent;
  const [open, setOpen] = useState(false);
  const then = useRef<(() => void) | undefined>(undefined);

  useEffect(() => {
    const ask = (e: Event) => { then.current = (e as CustomEvent<AskDetail>).detail?.then; setOpen(true); };
    window.addEventListener(AI_CONSENT_ASK, ask);
    return () => window.removeEventListener(AI_CONSENT_ASK, ask);
  }, []);

  const close = () => { then.current = undefined; setOpen(false); };
  const allow = () => {
    setAiConsent("granted");
    track("ai_consent", { choice: "allow" });
    const run = then.current;
    close();
    run?.(); // inside the tap, so a photo picker is still allowed to open
  };
  const deny = () => { setAiConsent("denied"); track("ai_consent", { choice: "deny" }); close(); };

  // Its own backdrop and a higher layer than other sheets, so it shows over a dish sheet already open on Eat.
  return (<>
    <div onClick={close} aria-hidden className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`} />
    <Sheet opened={open} backdrop={false} className="pb-safe z-[61]! mx-auto max-w-[600px]" style={{ maxHeight: "92vh" }}>
      {/* Text scrolls (German and French run long); the two buttons always stay on screen. */}
      <div role="dialog" aria-modal="true" aria-labelledby="ai-consent-title" className="flex max-h-[92vh] flex-col bg-card text-ink">
        <div className="mx-auto mt-2 mb-2 h-1.5 w-10 shrink-0 rounded-full bg-line" aria-hidden />
        <div className="min-h-0 flex-1 overflow-auto px-5 pt-2">
          <h2 id="ai-consent-title" className="text-title">{t.title}</h2>
          <p className="mt-1 text-subhead text-muted">{t.sub}</p>
          <div className="mt-4"><AiConsentFacts /></div>
          <NextLink href="/privacy#ai" onClick={close} className="mt-3 inline-flex min-h-touch items-center gap-1 text-subhead font-semibold text-cobalt">
            {t.policy}<ArrowUpRight className="h-4 w-4" aria-hidden />
          </NextLink>
        </div>
        <div className="shrink-0 px-5 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-2">
            <Button onClick={allow} className="w-full">{t.allow}</Button>
            <Button variant="soft" onClick={deny} className="w-full">{t.deny}</Button>
          </div>
          <p className="mt-3 text-center text-footnote text-muted">{t.later}</p>
        </div>
      </div>
    </Sheet>
  </>);
}

/**
 * Shown where an AI feature would be, once the traveller said no: nothing was sent, a way to
 * allow it, and (on Eat) what still works without it.
 */
export function AiOff({ title, works, onAllergyCard }: { title: string; works?: boolean; onAllergyCard?: () => void }) {
  const all = useT();
  const t = all.aiConsent;
  const link = "flex min-h-touch w-full items-center gap-3 text-left text-body";
  const ico = "h-5 w-5 shrink-0 text-cobalt";
  return (
    <Card>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-control bg-porcelain text-muted"><WifiOff className="h-5 w-5" aria-hidden /></span>
        <div className="min-w-0">
          <h2 className="text-headline">{title}</h2>
          <p className="mt-0.5 text-subhead text-muted">{t.offBody}</p>
        </div>
      </div>
      <Button variant="soft" className="mt-3 w-full" onClick={() => withAi()}>{t.allowBtn}</Button>
      {works && (
        <div className="mt-3 border-t border-line pt-3">
          <p className="text-footnote font-semibold text-muted">{t.stillWorks}</p>
          <ul>
            {onAllergyCard && <li><button onClick={onAllergyCard} className={link}><ShieldAlert className={ico} aria-hidden />{all.today.allergyCard}</button></li>}
            <li><NextLink href="/sos" className={link}><Siren className={ico} aria-hidden />{all.today.help}</NextLink></li>
            <li><NextLink href="/driver" className={link}><CarTaxiFront className={ico} aria-hidden />{t.worksTaxi}</NextLink></li>
            <li><NextLink href="/talk" className={link}><BookOpen className={ico} aria-hidden />{all.talk.phrasebook}</NextLink></li>
            <li><NextLink href="/explore" className={link}><Compass className={ico} aria-hidden />{t.worksExplore}</NextLink></li>
          </ul>
        </div>
      )}
    </Card>
  );
}
