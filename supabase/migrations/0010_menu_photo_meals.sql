-- Menu photos count per meal, not per photo (DECISIONS D8, 2026-11-02): one free use opens a
-- 30-minute window for up to 4 photos of the same menu. The daily row for kind 'menu_photo'
-- keeps n = meals used today; the window is tracked on the same row.

alter table usage_counts add column if not exists window_start timestamptz;
alter table usage_counts add column if not exists window_n int not null default 0;

-- Counts one menu photo: inside the open window (under p_pages photos, younger than p_minutes)
-- it's free; otherwise it opens a new window if today's meals are under p_max.
create or replace function use_menu_photo(p_device text, p_period text, p_max int, p_pages int, p_minutes int)
returns boolean language plpgsql security definer set search_path = public as $$
declare r usage_counts%rowtype;
begin
  insert into usage_counts (device, kind, period, n) values (p_device, 'menu_photo', p_period, 0)
  on conflict (device, kind, period) do nothing;
  select * into r from usage_counts where device = p_device and kind = 'menu_photo' and period = p_period for update;
  if r.window_start is not null and now() - r.window_start < make_interval(mins => p_minutes) and r.window_n < p_pages then
    update usage_counts set window_n = window_n + 1, updated_at = now()
      where device = p_device and kind = 'menu_photo' and period = p_period;
    return true;
  end if;
  if r.n >= p_max then return false; end if;
  update usage_counts set n = n + 1, window_start = now(), window_n = 1, updated_at = now()
    where device = p_device and kind = 'menu_photo' and period = p_period;
  return true;
end $$;

-- Gives a photo back when the AI call failed; giving back a window's only photo gives back the meal.
create or replace function refund_menu_photo(p_device text, p_period text)
returns void language plpgsql security definer set search_path = public as $$
begin
  update usage_counts set
    n = case when window_n <= 1 then greatest(n - 1, 0) else n end,
    window_start = case when window_n <= 1 then null else window_start end,
    window_n = greatest(window_n - 1, 0),
    updated_at = now()
  where device = p_device and kind = 'menu_photo' and period = p_period;
end $$;

revoke execute on function use_menu_photo(text, text, int, int, int) from public, anon, authenticated;
revoke execute on function refund_menu_photo(text, text) from public, anon, authenticated;
grant execute on function use_menu_photo(text, text, int, int, int) to service_role;
grant execute on function refund_menu_photo(text, text) to service_role;
