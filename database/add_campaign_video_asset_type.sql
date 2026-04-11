-- Migration to add 'campaign_video' to asset_type enum
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'campaign_video';
