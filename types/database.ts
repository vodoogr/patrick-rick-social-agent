import { CampaignStatus, PostStatus, PlatformType, AssetType } from './enums';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  updated_at: string;
}

export interface Song {
  id: string;
  title: string;
  slug: string;
  era: string;
  album: string | null;
  emotional_summary: string | null;
  visual_identity: string | null;
  canonical_phrase: string | null;
  audio_url: string | null;
  cover_url: string | null;
  spotify_link: string | null;
  youtube_link: string | null;
  is_favorite: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  song_id: string;
  user_id: string;
  status: CampaignStatus;
  campaign_day: number;
  start_date: string;
  last_generated: string | null;
  last_published: string | null;
  is_current: boolean;
  created_at: string;
}

export interface PostAngle {
  id: string;
  day_number: number;
  name: string;
  description: string | null;
  visual_style: string | null;
  example_hook: string | null;
}

export interface GeneratedPost {
  id: string;
  campaign_id: string;
  angle_id: string | null;
  content_angle: string | null;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  hashtags: string[] | null;
  subtitle_text: string | null;
  thumbnail_concept: string | null;
  video_concept: string | null;
  visual_prompt: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  status: PostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  created_at: string;
}

export interface PostPlatform {
  id: string;
  post_id: string;
  platform: PlatformType;
  external_id: string | null;
  publish_status: PostStatus;
  error_log: string | null;
  published_at: string | null;
}

export interface PublishLog {
  id: string;
  post_id: string;
  platform: PlatformType;
  status: string;
  message: string | null;
  payload: any;
  created_at: string;
}

export interface Asset {
  id: string;
  song_id: string;
  type: AssetType;
  name: string | null;
  url: string;
  metadata: any;
  created_at: string;
}

export interface AppSettings {
  id: string;
  user_id: string;
  daily_post_time: string;
  auto_publish: boolean;
  approval_mode: boolean;
  enabled_platforms: PlatformType[];
  default_hashtags: string[];
  retry_limit: number;
  updated_at: string;
}

