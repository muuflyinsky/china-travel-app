# Monetization: 3-day free trial + free daily limits + trip passes

Decided 2026-11-01 (DECISIONS D3), revised 2026-11-23 (D23: free trial, one free menu a day, launch
period withdrawn). Built (off until `QUOTA=on`); see "How it works" and "Turning it on" below.

## Principles

- **Safety is never paid**: allergy check, severe-allergy block, allergy card, emergency help stay free and unlimited.
- **Charge for volume and convenience**: photo menus (the costliest AI call), dish lookups, translation.
- **Don't hurt affiliate revenue**: maps, routes, taxi card and booking links stay free and unlimited.
- **Trip passes, not monthly subscriptions**: visitors use the app for one trip. Apple's non-renewing subscription type.
- iOS only, through Apple in-app purchase (15% with the Small Business Program). The website keeps the free tier
  and points to the iPhone app when it runs out (never the other way: no App Store links inside the app, D19).

## Free trial (iOS, D23)

- "Start your free 3 days": unlimited AI for 3 days. A **non-consumable at price 0** named "3-Day Trial"
  (`com.haodego.app.trial.3d`), the way App Review 3.1.1 allows a time-based trial without a subscription.
- It runs from the transaction's **original purchase date**, so restoring, reinstalling or taking it again never
  restarts it (`lib/passes-server.ts`). One per Apple ID; Family Sharing off.
- Before it starts the pass sheet says what it includes, that it ends by itself after 3 days, that nothing renews
  and nothing is charged, and what comes after (the free daily uses below, or a pass from the lowest price).
- Offered in the pass sheet (opens when free uses run out, or from Settings → Trip pass) and in one line under
  the inputs on Eat and Talk (hidden for good with ×). Not on Today.

## Allergy safety when the free uses run out

D3 says the allergy check and allergy card are always free. With D23 the AI *reading* of new dishes (a menu photo,
typed dish names) is limited, and that reading is what produces a new allergy check. So, precisely:

- **Always free and unlimited**: the allergy card (with the severe "clean pans and utensils" line), the order card
  and staff replies, emergency help; the allergy verdicts of every dish already read in this meal and of saved
  dishes (worked out on the phone, so editing your allergies re-checks them at once); opening an already-read dish
  for its details (`/api/dish`, not counted).
- **Limited** (1 menu a day, **3 with any allergy saved** (D23 3a, Veer 11-23: enough for three meals), 3 typed
  lookups a day; unlimited in the trial or with a pass): reading *new* dishes, which is when they get their allergy
  check.
