-- ============================================================
-- KopiKabin Schema - run this in Supabase SQL Editor
-- Clerk is the auth provider. Protected writes go through server.ts.
-- ============================================================

create table if not exists profiles (
  id         text primary key,
  email      text not null unique,
  name       text not null,
  role       text not null default 'kurir' check (role in ('admin', 'kurir')),
  status           text not null default 'active' check (status in ('active', 'inactive')),
  current_location text,
  last_password    text,
  created_at       timestamptz default now()
);

-- Migration: add last_password column if upgrading from older schema
alter table profiles add column if not exists last_password text;

-- Migration: add daily_target for per-courier sales targets
alter table profiles add column if not exists daily_target integer;

alter table profiles enable row level security;

drop policy if exists "Public can read limited profiles" on profiles;
create policy "Public can read limited profiles"
  on profiles for select using (true);

create table if not exists inventory (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  price           integer not null default 0,
  cat             text not null default '',
  power           text not null default '',
  "desc"          text not null default '',
  image_url       text,
  stock_level     integer not null default 0,
  min_stock_level integer not null default 10,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table inventory enable row level security;

drop policy if exists "Public can read inventory" on inventory;
create policy "Public can read inventory"
  on inventory for select using (true);

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists inventory_updated_at on inventory;
create trigger inventory_updated_at
  before update on inventory
  for each row execute function update_updated_at();

create table if not exists courier_stock (
  kurir_id     text not null references profiles(id) on delete cascade,
  inventory_id uuid not null references inventory(id) on delete cascade,
  quantity     integer not null default 0 check (quantity >= 0),
  updated_at   timestamptz default now(),
  primary key (kurir_id, inventory_id)
);

alter table courier_stock enable row level security;

drop policy if exists "Public cannot read courier stock directly" on courier_stock;
drop policy if exists "Kurir can read own stock" on courier_stock;
create policy "Kurir can read own stock"
  on courier_stock for select using (auth.uid()::text = kurir_id);

drop trigger if exists courier_stock_updated_at on courier_stock;
create trigger courier_stock_updated_at
  before update on courier_stock
  for each row execute function update_updated_at();

create table if not exists requests (
  id          uuid primary key default gen_random_uuid(),
  kurir_id    text not null references profiles(id) on delete cascade,
  kurir_name  text not null,
  items       jsonb not null default '[]',
  status      text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note        text not null default '',
  created_at  timestamptz default now()
);

alter table requests enable row level security;

drop policy if exists "Public cannot read requests directly" on requests;
drop policy if exists "Kurir can read own requests" on requests;
create policy "Kurir can read own requests"
  on requests for select using (auth.uid()::text = kurir_id);

create table if not exists transactions (
  id           uuid primary key default gen_random_uuid(),
  kurir_id     text not null references profiles(id) on delete cascade,
  kurir_name   text not null,
  items        jsonb not null default '[]',
  total_amount integer not null default 0,
  type         text not null default 'sale' check (type in ('sale', 'restock', 'adjustment')),
  created_at   timestamptz default now()
);

alter table transactions enable row level security;

drop policy if exists "Public cannot read transactions directly" on transactions;
drop policy if exists "Kurir can read own transactions" on transactions;
create policy "Kurir can read own transactions"
  on transactions for select using (auth.uid()::text = kurir_id);

-- Realtime is useful for future live refreshes. Enable these in Dashboard
-- or run the statements below once; ignore duplicate-publication errors.
alter publication supabase_realtime add table inventory;
alter publication supabase_realtime add table courier_stock;
alter publication supabase_realtime add table requests;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table profiles;
