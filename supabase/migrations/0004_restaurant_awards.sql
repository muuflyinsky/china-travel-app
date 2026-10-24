-- Restaurant awards (SPEC §3.2.2): Michelin Guide, Black Pearl and the Dianping Must-Eat List.
-- Static, published data: the app reads it server-side (lib/restaurants.ts) and caches it for an
-- hour. Load or refresh it with scripts/sync-awards.mjs. Unlike the log tables, anyone may read
-- these rows (they are public guide listings); only the service role can write.

create table if not exists award_lists (
  list text primary key check (list in ('michelin', 'black_pearl', 'dianping')),
  name text not null,       -- MICHELIN Guide
  edition text not null,    -- 2026
  source text,              -- where the list was checked
  checked date              -- when
);

create table if not exists restaurants (
  id bigint generated always as identity primary key,
  city text not null check (city ~ '^\d{6}$'), -- city adcode, e.g. 310000
  city_name text,                              -- 上海
  name_zh text not null,                       -- as the guide lists it, branch in brackets: 南京大牌档(德基广场店)
  name_en text,
  cuisine text,                                -- Chinese: 本帮菜, 粤菜 …
  updated_at timestamptz not null default now(),
  unique (city, name_zh)
);
create index if not exists restaurants_city on restaurants (city);

-- One award per list per restaurant: a new edition replaces the old one.
create table if not exists restaurant_awards (
  restaurant_id bigint not null references restaurants (id) on delete cascade,
  list text not null references award_lists (list),
  level text not null,
  edition text not null,
  primary key (restaurant_id, list),
  check (
    (list = 'michelin' and level in ('3', '2', '1', 'bib', 'selected')) or
    (list = 'black_pearl' and level in ('3', '2', '1')) or
    (list = 'dianping' and level = 'must_eat')
  )
);
create index if not exists restaurant_awards_list on restaurant_awards (list, level);

alter table award_lists enable row level security;
alter table restaurants enable row level security;
alter table restaurant_awards enable row level security;
create policy "public read" on award_lists for select to anon, authenticated using (true);
create policy "public read" on restaurants for select to anon, authenticated using (true);
create policy "public read" on restaurant_awards for select to anon, authenticated using (true);
