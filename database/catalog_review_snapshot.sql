-- Additive staging tables for a screenshot-based review snapshot.
-- Apply only after checking the target database and branch.
CREATE TABLE IF NOT EXISTS catalog.review_album_snapshots (
  snapshot_id text NOT NULL,
  album_id text NOT NULL,
  album jsonb NOT NULL,
  tracks jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (snapshot_id, album_id),
  CHECK (jsonb_typeof(tracks) = 'array')
);
CREATE TABLE IF NOT EXISTS catalog.review_catalog_metadata (
  snapshot_id text PRIMARY KEY,
  manifest jsonb NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT now()
);

