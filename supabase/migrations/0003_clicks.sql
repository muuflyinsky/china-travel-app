-- Booking link clicks (app/api/go), for matching partner commission reports: trip_sub1 = click_id
-- appears in the Trip.com affiliate order report. No user identifier: the placement, the partner
-- link parameters (city, dates, guests) and a coarse client type. Server-only, RLS on, no policies.

create table if not exists clicks (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  click_id text not null unique,      -- sent to the partner as trip_sub1
  tag text,                           -- placement, e.g. stay-comfort-1
  partner text not null,              -- trip | fliggy | esim
  kind text not null,                 -- hotel_list | hotel_search | train | flight | attraction | esim
  src text,                           -- page that sent the click
  params jsonb not null default '{}', -- link parameters: city, cityEn, keyword, checkin, checkout, adults, from, to, date, provider
  client text                         -- ios-app | ios | android | desktop
);
create index if not exists clicks_ts on clicks (ts);
create index if not exists clicks_partner_ts on clicks (partner, ts);

alter table clicks enable row level security;
