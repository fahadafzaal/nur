-- ---------------------------------------------------------------------
-- NUR — 0007: shop (products, orders) and admin capabilities
--
-- Safe to re-run.
-- ---------------------------------------------------------------------

-- ---- Products ---------------------------------------------------------

create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name         text not null check (char_length(name) between 1 and 200),
  description  text not null default '',
  price_pence  integer not null check (price_pence >= 0),
  currency     text not null default 'gbp' check (currency ~ '^[a-z]{3}$'),
  images       text[] not null default '{}',   -- paths in the public 'media' bucket
  sizes        text[] not null default '{}',   -- e.g. {S,M,L,XL}; empty = one size
  stock        integer check (stock is null or stock >= 0),  -- null = not tracked
  active       boolean not null default false,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.products enable row level security;

-- Browsing the shop does not require an account.
drop policy if exists "products_read" on public.products;
create policy "products_read"
  on public.products for select
  to anon, authenticated
  using (active or (select public.is_admin()));

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write"
  on public.products for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists products_touch on public.products;
create trigger products_touch
  before update on public.products
  for each row execute function public.touch_updated_at();

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;

-- ---- Orders -------------------------------------------------------------
--
-- Orders and their items are written ONLY by the server with the secret
-- key — never from the browser. If shoppers could insert their own order
-- rows, someone could add items to a pending order after its checkout was
-- created and have them fulfilled unpaid. Members can read their own
-- orders; admins can read all and move them through fulfilment.

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users (id) on delete set null,
  status            text not null default 'pending'
                      check (status in ('pending','paid','fulfilled','cancelled','refunded')),
  total_pence       integer not null check (total_pence >= 0),
  currency          text not null default 'gbp',
  email             text,
  shipping          jsonb,
  stripe_session_id text unique,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists orders_user on public.orders (user_id, created_at desc);
create index if not exists orders_status on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id               uuid primary key default gen_random_uuid(),
  order_id         uuid not null references public.orders (id) on delete cascade,
  product_id       uuid references public.products (id) on delete set null,
  name             text not null,          -- snapshot at time of purchase
  size             text,
  unit_price_pence integer not null check (unit_price_pence >= 0),
  quantity         integer not null check (quantity between 1 and 20)
);

create index if not exists order_items_order on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "orders_read" on public.orders;
create policy "orders_read"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id or (select public.is_admin()));

drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_admin_update"
  on public.orders for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop policy if exists "order_items_read" on public.order_items;
create policy "order_items_read"
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch
  before update on public.orders
  for each row execute function public.touch_updated_at();

revoke all on public.orders      from anon, authenticated;
revoke all on public.order_items from anon, authenticated;
grant select on public.orders      to authenticated;
grant select on public.order_items to authenticated;
-- Admins may only change an order's status (e.g. mark it fulfilled).
grant update (status) on public.orders to authenticated;

-- ---- Admin: see members ---------------------------------------------------

drop policy if exists "profiles_admin_read" on public.profiles;
create policy "profiles_admin_read"
  on public.profiles for select
  to authenticated
  using ((select public.is_admin()));

-- ---- Admin: grant or revoke membership and roles --------------------------
--
-- Members cannot write membership_status or role (column grants, 0001).
-- These functions let an admin do it from the admin panel — for complimentary
-- memberships, or to add the client as a fellow admin — and refuse everyone
-- else. SECURITY DEFINER so they can write those columns; the is_admin()
-- check inside is what makes that safe. An admin cannot demote themselves,
-- so the app can never be left with no admin by accident.

create or replace function public.admin_set_membership(target uuid, status public.membership_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  update public.profiles set membership_status = status where id = target;
end;
$$;

create or replace function public.admin_set_role(target uuid, new_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if target = auth.uid() and new_role <> 'admin' then
    raise exception 'you cannot remove your own admin role' using errcode = '42501';
  end if;
  update public.profiles set role = new_role where id = target;
end;
$$;

revoke execute on function public.admin_set_membership(uuid, public.membership_status) from public, anon;
revoke execute on function public.admin_set_role(uuid, public.user_role)               from public, anon;
grant  execute on function public.admin_set_membership(uuid, public.membership_status) to authenticated;
grant  execute on function public.admin_set_role(uuid, public.user_role)               to authenticated;

-- Emails live in auth.users, which the browser cannot read. This returns
-- them to admins only, for the members list.
create or replace function public.admin_list_members()
returns table (
  id uuid,
  email text,
  display_name text,
  role public.user_role,
  membership_status public.membership_status,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return query
    select p.id, u.email::text, p.display_name, p.role, p.membership_status,
           u.created_at, u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
    order by u.created_at desc;
end;
$$;

revoke execute on function public.admin_list_members() from public, anon;
grant  execute on function public.admin_list_members() to authenticated;
