"use client";
// "This meal": every menu page read at one restaurant, the order being built, and dishes the
// traveller saved for later. Kept only on this phone (localStorage), never sent anywhere.
// Pages store dish facts, never verdicts: the page recomputes every verdict from the current
// allergy settings, so a restored or saved dish can't carry an old "OK" past a new allergy (D1).
import type { ListDish } from "./dishes";

/** Order line: how many, and which sauce/garnish ingredients (Chinese) to leave out. */
export type Line = { qty: number; without: string[] };

/** One photo or typed list. `dishes` is indexed by position on the menu; gaps are still coming (or never came). */
export type MealPage = {
  id: string; input: "photo" | "text" | "saved"; thumb?: string;
  cuisine: string; total: number; dishes: (ListDish | null | undefined)[]; tips: string[]; missing: number; demo?: boolean;
};

/** Order lines by dish (Chinese name): a dish printed on two pages is one line. */
export type Meal = { pages: MealPage[]; order: Record<string, Line>; touched: number };

/** A meal clears this long after its last change; saved dishes stay. */
export const MEAL_TTL = 3 * 3600_000;
const MEAL = "ctg.meal";
const SAVED = "ctg.saved";
const SAVED_MAX = 60;
export const SAVED_EVENT = "ctg-saved";

export const pageId = () => Math.random().toString(36).slice(2, 10);

/** The meal on this phone, or null. `expired`: one is stored but too old (the caller clears it). */
export function loadMeal(now = Date.now()): { meal: Meal | null; expired: boolean } {
  try {
    const raw = localStorage.getItem(MEAL);
    if (!raw) return { meal: null, expired: false };
    const meal = JSON.parse(raw) as Meal;
    if (!meal.pages?.length) return { meal: null, expired: false };
    if (now - meal.touched > MEAL_TTL) return { meal: null, expired: true };
    return { meal, expired: false };
  } catch {
    return { meal: null, expired: false };
  }
}

export function saveMeal(meal: Meal) {
  try {
    if (meal.pages.length) localStorage.setItem(MEAL, JSON.stringify(meal));
    else localStorage.removeItem(MEAL);
  } catch {
    // Storage full: drop the photo thumbnails and keep the dishes.
    try { localStorage.setItem(MEAL, JSON.stringify({ ...meal, pages: meal.pages.map((p) => ({ ...p, thumb: undefined })) })); } catch {}
  }
}

export function clearMeal() {
  try { localStorage.removeItem(MEAL); } catch {}
}

/** A small square-ish JPEG of the photo for the page strip (about 10 KB). */
export async function thumbnail(dataUrl: string, size = 160): Promise<string | undefined> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const scale = Math.min(1, size / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.7);
  } catch {
    return undefined;
  }
}

// ---- saved dishes ---------------------------------------------------------------------------

export type SavedDish = { dish: ListDish; at: number };

export function loadSaved(): SavedDish[] {
  try { return JSON.parse(localStorage.getItem(SAVED) ?? "[]") as SavedDish[]; } catch { return []; }
}

function writeSaved(list: SavedDish[]) {
  try { localStorage.setItem(SAVED, JSON.stringify(list.slice(0, SAVED_MAX))); } catch {}
  window.dispatchEvent(new Event(SAVED_EVENT));
}

export const isSaved = (list: SavedDish[], zh: string) => list.some((s) => s.dish.zh === zh);

/** Saves the dish (newest first), or removes it if it's already saved. */
export function toggleSaved(dish: ListDish) {
  const list = loadSaved();
  writeSaved(isSaved(list, dish.zh) ? list.filter((s) => s.dish.zh !== dish.zh) : [{ dish, at: Date.now() }, ...list]);
}

/** Keeps a saved dish's facts up to date when the dish detail adds allergens (stricter, never looser). */
export function refreshSaved(dish: ListDish) {
  const list = loadSaved();
  if (isSaved(list, dish.zh)) writeSaved(list.map((s) => (s.dish.zh === dish.zh ? { ...s, dish } : s)));
}
