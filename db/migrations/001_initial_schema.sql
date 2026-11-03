CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nimiq_address text NOT NULL UNIQUE,
  public_key_hex text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  last_authenticated_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_nonces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nimiq_address text NOT NULL,
  nonce_hash text NOT NULL UNIQUE,
  challenge text NOT NULL,
  challenge_origin text NOT NULL,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_nonces_address_expiry_idx
  ON auth_nonces (nimiq_address, expires_at);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id),
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS auth_sessions_player_idx ON auth_sessions (player_id, expires_at);

CREATE TABLE IF NOT EXISTS requester_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  public_ref text NOT NULL UNIQUE,
  requester_type text NOT NULL CHECK (requester_type IN ('SCRIPTED_DEMO')),
  state text NOT NULL CHECK (
    state IN (
      'DRAFT', 'AWAITING_FUNDING', 'FUNDING_PENDING', 'FUNDED', 'AVAILABLE',
      'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'SETTLED', 'FUNDING_FAILED',
      'CANCELLED', 'PAYOUT_PENDING', 'PAYOUT_FAILED', 'EXPIRED'
    )
  ),
  network_id text NOT NULL CHECK (network_id = 'testnet'),
  treasury_address text NOT NULL,
  expected_funding_luna bigint NOT NULL CHECK (expected_funding_luna > 0),
  reward_per_answer_luna bigint NOT NULL DEFAULT 500 CHECK (reward_per_answer_luna > 0),
  max_consultations smallint NOT NULL DEFAULT 3 CHECK (max_consultations > 0),
  max_reward_liability_luna bigint NOT NULL DEFAULT 1500 CHECK (max_reward_liability_luna > 0),
  reserved_liability_luna bigint NOT NULL DEFAULT 1500 CHECK (reserved_liability_luna >= 0),
  unused_credit_luna bigint NOT NULL DEFAULT 0 CHECK (unused_credit_luna >= 0),
  funding_deadline timestamptz NOT NULL,
  claimed_by_player_run_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT requester_session_liability_check
    CHECK (max_reward_liability_luna = reward_per_answer_luna * max_consultations),
  CONSTRAINT requester_session_reserved_check
    CHECK (reserved_liability_luna <= max_reward_liability_luna)
);

CREATE TABLE IF NOT EXISTS funding_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_session_id uuid NOT NULL UNIQUE REFERENCES requester_sessions(id),
  tx_hash text NOT NULL UNIQUE,
  sender_address text NOT NULL,
  recipient_address text NOT NULL,
  amount_luna bigint NOT NULL CHECK (amount_luna > 0),
  network_id text NOT NULL CHECK (network_id = 'testnet'),
  reference text NOT NULL,
  status text NOT NULL CHECK (status IN ('PENDING', 'INCLUDED', 'VERIFIED', 'REJECTED', 'REORGED')),
  block_height bigint,
  included_at timestamptz,
  verified_at timestamptz,
  verification_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS funding_transactions_status_updated_idx
  ON funding_transactions (status, updated_at);

CREATE TABLE IF NOT EXISTS player_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_session_id uuid NOT NULL UNIQUE REFERENCES requester_sessions(id),
  player_id uuid NOT NULL REFERENCES players(id),
  state text NOT NULL CHECK (
    state IN (
      'NOT_STARTED', 'IN_PROGRESS', 'CONSULTATION_PENDING', 'COMPLETED',
      'PAYOUT_QUEUED', 'PAYOUT_SUBMITTED', 'PAYOUT_CONFIRMED',
      'COMPLETED_NO_REWARD'
    )
  ),
  level_index smallint NOT NULL DEFAULT 1 CHECK (level_index BETWEEN 1 AND 3),
  portfolio_state jsonb NOT NULL DEFAULT '{}'::jsonb,
  state_version integer NOT NULL DEFAULT 0 CHECK (state_version >= 0),
  reward_earned_luna bigint NOT NULL DEFAULT 0 CHECK (reward_earned_luna >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS player_runs_player_state_idx ON player_runs (player_id, state);
CREATE INDEX IF NOT EXISTS player_runs_state_updated_idx ON player_runs (state, updated_at);
CREATE UNIQUE INDEX IF NOT EXISTS player_runs_one_active_per_player_idx
  ON player_runs (player_id)
  WHERE state IN ('IN_PROGRESS', 'CONSULTATION_PENDING');

CREATE TABLE IF NOT EXISTS scenario_decisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_run_id uuid NOT NULL REFERENCES player_runs(id),
  level_index smallint NOT NULL CHECK (level_index BETWEEN 1 AND 3),
  decision_key text NOT NULL,
  result jsonb NOT NULL,
  idempotency_key text NOT NULL,
  state_version_before integer NOT NULL CHECK (state_version_before >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_run_id, level_index),
  UNIQUE (player_run_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS consultation_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_run_id uuid NOT NULL REFERENCES player_runs(id),
  question_id text NOT NULL,
  evidence_version text NOT NULL,
  response_key text,
  result text NOT NULL CHECK (result IN ('ANSWERED', 'SKIPPED')),
  reward_luna bigint NOT NULL DEFAULT 0 CHECK (reward_luna >= 0),
  idempotency_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (player_run_id, question_id),
  UNIQUE (player_run_id, idempotency_key),
  CONSTRAINT consultation_response_result_check
    CHECK (
      (result = 'SKIPPED' AND reward_luna = 0)
      OR (result = 'ANSWERED' AND reward_luna > 0)
    )
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_session_id uuid REFERENCES requester_sessions(id),
  player_run_id uuid REFERENCES player_runs(id),
  entry_type text NOT NULL CHECK (
    entry_type IN (
      'FUNDING_CONFIRMED', 'REWARD_RESERVED', 'PAYOUT_QUEUED',
      'PAYOUT_CONFIRMED', 'UNUSED_CREDIT', 'REFUND_SENT', 'MANUAL_ADJUSTMENT'
    )
  ),
  amount_luna bigint NOT NULL CHECK (amount_luna > 0),
  direction text NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  idempotency_key text NOT NULL UNIQUE,
  external_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ledger_entries_session_idx ON ledger_entries (requester_session_id, created_at);
CREATE INDEX IF NOT EXISTS ledger_entries_run_idx ON ledger_entries (player_run_id, created_at);

CREATE TABLE IF NOT EXISTS payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_run_id uuid NOT NULL UNIQUE REFERENCES player_runs(id),
  player_id uuid NOT NULL REFERENCES players(id),
  recipient_address text NOT NULL,
  amount_luna bigint NOT NULL CHECK (amount_luna > 0),
  network_id text NOT NULL CHECK (network_id = 'testnet'),
  status text NOT NULL CHECK (
    status IN ('QUEUED', 'BUILDING', 'SUBMITTED', 'CONFIRMED', 'FAILED', 'RECONCILING', 'CANCELLED')
  ),
  idempotency_key text NOT NULL UNIQUE,
  tx_hash text UNIQUE,
  failure_code text,
  failure_message_safe text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  submitted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_status_updated_idx ON payouts (status, updated_at);
CREATE INDEX IF NOT EXISTS payouts_player_created_idx ON payouts (player_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_type text NOT NULL CHECK (actor_type IN ('PLAYER', 'OPERATOR', 'SYSTEM', 'DEMO_AGENT')),
  actor_id text,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text NOT NULL,
  request_id text,
  ip_hash text,
  details_redacted jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_events_resource_idx ON audit_events (resource_type, resource_id, created_at DESC);

ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_nonces ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE requester_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenario_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
