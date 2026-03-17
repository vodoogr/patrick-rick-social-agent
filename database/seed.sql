-- =========================================
-- PATRICK RICK SOCIAL CAMPAIGN SYSTEM
-- Production Seed Data
-- =========================================

-- Post Angles (10-Day Rotation)
insert into public.post_angles (code, label, description, sort_order)
values
  ('atmospheric_teaser', 'Atmospheric Teaser', 'Mood-first teaser focused on atmosphere and intrigue', 1),
  ('lyric_focus', 'Lyric Focus', 'A post centered around a key lyric fragment', 2),
  ('emotional_hook', 'Emotional Hook', 'Direct emotional insight from the song', 3),
  ('cinematic_visual', 'Cinematic Visual', 'Visual-first post built on cinematic mood', 4),
  ('era_storytelling', 'Era Storytelling', 'Connect the song to its era and narrative chapter', 5),
  ('intimate_interpretation', 'Intimate Interpretation', 'Personal and emotionally contained interpretation', 6),
  ('quote_piece', 'Quote Piece', 'Short quote-led content piece', 7),
  ('listening_invitation', 'Listening Invitation', 'Elegant CTA to listen to the full track', 8),
  ('silent_visual_text', 'Silent Visual + Text', 'Silent or minimal visual with strong text overlay', 9),
  ('what_it_feels_like', 'What It Feels Like', 'Translate the song into an emotional visual feeling', 10)
on conflict (code) do nothing;

-- Songs (Placeholders for real owner_id)
-- Replace 'YOUR_USER_UUID_HERE' with a valid Profile ID
insert into public.songs (
  owner_id,
  title,
  slug,
  era,
  album,
  emotional_summary,
  visual_identity,
  canonical_phrase,
  audio_path,
  cover_path,
  spotify_url,
  youtube_url
)
values
(
  'YOUR_USER_UUID_HERE',
  'Warmth of Sin',
  'warmth-of-sin',
  'red',
  'Pleasure Without Apology',
  'A nocturnal red-era track about adult desire, emotional surrender and elegant intensity.',
  'Neon red, midnight glow, skin, shadow, reflective city textures.',
  'Some fires are softer when they know your name.',
  'songs/warmth-of-sin/audio.mp3',
  'songs/warmth-of-sin/cover.jpg',
  null,
  null
),
(
  'YOUR_USER_UUID_HERE',
  'Beneath the Surface',
  'beneath-the-surface',
  'purple',
  'Only at Night',
  'A hidden emotional current beneath restraint, where silence reveals truth.',
  'Wet streets, indigo light, submerged emotion, restrained closeness.',
  'What stays hidden still burns.',
  'songs/beneath-the-surface/audio.mp3',
  'songs/beneath-the-surface/cover.jpg',
  null,
  null
),
(
  'YOUR_USER_UUID_HERE',
  'The Things I Never Said',
  'the-things-i-never-said',
  'blue',
  'The Things I Never Said',
  'Blue-era introspection about distance, withheld truth and the weight of quiet memory.',
  'Blue haze, city windows, solitude, late-night emotional architecture.',
  'Silence can become its own language.',
  'songs/the-things-i-never-said/audio.mp3',
  'songs/the-things-i-never-said/cover.jpg',
  null,
  null
)
on conflict (owner_id, slug) do nothing;

-- Campaign (Optional: Start one for Warmth of Sin if no current campaign exists)
with s as (
  select id
  from public.songs
  where owner_id = 'YOUR_USER_UUID_HERE'
    and slug = 'warmth-of-sin'
  limit 1
)
insert into public.campaigns (
  owner_id,
  song_id,
  status,
  day_number,
  start_date,
  is_current
)
select
  'YOUR_USER_UUID_HERE',
  s.id,
  'active',
  1,
  current_date,
  true
from s
where not exists (
  select 1
  from public.campaigns c
  where c.owner_id = 'YOUR_USER_UUID_HERE'
    and c.is_current = true
);


