-- ---------------------------------------------------------------------
-- NUR — 0002: tasbeeh sessions and health logs
--
-- Run in the Supabase SQL Editor after 0001. Safe to re-run.
--
-- Both tables are private per user and enforced in the database, not the
-- UI: every policy is scoped to auth.uid(), so one member can never read
-- another's dhikr history or health log even by crafting requests directly
-- against the REST API.
-- ---------------------------------------------------------------------

-- ---- Tasbeeh --------------------------------------------------------

create table if not exists public.tasbeeh_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  dhikr        text not null,
  count        integer not null check (count >= 0),
  target       integer check (target is null or target > 0),
  completed_at timestamptz not null default now()
);

create index if not exists tasbeeh_sessions_user_time
  on public.tasbeeh_sessions (user_id, completed_at desc);

alter table public.tasbeeh_sessions enable row level security;

drop policy if exists "tasbeeh_own" on public.tasbeeh_sessions;
create policy "tasbeeh_own"
  on public.tasbeeh_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---- Health ---------------------------------------------------------
-- One row per user per day; upserted as the day goes on.

create table if not exists public.health_logs (
  user_id     uuid not null references auth.users (id) on delete cascade,
  log_date    date not null default current_date,
  sleep_hours numeric(3,1) check (sleep_hours is null or (sleep_hours >= 0 and sleep_hours <= 24)),
  water_ml    integer      check (water_ml is null or (water_ml >= 0 and water_ml <= 20000)),
  fasted      boolean not null default false,
  updated_at  timestamptz not null default now(),
  primary key (user_id, log_date)
);

alter table public.health_logs enable row level security;

drop policy if exists "health_own" on public.health_logs;
create policy "health_own"
  on public.health_logs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop trigger if exists health_logs_touch_updated_at on public.health_logs;
create trigger health_logs_touch_updated_at
  before update on public.health_logs
  for each row execute function public.touch_updated_at();

-- ---- Privileges -------------------------------------------------------
-- Anonymous visitors get nothing; signed-in users act only through the
-- policies above.

revoke all on public.tasbeeh_sessions from anon, authenticated;
revoke all on public.health_logs      from anon, authenticated;

grant select, insert, update, delete on public.tasbeeh_sessions to authenticated;
grant select, insert, update, delete on public.health_logs      to authenticated;
