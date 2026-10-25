-- Durable cache for computed content (v0.6): city guides and hotel picks. Vercel's file system is
-- read-only, so the old data/ files lived only in one instance's memory and every cold start
-- recomputed (or never finished) them. One row per (namespace, key); freshness is decided in
-- code from value.generatedAt. Server-only access with the service role key; RLS on, no policies.

create table if not exists app_cache (
  ns text not null,                   -- 'city_guide' | 'hotel_picks'
  key text not null,                  -- adcode, or adcode@lng,lat for hotel picks near an area
  value jsonb not null,
  generated_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (ns, key)
);

alter table app_cache enable row level security;
