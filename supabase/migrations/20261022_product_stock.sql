-- Inventory tracking.
alter table public.products
  add column if not exists stock integer not null default 0 check (stock >= 0);

-- Seed initial stock (generous for testing).
update public.products set stock = 50 where stock = 0;
