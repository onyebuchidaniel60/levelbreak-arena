-- Phase 3: funded-session gate, game idempotency and payout-outbox constraints.

ALTER TABLE requester_sessions
  ADD COLUMN IF NOT EXISTS creation_idempotency_key text;
ALTER TABLE requester_sessions
  ADD COLUMN IF NOT EXISTS funding_transfer_started_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS requester_sessions_creation_idem_idx
  ON requester_sessions (creation_idempotency_key)
  WHERE creation_idempotency_key IS NOT NULL;

ALTER TABLE player_runs
  ADD COLUMN IF NOT EXISTS claim_idempotency_key text;
ALTER TABLE player_runs
  ADD COLUMN IF NOT EXISTS finish_idempotency_key text;

CREATE UNIQUE INDEX IF NOT EXISTS player_runs_claim_idem_idx
  ON player_runs (claim_idempotency_key)
  WHERE claim_idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS player_runs_finish_idem_idx
  ON player_runs (finish_idempotency_key)
  WHERE finish_idempotency_key IS NOT NULL;

ALTER TABLE consultation_responses
  ADD COLUMN IF NOT EXISTS level_index smallint NOT NULL DEFAULT 1
  CHECK (level_index BETWEEN 1 AND 3);

CREATE UNIQUE INDEX IF NOT EXISTS consultation_responses_run_level_idx
  ON consultation_responses (player_run_id, level_index);

ALTER TABLE consultation_responses
  ADD CONSTRAINT consultation_response_fixed_reward_check
  CHECK (reward_luna IN (0, 500));

ALTER TABLE player_runs
  ADD CONSTRAINT player_runs_reward_cap_check
  CHECK (reward_earned_luna <= 1500);

ALTER TABLE payouts
  ADD COLUMN IF NOT EXISTS attempted_at timestamptz;

ALTER TABLE payouts
  ADD CONSTRAINT payouts_reward_cap_check
  CHECK (amount_luna <= 1500);

ALTER TABLE funding_transactions
  ADD CONSTRAINT funding_transactions_reference_format_check
  CHECK (reference LIKE 'LBA1:%');

CREATE INDEX IF NOT EXISTS consultation_responses_run_created_idx
  ON consultation_responses (player_run_id, created_at);

CREATE INDEX IF NOT EXISTS payouts_run_status_idx
  ON payouts (player_run_id, status);
