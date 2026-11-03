"use client";
import { useState } from "react";
import { ArrowLeft, Check, X } from "lucide-react";
import { ShowCard } from "./ShowCard";
import { useT } from "./useT";
import { useProfile } from "./useProfile";
import { track } from "@/lib/track";
import { fmt } from "@/lib/i18n";
import type { AllergenId } from "@/lib/allergens";
import type { orderCard } from "@/lib/order-card";

type Card = ReturnType<typeof orderCard>;
type Step = "card" | "pick" | "handoff" | "result" | "ok";

/**
 * The order card as a short exchange with staff (PM review #2, Veer 2026-11-03):
 * 1. card: the order in big Chinese, and one question staff can answer in a tap — "can you make
 *    all of these, is any one where my allergen can't be left out?" — all fine / some aren't.
 * 2. pick (staff, full screen, Chinese): tick every problem dish, then 选好了 — or "not sure".
 * 3. handoff (staff): "thanks, please hand the phone back".
 * 4. result (traveller's language): which dishes staff marked; order the rest now (the card comes
 *    back without them, to show again) or go choose other dishes. Marked dishes leave the order.
 * A staff "all fine" is their answer, never the app's check: no verdict changes (D1).
 */
export function OrderShowCard({ card, onRemove, onClose }: {
  /** Without `then`, the dishes only leave the order (the card stays); with it, show the card for the rest or go back to the menu. */
  card: Card; onRemove: (zhs: string[], then?: "show" | "menu") => void; onClose: () => void;
}) {
  const t = useT();
  const [p] = useProfile();
  const [step, setStep] = useState<Step>("card");
  const [marked, setMarked] = useState<string[]>([]);
  const [unsure, setUnsure] = useState(false);
  const { ask, dishes } = card;
  const mine = p.allergens.map((a) => t.allergens[a as AllergenId].toLowerCase()).join(", ");
  // Staff answered: marked dishes leave the order now, so closing at any later step keeps that.
  const finish = (zhs: string[]) => { setMarked(zhs); if (zhs.length) onRemove(zhs); setStep("handoff"); };
  const toggle = (zh: string) => setMarked((m) => (m.includes(zh) ? m.filter((x) => x !== zh) : [...m, zh]));
  const left = dishes.filter((d) => !marked.includes(d.zh));
  const shell = "fixed inset-0 z-50 flex flex-col bg-card px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-[calc(12px+env(safe-area-inset-bottom))] text-ink";
  const close = <button onClick={onClose} aria-label={t.common.close} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-porcelain"><X className="h-5 w-5" /></button>;

  if (step === "pick") {
    return (
      <div role="dialog" aria-modal="true" className={shell}>
        <div className="flex shrink-0 items-center gap-2">
          <button onClick={() => { setStep("card"); setMarked([]); }} aria-label={t.common.back} className="grid h-11 w-11 place-items-center rounded-full bg-porcelain"><ArrowLeft className="h-5 w-5" /></button>
          <span className="flex-1 text-footnote font-semibold text-muted">{t.eat.staffPicking}</span>
          {close}
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-auto" lang="zh-CN">
          {card.lead && <p className="zh mb-2 text-title font-bold text-danger">{card.lead}</p>}
          <p className="zh text-[28px] leading-tight font-bold">{ask.pick}</p>
          <ul className="mt-4 space-y-2">
            {dishes.map((d) => {
              const on = marked.includes(d.zh);
              return (
                <li key={d.zh}>
                  <button onClick={() => toggle(d.zh)} aria-pressed={on}
                    className={`zh flex min-h-16 w-full items-center gap-3 rounded-card border-2 px-4 text-left text-[26px] font-bold ${on ? "border-danger bg-danger-soft text-danger" : "border-line"}`}>
                    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${on ? "border-danger bg-danger text-white" : "border-line"}`}>{on && <Check className="h-5 w-5" aria-hidden />}</span>
                    <span className="min-w-0 flex-1">{d.zh}</span>
                    <span className="shrink-0 text-body font-semibold text-muted">×{d.qty}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-3 shrink-0 space-y-2 border-t border-line pt-3" lang="zh-CN">
          <button disabled={!marked.length} onClick={() => { track("staff_reply_dish", { card: "order", n: marked.length }); finish(marked); }}
            className="zh flex min-h-14 w-full items-center justify-center rounded-control bg-cobalt text-title font-bold text-white disabled:opacity-40 dark:text-[#12141c]">
            {ask.done}{marked.length ? `（${marked.length}）` : ""}
          </button>
          {ask.unsure && (
            <button onClick={() => { track("staff_reply_dish", { card: "order", n: -1 }); setUnsure(true); finish([]); }}
              className="zh flex min-h-control w-full items-center justify-center rounded-control border-2 border-line text-headline">{ask.unsure}</button>
          )}
        </div>
      </div>
    );
  }

  if (step === "handoff") {
    return (
      <div role="dialog" aria-modal="true" className={shell}>
        <div className="flex shrink-0 justify-end">{close}</div>
        <div className="zh flex min-h-0 flex-1 flex-col justify-center space-y-3 text-[36px] leading-tight font-bold" lang="zh-CN">
          {ask.handoff.map((l) => <p key={l}>{l}</p>)}
        </div>
        <button onClick={() => setStep("result")} className="flex min-h-control w-full shrink-0 items-center justify-center rounded-control bg-cobalt-soft text-headline text-cobalt">{t.eat.seeAnswer}</button>
      </div>
    );
  }

  if (step === "result" && unsure) {
    return (
      <div role="dialog" aria-modal="true" className={shell}>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex-1 text-footnote font-semibold text-muted">{t.eat.staffSays}</span>
          {close}
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-auto">
          <h2 className="text-title">{fmt(t.eat.staffUnsure, { x: mine })}</h2>
          <p className="rounded-card bg-warn-soft p-3 text-body text-warn">{fmt(t.eat.whichDishUnsure, { x: mine })}</p>
        </div>
        <div className="mt-3 shrink-0 space-y-2 border-t border-line pt-3">
          <button onClick={() => { setUnsure(false); setStep("card"); }} className="flex min-h-control w-full items-center justify-center rounded-control bg-cobalt text-headline text-white dark:text-[#12141c]">{t.eat.askAgain}</button>
          <button onClick={onClose} className="flex min-h-control w-full items-center justify-center rounded-control bg-cobalt-soft text-headline text-cobalt">{t.eat.chooseOther}</button>
        </div>
      </div>
    );
  }

  if (step === "result") {
    return (
      <div role="dialog" aria-modal="true" className={shell}>
        <div className="flex shrink-0 items-center gap-2">
          <span className="flex-1 text-footnote font-semibold text-muted">{t.eat.staffSays}</span>
          {close}
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-auto">
          <h2 className="text-title">{marked.length === 1 ? t.eat.markedOne : fmt(t.eat.marked, { n: marked.length })}</h2>
          <p className="text-body text-muted">{[mine && fmt(t.eat.markedWhyAllergy, { x: mine }), p.diets.length ? t.eat.markedWhyDiet : "", !mine && !p.diets.length ? t.eat.markedWhy : ""].filter(Boolean).join(" ")}</p>
          <ul className="divide-y divide-line rounded-card border border-line">
            {dishes.filter((d) => marked.includes(d.zh)).map((d) => (
              <li key={d.zh} className="flex items-baseline justify-between gap-3 px-4 py-3">
                <span className="text-body font-semibold">{d.name}</span><span className="zh text-subhead text-muted" lang="zh-CN">{d.zh}</span>
              </li>
            ))}
          </ul>
          <p className="text-footnote text-muted">{t.eat.markedLeave}</p>
        </div>
        <div className="mt-3 shrink-0 space-y-2 border-t border-line pt-3">
          {left.length > 0 && (
            <button onClick={() => onRemove([], "show")} className="flex min-h-control w-full items-center justify-center rounded-control bg-cobalt text-headline text-white dark:text-[#12141c]">
              {left.length === 1 ? t.eat.orderRestOne : fmt(t.eat.orderRest, { n: left.length })}
            </button>
          )}
          <button onClick={() => onRemove([], "menu")} className="flex min-h-control w-full items-center justify-center rounded-control bg-cobalt-soft text-headline text-cobalt">{t.eat.chooseOther}</button>
        </div>
      </div>
    );
  }

  // Step "card", plus the two answers that need no picking: all fine, or not sure.
  const bottom = step === "ok" ? (
    <div className="space-y-2">
      <button onClick={() => setStep("card")} className="block w-full rounded-card bg-cobalt-soft p-3 text-left" role="status">
        <span className="block text-footnote font-semibold text-cobalt">{t.eat.staffSays}</span>
        <span className="block text-headline">{mine ? fmt(t.eat.staffAllOkAllergy, { x: mine }) : t.eat.staffAllOk}</span>
        <span className="zh block text-subhead text-muted" lang="zh-CN">{ask.yes}</span>
      </button>
      {/* Their answer, never the app's: no verdict changes (D1). */}
      <p className="text-footnote text-muted">{t.eat.staffOkNote}</p>
    </div>
  ) : (
    <div lang="zh-CN">
      <p className="zh text-[26px] leading-tight font-bold">{ask.q}</p>
      <div className="mt-3 space-y-2">
        <button onClick={() => { track("staff_reply", { card: "order", reply: 0 }); setStep("ok"); }}
          className="zh min-h-14 w-full rounded-control border-2 border-line px-4 text-left text-title font-bold">{ask.yes}</button>
        <button onClick={() => { track("staff_reply", { card: "order", reply: 1 }); if (dishes.length === 1) finish([dishes[0].zh]); else { setMarked([]); setStep("pick"); } }}
          className="zh min-h-14 w-full rounded-control border-2 border-danger px-4 text-left text-title font-bold text-danger">{ask.some}</button>
      </div>
      <p className="mt-2 text-footnote text-muted">{t.eat.askHint}</p>
    </div>
  );
  return (
    <ShowCard kind="order" lead={card.lead} lines={card.lines} rest={card.rest} explain={card.explain}
      notice={card.again ? t.eat.orderUpdated : undefined} bottom={bottom} bottomKey={step} onClose={onClose} />
  );
}
