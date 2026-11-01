-- Free limits (docs/MONETIZATION.md): how many AI uses each phone has had today, or ever for the
-- ones that never reset. One row per (device, kind, period). device is a random id the app makes
-- for itself, or the IP when there is none; nothing else about the traveller is stored.
-- Server-only access with the service role key; RLS on, no policies.

create table if not exists usage_counts (
  device text not null,
  kind text not null,                 -- menu_photo | menu_text | translate | hotel
  period text not null,               -- day in Beijing time (2026-11-01), or 'ever'
  n int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (device, kind, period)
);

alter table usage_counts enable row level security;

-- Counts one use if the device is still under max; false when the limit is reached.
create or replace function use_quota(p_device text, p_kind text, p_period text, p_max int)
returns boolean language plpgsql security definer set search_path = public as $$
declare v int;
begin
  insert into usage_counts (device, kind, period, n) values (p_device, p_kind, p_period, 1)
  on conflict (device, kind, period) do update set n = usage_counts.n + 1, updated_at = now()
    where usage_counts.n < p_max
  returning n into v;
  return v is not null;
end $$;

-- Gives a use back when the AI call failed, so travellers don't pay for our errors.
create or replace function refund_quota(p_device text, p_kind text, p_period text)
returns void language sql security definer set search_path = public as $$
  update usage_counts set n = greatest(n - 1, 0), updated_at = now()
  where device = p_device and kind = p_kind and period = p_period;
$$;

revoke execute on function use_quota(text, text, text, int) from public, anon, authenticated;
revoke execute on function refund_quota(text, text, text) from public, anon, authenticated;
