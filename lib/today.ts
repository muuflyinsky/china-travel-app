"use client";
import { useCallback, useEffect, useState } from "react";
import { addDays, todayIso } from "./stay";

/**
 * Today home A' (DECISIONS D17): which shortcuts the traveller keeps on Today, which reminder
 * types are on, and which reminder cards they hid. Kept in this browser only (localStorage
 * `ctg.today`), like the rest of the trip data.
 */

/** Every shortcut, in the order "More shortcuts" lists them. Only our own pages and panels (D19). */
export const SHORTCUTS = ["menu", "allergy", "driver", "pay", "translate", "nearby", "price", "today", "phrase", "tax", "airport", "ready"] as const;
export type ShortcutId = (typeof SHORTCUTS)[number];

/** Defaults are conservative (Veer): five, plus the allergy card second for travellers with allergies. */
export const defaultShortcuts = (hasAllergies: boolean): ShortcutId[] =>
  hasAllergies ? ["menu", "allergy", "driver", "pay", "translate", "nearby"] : ["menu", "driver", "pay", "translate", "nearby"];

export const MAX_SHORTCUTS = 7; // one large + six small fill the first screen

/** Reminder types in priority order: when several apply, only the first shows (design §5.6). */
export const REMINDERS = ["stay", "arrival", "leaving", "moving", "train", "before", "holiday"] as const;
export type ReminderType = (typeof REMINDERS)[number];
/** Holiday crowds are useful but not urgent: off until turned on. The stay limit can't be turned off. */
const REMINDER_DEFAULTS: Record<ReminderType, boolean> = { stay: true, arrival: true, leaving: true, moving: true, train: true, before: true, holiday: false };

export type TodayPrefs = {
  /** Chosen shortcuts in order; absent = the default list. */
  shortcuts?: ShortcutId[];
  /** Reminder types switched away from their default. */
  reminders: Partial<Record<ReminderType, boolean>>;
  /** Hidden reminder cards: instance key (type:detail) → first day it may show again ("9999-12-31" = never). */
  hidden: Record<string, string>;
  /** "Make it yours" hint dismissed, or the editor opened once. */
  hintDone: boolean;
  /** "Add your dates for reminders" dismissed. */
  datesHintDone: boolean;
  /** The allergy card was added once for this traveller's allergies; removing it later is respected. */
  allergyAutoAdded: boolean;
  /** The traveller put the allergy card back from More shortcuts themselves (no "Added because…" line). */
  allergyByUser?: boolean;
};

const EMPTY: TodayPrefs = { reminders: {}, hidden: {}, hintDone: false, datesHintDone: false, allergyAutoAdded: false };
const KEY = "ctg.today";
const EVENT = "ctg-today";

function read(): TodayPrefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const v = { ...EMPTY, ...JSON.parse(raw) } as TodayPrefs;
      // Drop ids a later version no longer has.
      if (v.shortcuts) v.shortcuts = v.shortcuts.filter((x) => (SHORTCUTS as readonly string[]).includes(x));
      return v;
    }
  } catch {}
  return EMPTY;
}

export function useTodayPrefs() {
  const [prefs, setPrefs] = useState<TodayPrefs>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const sync = () => { setPrefs(read()); setLoaded(true); };
    sync();
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);
  const update = useCallback((patch: Partial<TodayPrefs> | ((p: TodayPrefs) => Partial<TodayPrefs>)) => {
    const cur = read();
    const next = { ...cur, ...(typeof patch === "function" ? patch(cur) : patch) };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setPrefs(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  const reset = useCallback(() => {
    // Hints stay dismissed: the traveller already knows Edit is there.
    const cur = read();
    const next: TodayPrefs = { ...EMPTY, hintDone: true, datesHintDone: cur.datesHintDone };
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
    setPrefs(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);
  return { prefs, update, reset, loaded };
}

export const shortcutsOf = (p: TodayPrefs, hasAllergies: boolean) => p.shortcuts ?? defaultShortcuts(hasAllergies);

export const reminderOn = (p: TodayPrefs, type: ReminderType) => type === "stay" || (p.reminders[type] ?? REMINDER_DEFAULTS[type]);

export const isHidden = (p: TodayPrefs, key: string, today = todayIso()) => {
  const until = p.hidden[key];
  return Boolean(until && today < until);
};

/** "Not needed" hides this card for good; "Remind me tomorrow" until tomorrow 00:00 on this phone. */
export const hideUntil = (how: "never" | "tomorrow", today = todayIso()) => (how === "never" ? "9999-12-31" : addDays(today, 1));

/**
 * The first time allergies are set, the allergy card goes second on Today (D17). Once added it is
 * never added again, so removing it sticks; Reset clears the flag.
 */
export function withAllergyCard(list: ShortcutId[]): ShortcutId[] {
  // Full: never push out something the traveller chose; the card stays one tap away in More shortcuts.
  if (list.includes("allergy") || list.length >= MAX_SHORTCUTS) return list;
  const next = [...list];
  next.splice(Math.min(1, next.length), 0, "allergy");
  return next;
}
