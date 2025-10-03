-- Align page_views schema and add RPC to count unique visitors

-- Ensure required columns exist and align naming (prefer "path")
alter table if exists public.page_views
  add column if not exists path text;

-- Backfill path from page_path if needed
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'page_views'
      and column_name = 'page_path'
  ) then
    update public.page_views
      set path = coalesce(path, page_path)
      where path is null;
  end if;
end $$;

-- Ensure device_id column exists
alter table if exists public.page_views
  add column if not exists device_id text;

-- Ensure created_at column exists
alter table if exists public.page_views
  add column if not exists created_at timestamptz default now();

-- Helpful indexes
create index if not exists idx_page_views_created_at on public.page_views(created_at);
create index if not exists idx_page_views_device_id on public.page_views(device_id);

-- RLS: allow anon/auth insert; allow admins to read all; users read own/null
alter table public.page_views enable row level security;

-- Drop legacy policies to avoid duplicates
drop policy if exists "Anyone can insert page views" on public.page_views;
drop policy if exists "Public can insert page views" on public.page_views;
drop policy if exists "Admins can read all page views" on public.page_views;
drop policy if exists "Users can read own page views" on public.page_views;
drop policy if exists "Anyone can insert page_views" on public.page_views;
drop policy if exists "Authenticated can read page_views" on public.page_views;

-- Insert policies
create policy "Anon can insert page_views" on public.page_views
  for insert to anon
  with check (true);

create policy "Auth can insert page_views" on public.page_views
  for insert to authenticated
  with check (true);

-- Require is_admin helper
drop function if exists public.is_admin(uuid);
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.users u where u.id = uid and u.role = 'admin');
$$;
revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

create policy "Admin can read all page_views" on public.page_views
  for select to authenticated
  using (public.is_admin(auth.uid()));

create policy "Users can read own/null page_views" on public.page_views
  for select to authenticated
  using (user_id = auth.uid() or user_id is null);

-- RPC to count unique visitors in a time window
create or replace function public.count_unique_visitors(p_start timestamptz, p_end timestamptz)
returns integer
language sql
security definer
set search_path = public
as $$
  select coalesce(count(distinct device_id), 0)
  from public.page_views
  where created_at >= p_start
    and created_at < p_end;
$$;

revoke all on function public.count_unique_visitors(timestamptz, timestamptz) from public;
grant execute on function public.count_unique_visitors(timestamptz, timestamptz) to authenticated;


