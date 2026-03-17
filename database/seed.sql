-- Initial Seed Data for Songs and Assets

-- Initial Songs representing different Eras
INSERT INTO songs (title, slug, era, album, emotional_summary, visual_identity, canonical_phrase, spotify_link)
VALUES 
('Blue Night City', 'blue-night-city', 'Blue', 'Midnight Chronicles', 'Introspection in the urban silence.', 'Deep neon blues, rain-slicked streets, far-off city lights.', 'The silence of the night speaks louder than words.', 'https://spotify.com/track/1'),
('Golden Rebirth', 'golden-rebirth', 'Yellow', 'Light Seekers', 'Finding clarity after the storm.', 'Warm sunrise hues, golden fields, crystalline atmosphere.', 'Morning light heals what the night has broken.', 'https://spotify.com/track/2'),
('Nocturnal Passion', 'nocturnal-passion', 'Red', 'Inner Fire', 'The intensity of nocturnal desire.', 'Deep velvet reds, flickering flames, dramatic shadows.', 'In the heat of the night, we find who we truly are.', 'https://spotify.com/track/3'),
('Spiritual Balance', 'spiritual-balance', 'Green', 'Harmonics', 'Calm, centering, and grounded existence.', 'Ethereal forest greens, soft natural light, mist.', 'Find your rhythm in the silence of nature.', 'https://spotify.com/track/4');

-- Note: In a real system, you would insert profiles and campaigns here as well, 
-- but these often depend on the auth.users table which is managed by Supabase Auth.