- **How "allergy saved" is known**: the page sends `x-ctg-allergies: 1` when the profile has at least one allergy
  (diets such as vegetarian don't count). Only that yes/no is sent, never which allergies, and it isn't stored: it
  only sets the limit for that request. Like the other headers it's the page's word; someone could save an allergy
  they don't have to get 3 menus (D23 re-evaluation watches the share of profiles with allergies).
- **Saving allergies mid-day**: the limit is sent with every use and compared with today's count, so someone who has
  used their 1 menu and then saves an allergy can read 2 more that day; nothing used is given back or reset. Removing
  all allergies lowers the limit again from the next use.
- When a reading is refused because the free uses are gone, Eat says that page (or those dishes) has no allergy check
  and to ask staff or show the allergy card; the pass sheet puts the allergy card first (or, with no allergies saved,
  a link to add them), before the trial and passes.
- Store and app wording therefore says "your allergy card and emergency help are always free, and dishes you've
  already read keep their allergy check", not "allergy checks are unlimited". If Veer wants new-dish checks unlimited
  for people with allergies, that is a decision (it would lift the menu limit for them), not a wording change.

## Free limits (per phone, after the trial or without one)

| Feature | Free | Resets |
|---|---|---|
| Menu photo | 1 meal (up to 4 photos within 30 min of the first); **3 with any allergy saved** (D23 3a) | daily, midnight Beijing time |
| Typed dish names | 3 | daily |
| Translation | 10 | daily |
| Booking screenshot | 2 | never |
| Allergy check and card, emergency, maps, routes, taxi card, booking links | unlimited | |

**Restaurant signature dishes** (Explore → a restaurant, `components/RestaurantDetail.tsx`; Veer 11-23): read through
the same route as typed dish names, but dishes already in the dish cache are free; one typed lookup is counted only when
some have to be generated, at the moment before the model call (`readMenu`'s `beforeModel`). With no free lookup left
the cached ones still show and the rest don't. The request says `from: "restaurant"`; claiming that for a typed lookup
gains nothing, since whatever needs the AI is still counted.

Defined in `lib/products.ts` (`FREE`). Menu photos count per meal (DECISIONS D8, 2026-11-02): a menu is often 3–4 pages, so the first photo opens a 30-minute window for up to 4 photos (`use_menu_photo`, migration 0010). A 5th photo, or one after 30 minutes, starts the next meal.

## Passes (starting prices, to be tested)

| Pass | Price | Per day | vs 1 day |
|---|---|---|---|
| 1 day | $3.99 | $3.99 | |
| 3 days | $4.99 | $1.66 | save 58% |
| 7 days | $7.99 | $1.14 | save 71% |
| 14 days | $9.99 | $0.71 | save 82% |

The sheet works the per-day price and saving out from the App Store's own prices in the traveller's storefront,
rounded down, so it never claims more than the real saving. No "was" prices.

All four are standard App Store price points. The 1-day pass mostly makes 3 and 7 days look cheap.
Watch: whether four choices slow people down (if most pick one tier, drop the others), and whether
trips longer than 14 days buy twice or need a 30-day pass.

## Steps

1. **Measure (now, live since ef39e94)**: events carry a random id that changes every day (`lib/track.ts`),
   so uses per phone per day can be counted. Run 2–4 weeks.
2. **Set the free limit** at about the 70th–80th percentile of daily use, and check unit cost
   (Model Studio bill ÷ calls) against affiliate revenue per user.
3. **Build passes**: StoreKit, Restore Purchases, server-side quota per device (not per IP), new app build.
4. **Iterate**: change one thing at a time (price or limit), at least two weeks each. Healthy conversion: 2–5%.

## Queries (Supabase SQL editor, project china-travel-buddy)

Daily uses per phone, by feature, with percentiles:

```sql
with per_day as (
  select date_trunc('day', ts) as day, sid, e, count(*) as n
  from events
  where e in ('menu_scan', 'dish_detail', 'translate', 'hotel_read')
    and sid is not null and sid <> '' and ts > now() - interval '28 days'
  group by 1, 2, 3
)
select e,
  count(*) as phone_days,
  percentile_cont(0.5) within group (order by n) as p50,
  percentile_cont(0.75) within group (order by n) as p75,
  percentile_cont(0.8) within group (order by n) as p80,
  percentile_cont(0.95) within group (order by n) as p95,
  max(n) as max
from per_day group by e order by e;
```

Photo vs typed menus:

```sql
select p->>'input' as input, count(*) from events
where e = 'menu_scan' and ts > now() - interval '28 days' group by 1;
```

Events before 2026-11-01 have a per-tab id, not a daily one; leave them out.

## How it works

- `lib/products.ts`: product ids (passes, `TRIAL`, tips) and free limits, shared by server and page.
- `lib/quota.ts`: counts a use in Supabase (`usage_counts`, `use_quota()`, migration 0008) and answers 402
  when the free uses are gone; gives the use back if the AI call fails; allows the use if Supabase is down.
  Off unless the env var `QUOTA=on`. A build without the StoreKit plugin sends `x-ctg-client: app-old` and isn't
  limited, but every shipped build has the plugin, 1.0 included: 1.0 users are limited like 1.1 (after their early
  period) and can buy passes there; the trial bought in 1.0 isn't restored by 1.0's plugin after a reinstall (1.1 does).
  Early devices aren't limited until 31 December 2026 (below).
- `lib/device.ts`: random device id in localStorage, sent as `x-ctg-device` with `x-ctg-client` and the pass token.
- `ios/App/App/PassesPlugin.swift`: StoreKit 2 (products, buy, entitlements, restore), registered in
  `MainViewController.swift`. `Products.storekit` + the shared App scheme let Xcode test purchases locally.
- `/api/pass` + `lib/passes-server.ts`: takes pass and trial transactions alike; verifies Apple's signed transaction (x5c chain to Apple Root CA G3,
  bundle id, not revoked; Xcode test transactions only outside production) and returns an HMAC token
  bound to the device until the pass ends, signed with `PASS_SECRET` (its own secret, not a Supabase key;
  without it `/api/pass` answers 503 and no token is accepted).
- `components/Paywall.tsx`: opens on a 402 (or from Settings → Trip pass, or the trial line); offers the trial while
  this Apple ID hasn't taken it, then the passes; always offers the allergy card (first, on a 402), or with no
  allergies saved a link to add them. `components/TrialHint.tsx`: the
  trial line on Eat and Talk. `lib/passes.ts` remembers on the phone whether the trial was taken (`ctg.trial`, read
  from the transaction without trusting it: nothing is unlocked from it).
  `components/TipJar.tsx`: Settings → Leave a tip.
- The daily cron deletes daily counts older than 30 days.

## Turning it on (iOS 1.1, D23)

1. App Store Connect: Paid Apps agreement, banking and tax; Small Business Program; create the 4 non-renewing
   subscriptions, the trial (non-consumable, price **Free**, reference and display name "3-Day Trial",
   `com.haodego.app.trial.3d`, Family Sharing off) and 3 consumable tips with the ids above (tips $1.99 / $4.99 / $9.99).
   Attach all of them to the 1.1 version. The review note says where to find them (Settings → Support and purchases).
2. `PASS_SECRET` (a long random string) in Vercel Production; already set 2026-11-20.
3. On the day 1.1 goes on sale, in this order:
   1. apply migration 0010 to Supabase (Veer approves; 0008 is already applied);
   2. set `EARLY_BEFORE` to that day (YYYY-MM-DD) **and** `QUOTA=on` in Vercel Production;
   3. redeploy (the root layout reads `EARLY_BEFORE` at build time).
   Until 31 December, `QUOTA=on` without `EARLY_BEFORE` leaves the limits off, so the early-device promise can't
   be broken by a missing variable. `PROMO_ENDS` is no longer read; it can be deleted.

## Early devices (D23, item 7)

From 11-20 to 11-23 the website and the app said "free until 31 December 2026" (D21, withdrawn 11-23). Devices
that used HaodeGo before 1.1 went on sale keep unlimited AI until 2026-12-31, Beijing time, inclusive; from
2027-01-01 they're like everyone else, with nothing to switch.

- **How a device's start day is known**: the first page load with this code stores `ctg.since` (the Beijing date)
  in localStorage, from an inline script in `app/(app)/layout.tsx` that runs before anything else on the page writes.
  A device that already had HaodeGo data then (any `ctg.*` key, written by an earlier visit) gets `2026-11-23`
  instead: it was here before this code shipped. The 1.1 app keeps the 1.0 app's storage (same WebView data, same
  origin), so 1.0 users who update count as early.
