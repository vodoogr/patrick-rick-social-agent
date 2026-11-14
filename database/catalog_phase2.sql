-- Patrick Rick Agent AI / Phase 2: canonical music catalog
-- ADDITIVE ONLY. Designed for Neon Preview, not Production until acceptance.
-- Source fidelity: unknown release dates/status, ISRC and audio are NOT invented.
CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE IF NOT EXISTS catalog.sources (
  source_key text PRIMARY KEY,
  title text NOT NULL,
  file_name text,
  source_kind text NOT NULL CHECK (source_kind IN ('PDF_BIBLE','PROJECT_CONTEXT','USER_CONFIRMED','PROVIDER_VERIFIED')),
  sha256 text CHECK (sha256 IS NULL OR sha256 ~ '^[0-9a-f]{64}$'),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.artists (
  artist_key text PRIMARY KEY,
  display_name text NOT NULL,
  artist_role text NOT NULL DEFAULT 'PRIMARY',
  source_key text REFERENCES catalog.sources(source_key),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.eras (
  era_key text PRIMARY KEY,
  title text NOT NULL,
  color text NOT NULL,
  emotional_core text NOT NULL,
  canonical_order integer CHECK (canonical_order > 0),
  source_key text REFERENCES catalog.sources(source_key)
);

CREATE TABLE IF NOT EXISTS catalog.albums (
  album_key text PRIMARY KEY,
  artist_key text NOT NULL REFERENCES catalog.artists(artist_key),
  era_key text REFERENCES catalog.eras(era_key),
  title text NOT NULL,
  album_kind text NOT NULL CHECK (album_kind IN ('ERA','CHAPTER','PARALLEL','DOUBLE','COMPILATION','UNPLUGGED')),
  chapter_label text,
  concept text,
  canonical_phrase text,
  source_key text NOT NULL REFERENCES catalog.sources(source_key),
  publication_status text NOT NULL DEFAULT 'UNKNOWN'
    CHECK (publication_status IN ('UNKNOWN','PLANNED','IN_PRODUCTION','PRESAVE','RELEASED','ARCHIVED')),
  released_on date,
  verification_state text NOT NULL DEFAULT 'DOCUMENTED'
    CHECK (verification_state IN ('DOCUMENTED','USER_CONFIRMED','PROVIDER_VERIFIED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (released_on IS NULL OR publication_status IN ('RELEASED','ARCHIVED'))
);

CREATE TABLE IF NOT EXISTS catalog.discs (
  album_key text NOT NULL REFERENCES catalog.albums(album_key) ON DELETE RESTRICT,
  disc_number integer NOT NULL CHECK (disc_number > 0),
  title text,
  PRIMARY KEY (album_key,disc_number)
);

CREATE TABLE IF NOT EXISTS catalog.songs (
  song_key text PRIMARY KEY,
  artist_key text NOT NULL REFERENCES catalog.artists(artist_key),
  title text NOT NULL,
  source_key text NOT NULL REFERENCES catalog.sources(source_key),
  lyrics_state text NOT NULL DEFAULT 'UNKNOWN'
    CHECK (lyrics_state IN ('UNKNOWN','DRAFT','REVIEW','APPROVED')),
  composition_state text NOT NULL DEFAULT 'UNKNOWN'
    CHECK (composition_state IN ('UNKNOWN','IDEA','DEMO','PRODUCTION','MASTERED')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.album_tracks (
  album_key text NOT NULL,
  disc_number integer NOT NULL,
  track_number integer NOT NULL CHECK (track_number > 0),
  song_key text NOT NULL REFERENCES catalog.songs(song_key),
  source_key text NOT NULL REFERENCES catalog.sources(source_key),
  PRIMARY KEY (album_key,disc_number,track_number),
  FOREIGN KEY (album_key,disc_number) REFERENCES catalog.discs(album_key,disc_number) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS catalog_tracks_by_song_idx ON catalog.album_tracks(song_key);
CREATE INDEX IF NOT EXISTS catalog_songs_title_idx ON catalog.songs(lower(title));
CREATE INDEX IF NOT EXISTS catalog_albums_artist_era_idx ON catalog.albums(artist_key,era_key);

-- A song/work is not the same as a recording. Multiple versions can coexist.
CREATE TABLE IF NOT EXISTS catalog.recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_key text NOT NULL REFERENCES catalog.songs(song_key),
  version_label text NOT NULL,
  version_kind text NOT NULL CHECK (version_kind IN ('STUDIO','LIVE','ACOUSTIC','UNPLUGGED','REMIX','DEMO','OTHER')),
  vocal_identity text,
  bpm numeric(6,2) CHECK (bpm IS NULL OR bpm > 0),
  suno_model text,
  style_prompt text,
  audio_asset_uri text,
  approval_status text NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (approval_status IN ('UNVERIFIED','DRAFT','REVIEW','APPROVED')),
  source_key text REFERENCES catalog.sources(source_key),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(song_key,version_label)
);

CREATE TABLE IF NOT EXISTS catalog.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_key text NOT NULL REFERENCES catalog.artists(artist_key),
  release_kind text NOT NULL CHECK (release_kind IN ('SINGLE','EP','ALBUM')),
  album_key text REFERENCES catalog.albums(album_key),
  recording_id uuid REFERENCES catalog.recordings(id),
  title text NOT NULL,
  distributor text,
  upc text,
  isrc text,
  platform_uri text,
  released_on date,
  status text NOT NULL DEFAULT 'UNKNOWN'
    CHECK (status IN ('UNKNOWN','PLANNED','PRESAVE','RELEASED','TAKEDOWN')),
  source_key text REFERENCES catalog.sources(source_key),
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(album_key, recording_id) = 1),
  CHECK (released_on IS NULL OR status IN ('RELEASED','TAKEDOWN'))
);

CREATE TABLE IF NOT EXISTS catalog.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  album_key text REFERENCES catalog.albums(album_key),
  song_key text REFERENCES catalog.songs(song_key),
  recording_id uuid REFERENCES catalog.recordings(id),
  asset_kind text NOT NULL CHECK (asset_kind IN ('COVER','AUDIO','VIDEO','LYRICS','PHOTO','PROMPT','OTHER')),
  external_uri text NOT NULL,
  rights_checked boolean NOT NULL DEFAULT false,
  source_key text REFERENCES catalog.sources(source_key),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(album_key,song_key,recording_id) = 1)
);

CREATE TABLE IF NOT EXISTS catalog.change_events (
  id bigserial PRIMARY KEY,
  entity_kind text NOT NULL,
  entity_key text NOT NULL,
  action_kind text NOT NULL,
  source_key text REFERENCES catalog.sources(source_key),
  notes text,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

-- Production remains intact. Seed separately from reviewed PDFs.
