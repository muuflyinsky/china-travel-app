"use client";
import { useRef, useState } from "react";
import { Popup, Dialog, DialogButton } from "konsta/react";
import { CircleMinus, CirclePlus, GripVertical, Lock, ChevronUp, ChevronDown } from "lucide-react";
import { useProfile } from "@/components/useProfile";
import { useT } from "@/components/useT";
import { fmt } from "@/lib/i18n";
import { MAX_SHORTCUTS, REMINDERS, SHORTCUTS, reminderOn, shortcutsOf, useTodayPrefs, type ReminderType, type ShortcutId } from "@/lib/today";
import { SHORTCUT_ICON, useShortcutTitle } from "./Shortcuts";
import { StaySheet } from "./StaySheet";

const ROW = "flex min-h-[52px] w-full items-center gap-3 bg-card px-2";

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-section mb-2 px-1 text-footnote font-semibold text-muted uppercase first:mt-2">{children}</h3>;
}

/** iOS-style switch in our colours. */
function Switch({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors ${on ? "bg-cobalt" : "bg-line"}`}>
      <span className={`absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

/**
 * "Edit Today" (design §5.5): order, remove and add shortcuts, and switch reminder types. Every
 * change is saved on this phone at once; Done only closes.
 */
export function EditToday({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [p] = useProfile();
  const { prefs, update, reset } = useTodayPrefs();
  const title = useShortcutTitle();
  const [confirm, setConfirm] = useState(false);
  const [visa, setVisa] = useState(false);
  const [drag, setDrag] = useState<{ from: number; dy: number; h: number } | null>(null);
  const startY = useRef(0);
  const ids = shortcutsOf(prefs, p.allergens.length > 0);
  const more = SHORTCUTS.filter((x) => !ids.includes(x));
  const full = ids.length >= MAX_SHORTCUTS;

  const save = (list: ShortcutId[]) => update({ shortcuts: list });
  const move = (from: number, to: number) => {
    if (to < 0 || to >= ids.length || to === from) return;
    const n = [...ids];
    const [x] = n.splice(from, 1);
    n.splice(to, 0, x);
    save(n);
  };
  const over = drag ? Math.max(0, Math.min(ids.length - 1, drag.from + Math.round(drag.dy / drag.h))) : -1;
  const shift = (i: number) => {
    if (!drag || i === drag.from) return drag ? drag.dy : 0;
    if (drag.from < over && i > drag.from && i <= over) return -drag.h;
    if (drag.from > over && i >= over && i < drag.from) return drag.h;
    return 0;
  };

  const reminderLabel: Record<ReminderType, string> = {
    stay: t.home.rStay, arrival: t.home.rArrival, leaving: t.home.rLeaving, moving: t.home.rMoving,
    train: t.home.rTrain, before: t.home.rBefore, holiday: t.home.rHoliday,
  };
  // The order travellers meet them in a trip; the stay limit (always on) last.
  const listed: ReminderType[] = ["before", "arrival", "moving", "train", "leaving", "holiday", "stay"];

  return (
    <>
      <Popup opened={open} onBackdropClick={onClose}>
        <div className="flex h-full flex-col bg-porcelain">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 pt-[calc(12px+env(safe-area-inset-top))] pb-2">
            <button type="button" onClick={() => setConfirm(true)} className="flex min-h-11 items-center justify-self-start px-2 text-body text-cobalt">{t.home.reset}</button>
            <h2 className="text-headline text-ink">{t.home.editTitle}</h2>
            <button type="button" onClick={onClose} className="flex min-h-11 items-center justify-self-end px-2 text-headline text-cobalt">{t.home.done}</button>
          </div>
          <div className="flex-1 overflow-auto px-4 pb-[calc(40px+env(safe-area-inset-bottom))]">
            {open && (
              <>
                <GroupTitle>{t.home.onToday}</GroupTitle>
                <ul className="overflow-hidden rounded-card border border-line bg-card">
                  {ids.map((id, i) => {
                    const Icon = SHORTCUT_ICON[id];
                    const auto = id === "allergy" && prefs.allergyAutoAdded && !prefs.allergyByUser && p.allergens.length > 0;
                    const lifted = drag?.from === i;
                    return (
                      <li key={id} className={`relative border-b border-line last:border-b-0 ${lifted ? "z-10 shadow-bar" : ""} ${drag && !lifted ? "transition-transform duration-150" : ""}`}
                        style={{ transform: `translateY(${shift(i)}px)` }}>
                        <div className={ROW}>
                          <button type="button" onClick={() => save(ids.filter((x) => x !== id))} disabled={ids.length <= 1}
                            aria-label={fmt(t.home.removeX, { name: title(id) })}
                            className="grid h-touch w-touch shrink-0 place-items-center text-muted disabled:opacity-40">
                            <CircleMinus className="h-[22px] w-[22px]" aria-hidden />
                          </button>
                          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-cobalt-soft text-cobalt"><Icon className="h-[18px] w-[18px]" aria-hidden /></span>
                          <span className="min-w-0 flex-1 py-2">
                            <span className="block text-body">{title(id)}</span>
                            {auto && <span className="block text-footnote text-muted">{t.home.autoAdded}</span>}
                          </span>
                          {/* Keyboard and screen readers: move without dragging. */}
                          <button type="button" className="sr-only focus:not-sr-only" onClick={() => move(i, i - 1)} disabled={i === 0}>{t.home.moveUp}<ChevronUp className="inline h-4 w-4" aria-hidden /></button>
                          <button type="button" className="sr-only focus:not-sr-only" onClick={() => move(i, i + 1)} disabled={i === ids.length - 1}>{t.home.moveDown}<ChevronDown className="inline h-4 w-4" aria-hidden /></button>
                          <span aria-hidden className="grid h-touch w-touch shrink-0 cursor-grab touch-none place-items-center text-muted"
                            onPointerDown={(e) => {
                              const li = (e.currentTarget as HTMLElement).closest("li");
                              e.currentTarget.setPointerCapture(e.pointerId);
                              startY.current = e.clientY;
                              setDrag({ from: i, dy: 0, h: li?.getBoundingClientRect().height ?? 52 });
                            }}
                            onPointerMove={(e) => drag && setDrag({ ...drag, dy: e.clientY - startY.current })}
                            onPointerUp={() => { if (drag) move(drag.from, over); setDrag(null); }}
                            onPointerCancel={() => setDrag(null)}>
                            <GripVertical className="h-5 w-5" />
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {ids.length <= 1 && <p className="mt-2 px-1 text-footnote text-muted">{t.home.keepOne}</p>}

                {more.length > 0 && (
                  <>
                    <GroupTitle>{t.home.more}</GroupTitle>
                    <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
                      {more.map((id) => {
                        const Icon = SHORTCUT_ICON[id];
                        return (
                          <li key={id}>
                            <button type="button" onClick={() => (id === "allergy" ? update({ shortcuts: [...ids, id], allergyByUser: true }) : save([...ids, id]))} disabled={full} aria-label={fmt(t.home.addX, { name: title(id) })}
                              className={`${ROW} text-left disabled:opacity-40`}>
                              <span className="grid h-touch w-touch shrink-0 place-items-center text-cobalt"><CirclePlus className="h-[22px] w-[22px]" aria-hidden /></span>
                              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] bg-cobalt-soft text-cobalt"><Icon className="h-[18px] w-[18px]" aria-hidden /></span>
                              <span className="min-w-0 flex-1 py-2 text-body">{title(id)}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                    {full && <p className="mt-2 px-1 text-footnote text-muted">{t.home.maxSeven}</p>}
                  </>
                )}

                <GroupTitle>{t.home.remindersTop}</GroupTitle>
                <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-card">
                  {listed.filter((r) => REMINDERS.includes(r)).map((r) => r === "stay" ? (
                    <li key={r}>
                      <button type="button" onClick={() => setVisa(true)} className="flex min-h-[52px] w-full items-center gap-3 px-4 py-2 text-left">
                        <span className="min-w-0 flex-1">
                          <span className="block text-body">{reminderLabel[r]}</span>
                          <span className="block text-footnote text-muted">{t.home.alwaysOn}</span>
                        </span>
                        <Lock className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                      </button>
                    </li>
                  ) : (
                    <li key={r} className="flex min-h-[52px] items-center gap-3 px-4 py-2">
                      <span className="min-w-0 flex-1 text-body">{reminderLabel[r]}</span>
                      <Switch on={reminderOn(prefs, r)} label={reminderLabel[r]} onChange={(v) => update((cur) => ({ reminders: { ...cur.reminders, [r]: v } }))} />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </Popup>
      <Dialog opened={confirm} onBackdropClick={() => setConfirm(false)} title={t.home.resetQ} content={t.home.resetBody}
        buttons={<>
          <DialogButton onClick={() => setConfirm(false)}>{t.home.cancel}</DialogButton>
          <DialogButton strong onClick={() => { reset(); setConfirm(false); }}>{t.home.reset}</DialogButton>
        </>} />
      <StaySheet open={visa} onClose={() => setVisa(false)} />
    </>
  );
}
