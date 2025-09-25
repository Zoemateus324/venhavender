-- API Keys table and RLS

create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  key text not null unique,
  permissions text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

alter table public.api_keys enable row level security;

-- Helpers
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

-- Policies
create policy if not exists "Owner can read own api_keys" on public.api_keys
  for select to authenticated
  using (auth.uid() = user_id);

create policy if not exists "Owner can insert own api_keys" on public.api_keys
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy if not exists "Owner can update own api_keys" on public.api_keys
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy if not exists "Admin can read all api_keys" on public.api_keys
  for select to authenticated
  using (public.is_admin(auth.uid()));

create policy if not exists "Admin can manage all api_keys" on public.api_keys
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));


