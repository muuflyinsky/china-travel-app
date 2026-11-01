// What the app sells (docs/MONETIZATION.md). Product ids must match App Store Connect and
// ios/App/App/Products.storekit. Prices are set there; the app shows Apple's localized price.

/** Trip passes: non-renewing subscriptions, unlimited AI for this many days from purchase. */
export const PASSES = [
  { id: "com.haodego.app.pass.1d", days: 1 },
  { id: "com.haodego.app.pass.3d", days: 3 },
  { id: "com.haodego.app.pass.7d", days: 7 },
  { id: "com.haodego.app.pass.14d", days: 14 },
] as const;

/** Tips: consumables that unlock nothing. */
export const TIPS = ["com.haodego.app.tip.small", "com.haodego.app.tip.medium", "com.haodego.app.tip.large"] as const;

export const passDays = (id: string) => PASSES.find((p) => p.id === id)?.days;

/** Free uses per phone. "day" resets at midnight Beijing time; "ever" never resets. */
export const FREE = {
  menu_photo: { max: 2, per: "day" },
  menu_text: { max: 3, per: "day" },
  translate: { max: 10, per: "day" },
  hotel: { max: 2, per: "ever" },
} as const;
export type QuotaKind = keyof typeof FREE;
