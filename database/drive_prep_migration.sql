-- =========================================
-- DRIVE PREPARATION MIGRATION
-- Run this in Supabase SQL Editor
-- =========================================

-- Add drive_folder_id to albums
alter table public.albums
  add column if not exists drive_folder_id text;

-- Add drive_file_id to songs
alter table public.songs
  add column if not exists drive_file_id text;

-- Add external_source_url to assets
alter table public.assets
  add column if not exists external_source_url text;
