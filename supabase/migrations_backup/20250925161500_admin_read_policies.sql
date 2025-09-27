-- Admin read access for analytics (users, ads, payments)

-- Helper function to safely check admin without recursive RLS lookups
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users u where u.id = uid and u.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- Allow admins to read all users
create policy if not exists "Admin can read all users (analytics)" on public.users
  for select to authenticated
  using (public.is_admin(auth.uid()));

-- Allow admins to read all ads
create policy if not exists "Admin can read all ads (analytics)" on public.ads
  for select to authenticated
  using (public.is_admin(auth.uid()));

-- Allow admins to read all payments
create policy if not exists "Admin can read all payments (analytics)" on public.payments
  for select to authenticated
  using (public.is_admin(auth.uid()));


