-- Phase 7: five-level ladder and 2,500 Luna maximum liability.
-- Existing sessions keep their stored max_consultations / liability values.
-- New sessions use the new defaults. Level constraints are widened in place.

ALTER TABLE requester_sessions
  ALTER COLUMN max_consultations SET DEFAULT 5,
  ALTER COLUMN max_reward_liability_luna SET DEFAULT 2500,
  ALTER COLUMN reserved_liability_luna SET DEFAULT 2500;

-- Drop the old 1..3 level checks regardless of the auto-generated constraint
-- names used by the earlier migrations.
DO $$
DECLARE
  target record;
BEGIN
  FOR target IN
    SELECT conrelid::regclass AS table_name, conname
      FROM pg_constraint
     WHERE contype = 'c'
       AND conrelid IN (
         'player_runs'::regclass,
         'scenario_decisions'::regclass,
         'consultation_responses'::regclass
       )
       AND pg_get_constraintdef(oid) ILIKE '%level_index%BETWEEN 1 AND 3%'
  LOOP
    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      target.table_name,
      target.conname
    );
  END LOOP;
END $$;

ALTER TABLE player_runs
  DROP CONSTRAINT IF EXISTS player_runs_level_index_check;
ALTER TABLE player_runs
  ADD CONSTRAINT player_runs_level_index_check
  CHECK (level_index BETWEEN 1 AND 5);

ALTER TABLE scenario_decisions
  DROP CONSTRAINT IF EXISTS scenario_decisions_level_index_check;
ALTER TABLE scenario_decisions
  ADD CONSTRAINT scenario_decisions_level_index_check
  CHECK (level_index BETWEEN 1 AND 5);

ALTER TABLE consultation_responses
  DROP CONSTRAINT IF EXISTS consultation_responses_level_index_check;
ALTER TABLE consultation_responses
  ADD CONSTRAINT consultation_responses_level_index_check
  CHECK (level_index BETWEEN 1 AND 5);

ALTER TABLE player_runs
  DROP CONSTRAINT IF EXISTS player_runs_reward_cap_check;

ALTER TABLE player_runs
  ADD CONSTRAINT player_runs_reward_cap_check
  CHECK (reward_earned_luna <= 2500);

ALTER TABLE payouts
  DROP CONSTRAINT IF EXISTS payouts_reward_cap_check;

ALTER TABLE payouts
  ADD CONSTRAINT payouts_reward_cap_check
  CHECK (amount_luna <= 2500);
