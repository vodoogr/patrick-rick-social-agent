import { 
  SongEra, 
  CampaignStatus, 
  PostStatus, 
  PublishMode, 
  PlatformName, 
  AssetType,
  ReleaseStatus
} from './enums';

// =========================================
// Creative DNA Interfaces
// =========================================

export interface AlbumCreativeDNA {
  narrative_summary?: string;
  visual_identity?: string;
  canonical_phrase?: string;
  visual_keywords?: string[];
  emotional_direction?: string;
  prompt_notes?: string;
}

export interface SongCreativeDNA {
  emotional_summary?: string;
  visual_identity?: string;
  canonical_phrase?: string;
  themes?: string[];
  symbolism?: string[];
  visual_keywords?: string[];
  campaign_tone?: string;
  prompt_notes?: string;
}

// =========================================
// Core Entities
// =========================================

export interface Profile {
  id: string;
  display_name: string | null;
  email: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Album {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  era: SongEra;
  cover_path: string | null;
  description: string | null;
  release_year: number | null;
  sort_order: number;
  is_active: boolean;
  creative_dna: AlbumCreativeDNA;
  created_at: string;
  updated_at: string;
}

export interface AlbumWithSongs extends Album {
  songs?: Song[];
}

export interface Song {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  era: SongEra;
  album: string | null; // legacy text column
  album_id: string | null;
  track_number: number | null;
  release_status: ReleaseStatus;
  emotional_summary: string | null;
  visual_identity: string | null;
  canonical_phrase: string | null;
  audio_path: string | null;
  cover_path: string | null;
  spotify_url: string | null;
  youtube_url: string | null;
  is_active: boolean;
  creative_dna: SongCreativeDNA;
  created_at: string;
  updated_at: string;
}

export interface SongWithAlbum extends Song {
  albums?: Album;
}

export interface PostAngle {
  id: string;
  code: string;
  label: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface Campaign {
  id: string;
  owner_id: string;
  song_id: string;
  status: CampaignStatus;
  day_number: number;
  start_date: string | null;
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
  id: string;
  owner_id: string;
  campaign_id: string;
  song_id: string;
  angle_id: string | null;
  campaign_day: number;
  title: string | null;
  hook: string | null;
  caption: string | null;
  cta: string | null;
  hashtags: string | null;
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
  id: string;
  post_id: string;
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
  id: string;
  owner_id: string;
  post_id: string | null;
  post_platform_id: string | null;
  platform: PlatformName | null;
  success: boolean;
  response_code: number | null;
  response_message: string | null;
  raw_response: any;
  attempted_at: string;
}

export interface Asset {
  id: string;
  owner_id: string;
  song_id: string | null;
  album_id: string | null;
  campaign_id: string | null;
  post_id: string | null;
  asset_type: AssetType;
  storage_path: string;
  file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  metadata: any;
  created_at: string;
}

export interface AppSettings {
  id: string;
  owner_id: string;
  publish_mode: PublishMode;
  daily_post_time: string;
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
