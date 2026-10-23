"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Volume2, X, MessageSquareReply, ChevronDown } from "lucide-react";
import { useT } from "./useT";
import { track } from "@/lib/track";

export type StaffReply = { zh: string; mine: string };

const MAX = 36; // --text-display-zh
const MIN = 28;

/**
 * Full-screen, large-type Chinese card to hand to a taxi driver, waiter or hotel staff.
 * Order of importance: `lead` (a severe allergy, red, largest) → `lines` (what you want) →
 * `rest` (other allergies, smaller). The type shrinks from 36px to 28px until it fits one
 * screen; reply buttons stay pinned at the bottom so staff can always answer.
 */
export function ShowCard({ lead, lines, rest = [], sub, explain, replies, kind = "card", onClose }: {
  lead?: string; lines: string[]; rest?: string[]; sub?: string; explain?: string; replies?: StaffReply[];
  kind?: string; onClose: () => void;
}) {
  const t = useT();
  const [answer, setAnswer] = useState<StaffReply | null>(null);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(MAX);
  const box = useRef<HTMLDivElement>(null);
  const all = [lead, ...lines, ...rest].filter(Boolean).join("。");

  // Fit to one screen: step the size down while the content overflows.
  useLayoutEffect(() => { setSize(MAX); }, [all]);
  useLayoutEffect(() => {
    const el = box.current;
    if (el && el.scrollHeight > el.clientHeight + 1 && size > MIN) setSize(size - 2);
  }, [size, all, open]);

  const speak = () => {
    const u = new SpeechSynthesisUtterance(all);
    u.lang = "zh-CN";
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  };
  // Sizes are computed between the display token (36px) and 28px, so they are set inline.
  const big = { fontSize: size, lineHeight: 1.28 };
  const small = { fontSize: Math.round(size * 0.72), lineHeight: 1.4 };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex flex-col bg-card px-4 pt-[calc(12px+env(safe-area-inset-top))] pb-[calc(12px+env(safe-area-inset-bottom))] text-ink">
      <div className="flex shrink-0 items-center gap-2">
        <span className="flex-1 text-footnote font-semibold text-muted"><span lang="zh-CN">请看</span> · {t.show.title}</span>
        <button onClick={speak} aria-label={t.show.play} className="grid h-11 w-11 place-items-center rounded-full bg-cobalt-soft text-cobalt"><Volume2 className="h-5 w-5" /></button>
        <button onClick={onClose} aria-label={t.common.close} className="grid h-11 w-11 place-items-center rounded-full bg-porcelain"><X className="h-5 w-5" /></button>
      </div>

      <div ref={box} className="mt-3 min-h-0 flex-1 overflow-auto">
        <div className="zh space-y-3 font-semibold" lang="zh-CN">
          {lead && <p className="font-bold text-danger" style={big}>{lead}</p>}
          {lines.map((l, i) => <p key={i} className="font-bold" style={big}>{l}</p>)}
          {rest.map((l, i) => <p key={i} style={small}>{l}</p>)}
        </div>
        {sub && <p className="mt-2 text-subhead text-muted">{sub}</p>}
        {explain && (
          <div className="mt-3">
            <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex min-h-11 items-center gap-1 text-subhead font-semibold text-cobalt">
              {t.show.whatItSays}<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
            </button>
            {open && <p className="rounded-xl bg-porcelain p-3 text-subhead text-muted">{explain}</p>}
          </div>
        )}
      </div>

      {replies && replies.length > 0 && (
        <div className="mt-3 shrink-0 border-t border-line pt-3">
          {answer ? (
            <button onClick={() => setAnswer(null)} className="block w-full rounded-2xl bg-cobalt-soft p-3 text-left" role="status">
              <span className="block text-footnote font-semibold text-cobalt">{t.eat.staffSays}</span>
              <span className="block text-title">{answer.mine}</span>
              <span className="zh block text-subhead text-muted" lang="zh-CN">{answer.zh}</span>
            </button>
          ) : (
            <>
              <p className="mb-2 text-footnote font-semibold text-muted">
                <MessageSquareReply className="mr-1 inline h-4 w-4 align-[-3px]" aria-hidden /><span lang="zh-CN" className="whitespace-nowrap">请点一个回复</span> · {t.eat.repliesHint}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {replies.map((r, i) => (
                  <button key={r.zh} lang="zh-CN" onClick={() => { setAnswer(r); track("staff_reply", { card: kind, reply: i }); }}
                    className={`zh min-h-12 rounded-2xl border-2 border-line px-3 text-left text-headline ${replies.length % 2 && i === replies.length - 1 ? "col-span-2" : ""}`}>
                    {r.zh}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
