-- Photos for guide-listed restaurants: Amap's (returned by the same search that matched the
-- restaurant, so they cost no extra call) or added by hand from a source that allows it
-- (scripts/enrich-restaurants.mjs --photos <csv>). Stored once; restaurants aren't re-queried.
alter table restaurants
  add column if not exists photos jsonb,        -- up to 3 https URLs
  add column if not exists photo_source text;   -- "Amap", or e.g. "Wikimedia Commons / Author, CC BY-SA 4.0"
