# Monetization: free daily limits + trip passes

Decided 2026-11-01. Built (off until `QUOTA=on`); see "How it works" below.

## Principles

- **Safety is never paid**: allergy check, severe-allergy block, allergy card, emergency help stay free and unlimited.
- **Charge for volume and convenience**: photo menus (the costliest AI call), dish lookups, translation.
- **Don't hurt affiliate revenue**: maps, routes, taxi card and booking links stay free and unlimited.
- **Trip passes, not monthly subscriptions**: visitors use the app for one trip. Apple's non-renewing subscription type.
- iOS only, through Apple in-app purchase (15% with the Small Business Program). The website keeps the free tier.

## Free limits (per phone)

| Feature | Free | Resets |
|---|---|---|
| Menu photo | 2 meals (each: up to 4 photos within 30 min of the first) | daily, midnight Beijing time |
| Typed dish names | 3 | daily |
| Translation | 10 | daily |
| Booking screenshot | 2 | never |
| Allergy check and card, emergency, maps, routes, taxi card, booking links | unlimited | |

Defined in `lib/products.ts` (`FREE`). Menu photos count per meal (DECISIONS D8, 2026-11-02): a menu is often 3–4 pages, so the first photo opens a 30-minute window for up to 4 photos (`use_menu_photo`, migration 0010). A 5th photo, or one after 30 minutes, starts the next meal.

## Passes (starting prices, to be tested)

| Pass | Price | Per day |
|---|---|---|
| 1 day | $3.99 | $3.99 |
| 3 days | $4.99 | $1.66 |
| 7 days | $7.99 | $1.14 |
| 14 days | $9.99 | $0.71 |

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

- `lib/products.ts`: product ids and free limits, shared by server and page.
- `lib/quota.ts`: counts a use in Supabase (`usage_counts`, `use_quota()`, migration 0008) and answers 402
  when the free uses are gone; gives the use back if the AI call fails; allows the use if Supabase is down.
  Off unless the env var `QUOTA=on`. App 1.0 (no StoreKit plugin) sends `x-ctg-client: app-old` and isn't limited.
- `lib/device.ts`: random device id in localStorage, sent as `x-ctg-device` with `x-ctg-client` and the pass token.
- `ios/App/App/PassesPlugin.swift`: StoreKit 2 (products, buy, entitlements, restore), registered in
  `MainViewController.swift`. `Products.storekit` + the shared App scheme let Xcode test purchases locally.
- `/api/pass` + `lib/passes-server.ts`: verifies Apple's signed transaction (x5c chain to Apple Root CA G3,
  bundle id, not revoked; Xcode test transactions only outside production) and returns an HMAC token
  bound to the device until the pass ends, signed with `PASS_SECRET` (its own secret, not a Supabase key;
  without it `/api/pass` answers 503 and no token is accepted).
- `components/Paywall.tsx`: opens on a 402 (or from Settings → Trip pass); always offers the allergy card.
  `components/TipJar.tsx`: Settings → Leave a tip.
- The daily cron deletes daily counts older than 30 days.

## Turning it on

1. Apply migration 0008 to Supabase.
2. App Store Connect: Paid Apps agreement, banking and tax; Small Business Program; create the 4 non-renewing
   subscriptions and 3 consumable tips with the ids above (prices as in the table; tips $1.99 / $4.99 / $9.99).
3. Submit an app version built from this code, with the in-app purchases attached to it.
4. When it's live: set `PASS_SECRET` (a long random string) and `QUOTA=on` in Vercel (Production) and redeploy.
