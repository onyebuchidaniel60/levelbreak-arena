# Testing Strategy

## Commands

The implementation agent must add and document working scripts for lint, typecheck, unit tests, integration tests, E2E tests and build. Do not claim a test ran unless its actual output was observed.

## Unit tests

- Challenge creation/expiry/single-use/signature verification helpers.
- Every scenario decision branch and portfolio invariant.
- Three-answer reward calculation, skip=0 and 1,500-Luna cap.
- State transition guard and expected version checks.
- Idempotency key/unique record behavior.
- NIM/Luna display conversion (financial calculations remain integer Luna).

## Integration tests

- Migrations and DB unique/check constraints.
- Simultaneous session claims: exactly one succeeds.
- Simultaneous answer submits: at most one response/reward.
- Duplicate funding transaction hash: cannot fund two sessions.
- Funding validation for wrong network/sender/recipient/value/reference and missing inclusion.
- Outbox/payout state transitions and reconciliation with a mocked chain adapter.
- Player ownership checks and auth session revocation.

## Testnet proof (must be executed, not inferred)

- Testnet-only demo-agent to treasury funding transfer.
- Session does not become available until the funding transaction is verified.
- Player signs an authentication challenge in the actual Nimiq Pay environment.
- Player completes one run; treasury pays the exact amount from persisted answer records.
- Verify sender, recipient, value, network and chain inclusion independently.
- Worker restart/timeout does not duplicate payout.
- Insufficient treasury balance or chain outage leaves payout pending/failed safely.

## E2E tests

- Landing -> wallet auth -> available funded session -> claim -> three decisions -> consultations -> finish -> payout status -> history.
- Mix of answer and skip; correct reward total.
- Refresh halfway and resume same run.
- No funded session state blocks start.
- Double-click/duplicate requests do not duplicate decision, answer, reward or payout.
- One player cannot access another player's history by modifying IDs.
- Check 320, 375, 768, 1024 and 1440px layouts.
- Verify all nav/footer/Docs/GitHub links on the deployed preview.
- Verify error, loading, empty, denial, pending, confirmed, failed, 404 states.

## Security tests

Replay signed challenge; forge/wrong address; cross-player IDOR; modify reward amount; send duplicate funding hash; use transaction for wrong session; concurrent claim/answer/payout; CSRF; rate-limit routes; inspect logs for secrets; try mainnet configuration in preview.

## Design gate

Do not begin final visual design until all critical funded-session-to-payout E2E checks have passed on preview and evidence is recorded. Design/visual regression tests occur after the operator approves mockups.
