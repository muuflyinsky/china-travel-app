-- Dish knowledge base (SPEC v0.5 P1.7 #29). General facts about dishes only:
-- no user data, no menu photos. Server-only access with the service role key; RLS is on
-- with no policies, so the anon/public keys can read nothing.

create table if not exists dishes (
  id bigint generated always as identity primary key,
  name_zh text not null,              -- normalised dish name (lib/dish-name.ts)
  region text not null default '',    -- province code: first two digits of the adcode ('51' Sichuan); '' = general
  facts jsonb not null,               -- language-independent: pinyin, allergens[{id, role, via_zh}], spice, vegetarian, meat[], alcohol
  confidence text not null check (confidence in ('high','medium','low')),
  model text,
  prompt_version text,
  flagged boolean not null default false,
  flag_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (name_zh, region)
);

create table if not exists dish_texts (
  dish_id bigint not null references dishes(id) on delete cascade,
  lang text not null,
  name text not null,
  short text,                         -- list
  via jsonb,                          -- allergen source ingredient: Chinese → this language
  description text, literal text, notes text,
  ingredients jsonb,                  -- detail: [{zh, name, role, source, allergens[]}]
  primary key (dish_id, lang)
);

create table if not exists dish_feedback (
  id bigint generated always as identity primary key,
  dish_id bigint references dishes(id) on delete cascade,
  lang text,
  reason text,
  created_at timestamptz not null default now()
); -- anonymous: no user identifier of any kind

alter table dishes enable row level security;
alter table dish_texts enable row level security;
alter table dish_feedback enable row level security;

-- "This dish info is wrong": log it and stop serving the entry until it is regenerated.
create or replace function flag_dish(p_name_zh text, p_region text, p_lang text, p_reason text)
returns void language plpgsql security invoker set search_path = public as $$
declare d bigint;
begin
  select id into d from dishes where name_zh = p_name_zh and region in (p_region, '') order by length(region) desc limit 1;
  if d is null then return; end if;
  update dishes set flagged = true, flag_count = flag_count + 1 where id = d;
  insert into dish_feedback (dish_id, lang, reason) values (d, left(p_lang, 8), left(p_reason, 200));
end $$;

revoke execute on function flag_dish(text, text, text, text) from public, anon, authenticated;
