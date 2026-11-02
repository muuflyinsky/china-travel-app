-- Restaurants fixed by hand, in Supabase's table editor instead of files on someone's laptop.
-- amap_link: paste an amap.com place link (or just its id, B0FFHOVBNT) for a restaurant the
--   automatic match missed or got wrong; the daily cron (/api/cron/city-guides →
--   resolveManualLinks in lib/restaurants.ts) looks it up by id, fills the Amap columns from 0005/0006
--   and clears review.
-- review: why a restaurant still needs a look, in plain words, with Amap's candidates and their ids
--   (filter "review is not null" to see the to-do list). Empty when nothing is pending.
alter table restaurants
  add column if not exists amap_link text,
  add column if not exists review text;
