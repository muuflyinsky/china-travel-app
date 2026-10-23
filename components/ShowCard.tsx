"use client";
import { useState } from "react";
import { Volume2, X, MessageSquareReply } from "lucide-react";
import { useT } from "./useT";

export type StaffReply = { zh: string; mine: string };

/**
 * Full-screen, large-type Chinese card to hand to a taxi driver, waiter or hotel staff.
 * `explain` tells the traveller (in their language) what the card says; `replies` lets staff
 * answer with one tap, and the answer is shown back in the traveller's language.
 */
export function ShowCard({ lines, sub, explain, replies, onClose }: { lines: string[]; sub?: string; explain?: string; replies?: StaffReply[]; onClose: () => void }) {
  const t = useT();
  const [answer, setAnswer] = useState<StaffReply | null>(null);
  const speak = () => {
    const u = new SpeechSynthesisUtterance(lines.join("。"));
    u.lang = "zh-CN";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-card px-5 pt-[calc(16px+env(safe-area-inset-top))] pb-[calc(20px+env(safe-area-inset-bottom))] text-ink">
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-muted">请看 · {t.show.title}</span>
        <button onClick={onClose} aria-label={t.common.close} className="grid h-11 w-11 place-items-center rounded-full bg-porcelain">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-6 flex-1 space-y-4 overflow-auto">
        <div className="zh space-y-3">
          {lines.map((l, i) => <p key={i} className="text-[28px] leading-snug font-bold">{l}</p>)}
        </div>
        {sub && <p className="text-muted">{sub}</p>}
        {explain && <p className="rounded-xl bg-porcelain p-3 text-[15px] text-muted">{explain}</p>}

        {replies && replies.length > 0 && (
          <div className="space-y-2">
            {answer ? (
              <div className="rounded-2xl bg-cobalt-soft p-4" role="status">
                <p className="text-[13px] font-semibold text-cobalt">{t.eat.staffSays}</p>
                <p className="text-[24px] leading-snug font-bold">{answer.mine}</p>
                <p className="zh text-[15px] text-muted">{answer.zh}</p>
              </div>
            ) : (
              <>
                <p className="zh flex items-center gap-1.5 text-[15px] font-semibold text-muted">
                  <MessageSquareReply className="h-4 w-4" aria-hidden />请点一个回复 · {t.eat.repliesHint}
                </p>
                <div className="grid gap-2">
                  {replies.map((r) => (
                    <button key={r.zh} onClick={() => setAnswer(r)} className="zh min-h-14 rounded-2xl border-2 border-line px-4 text-left text-[20px] font-semibold">
                      {r.zh}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <button onClick={speak} className="mt-3 flex h-14 items-center justify-center gap-2 rounded-2xl bg-cobalt text-[17px] font-semibold text-white dark:text-[#12141c]">
        <Volume2 className="h-5 w-5" /> {t.show.play}
      </button>
    </div>
  );
}
