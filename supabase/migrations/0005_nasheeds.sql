-- ---------------------------------------------------------------------
-- NUR — 0005: Nasheed library, media storage, reminder articles,
--             and the app-wide ambient setting
--
-- Safe to re-run.
-- ---------------------------------------------------------------------

-- ---- Nasheeds -------------------------------------------------------

create table if not exists public.nasheeds (
  id             uuid primary key default gen_random_uuid(),
  title          text not null check (char_length(title) between 1 and 200),
  artist         text not null default '',
  description    text not null default '',
  -- Full track, in the PRIVATE 'nasheeds' bucket. Never publicly addressable.
  audio_path     text,
  -- Optional short preview, in the PUBLIC 'media' bucket.
  preview_path   text,
  cover_path     text,
  duration_s     integer check (duration_s is null or duration_s > 0),
  is_member_only boolean not null default true,
  themes         text[] not null default '{}',
  sort_order     integer not null default 0,
  published      boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists nasheeds_order on public.nasheeds (sort_order, created_at desc);
create index if not exists nasheeds_themes on public.nasheeds using gin (themes);

alter table public.nasheeds enable row level security;

-- Every signed-in visitor sees the catalogue (so non-members can see what
-- membership unlocks). Whether they may *play* a full track is decided by
-- the storage policy below, not by hiding rows.
drop policy if exists "nasheeds_read" on public.nasheeds;
create policy "nasheeds_read"
  on public.nasheeds for select
  to authenticated
  using (published or (select public.is_admin()));

drop policy if exists "nasheeds_admin_write" on public.nasheeds;
create policy "nasheeds_admin_write"
  on public.nasheeds for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists nasheeds_touch on public.nasheeds;
create trigger nasheeds_touch
  before update on public.nasheeds
  for each row execute function public.touch_updated_at();

revoke all on public.nasheeds from anon, authenticated;
grant select, insert, update, delete on public.nasheeds to authenticated;

-- ---- Storage buckets ------------------------------------------------
--
-- nasheeds: PRIVATE. Full member tracks. Reached only through short-lived
--           signed URLs minted by /api/nasheeds/[id]/stream, and only for
--           members — enforced here in the storage policy, so the check
--           holds even if someone calls the Storage API directly.
-- media:    PUBLIC. Previews, cover art, the ambient loop. Safe to expose.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('nasheeds', 'nasheeds', false, 52428800,
     array['audio/mpeg','audio/mp4','audio/aac','audio/x-m4a','audio/ogg','audio/wav','audio/webm']),
  ('media', 'media', true, 52428800,
     array['audio/mpeg','audio/mp4','audio/aac','audio/x-m4a','audio/ogg','audio/wav','audio/webm',
           'image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "nasheeds_members_read" on storage.objects;
create policy "nasheeds_members_read"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'nasheeds' and (select public.is_member()));

drop policy if exists "nasheeds_admin_insert" on storage.objects;
create policy "nasheeds_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id in ('nasheeds', 'media') and (select public.is_admin()));

drop policy if exists "nasheeds_admin_update" on storage.objects;
create policy "nasheeds_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id in ('nasheeds', 'media') and (select public.is_admin()))
  with check (bucket_id in ('nasheeds', 'media') and (select public.is_admin()));

drop policy if exists "nasheeds_admin_delete" on storage.objects;
create policy "nasheeds_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id in ('nasheeds', 'media') and (select public.is_admin()));

-- Admins also need to list the media bucket in the admin panel.
drop policy if exists "media_admin_list" on storage.objects;
create policy "media_admin_list"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

-- ---- Reminder articles ------------------------------------------------
-- The client asked that tapping a daily reminder opens a longer reflection
-- and a nasheed on the same theme. The 35 reminder lines live in code;
-- their articles and nasheed links are content, so they live here.

create table if not exists public.reminder_articles (
  reminder_id smallint primary key check (reminder_id between 1 and 35),
  title       text not null default '',
  body        text not null default '',
  nasheed_id  uuid references public.nasheeds (id) on delete set null,
  updated_at  timestamptz not null default now()
);

alter table public.reminder_articles enable row level security;

drop policy if exists "reminder_articles_read" on public.reminder_articles;
create policy "reminder_articles_read"
  on public.reminder_articles for select
  to authenticated
  using (true);

drop policy if exists "reminder_articles_admin_write" on public.reminder_articles;
create policy "reminder_articles_admin_write"
  on public.reminder_articles for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists reminder_articles_touch on public.reminder_articles;
create trigger reminder_articles_touch
  before update on public.reminder_articles
  for each row execute function public.touch_updated_at();

revoke all on public.reminder_articles from anon, authenticated;
grant select, insert, update, delete on public.reminder_articles to authenticated;

-- ---- App settings (singleton) -------------------------------------------
-- Lets the client change the app-wide ambient nasheed without a deploy.
-- Readable before sign-in, because the ambient loop plays on the splash.

create table if not exists public.app_settings (
  id            smallint primary key default 1 check (id = 1),
  ambient_path  text,            -- path in the public 'media' bucket
  ambient_title text not null default 'Lost and Found',
  ambient_start integer not null default 68  check (ambient_start >= 0),
  ambient_end   integer not null default 113 check (ambient_end > ambient_start),
  updated_at    timestamptz not null default now()
);

insert into public.app_settings (id) values (1) on conflict (id) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_read" on public.app_settings;
create policy "app_settings_read"
  on public.app_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "app_settings_admin_update" on public.app_settings;
create policy "app_settings_admin_update"
  on public.app_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch
  before update on public.app_settings
  for each row execute function public.touch_updated_at();

revoke all on public.app_settings from anon, authenticated;
grant select on public.app_settings to anon, authenticated;
grant update on public.app_settings to authenticated;
