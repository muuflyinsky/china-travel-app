# Monetization: free daily limits + trip passes

Decided 2026-11-01. Not built yet: first measure, then set limits, then sell passes.

## Principles

- **Safety is never paid**: allergy check, severe-allergy block, allergy card, emergency help stay free and unlimited.
- **Charge for volume and convenience**: photo menus (the costliest AI call), dish lookups, translation.
- **Don't hurt affiliate revenue**: maps, routes, taxi card and booking links stay free and unlimited.
- **Trip passes, not monthly subscriptions**: visitors use the app for one trip. Apple's non-renewing subscription type.
- iOS only, through Apple in-app purchase (15% with the Small Business Program). The website keeps the free tier.

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
