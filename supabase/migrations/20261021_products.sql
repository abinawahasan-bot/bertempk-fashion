-- Product catalogue (single source of truth for prices).
-- The storefront still renders from src/constants/products.ts for display,
-- but the create-order Edge Function reads prices from here.

create table if not exists public.products (
  id          text primary key,
  name        text not null,
  image       text not null,
  category    text not null,
  price       bigint not null check (price >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.products enable row level security;

-- Anyone can read products (public catalogue).
drop policy if exists "products are readable by everyone" on public.products;
create policy "products are readable by everyone"
  on public.products for select
  using (true);

-- Seed the 6 products. Idempotent (upsert).
insert into public.products (id, name, image, category, price) values
  ('p1', 'Mod Jacket / 001', 'https://images.pexels.com/photos/29900469/pexels-photo-29900469.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop', 'Outerwear', 1290000),
  ('p2', 'Static Hoodie / 002', 'https://images.pexels.com/photos/28701960/pexels-photo-28701960.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop', 'Hoodie', 989000),
  ('p3', 'Wide Trousers / 003', 'https://images.pexels.com/photos/36611867/pexels-photo-36611867.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop', 'Trousers', 1190000),
  ('p4', 'Multi-pocket Vest / 001', 'https://images.pexels.com/photos/14437343/pexels-photo-14437343.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop', 'Outerwear', 1590000),
  ('p5', 'Signal Crop / 004', 'https://images.pexels.com/photos/5443935/pexels-photo-5443935.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop', 'New Crop', 749000),
  ('p6', 'Wide Trousers / 002', 'https://images.pexels.com/photos/17908419/pexels-photo-17908419.jpeg?auto=compress&cs=tinysrgb&w=1600&h=2000&fit=crop', 'Trousers', 1190000)
on conflict (id) do update set
  name = excluded.name,
  image = excluded.image,
  category = excluded.category,
  price = excluded.price,
  updated_at = now();
