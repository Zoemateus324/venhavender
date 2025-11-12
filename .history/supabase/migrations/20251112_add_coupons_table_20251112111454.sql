-- Create coupons table for discount management
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  description text,
  discount_percent numeric(5,2) not null check (discount_percent >= 0 and discount_percent <= 100),
  max_uses integer check (max_uses is null or max_uses >= 0),
  usage_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists coupons_code_unique_idx
  on public.coupons (lower(code));

-- Helper function to keep updated_at in sync
create or replace function public.update_coupon_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists coupons_set_timestamp on public.coupons;

create trigger coupons_set_timestamp
before update on public.coupons
for each row execute function public.update_coupon_timestamp();

-- Helper function to increment coupon usage atomically
create or replace function public.increment_coupon_usage(coupon uuid)
returns void
language sql
as $$
  update public.coupons
  set usage_count = usage_count + 1,
      updated_at = timezone('utc', now())
  where id = coupon;
$$;

