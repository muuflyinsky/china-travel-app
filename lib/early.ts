// Early devices (DECISIONS D23, item 7): from 11-20 to 11-23 the website and the app said
// "free until 31 December 2026" (D21). The offer is withdrawn for new users, but a device that used
// HaodeGo before iOS 1.1 went on sale keeps unlimited use until that day, Beijing time.
//
// How a device knows when it started: the first page load with this code stores ctg.since (the
// Beijing date) in localStorage, from the inline script in app/(app)/layout.tsx, before anything
// else on the page writes. A device that already had HaodeGo data then (any ctg.* key, written by
// an earlier visit) gets OLD_DEVICE instead, since it was here before this code shipped. The page
// sends it as x-ctg-since (lib/device.ts).
//
// The cut-off is the day 1.1 went on sale: EARLY_BEFORE=YYYY-MM-DD (Vercel), set together with
// QUOTA=on. A device whose ctg.since is earlier is early. Until 31 December, QUOTA=on without
// EARLY_BEFORE leaves the limits off (lib/quota.ts), so a missing variable can't break the promise.
//
// Like x-ctg-client, the header is the page's word: someone who edits localStorage can claim an
// early date. That buys free AI until 31 December at most, and the per-IP limits still cap scripts.

/** The last free day promised to early devices (Beijing time, inclusive). Never extended. */
export const EARLY_FREE_UNTIL = "2026-12-31";
/** ctg.since for a device that already had HaodeGo data when this code first ran on it. */
export const OLD_DEVICE = "2026-11-23";

/** A real calendar day as YYYY-MM-DD (2026-02-31 is refused rather than rolled into March). */
export function isDay(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

export const beijingDay = (now = new Date()) => now.toLocaleDateString("en-CA", { timeZone: "Asia/Shanghai" });

/** The day 1.1 went on sale (server only; the page gets it from app/(app)/layout.tsx). */
export function earlyBefore(): string | null {
  const v = process.env.EARLY_BEFORE?.trim();
  return isDay(v) ? v : null;
}

/** True while a device that started before `before` still has its free period. */
export const isEarly = (since: string | null | undefined, before: string | null | undefined, now = new Date()) =>
  isDay(since) && isDay(before) && since < before && beijingDay(now) <= EARLY_FREE_UNTIL;

/** "31 December 2026" in the traveller's language. */
export const earlyDate = (lang: string) =>
  new Date(`${EARLY_FREE_UNTIL}T12:00:00+08:00`).toLocaleDateString(lang, { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Shanghai" });

/** The inline script that stores ctg.since; keep in step with OLD_DEVICE and beijingDay. */
export const SINCE_SCRIPT = `try{if(!localStorage.getItem("ctg.since")){var o=Object.keys(localStorage).some(function(k){return k.indexOf("ctg.")===0});localStorage.setItem("ctg.since",o?"${OLD_DEVICE}":new Date().toLocaleDateString("en-CA",{timeZone:"Asia/Shanghai"}))}}catch(e){}`;
