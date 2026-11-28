-- Additive mapping from reviewed album observations to Suno playlists.
CREATE TABLE IF NOT EXISTS catalog.review_album_playlists (
  snapshot_id text NOT NULL,
  album_id text NOT NULL,
  collection_key text NOT NULL REFERENCES catalog.suno_collections(collection_key),
  linked_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (snapshot_id, album_id),
  FOREIGN KEY (snapshot_id, album_id) REFERENCES catalog.review_album_snapshots(snapshot_id, album_id)
);
