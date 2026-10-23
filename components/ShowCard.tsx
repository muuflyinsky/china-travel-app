"use client";
import { Volume2, X } from "lucide-react";
import { useT } from "./useT";

// Full-screen, large-type Chinese card to hand to a taxi driver, waiter or hotel staff.
export function ShowCard({ lines, sub, onClose }: { lines: string[]; sub?: string; onClose: () => void }) {
  const t = useT();
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
      <div className="zh mt-8 flex-1 space-y-4 overflow-auto">
        {lines.map((l, i) => <p key={i} className="text-[30px] leading-snug font-bold">{l}</p>)}
      </div>
      {sub && <p className="mb-3 text-muted">{sub}</p>}
      <button onClick={speak} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-cobalt text-[17px] font-semibold text-white dark:text-[#12141c]">
        <Volume2 className="h-5 w-5" /> {t.show.play}
      </button>
    </div>
  );
}
