-- Patrick Rick Social Agent / Neon PostgreSQL
-- Run in the selected Neon project's SQL Editor.
-- Server-only database access through DATABASE_URL; no public client keys.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.content_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist text NOT NULL CHECK (artist IN ('patrick_rick', 'chris_rick', 'patrick_meets_rico')),
  platform text NOT NULL CHECK (platform IN ('instagram', 'tiktok', 'youtube')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  era text,
  caption text NOT NULL CHECK (char_length(caption) BETWEEN 1 AND 4000),
  planned_at timestamptz,
  status text NOT NULL DEFAULT 'DRAFT'
    CHECK (status IN ('DRAFT', 'READY_FOR_APPROVAL', 'APPROVED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS content_drafts_created_at_idx
  ON public.content_drafts (created_at DESC);

-- Do not expose this table via public REST or browser-side credentials.
-- Provision an app-specific database role with minimum required permissions
-- before production release. No automated publishing exists in this phase.
