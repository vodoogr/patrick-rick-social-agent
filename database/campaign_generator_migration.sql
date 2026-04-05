-- Add AI Campaign Generator fields to campaigns table
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS campaign_hook text,
ADD COLUMN IF NOT EXISTS caption text,
ADD COLUMN IF NOT EXISTS hashtags text,
ADD COLUMN IF NOT EXISTS video_prompt text,
ADD COLUMN IF NOT EXISTS campaign_concept text;

-- Add new asset types to asset_type enum
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'song_cover';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'reel_visual';
