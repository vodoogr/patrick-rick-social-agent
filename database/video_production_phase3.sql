-- Apply only to the isolated Phase 3 test branch after review.
CREATE TABLE IF NOT EXISTS public.video_production_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist text NOT NULL,
  song text NOT NULL,
  version text NOT NULL,
  title text NOT NULL,
  shots jsonb NOT NULL CHECK (jsonb_typeof(shots) = 'array'),
  assets jsonb NOT NULL CHECK (jsonb_typeof(assets) = 'array'),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status = 'DRAFT'),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS video_production_drafts_created_at_idx
  ON public.video_production_drafts (created_at DESC);

