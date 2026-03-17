-- Profiles (Extended)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Songs
CREATE TABLE IF NOT EXISTS songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  era TEXT NOT NULL,
  album TEXT,
  emotional_summary TEXT,
  visual_identity TEXT,
  canonical_phrase TEXT,
  audio_url TEXT,
  cover_url TEXT,
  spotify_link TEXT,
  youtube_link TEXT,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaigns
CREATE TYPE campaign_status AS ENUM ('draft', 'active', 'paused', 'completed');

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status campaign_status DEFAULT 'draft',
  campaign_day INTEGER DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_generated TIMESTAMP WITH TIME ZONE,
  last_published TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Angles
CREATE TABLE IF NOT EXISTS post_angles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  visual_style TEXT,
  example_hook TEXT,
  UNIQUE(day_number)
);

-- Generated Posts
CREATE TYPE post_status AS ENUM ('draft', 'queued', 'scheduled', 'published', 'failed');

CREATE TABLE IF NOT EXISTS generated_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  angle_id UUID REFERENCES post_angles(id),
  content_angle TEXT,
  hook TEXT,
  caption TEXT,
  cta TEXT,
  hashtags TEXT[],
  subtitle_text TEXT,
  thumbnail_concept TEXT,
  video_concept TEXT,
  visual_prompt TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  status post_status DEFAULT 'draft',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post Platforms
CREATE TYPE platform_type AS ENUM ('tiktok', 'instagram', 'youtube');

CREATE TABLE IF NOT EXISTS post_platforms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES generated_posts(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  external_id TEXT,
  publish_status post_status DEFAULT 'draft',
  error_log TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(post_id, platform)
);

-- Publish Logs
CREATE TABLE IF NOT EXISTS publish_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES generated_posts(id) ON DELETE CASCADE,
  platform platform_type NOT NULL,
  status TEXT NOT NULL,
  message TEXT,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'video', 'image', 'audio', 'document'
  name TEXT,
  url TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  daily_post_time TIME DEFAULT '10:00:00',
  auto_publish BOOLEAN DEFAULT false,
  approval_mode BOOLEAN DEFAULT true,
  enabled_platforms platform_type[] DEFAULT '{tiktok, instagram, youtube}',
  default_hashtags TEXT[] DEFAULT '{#PatrickRick, #NewMusic}',
  retry_limit INTEGER DEFAULT 3,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_generated_posts_status ON generated_posts(status);
CREATE INDEX IF NOT EXISTS idx_assets_song_id ON assets(song_id);

-- Seeding Logic (Initial Post Angles)
INSERT INTO post_angles (day_number, name, description, example_hook) VALUES
(1, 'Atmospheric Teaser', 'Focus on the mood and visual atmosphere of the era.', 'The silence of the night speaks louder than words...'),
(2, 'Lyric Fragment', 'Highlight a powerful line from the song.', 'In the neon glow, we find our truth.'),
(3, 'Emotional Hook', 'Connect the song’s meaning to a relatable emotion.', 'Ever felt the world stop when the music starts?'),
(4, 'Cinematic Visual Concept', 'Showcase deep artistic visual metaphors.', 'Visualizing the weight of a memory.'),
(5, 'Era Storytelling', 'Deep dive into the lore and narrative of the current Era.', 'The Blue Era has always been about the things we leave unsaid.'),
(6, 'Intimate Interpretation', 'A more personal, raw connection to the music.', 'Just me, a piano, and the thoughts that won't go away.'),
(7, 'Listening Invitation', 'Direct call to stream the song on platforms.', 'The journey continues on Spotify. Are you coming?')
ON CONFLICT (day_number) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  example_hook = EXCLUDED.example_hook;

-- RLS Policies (Basic setup)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- (Extend RLS for other tables as needed)