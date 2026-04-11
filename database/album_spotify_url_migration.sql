-- migration to add spotify_url to albums table
ALTER TABLE albums ADD COLUMN IF NOT EXISTS spotify_url text;
