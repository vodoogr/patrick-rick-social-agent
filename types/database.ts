import { 
  SongEra, 
  CampaignStatus, 
  PostStatus, 
  PublishMode, 
  PlatformName, 
  AssetType 
} from './enums';

export interface Profile {
  id: string; // uuid
  display_name: string | null;
  email: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Song {
  id: string; // uuid
  owner_id: string; // uuid
  title: string;
  slug: string;
  era: SongEra;
  album: string | null;
  emotional_summary: string | null;
  visual_identity: string | null;
  canonical_phrase: string | null;
  audio_path: string | null;
  cover_path: string | null;
  spotify_url: string | null;
  youtube_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostAngle {
  id: string; // uuid
  code: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string; // uuid
  owner_id: string; // uuid
  song_id: string; // uuid
  status: CampaignStatus;
  day_number: number;
  start_date: string | null; // date
  last_generated_at: string | null;
  last_published_at: string | null;
  is_current: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignWithSong extends Campaign {
  songs?: Song;
}

export interface GeneratedPost {
  id: string; // uuid
  owner_id: string; // uuid
  campaign_id: string; // uuid
  song_id: string; // uuid
  angle_id: string | null; // uuid
  campaign_day: number;
  title: string | null;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  hashtags: string | null; // stored as text in this schema
  subtitle_text: string | null;
  thumbnail_concept: string | null;
  video_concept: string | null;
  visual_prompt: string | null;
  scheduled_for: string | null;
  status: PostStatus;
  approval_required: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostPlatform {
  id: string; // uuid
  post_id: string; // uuid
  platform: PlatformName;
  platform_caption: string | null;
  platform_hashtags: string | null;
  platform_cta: string | null;
  external_post_id: string | null;
  publish_status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PublishLog {
  id: string; // uuid
  owner_id: string; // uuid
  post_id: string | null; // uuid
  post_platform_id: string | null; // uuid
  platform: PlatformName | null;
  success: boolean;
  response_code: number | null;
  response_message: string | null;
  raw_response: any; // jsonb
  attempted_at: string;
}

export interface Asset {
  id: string; // uuid
  owner_id: string; // uuid
  song_id: string | null; // uuid
  campaign_id: string | null; // uuid
  post_id: string | null; // uuid
  asset_type: AssetType;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  metadata: any; // jsonb
  created_at: string;
}

export interface AppSettings {
  id: string; // uuid
  owner_id: string; // uuid
  publish_mode: PublishMode;
  daily_post_time: string; // time
  timezone: string;
  enable_tiktok: boolean;
  enable_instagram_reels: boolean;
  enable_youtube_shorts: boolean;
  default_hashtags: string | null;
  retry_limit: number;
  auto_continue_same_song: boolean;
  created_at: string;
  updated_at: string;
}


