"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Volume2, X, MessageSquareReply, ChevronDown, Minus, ArrowLeft } from "lucide-react";
import { useT } from "./useT";
import { track } from "@/lib/track";
import { fmt } from "@/lib/i18n";

/**
 * A reply staff can tap. `pick`: it's about one dish ("can't make", "contains your allergen"), so
 * on an order card with several dishes staff are asked which one; `noneZh`/`none` is the answer
 * for "all of them" / "not sure which".
 */
export type StaffReply = { zh: string; mine: string; pick?: { noneZh: string; none: string; advice?: string; removeOnly?: boolean } };
export type CardDish = { zh: string; name: string };
type Answer = { reply: StaffReply; dish?: CardDish | null; picking?: boolean };

const MAX = 36; // --text-display-zh
const MIN = 28;

/**
 * Full-screen, large-type Chinese card to hand to a taxi driver, waiter or hotel staff.
 * Order of importance: `lead` (a severe allergy, red, largest) → `lines` (what you want) →
 * `rest` (other allergies, smaller). The type shrinks from 36px to 28px until it fits one
 * screen; reply buttons stay pinned at the bottom so staff can always answer.
 */
export function ShowCard({ lead, lines, rest = [], sub, explain, replies, dishes = [], onRemove, kind = "card", onClose }: {
  lead?: string; lines: string[]; rest?: string[]; sub?: string; explain?: string; replies?: StaffReply[];
  /** Order cards: the dishes, so a "can't make" can say which; onRemove takes one out of the order. */
  dishes?: CardDish[]; onRemove?: (zh: string) => void;
  kind?: string; onClose: () => void;
}) {
  const t = useT();
  const [answer, setAnswer] = useState<Answer | null>(null);
  // Set after a dish is taken out: the card now shows the updated order and asks to show it again,
  // so one staff answer never reads as "the rest is fine".
  const [updated, setUpdated] = useState(false);
  const [open, setOpen] = useState(false);
  const [size, setSize] = useState(MAX);
  const box = useRef<HTMLDivElement>(null);
  const all = [lead, ...lines, ...rest].filter(Boolean).join("。");

  // Fit to one screen: step the size down while the content overflows.
  useLayoutEffect(() => { setSize(MAX); setAnswer(null); }, [all]);
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

      {updated && <p className="mt-2 shrink-0 rounded-control bg-cobalt-soft px-3 py-2 text-subhead font-semibold text-cobalt" role="status">{t.eat.orderUpdated}</p>}
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
            {open && <p className="rounded-control bg-porcelain p-3 text-subhead text-muted">{explain}</p>}
          </div>
        )}
      </div>

      {replies && replies.length > 0 && (
        <div className="mt-3 shrink-0 border-t border-line pt-3">
          {answer?.picking ? (
            // Staff point at the dish they meant (Chinese, for them); the traveller's language is the hint.
            <>
              <p className="mb-2 text-footnote font-semibold text-muted">
                <span lang="zh-CN" className="whitespace-nowrap">是哪道菜？请在下面点一下</span> · {t.eat.whichDishHint}
              </p>
              <div className="grid max-h-[40vh] grid-cols-2 gap-2 overflow-auto">
                {dishes.map((d, i) => (
                  <button key={d.zh} lang="zh-CN" onClick={() => { setAnswer({ reply: answer.reply, dish: d }); track("staff_reply_dish", { card: kind, dish: i }); }}
                    className="zh min-h-control rounded-control border-2 border-line px-3 text-left text-headline">{d.zh}</button>
                ))}
                <button lang="zh-CN" onClick={() => { setAnswer({ reply: answer.reply, dish: null }); track("staff_reply_dish", { card: kind, dish: -1 }); }}
                  className={`zh min-h-control rounded-control border-2 border-line px-3 text-left text-headline text-muted ${dishes.length % 2 ? "" : "col-span-2"}`}>{answer.reply.pick!.noneZh}</button>
              </div>
            </>
          ) : answer ? (
            <div className="space-y-2">
              <button onClick={() => setAnswer(null)} className="block w-full rounded-card bg-cobalt-soft p-3 text-left" role="status">
                <span className="block text-footnote font-semibold text-cobalt">{t.eat.staffSays}</span>
                <span className="block text-title">{answer.reply.mine}</span>
                {answer.dish && <span className="block text-headline">{answer.dish.name} <span className="zh font-normal text-muted" lang="zh-CN">{answer.dish.zh}</span></span>}
                {answer.dish === null && answer.reply.pick && <span className="block text-headline">{answer.reply.pick.none}</span>}
                <span className="zh block text-subhead text-muted" lang="zh-CN">{answer.reply.zh}{answer.dish ? `：${answer.dish.zh}` : answer.dish === null && answer.reply.pick ? `：${answer.reply.pick.noneZh}` : ""}</span>
              </button>
              {/* What the traveller can do next. A staff "OK" is their answer, never the app's guarantee. */}
              {answer.reply.pick && dishes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {answer.dish && onRemove && (
                    <button onClick={() => { onRemove(answer.dish!.zh); setUpdated(true); }}
                      className="flex min-h-control flex-1 items-center justify-center gap-1.5 rounded-control bg-cobalt px-3 text-subhead font-semibold text-white dark:text-[#12141c]">
                      <Minus className="h-4 w-4" aria-hidden />{fmt(t.eat.removeDish, { dish: answer.dish.name })}
                    </button>
                  )}
                  {/* "Contains your allergen" about a named dish: taking it out is the only way on. */}
                  {!(answer.dish && onRemove && answer.reply.pick.removeOnly) && <button onClick={onClose} className="flex min-h-control flex-1 items-center justify-center gap-1.5 rounded-control bg-cobalt-soft px-3 text-subhead font-semibold text-cobalt">
                    <ArrowLeft className="h-4 w-4" aria-hidden />{t.eat.changeOrder}
                  </button>}
                </div>
              )}
              {answer.reply.pick?.advice && dishes.length > 0 && answer.dish === null && <p className="text-subhead">{answer.reply.pick.advice}</p>}
            </div>
          ) : (
            <>
              <p className="mb-2 text-footnote font-semibold text-muted">
                <MessageSquareReply className="mr-1 inline h-4 w-4 align-[-3px]" aria-hidden /><span lang="zh-CN" className="whitespace-nowrap">请点一个回复</span> · {t.eat.repliesHint}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {replies.map((r, i) => (
                  <button key={r.zh} lang="zh-CN" onClick={() => {
                    track("staff_reply", { card: kind, reply: i });
                    setUpdated(false);
                    // One dish on the card: that's the one. Several: ask staff which.
                    if (r.pick && dishes.length > 1) setAnswer({ reply: r, picking: true });
                    else setAnswer({ reply: r, dish: r.pick && dishes.length === 1 ? dishes[0] : undefined });
                  }}
                    className={`zh min-h-control rounded-control border-2 border-line px-3 text-left text-headline ${replies.length % 2 && i === replies.length - 1 ? "col-span-2" : ""}`}>
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
