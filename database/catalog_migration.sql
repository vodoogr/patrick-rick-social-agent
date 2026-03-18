-- =========================================
-- CATALOG EXPANSION MIGRATION
-- Run this in Supabase SQL Editor
-- =========================================

-- =========================================
-- ALBUMS TABLE
-- =========================================

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  slug text not null,
  era public.song_era not null,
  cover_path text,
  description text,
  release_year int,
  sort_order int not null default 0,
  is_active boolean not null default true,
  creative_dna jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint albums_owner_slug_unique unique (owner_id, slug)
);

create index if not exists idx_albums_owner_id on public.albums(owner_id);
create index if not exists idx_albums_era on public.albums(era);

drop trigger if exists trg_albums_updated_at on public.albums;
create trigger trg_albums_updated_at
before update on public.albums
for each row
execute function public.set_updated_at();

-- =========================================
-- SONGS TABLE UPDATES
-- =========================================

-- Add album_id FK
alter table public.songs
  add column if not exists album_id uuid references public.albums(id) on delete set null;

-- Add track_number
alter table public.songs
  add column if not exists track_number int;

-- Add release_status
alter table public.songs
  add column if not exists release_status text not null default 'released';

-- Add creative_dna jsonb
alter table public.songs
  add column if not exists creative_dna jsonb not null default '{}'::jsonb;

create index if not exists idx_songs_album_id on public.songs(album_id);

-- =========================================
-- ASSETS TABLE UPDATE
-- =========================================

alter table public.assets
  add column if not exists album_id uuid references public.albums(id) on delete set null;

create index if not exists idx_assets_album_id on public.assets(album_id);

-- =========================================
-- RLS FOR ALBUMS
-- =========================================

alter table public.albums enable row level security;

drop policy if exists "albums_own_all" on public.albums;
create policy "albums_own_all"
on public.albums
for all
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
