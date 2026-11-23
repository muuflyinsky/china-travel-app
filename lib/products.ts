// What the app sells (docs/MONETIZATION.md). Product ids must match App Store Connect and
// ios/App/App/Products.storekit. Prices are set there; the app shows Apple's localized price.

/** Trip passes: non-renewing subscriptions, unlimited AI for this many days from purchase. */
export const PASSES = [
  { id: "com.haodego.app.pass.1d", days: 1 },
  { id: "com.haodego.app.pass.3d", days: 3 },
  { id: "com.haodego.app.pass.7d", days: 7 },
  { id: "com.haodego.app.pass.14d", days: 14 },
] as const;

/**
 * Free 3-day trial (DECISIONS D23): a non-consumable at price 0, the way App Review 3.1.1 allows a
 * time-based trial in an app without subscriptions. Unlimited AI for 3 days from the first time it
 * was taken on this Apple ID (its original purchase date), so restoring or reinstalling never
 * starts it again.
 */
export const TRIAL = { id: "com.haodego.app.trial.3d", days: 3 } as const;

/** Tips: consumables that unlock nothing. */
export const TIPS = ["com.haodego.app.tip.small", "com.haodego.app.tip.medium", "com.haodego.app.tip.large"] as const;

export const passDays = (id: string) => PASSES.find((p) => p.id === id)?.days;
/** Days of unlimited use a product gives: a pass or the trial; undefined for tips. */
export const unlimitedDays = (id: string): number | undefined => (id === TRIAL.id ? TRIAL.days : passDays(id));

/**
 * Free uses per phone after the trial, or without one (website). "day" resets at midnight Beijing
 * time; "ever" never resets. A menu photo use is a meal: up to `pages` photos within `minutes` of
 * the first (DECISIONS D8). Numbers from DECISIONS D23: one menu a day, three for a phone with
 * allergies saved (D23 3a: enough for three meals), the rest unchanged.
 */
export const FREE = {
  menu_photo: { max: 1, maxWithAllergies: 3, per: "day", pages: 4, minutes: 30 },
  menu_text: { max: 3, per: "day" },
  translate: { max: 10, per: "day" },
  hotel: { max: 2, per: "ever" },
} as const;
export type QuotaKind = keyof typeof FREE;
