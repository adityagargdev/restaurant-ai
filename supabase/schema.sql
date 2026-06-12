-- ============================================================
-- Pepper & Pine — Supabase Schema
-- ============================================================

-- Profiles (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  phone text unique,
  email text,
  name text,
  is_admin boolean default false,
  is_guest boolean default false,
  guest_expires_at timestamptz,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);
create policy "Admins can view all profiles"
  on public.profiles for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Restaurant Tables
create table public.restaurant_tables (
  id serial primary key,
  table_number int unique not null,
  type text check (type in ('small', 'medium', 'large', 'rooftop')) not null,
  capacity_min int not null,
  capacity_max int not null,
  is_rooftop boolean default false,
  premium_charge int default 0
);
alter table public.restaurant_tables enable row level security;
create policy "Anyone can view tables" on public.restaurant_tables for select using (true);
create policy "Admins can manage tables"
  on public.restaurant_tables for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Seed restaurant tables
insert into public.restaurant_tables (table_number, type, capacity_min, capacity_max, is_rooftop, premium_charge) values
  (1, 'small', 1, 2, false, 0),
  (2, 'small', 1, 2, false, 0),
  (3, 'small', 1, 2, false, 0),
  (4, 'small', 1, 2, false, 0),
  (5, 'small', 1, 2, false, 0),
  (6, 'small', 1, 2, false, 0),
  (7, 'small', 1, 2, false, 0),
  (8, 'small', 1, 2, false, 0),
  (9, 'small', 1, 2, false, 0),
  (10, 'small', 1, 2, false, 0),
  (11, 'medium', 3, 6, false, 0),
  (12, 'medium', 3, 6, false, 0),
  (13, 'medium', 3, 6, false, 0),
  (14, 'medium', 3, 6, false, 0),
  (15, 'medium', 3, 6, false, 0),
  (16, 'medium', 3, 6, false, 0),
  (17, 'medium', 3, 6, false, 0),
  (18, 'medium', 3, 6, false, 0),
  (19, 'medium', 3, 6, false, 0),
  (20, 'medium', 3, 6, false, 0),
  (21, 'large', 7, 10, false, 0),
  (22, 'large', 7, 10, false, 0),
  (23, 'large', 7, 10, false, 0),
  (24, 'large', 7, 10, false, 0),
  (25, 'large', 7, 10, false, 0),
  (26, 'large', 7, 10, false, 0),
  (27, 'large', 7, 10, false, 0),
  (28, 'large', 7, 10, false, 0),
  (29, 'large', 7, 10, false, 0),
  (30, 'large', 7, 10, false, 0),
  (31, 'rooftop', 1, 10, true, 500),
  (32, 'rooftop', 1, 10, true, 500),
  (33, 'rooftop', 1, 10, true, 500),
  (34, 'rooftop', 1, 10, true, 500),
  (35, 'rooftop', 1, 10, true, 500);

-- Reservations
create table public.reservations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  table_id int references public.restaurant_tables(id),
  date date not null,
  meal_slot text check (meal_slot in ('breakfast', 'lunch', 'dinner')) not null,
  party_size int not null,
  status text check (status in ('confirmed', 'cancelled', 'completed')) default 'confirmed',
  special_requests text,
  caller_phone text,
  created_at timestamptz default now()
);
alter table public.reservations enable row level security;

create policy "Users can view own reservations"
  on public.reservations for select using (
    auth.uid() = user_id or
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Users can insert own reservations"
  on public.reservations for insert with check (auth.uid() = user_id);
create policy "Admins can manage all reservations"
  on public.reservations for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Service role full access reservations"
  on public.reservations for all using (auth.role() = 'service_role');

-- Orders
create table public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  order_type text check (order_type in ('dine_in', 'takeaway')) not null,
  reservation_id uuid references public.reservations(id) on delete set null,
  status text check (status in ('pending', 'preparing', 'ready', 'completed', 'cancelled')) default 'pending',
  total_amount int not null,
  estimated_prep_minutes int,
  caller_phone text,
  created_at timestamptz default now()
);
alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select using (
    auth.uid() = user_id or
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Admins can manage all orders"
  on public.orders for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );
create policy "Service role full access orders"
  on public.orders for all using (auth.role() = 'service_role');

-- Order Items
create table public.order_items (
  id serial primary key,
  order_id uuid references public.orders(id) on delete cascade,
  item_name text not null,
  variant text,
  quantity int not null default 1,
  unit_price int not null
);
alter table public.order_items enable row level security;

create policy "Users can view own order items"
  on public.order_items for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or
        exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
    )
  );
create policy "Service role full access order_items"
  on public.order_items for all using (auth.role() = 'service_role');

-- Trigger: auto-delete guest accounts after 5 days
create or replace function public.cleanup_expired_guests()
returns void language plpgsql security definer as $$
begin
  delete from auth.users
  where id in (
    select id from public.profiles
    where is_guest = true
    and guest_expires_at < now()
  );
end;
$$;

-- Function to handle new user signups (creates profile automatically)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, phone)
  values (
    new.id,
    new.email,
    new.phone
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Enable realtime for admin dashboard
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.reservations;
