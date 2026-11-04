# Testing Strategy

## Commands

The implementation agent must add and document working scripts for lint, typecheck, unit tests, integration tests, E2E tests and build. Do not claim a test ran unless its actual output was observed.

```bash
pnpm lint
pnpm typecheck
pnpm test        # Vitest unit tests + Playwright route smoke tests
pnpm build
```

Phase 3 integration/concurrency tests must use a migrated test database:

```bash
pnpm db:migrate
LBA_INTEGRATION_DATABASE_URL="$DATABASE_URL" pnpm test:integration
```

GitHub Actions runs the same suite in the `integration` job against an
ephemeral `postgres:16` service container. The workflow provides
`DATABASE_URL_UNPOOLED`; the Vitest setup uses it only when `CI=true`, so local
unit/E2E runs never touch a database. The production Neon database is never
used by CI.

The testnet proof reader independently checks a transaction hash:

```bash
EXPECTED_REFERENCE="LBA1:<publicRef>" \
  pnpm --filter @levelbreak-arena/api verify:tx -- <txHash>
```

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

## Phase 3 executed coverage

- Requester-session, player-run, consultation and payout state-machine guards.
- All six signed scenario branches and the fixed virtual-portfolio arithmetic.
- Three bundled consultations: one per level, evidence before question,
  `Can't tell` allowed, fixed 500-Luna reward, no hidden correct answer.
- Incoming funding validation for inclusion, network, sender, recipient,
  amount and `LBA1:` reference.
- Two simultaneous claims: exactly one succeeds.
- Two simultaneous answers: exactly one response and one reward ledger row.
- Two simultaneous finishes: exactly one payout row.
- Ledger arithmetic: 3 answers = 1,500 Luna; 1 skip + 2 answers = 1,000 Luna;
  0 answers = zero payout and a 1,500-Luna unused-credit entry.
- Payout worker with a mocked adapter, while `PAYOUT_WORKER_ENABLED=false`.

## Phase 4 deployed frontend E2E

The deployed journey uses real Ed25519 authentication with a generated test key
and the real Nimiq testnet backend. It is intentionally opt-in because it claims
the single funded demo session once:

```bash
PHASE4_E2E_BASE_URL=https://levelbreak-arena.vercel.app \
PHASE4_EXPECTED_PUBLIC_REF=fa4f30a2d178b6da \
  pnpm exec playwright test -c tests/e2e/playwright.deployed.config.ts
```

The test covers unauthenticated provider messaging, real nonce → signature →
verify, lobby claim, all three levels, answer/skip, refresh/resume, finish,
payout status, history and responsive overflow checks. Do not run it twice
against the same funded session.

## Phase 5 payout worker integration coverage

`apps/api/src/services/phase3.integration.test.ts` now also covers the Phase 5
payout-worker safety cases. The CI `integration` job runs the same file against
an ephemeral `postgres:16` service container:

```bash
LBA_INTEGRATION_DATABASE_URL="postgres://..." pnpm test:integration
```

Covered cases (16 total integration tests):

- `QUEUED -> BUILDING -> SUBMITTED -> CONFIRMED`, one transaction hash and one
  `PAYOUT_CONFIRMED` ledger entry.
- Broadcast response lost after signing: payout stays `SUBMITTED` with the
  persisted hash; a restarted worker reconciles the existing transaction and
  does not broadcast again.
- Chain status unavailable: payout stays `SUBMITTED`, `CHAIN_UNAVAILABLE` is
  recorded, and it is never falsely `CONFIRMED`.
- Insufficient treasury balance: payout stays `QUEUED` with
  `TREASURY_INSUFFICIENT_BALANCE`, and the 60-second claim backoff applies.
- Two concurrent worker calls: the advisory lock lets exactly one broadcast;
  the other exits with `TREASURY_WORKER_BUSY`.
- Operator reconcile of a `SUBMITTED` payout: confirms from chain details
  without a new transfer.
- Zero-reward run: `COMPLETED_NO_REWARD`, no payout row.
- Repeated finish: same payoutId, no second payout row.

## Phase 5 deployed play-through E2E

The Phase 5 test is opt-in because it claims one funded session and moves real
testnet NIM. Do not run it twice against the same session.

```bash
PHASE5_E2E_BASE_URL=https://levelbreak-arena.vercel.app \
PHASE5_SESSION_REF=<publicRef> \
PHASE5_EXPECTED_LUNA=1000 \
PHASE5_PATTERN=ANSWER,SKIP,ANSWER \
PHASE5_LABEL=a \
  pnpm exec playwright test -c tests/e2e/playwright.phase5.config.ts
```

It performs real Ed25519 auth in two browser contexts, races both claims on the
same session (one 200, one 409), plays the three levels, replays the same
answer and finish idempotency keys, polls the payout endpoint until `CONFIRMED`
or five minutes, verifies the transaction through a testnet Web Client, and
checks the UI, history and explorer link.

Phase 5 executed results:

- Play-through A (`0f566d594fc30388`, 1,000 Luna): payout `dcab12c0`, tx
  `139bfc81…`, block `15838771`, confirmed.
- Play-through B (`685638bc542dad71`, 1,500 Luna): payout `5975746e`, tx
  `b693acd3…`, block `15839460`, confirmed.
- 16/16 integration tests passed against a fresh local Postgres 16 database.

The Vercel Security Checkpoint can return HTML for a burst of API requests; the
test treats a non-JSON response as retryable and keeps polling. Level 2's RISKY
answer label is “Impermanent loss”, not “Risky”.

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
