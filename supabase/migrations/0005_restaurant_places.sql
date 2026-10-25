-- Amap data for guide-listed restaurants (written by scripts/enrich-restaurants.mjs): only what
-- the Amap Web Service returns, no photos. Run by hand; nothing here comes from Dianping,
-- Michelin or search engines.
alter table restaurants
  add column if not exists amap_id text,
  add column if not exists location text,     -- "lng,lat" GCJ-02
  add column if not exists address text,
  add column if not exists district text,
  add column if not exists amap_type text,    -- Amap typecode, e.g. 050123 (潮州菜): cuisine when the guide has none
  add column if not exists tags text,         -- business.tag as returned (signature dishes for restaurants)
  add column if not exists rating numeric,
  add column if not exists cost int,          -- per person, CNY
  add column if not exists opentime text,
  add column if not exists match jsonb;       -- {confidence: high|medium|low, score, method, amap_name, matched_at}
