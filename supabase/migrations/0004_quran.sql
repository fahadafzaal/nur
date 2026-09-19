-- ---------------------------------------------------------------------
-- NUR — 0004: Qur'an Explorer — Daily Lessons and private notes
--
-- The Qur'an text itself is not in the database: it ships with the site
-- (src/data/quran) and is prerendered, so it costs nothing to serve.
-- Safe to re-run.
-- ---------------------------------------------------------------------

-- ---- Role helpers ---------------------------------------------------
-- SECURITY INVOKER: they read the caller's own profile under the caller's
-- own RLS, so they can only ever answer "am I…", never "is someone else…".

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.is_member()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid())
      and (membership_status = 'member' or role = 'admin')
  );
$$;

revoke execute on function public.is_admin()  from public, anon;
revoke execute on function public.is_member() from public, anon;
grant  execute on function public.is_admin()  to authenticated;
grant  execute on function public.is_member() to authenticated;

-- ---- Daily Lessons ----------------------------------------------------
-- Written by the client surah by surah, through the admin panel.
-- Every signed-in member reads published lessons; only admins write.

create table if not exists public.surah_lessons (
  surah_no   smallint primary key check (surah_no between 1 and 114),
  title      text not null default '',
  body       text not null default '',
  published  boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table public.surah_lessons enable row level security;

drop policy if exists "lessons_read" on public.surah_lessons;
create policy "lessons_read"
  on public.surah_lessons for select
  to authenticated
  using (published or (select public.is_admin()));

drop policy if exists "lessons_admin_write" on public.surah_lessons;
create policy "lessons_admin_write"
  on public.surah_lessons for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists surah_lessons_touch on public.surah_lessons;
create trigger surah_lessons_touch
  before update on public.surah_lessons
  for each row execute function public.touch_updated_at();

-- ---- My Notes ---------------------------------------------------------
-- "A little like Qur'an journaling but electronic." One journal per surah
-- per member, private to them.

create table if not exists public.quran_notes (
  user_id    uuid not null references auth.users (id) on delete cascade,
  surah_no   smallint not null check (surah_no between 1 and 114),
  body       text not null default '' check (char_length(body) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, surah_no)
);

alter table public.quran_notes enable row level security;

drop policy if exists "notes_own" on public.quran_notes;
create policy "notes_own"
  on public.quran_notes for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists quran_notes_touch on public.quran_notes;
create trigger quran_notes_touch
  before update on public.quran_notes
  for each row execute function public.touch_updated_at();

-- ---- Privileges -------------------------------------------------------

revoke all on public.surah_lessons from anon, authenticated;
revoke all on public.quran_notes   from anon, authenticated;

grant select, insert, update, delete on public.surah_lessons to authenticated;
grant select, insert, update, delete on public.quran_notes   to authenticated;
