-- Phase 10: external agents, deposits, and agent-authored consultations.
-- Agents are balance-backed requesters. Their balance is credited by verified
-- testnet deposits and reserved per posted consultation.

CREATE TABLE IF NOT EXISTS agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 80),
  wallet_address text NOT NULL UNIQUE,
  api_key_hash text NOT NULL UNIQUE,
  balance_luna bigint NOT NULL DEFAULT 0 CHECK (balance_luna >= 0),
  reserved_luna bigint NOT NULL DEFAULT 0 CHECK (reserved_luna >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agents_reserved_within_balance_check
    CHECK (reserved_luna <= balance_luna)
);

CREATE INDEX IF NOT EXISTS agents_created_idx ON agents (created_at DESC);

CREATE TABLE IF NOT EXISTS agent_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  tx_hash text NOT NULL UNIQUE,
  amount_luna bigint NOT NULL CHECK (amount_luna > 0),
  block_height bigint,
  network_id text NOT NULL CHECK (network_id = 'testnet'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_deposits_agent_idx
  ON agent_deposits (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS agent_consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  requester_session_id uuid NOT NULL UNIQUE REFERENCES requester_sessions(id) ON DELETE CASCADE,
  question text NOT NULL CHECK (char_length(question) BETWEEN 10 AND 500),
  context text NOT NULL CHECK (char_length(context) BETWEEN 10 AND 2000),
  reward_luna bigint NOT NULL DEFAULT 500 CHECK (reward_luna = 500),
  status text NOT NULL DEFAULT 'AVAILABLE'
    CHECK (status IN ('AVAILABLE', 'IN_PROGRESS', 'ANSWERED', 'SKIPPED', 'EXPIRED')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agent_consultations_agent_idx
  ON agent_consultations (agent_id, created_at DESC);
CREATE INDEX IF NOT EXISTS agent_consultations_status_idx
  ON agent_consultations (status, created_at ASC);

ALTER TABLE requester_sessions
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES agents(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS requester_sessions_agent_idx
  ON requester_sessions (agent_id, state, created_at DESC);

-- Widen the requester type check for externally funded agent sessions.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT conname
      FROM pg_constraint
     WHERE contype = 'c'
       AND conrelid = 'requester_sessions'::regclass
       AND pg_get_constraintdef(oid) ILIKE '%requester_type%'
  LOOP
    EXECUTE format('ALTER TABLE requester_sessions DROP CONSTRAINT %I', target.conname);
  END LOOP;
END $$;

ALTER TABLE requester_sessions
  ADD CONSTRAINT requester_sessions_requester_type_check
  CHECK (requester_type IN ('SCRIPTED_DEMO', 'EXTERNAL_AGENT'));

-- Widen the audit actor check for agent-originated actions.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT conname
      FROM pg_constraint
     WHERE contype = 'c'
       AND conrelid = 'audit_events'::regclass
       AND pg_get_constraintdef(oid) ILIKE '%actor_type%'
  LOOP
    EXECUTE format('ALTER TABLE audit_events DROP CONSTRAINT %I', target.conname);
  END LOOP;
END $$;

ALTER TABLE audit_events
  ADD CONSTRAINT audit_events_actor_type_check
  CHECK (actor_type IN ('PLAYER', 'OPERATOR', 'SYSTEM', 'DEMO_AGENT', 'AGENT'));

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_consultations ENABLE ROW LEVEL SECURITY;
