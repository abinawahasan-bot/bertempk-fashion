-- BERTEMPK — orders table + RLS
-- Run in: Supabase Dashboard → SQL Editor → New query → Run.
-- Safe to re-run (idempotent).

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text not null unique,
  user_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  status        text not null default 'pending_payment'
                check (status in ('pending_payment', 'paid', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null default 'manual_transfer'
                check (payment_method in ('midtrans', 'manual_transfer')),
  items         jsonb not null,
  subtotal      numeric(10, 2) not null check (subtotal >= 0),
  shipping_cost numeric(10, 2) not null default 0 check (shipping_cost >= 0),
  total         numeric(10, 2) not null check (total >= 0),
  address       jsonb not null,
  created_at    timestamptz not null default now()
);

create index if not exists orders_user_created_idx
  on public.orders (user_id, created_at desc);

-- Row Level Security: users only ever see their own orders.
alter table public.orders enable row level security;

drop policy if exists "Users can read own orders" on public.orders;
create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own orders" on public.orders;
create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);
