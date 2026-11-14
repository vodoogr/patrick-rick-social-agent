-- Phase 2B: snapshot of observed Suno playlists/workspaces and clips.
-- SUNO library evidence is NOT a confirmed album tracklist nor a Spotify release.
-- Additive, isolated from catalog.songs/recordings/releases until reviewed mapping.

CREATE TABLE IF NOT EXISTS catalog.suno_collections (
  collection_key text PRIMARY KEY,
  collection_type text NOT NULL CHECK (collection_type IN ('PLAYLIST','WORKSPACE')),
  external_id uuid NOT NULL,
  display_name text NOT NULL,
  external_url text,
  observed_clip_count integer CHECK (observed_clip_count IS NULL OR observed_clip_count >= 0),
  observed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_type,external_id)
);

CREATE TABLE IF NOT EXISTS catalog.suno_clips (
  clip_id uuid PRIMARY KEY,
  title text NOT NULL,
  suno_url text,
  created_at_suno timestamptz,
  visibility text CHECK (visibility IN ('public','private')),
  source_key text NOT NULL REFERENCES catalog.sources(source_key),
  last_observed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.suno_collection_clips (
  collection_key text NOT NULL REFERENCES catalog.suno_collections(collection_key),
  clip_id uuid NOT NULL REFERENCES catalog.suno_clips(clip_id),
  listed_position integer CHECK (listed_position IS NULL OR listed_position > 0),
  observed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_key,clip_id)
);
CREATE INDEX IF NOT EXISTS suno_memberships_clip_idx
  ON catalog.suno_collection_clips(clip_id);

CREATE TABLE IF NOT EXISTS catalog.suno_clip_links (
  clip_id uuid NOT NULL REFERENCES catalog.suno_clips(clip_id),
  song_key text NOT NULL REFERENCES catalog.songs(song_key),
  relation text NOT NULL CHECK (relation IN ('MASTER','ALTERNATE','COVER','REMIX','LIVE','DEMO','UNKNOWN')),
  review_status text NOT NULL DEFAULT 'PROPOSED'
    CHECK (review_status IN ('PROPOSED','CONFIRMED','REJECTED')),
  notes text,
  confirmed_source_key text REFERENCES catalog.sources(source_key),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (clip_id,song_key)
);
-- Do not infer a canonical link from title text or playlist membership alone.

INSERT INTO catalog.sources(source_key,title,source_kind,notes)
  VALUES ('suno-live-observation-2026-11-13','Patrick Rick SUNO account observation — 2026-11-13','PROVIDER_VERIFIED',
          'Visible playlists, workspaces and clips. Evidence of Suno library entries only, NOT final tracklists or releases.')
  ON CONFLICT (source_key) DO NOTHING;

INSERT INTO catalog.sources(source_key,title,source_kind,notes)
  VALUES ('user-albums-suno-2026-11-13','ALBUMS SUNO user status — 2026-11-13','USER_CONFIRMED',
          'Owner reports the album materials are uploaded to ALBUMS SUNO project except Unplugged II, which remains in development; folder itself is not yet reachable by this connector.')
  ON CONFLICT (source_key) DO NOTHING;

INSERT INTO catalog.albums (
  album_key,artist_key,era_key,title,album_kind,chapter_label,concept,source_key,
  publication_status,verification_state
) VALUES (
  'unplugged-ii', 'patrick_rick', NULL, 'Unplugged II', 'UNPLUGGED',
  'Unplugged II — proyecto en desarrollo', NULL, 'user-albums-suno-2026-11-13',
  'IN_PRODUCTION','USER_CONFIRMED'
) ON CONFLICT (album_key) DO NOTHING;
INSERT INTO catalog.discs(album_key,disc_number,title) VALUES ('unplugged-ii',1,NULL)
ON CONFLICT (album_key,disc_number) DO NOTHING;
