-- ---------------------------------------------------------------------
-- NUR — 0006: Seerah — episodes by character trait, private reflections
--
-- Deliberately not chronological: the client framed the Seerah around the
-- Prophet's character ﷺ — Mercy, Honesty, Patience, Humility, Justice,
-- Forgiveness — rather than dates. Safe to re-run.
-- ---------------------------------------------------------------------

create table if not exists public.seerah_episodes (
  id             uuid primary key default gen_random_uuid(),
  trait          text not null check (trait in
                   ('mercy','honesty','patience','humility','justice','forgiveness')),
  title          text not null check (char_length(title) between 1 and 200),
  summary        text not null default '',
  story          text not null default '',
  -- Narration, in the PRIVATE 'nasheeds' bucket under seerah/…
  audio_path     text,
  duration_s     integer check (duration_s is null or duration_s > 0),
  is_member_only boolean not null default true,
  sort_order     integer not null default 0,
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists seerah_by_trait on public.seerah_episodes (trait, sort_order);

alter table public.seerah_episodes enable row level security;

drop policy if exists "seerah_read" on public.seerah_episodes;
create policy "seerah_read"
  on public.seerah_episodes for select
  to authenticated
  using (published or (select public.is_admin()));

drop policy if exists "seerah_admin_write" on public.seerah_episodes;
create policy "seerah_admin_write"
  on public.seerah_episodes for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists seerah_touch on public.seerah_episodes;
create trigger seerah_touch
  before update on public.seerah_episodes
  for each row execute function public.touch_updated_at();

-- Private reflection notes, one per member per episode.
create table if not exists public.seerah_reflections (
  user_id    uuid not null references auth.users (id) on delete cascade,
  episode_id uuid not null references public.seerah_episodes (id) on delete cascade,
  body       text not null default '' check (char_length(body) <= 20000),
  updated_at timestamptz not null default now(),
  primary key (user_id, episode_id)
);

alter table public.seerah_reflections enable row level security;

drop policy if exists "reflections_own" on public.seerah_reflections;
create policy "reflections_own"
  on public.seerah_reflections for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop trigger if exists reflections_touch on public.seerah_reflections;
create trigger reflections_touch
  before update on public.seerah_reflections
  for each row execute function public.touch_updated_at();

revoke all on public.seerah_episodes    from anon, authenticated;
revoke all on public.seerah_reflections from anon, authenticated;
grant select, insert, update, delete on public.seerah_episodes    to authenticated;
grant select, insert, update, delete on public.seerah_reflections to authenticated;