- **The rule** (`lib/early.ts`): the page sends `x-ctg-since`; a device whose day is before `EARLY_BEFORE` is early.
  Settings → Trip pass shows "Unlimited until 31 December 2026"; the sheet, opened from there, says so too.
- **Who it misses**: the flag lives in the browser's storage. A website visitor whose browser deleted it (Safari
  removes a site's data after 7 days without a visit; private windows keep nothing), a new phone or browser, or a
  device that only ever opened a city guide (that layout stores nothing) counts as new. "Clear all data" in Settings
  keeps `ctg.since` and `ctg.trial`. A server-side record of device ids seen before `EARLY_BEFORE` would close the
  first gap; not built, since nothing was recorded before 11-23 anyway.
- **Website visitors count too**: the D21 note was shown on the website as well, so a browser that used HaodeGo before
  the cut-off is early. D23 item 7 says "used the App"; if Veer wants the app only, the server can also require
  `x-ctg-client: app` (one line in `lib/quota.ts`).
- `EARLY_BEFORE` must be after 2026-11-23 (the day given to devices that were already here); an earlier value is
  ignored.
- **Limits of it**: like `x-ctg-client`, the header is the page's word. Someone who edits localStorage can claim an
  early day; that buys free AI until 31 December at most, and the per-IP rate limits still cap scripts. A device
  that cleared its storage, or a new browser, starts again as a new device.
