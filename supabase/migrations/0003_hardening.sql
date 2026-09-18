-- ---------------------------------------------------------------------
-- NUR — 0003: fixes flagged by the Supabase security/performance advisors
--
-- Safe to re-run.
-- ---------------------------------------------------------------------

-- 1. handle_new_user() is SECURITY DEFINER and lives in the exposed public
--    schema, so PostgREST published it at /rest/v1/rpc/handle_new_user
--    for anon and signed-in callers. It only ever needs to run as the
--    auth.users trigger; nobody should be able to call it over HTTP.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- 2. Pin search_path on the updated_at trigger, as handle_new_user already
--    is, so it cannot be redirected to a shadowing function.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- 3. Evaluate auth.uid() once per query instead of once per row.
--    Wrapping it in (select ...) lets Postgres hoist it into an initplan;
--    unwrapped, a query over 10,000 rows calls it 10,000 times.

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "tasbeeh_own" on public.tasbeeh_sessions;
create policy "tasbeeh_own"
  on public.tasbeeh_sessions for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "health_own" on public.health_logs;
create policy "health_own"
  on public.health_logs for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
