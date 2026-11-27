-- Preview-only editorial suggestions. These rows do not schedule publication.
CREATE TABLE IF NOT EXISTS public.social_calendar_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.social_calendar_proposal_items (
  proposal_id uuid NOT NULL REFERENCES public.social_calendar_proposals(id) ON DELETE RESTRICT,
  draft_id uuid NOT NULL REFERENCES public.content_drafts(id) ON DELETE RESTRICT,
  suggested_date date NOT NULL,
  position integer NOT NULL CHECK (position > 0),
  PRIMARY KEY (proposal_id, draft_id),
  UNIQUE (proposal_id, position)
);
