-- Additive migration for Preview. References are metadata, not uploaded files.
CREATE TABLE IF NOT EXISTS public.social_draft_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.content_drafts(id) ON DELETE RESTRICT,
  kind text NOT NULL CHECK (kind IN ('song', 'audio', 'video', 'image', 'cover', 'listening_link')),
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 160),
  reference text NOT NULL CHECK (char_length(reference) BETWEEN 1 AND 2000),
  state text NOT NULL CHECK (state IN ('proposed', 'provided')),
  start_seconds double precision,
  end_seconds double precision,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (draft_id, kind, label),
  CHECK ((start_seconds IS NULL AND end_seconds IS NULL) OR
    (kind = 'audio' AND start_seconds IS NOT NULL AND end_seconds IS NOT NULL
      AND start_seconds >= 0 AND end_seconds > start_seconds))
);
