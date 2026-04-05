-- =========================================
-- PATRICK RICK SOCIAL CAMPAIGN SYSTEM
-- Supabase SQL Schema
-- =========================================

-- Extensions
create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

-- =========================================
-- ENUMS
-- =========================================

do $$ begin
  create type public.song_era as enum (
    'blue',
    'yellow',
    'red',
    'green',
    'purple',
    'black',
    'white',
    '80s',
    '90s',
    'ballads',
    'unplugged',
    'present'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.campaign_status as enum (
    'draft',
    'active',
    'paused',
    'completed'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.post_status as enum (
    'draft',
    'generated',
    'queued',
    'scheduled',
    'published',
    'failed',
    'cancelled'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.publish_mode as enum (
    'approval',
    'auto'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.platform_name as enum (
    'tiktok',
    'instagram_reels',
    'youtube_shorts'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.asset_type as enum (
    'audio',
    'cover',
    'image',
    'video',
    'subtitle',
    'thumbnail',
    'song_cover',
    'reel_visual',
    'other'
  );
exception
  when duplicate_object then null;
end $$;

-- =========================================
-- UPDATED_AT TRIGGER
-- =========================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =========================================
-- PROFILES
-- =========================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  timezone text default 'Europe/Madrid',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- =========================================
-- SONGS
-- =========================================

create table if not exists public.songs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null,
  era public.song_era not null,
  album text,
  emotional_summary text,
  visual_identity text,
  canonical_phrase text,
  audio_path text,
  cover_path text,
  spotify_url text,
  youtube_url text,
  drive_file_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint songs_owner_slug_unique unique (owner_id, slug)
);

create index if not exists idx_songs_owner_id on public.songs(owner_id);
create index if not exists idx_songs_era on public.songs(era);
create index if not exists idx_songs_title_trgm on public.songs using gin (title gin_trgm_ops);

drop trigger if exists trg_songs_updated_at on public.songs;
create trigger trg_songs_updated_at
before update on public.songs
for each row
execute function public.set_updated_at();

-- =========================================
-- POST ANGLES
-- =========================================

create table if not exists public.post_angles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  label text not null,
  description text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- =========================================
-- CAMPAIGNS
-- =========================================

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  status public.campaign_status not null default 'draft',
  day_number int not null default 1 check (day_number >= 1),
  start_date date,
  last_generated_at timestamptz,
  last_published_at timestamptz,
  is_current boolean not null default false,
  notes text,
  campaign_hook text,
  caption text,
  hashtags text,
  video_prompt text,
  campaign_concept text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_campaigns_owner_id on public.campaigns(owner_id);
create index if not exists idx_campaigns_song_id on public.campaigns(song_id);
create index if not exists idx_campaigns_status on public.campaigns(status);

drop trigger if exists trg_campaigns_updated_at on public.campaigns;
create trigger trg_campaigns_updated_at
before update on public.campaigns
for each row
execute function public.set_updated_at();

create unique index if not exists uq_campaigns_one_current_per_owner
on public.campaigns(owner_id)
where is_current = true;

-- =========================================
-- GENERATED POSTS
-- =========================================

create table if not exists public.generated_posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  angle_id uuid references public.post_angles(id) on delete set null,
  campaign_day int not null default 1 check (campaign_day >= 1),
  title text,
  hook text,
  caption text,
  cta text,
  hashtags text,
  subtitle_text text,
  thumbnail_concept text,
  video_concept text,
  visual_prompt text,
  scheduled_for timestamptz,
  status public.post_status not null default 'draft',
  approval_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_generated_posts_owner_id on public.generated_posts(owner_id);
create index if not exists idx_generated_posts_campaign_id on public.generated_posts(campaign_id);
create index if not exists idx_generated_posts_song_id on public.generated_posts(song_id);
create index if not exists idx_generated_posts_status on public.generated_posts(status);
create index if not exists idx_generated_posts_scheduled_for on public.generated_posts(scheduled_for);

drop trigger if exists trg_generated_posts_updated_at on public.generated_posts;
create trigger trg_generated_posts_updated_at
before update on public.generated_posts
for each row
execute function public.set_updated_at();

-- =========================================
-- POST PLATFORMS
-- =========================================

create table if not exists public.post_platforms (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.generated_posts(id) on delete cascade,
  platform public.platform_name not null,
  platform_caption text,
  platform_hashtags text,
  platform_cta text,
  external_post_id text,
  publish_status public.post_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint post_platforms_post_platform_unique unique (post_id, platform)
);

create index if not exists idx_post_platforms_post_id on public.post_platforms(post_id);
create index if not exists idx_post_platforms_platform on public.post_platforms(platform);

drop trigger if exists trg_post_platforms_updated_at on public.post_platforms;
create trigger trg_post_platforms_updated_at
before update on public.post_platforms
for each row
execute function public.set_updated_at();

-- =========================================
-- PUBLISH LOGS
-- =========================================

create table if not exists public.publish_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.generated_posts(id) on delete cascade,
  post_platform_id uuid references public.post_platforms(id) on delete cascade,
  platform public.platform_name,
  success boolean not null default false,
  response_code int,
  response_message text,
  raw_response jsonb,
  attempted_at timestamptz not null default now()
);

create index if not exists idx_publish_logs_owner_id on public.publish_logs(owner_id);
create index if not exists idx_publish_logs_post_id on public.publish_logs(post_id);

-- =========================================
-- ASSETS
-- =========================================

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  campaign_id uuid references public.campaigns(id) on delete cascade,
  post_id uuid references public.generated_posts(id) on delete cascade,
  asset_type public.asset_type not null,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  external_source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_owner_id on public.assets(owner_id);
create index if not exists idx_assets_song_id on public.assets(song_id);
create index if not exists idx_assets_post_id on public.assets(post_id);

-- =========================================
-- APP SETTINGS
-- =========================================

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade unique,
  publish_mode public.publish_mode not null default 'approval',
  daily_post_time time not null default '20:30',
  timezone text not null default 'Europe/Madrid',
  enable_tiktok boolean not null default true,
  enable_instagram_reels boolean not null default true,
  enable_youtube_shorts boolean not null default true,
  default_hashtags text,
  retry_limit int not null default 3 check (retry_limit >= 0 and retry_limit <= 20),
  auto_continue_same_song boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_app_settings_updated_at on public.app_settings;
create trigger trg_app_settings_updated_at
before update on public.app_settings
for each row
execute function public.set_updated_at();

-- =========================================
-- HELPER FUNCTIONS
-- =========================================

create or replace function public.get_current_profile_id()
returns uuid
language sql
stable
as $$
  select auth.uid();
$$;

create or replace function public.start_campaign(p_song_id uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_owner_id uuid := auth.uid();
  v_campaign_id uuid;
begin
  if v_owner_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.campaigns
  set is_current = false,
      status = case when status = 'active' then 'paused' else status end,
      updated_at = now()
  where owner_id = v_owner_id
    and is_current = true;

  insert into public.campaigns (
    owner_id,
    song_id,
    status,
    day_number,
    start_date,
    is_current
  )
  values (
    v_owner_id,
    p_song_id,
    'active',
    1,
    current_date,
    true
  )
  returning id into v_campaign_id;

  return v_campaign_id;
end;
$$;

create or replace function public.increment_current_campaign_day()
returns void
language plpgsql
security definer
as $$
declare
  v_owner_id uuid := auth.uid();
begin
  if v_owner_id is null then
    raise exception 'Not authenticated';
  end if;

  update public.campaigns
  set day_number = day_number + 1,
      updated_at = now()
  where owner_id = v_owner_id
    and is_current = true
    and status = 'active';
end;
$$;

create or replace function public.get_recent_angle_codes(p_song_id uuid, p_limit int default 5)
returns table(angle_code text)
language sql
security definer
as $$
  select pa.code
  from public.generated_posts gp
  left join public.post_angles pa on pa.id = gp.angle_id
  where gp.song_id = p_song_id
    and gp.owner_id = auth.uid()
    and pa.code is not null
  order by gp.created_at desc
  limit p_limit;
$$;

-- =========================================
-- RLS
-- =========================================

alter table public.profiles enable row level security;
alter table public.songs enable row level security;
alter table public.post_angles enable row level security;
alter table public.campaigns enable row level security;
alter table public.generated_posts enable row level security;
alter table public.post_platforms enable row level security;
alter table public.publish_logs enable row level security;
alter table public.assets enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "songs_own_all" on public.songs;
create policy "songs_own_all"
on public.songs
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "post_angles_read_all_authenticated" on public.post_angles;
create policy "post_angles_read_all_authenticated"
on public.post_angles
for select
using (auth.uid() is not null);

drop policy if exists "campaigns_own_all" on public.campaigns;
create policy "campaigns_own_all"
on public.campaigns
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "generated_posts_own_all" on public.generated_posts;
create policy "generated_posts_own_all"
on public.generated_posts
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "post_platforms_own_all" on public.post_platforms;
create policy "post_platforms_own_all"
on public.post_platforms
for all
using (
  exists (
    select 1
    from public.generated_posts gp
    where gp.id = post_platforms.post_id
      and gp.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.generated_posts gp
    where gp.id = post_platforms.post_id
      and gp.owner_id = auth.uid()
  )
);

drop policy if exists "publish_logs_own_all" on public.publish_logs;
create policy "publish_logs_own_all"
on public.publish_logs
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "assets_own_all" on public.assets;
create policy "assets_own_all"
on public.assets
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "app_settings_own_all" on public.app_settings;
create policy "app_settings_own_all"
on public.app_settings
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- =========================================
-- OPTIONAL: AUTO PROFILE CREATION
-- =========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    new.email
  )
  on conflict (id) do nothing;

  insert into public.app_settings (owner_id)
  values (new.id)
  on conflict (owner_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();