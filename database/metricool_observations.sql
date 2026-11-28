-- Preview only. These are caller-supplied observations, not live Metricool state.
CREATE TABLE IF NOT EXISTS public.metricool_observations (
  draft_id uuid PRIMARY KEY REFERENCES public.content_drafts(id) ON DELETE RESTRICT,
  proposal_id uuid NOT NULL,
  metricool_brand_id text NOT NULL CHECK (metricool_brand_id ~ '^[0-9]+$'),
  metricool_uuid text NOT NULL CHECK (metricool_uuid ~ '^-?[0-9]+$'),
  metricool_post_id text NOT NULL CHECK (metricool_post_id ~ '^[0-9]+$'),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok')),
  publication_date timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING', 'PUBLISHING', 'PUBLISHED', 'ERROR', 'AWAITING_CONFIRMATION')),
  auto_publish boolean NOT NULL,
  has_media boolean NOT NULL,
  observed_at timestamptz NOT NULL DEFAULT now(),
  provenance text NOT NULL DEFAULT 'caller_supplied_metricool',
  UNIQUE (metricool_brand_id, metricool_uuid),
  FOREIGN KEY (proposal_id, draft_id) REFERENCES public.social_calendar_proposal_items(proposal_id, draft_id) ON DELETE RESTRICT
);
