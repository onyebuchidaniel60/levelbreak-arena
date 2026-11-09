-- AI-generated level content, keyed by level index.
-- Existing runs default to an empty object and keep using the static fallback.
ALTER TABLE player_runs
  ADD COLUMN IF NOT EXISTS generated_content jsonb NOT NULL DEFAULT '{}'::jsonb;
