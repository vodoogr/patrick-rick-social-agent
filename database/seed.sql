-- =========================================
-- PATRICK RICK SOCIAL CAMPAIGN SYSTEM
-- Initial Seed Data
-- =========================================

-- Post Angles (Standard Rotation codes used by logic)
INSERT INTO public.post_angles (code, label, description, sort_order) VALUES
('atmospheric_teaser', 'Atmospheric Teaser', 'Focus on the mood and visual atmosphere of the era.', 1),
('lyric_fragment', 'Lyric Fragment', 'Highlight a powerful line from the song.', 2),
('emotional_hook', 'Emotional Hook', 'Connect the songs meaning to a relatable emotion.', 3),
('visual_concept', 'Cinematic Visual Concept', 'Showcase deep artistic visual metaphors.', 4),
('storytelling', 'Era Storytelling', 'Deep dive into the lore and narrative of the current Era.', 5),
('intimate_interpretation', 'Intimate Interpretation', 'A more personal, raw connection to the music.', 6),
('listening_invitation', 'Listening Invitation', 'Direct call to stream the song on platforms.', 7)
ON CONFLICT (code) DO UPDATE SET 
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- Note: Songs, Profiles, and Campaigns are owner-specific.
-- Those should be created via the App UI to ensure correct owner_id (auth.uid()).

