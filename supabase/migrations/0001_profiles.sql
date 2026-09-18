-- ---------------------------------------------------------------------
-- NUR — 0001: accounts and profiles
--
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Safe to re-run.
-- ---------------------------------------------------------------------

-- ---- Types ----------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'membership_status') then
    create type public.membership_status as enum ('free', 'member', 'lapsed');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'admin');
  end if;
end $$;

-- ---- Profiles -------------------------------------------------------

create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  display_name       text,
  role               public.user_role         not null default 'user',
  membership_status  public.membership_status not null default 'free',
  stripe_customer_id text unique,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---- Row Level Security ---------------------------------------------
-- A member may read and edit their own profile, and nobody else's.

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---- Column privileges ----------------------------------------------
--
-- IMPORTANT. RLS is row-level, not column-level: the policy above lets a
-- member update *their own row*, which on its own would let them set
-- membership_status = 'member' or role = 'admin' from the browser with the
-- public anon key, and walk straight through the paid gate.
--
-- Column-level GRANTs are what actually prevent that. display_name is the
-- only field a member may write. membership_status is moved solely by the
-- Stripe webhook using the service-role key, which bypasses RLS.

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- ---- Keep updated_at honest ------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ---- Create a profile automatically on sign-up ------------------------
--
-- security definer so it can write to public.profiles during the auth
-- insert; search_path pinned to empty to prevent search-path hijacking.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- Backfill any accounts created before this migration --------------

insert into public.profiles (id, display_name)
select u.id,
       nullif(trim(coalesce(u.raw_user_meta_data ->> 'display_name', '')), '')
from auth.users u
on conflict (id) do nothing;
