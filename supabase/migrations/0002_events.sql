-- Product events and content feedback (v0.6). Anonymous by design: no user, device or location
-- identifiers. `sid` is a random per-tab session id (lib/track.ts); feedback carries none at all —
-- each browser dedupes its own vote and sends the previous vote when it changes, so
-- helpful = count(vote = 'yes') - count(prev = 'yes'). Server-only access with the service role
-- key; RLS on with no policies.

create table if not exists events (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  e text not null,                    -- event name, one of EVENTS in lib/track.ts
  p jsonb not null default '{}',      -- up to 8 small primitive properties
  sid text                            -- per-tab session id, never stored in the browser beyond the tab
);
create index if not exists events_e_ts on events (e, ts);

create table if not exists content_feedback (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  kind text not null check (kind in ('sight','guide_dish','menu_dish','resv')),
  item text not null,                 -- content id (sight id, dish name, reservation id)
  version text not null,              -- content version the reader saw (generatedAt, checked date…)
  vote text check (vote in ('yes','no')),
  prev text check (prev in ('yes','no')),
  report text check (report in ('outdated','wrong')),
  city text,                          -- adcode of the content, not of the traveller
  lang text
);
create index if not exists content_feedback_item on content_feedback (kind, item, version);

alter table events enable row level security;
alter table content_feedback enable row level security;
