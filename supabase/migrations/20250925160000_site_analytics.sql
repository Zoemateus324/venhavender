-- Site Analytics: page views table and RLS

create table if not exists page_views (
  id uuid primary key default uuid_generate_v4(),
  device_id text not null,
  user_id uuid references users(id),
  path text not null,
  created_at timestamptz default now()
);

alter table page_views enable row level security;

-- Allow anonymous and authenticated to insert their own page views
create policy if not exists "Anyone can insert page_views" on page_views
  for insert to anon, authenticated
  with check (true);

-- Allow authenticated users (including admin) to read page views (for reporting)
create policy if not exists "Authenticated can read page_views" on page_views
  for select to authenticated
  using (true);


