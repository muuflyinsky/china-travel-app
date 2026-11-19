-- Must-see lists for the Explore city picks (SPEC §3.2.1). Per hot city, 3–6 sights that
-- appear in at least 3 independent public travel guides, drafted by AI and reviewed by Veer.
-- The city picks show the reviewed rows of a city first, in `ord` order; Amap's automatic picks
-- only fill the remaining slots, and Amap is used only to locate each row by `name_zh`.
--
-- Only rows with `reviewed_on` set are shown. Edit rows in the Supabase table editor; the app
-- reads them server-side (lib/must-see.ts, cached an hour) and the daily cron regenerates a
-- city whose list changed. lib/data/must-see.json is the bundled fallback, synced with
-- scripts/sync-must-see.mjs. Like the award tables: anyone may read, only the service role writes.

create table if not exists must_see (
  id bigint generated always as identity primary key,
  city text not null check (city ~ '^\d{6}$'),        -- city adcode, e.g. 610100
  ord smallint not null check (ord between 1 and 6),   -- order in the picks, 1 first
  name_zh text not null,       -- Chinese full name, shown on the taxi card and used for the Amap search: 秦始皇帝陵博物院
  name_en text not null,       -- Terracotta Army
  why_en text not null,        -- the reviewed "why go" line, ≤ 20 words; the other 5 languages are machine-translated with the guide
  outside boolean not null default false,  -- outside the city centre (shows "about N h from the centre")
  centre_km smallint,          -- distance from the centre, reviewed (not computed)
  centre_h numeric(3, 1),      -- travel time from the centre in hours, reviewed (not computed)
  sources text[] not null default '{}',    -- links to the guides it appears in (≥ 3)
  reviewed_on date,            -- null = draft: not shown
  reviewed_by text,
  updated_at timestamptz not null default now(),
  unique (city, ord),
  unique (city, name_zh),
  check (not outside or centre_h is not null)
);
create index if not exists must_see_city on must_see (city);

alter table must_see enable row level security;
create policy "public read" on must_see for select to anon, authenticated using (true);
