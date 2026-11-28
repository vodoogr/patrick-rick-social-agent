-- Preview-only additive migration. A creative review never publishes a draft.
CREATE TABLE IF NOT EXISTS public.social_draft_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL REFERENCES public.content_drafts(id) ON DELETE RESTRICT,
  decision text NOT NULL CHECK (decision IN ('pending', 'approved', 'changes_requested')),
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS social_draft_reviews_draft_created_idx
  ON public.social_draft_reviews (draft_id, created_at DESC, id DESC);
