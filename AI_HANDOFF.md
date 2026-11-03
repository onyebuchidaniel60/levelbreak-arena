# AI_HANDOFF.md — LevelBreak Arena

**Last updated:** 3 November 2026
**Current phase:** Phase 3 complete — core domain, funded-session gate and APIs
**Status:** Phase 3 PASS; Phase 4 NOT STARTED.

## Current deployment and wallets

- Vercel preview URL: https://levelbreak-arena.vercel.app
- Vercel deployed commit: 612809c8fca37fa6deaac31dd2ec79634c13d87e (Phase 1; unchanged in Phase 3)
- Render API URL: https://levelbreak-arena.onrender.com
- Render deployed code commit: 92e0eacc3c37e23c1b3e3c41d4a704442c921fc5 (Phase 3)
- Render deployment ID: `dep-dbkmps8ae00c73fnjqk0`
- Repository URL: https://github.com/onyebuchidaniel60/levelbreak-arena
- Render service: `levelbreak-arena`; `/health/ready` verified 200 after the Phase 3 deploy.
- Demo-agent wallet: `NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T`
- Treasury wallet: `NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3`
- `NIMIQ_NETWORK`: `"testnet"`
- Phase 2 transfer proof: `899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e`
- Phase 3 funded-session proof: `82c8c1f977fa2a743059a494efc1d1a962944fc090f6d1e18fcce7569854d55e`
- Phase 3 proof session: `d242581a-2590-4ac0-944a-6b41fc626f80`, public ref `fa4f30a2d178b6da`
- Testnet payout: **NOT YET RUN**
- `NIMIQ_EXPLORER_BASE_URL`: **still unset** — must be supplied before Phase 4; no explorer URL was guessed.
- Design references: not collected
- Mockups: not created
- Operator approval of final visual design: **NOT GIVEN**
- Feature flags on Render: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`

## Phase 3 checkpoint

```text
Project: LevelBreak Arena
Current phase: Phase 3 complete — core domain, funded-session gate and APIs
Status: PASS
Preview URL: https://levelbreak-arena.vercel.app (unchanged Phase 1 shell; Phase 3 did not wire the frontend)
Deployed commit SHA: 92e0eacc3c37e23c1b3e3c41d4a704442c921fc5 (Render API code deploy, verified live); this docs checkpoint is the new commit containing this file
What changed:
  - Added migration 002_phase3_domain.sql: creation/funding idempotency fields, claim/finish idempotency keys, per-level consultation responses with a unique (run, level) guard, fixed 500-Luna reward constraint, 1,500-Luna run/payout caps, attempted_at for payouts, LBA1 reference format constraint.
  - Added domain state machines for requester sessions, player runs, consultations and payouts; all transitions are checked in domain services inside DB transactions.
  - Added server-owned static scenarios for all three levels with six tested decision branches and integer virtual-portfolio arithmetic.
  - Added three static consultation questions (one per level), evidence ordered before the question, SAFE/RISKY/CANT_TELL options and the fixed 500-Luna reward. No hidden correct-answer field.
  - Added the scripted demo-agent funding service: AWAITING_FUNDING -> FUNDING_PENDING -> verified on-chain -> FUNDED -> AVAILABLE, with unique LBA1 reference and unique funding tx hash.
  - Added idempotent player APIs: available sessions, claim, run detail, decision, consultation answer/skip, finish, payout status and history.
  - Added the payout outbox with one serialized advisory-lock worker. It is disabled by default and was tested with a mocked Nimiq adapter; it did not send any treasury transfer.
  - Added protected operator endpoints for demo sessions, session inspection, payout inspection, read-only reconciliation, failed-payout requeue and audit events. OPERATOR_AUTH_SECRET is configured in Render; values are not recorded.
  - Added unit, funding-validation and DB integration/concurrency tests; no frontend wiring was added.
What works on the deployed preview:
  - GET /health/live -> 200; GET /health/ready -> 200 after the Phase 3 deploy.
  - Operator authentication works: GET /api/operator/sessions without a secret -> 403; with the secret -> 200 with the funded Phase 3 session.
  - The Phase 3 funded session is AVAILABLE and its funding row is VERIFIED.
  - GET /api/operator/payouts -> 200 with zero payouts (no payout was attempted).
  - POST /api/operator/demo-sessions on Render -> 403 DEMO_FUNDING_DISABLED (fail-closed), confirming no funding is enabled in the deployed service.
  - Player endpoints reject unauthenticated reads: GET /api/sessions/available -> 401.
  - The frontend remains the Phase 1 shell. No UI claims funding, payout or payment success.
What is intentionally incomplete:
  - Frontend-to-API integration, wallet signing in the browser, consultation evidence renderers, game UI, payout polling UI and history UI are Phase 4.
  - No real treasury payout was attempted. The payout worker path is tested only with a mocked adapter in Phase 3.
  - NIMIQ_EXPLORER_BASE_URL is unset, so no explorer link is fabricated.
  - Final visual design, mockups, docs/footer links and release polish are later phases.
Tests run and actual results:
  Full suite (no integration DB opt-in):
    $ pnpm lint -> passed
    $ pnpm typecheck -> apps/api, apps/web, packages/contracts passed
    $ pnpm test -> 30 unit tests passed; 8 DB integration tests skipped; 18 Playwright route tests passed
    $ pnpm build -> apps/api and apps/web built successfully

  Phase 3 DB integration run (LBA_INTEGRATION_DATABASE_URL set):
    $ pnpm exec vitest run apps/api/src/services/phase3.integration.test.ts --reporter=verbose
    ✓ does not make a session available when chain verification fails
    ✓ refuses to fund a second session with the same transaction hash
    ✓ lets exactly one of two simultaneous claims win
    ✓ returns the same run for a repeated claim idempotency key
    ✓ allows only one row and one reward for two simultaneous answers
    ✓ creates exactly one payout for two simultaneous finishes
    ✓ computes the three required ledger cases
    ✓ confirms a payout through the disabled-by-default worker with a mocked adapter
    Test Files 1 passed; Tests 8 passed.

  Concurrency evidence:
    - Two simultaneous claims: exactly one fulfilled; the other returned AppError status 409 SESSION_UNAVAILABLE; player_runs count for the session = 1.
    - Two simultaneous answers with different idempotency keys: exactly one response row and one REWARD_RESERVED ledger row (500 Luna); the other returned 409 QUESTION_ALREADY_RESOLVED.
    - Two simultaneous finishes: both returned the same payoutId; payouts count for the run = 1; amount = 1,500 Luna.
  Ledger arithmetic evidence:
    - 3 answers: earned 1,500 Luna, REWARD_RESERVED total 1,500, one payout row for 1,500.
    - 1 skip + 2 answers: earned 1,000 Luna, REWARD_RESERVED total 1,000, one payout row for 1,000.
    - 0 answers: earned 0, no payout row, UNUSED_CREDIT 1,500 Luna, run COMPLETED_NO_REWARD and session SETTLED.

  Migration:
    $ pnpm db:migrate
    Applied 002_phase3_domain.sql
    Applied migrations: 001_initial_schema.sql, 002_phase3_domain.sql
Payment evidence (if applicable, testnet/mainnet stated clearly):
  TESTNET ONLY — real funded-session proof, one POST /api/operator/demo-sessions from a controlled local process using the same testnet keys; Render funding remained disabled.
  txHash: 82c8c1f977fa2a743059a494efc1d1a962944fc090f6d1e18fcce7569854d55e
  networkId: 5 (testalbatross)
  sender: NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T (demo-agent)
  recipient: NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3 (treasury)
  valueLuna: 1500
  feeLuna: 0
  blockHeight: 15766696
  state: confirmed
  reference: LBA1:fa4f30a2d178b6da
  session: d242581a-2590-4ac0-944a-6b41fc626f80; state AVAILABLE; funding status VERIFIED; ledger FUNDING_CONFIRMED 1,500 Luna.
  Independent read-only verification: apps/api/src/scripts/verify-transaction.ts checks networkId 5, sender, recipient, value, reference and inclusion; proof=PASS.
  No payout transaction was created.
Known issues/blockers:
  - Local verification ran on Node v26.13.0 while the repository pins Node 24.22.1; pnpm printed an engine warning only. Render builds on the pinned Node 24 service.
  - The payout worker has not been run with a real treasury key; it is disabled in Render and was tested only with a mocked adapter. Do not describe any payout as paid.
  - NIMIQ_EXPLORER_BASE_URL remains unset, so payout explorer links stay null.
  - @nimiq/core continues to emit benign IndexedDB/WASM listener warnings; consensus and transfer proof still succeed.
  - Vercel still serves the Phase 1 shell at 612809c8fca37fa6deaac31dd2ec79634c13d87e because Phase 3 was backend-only.
Design references/mockups status: none yet — Phase 6.
Operator visual approval status: NOT GIVEN — Phase 6 hard gate.
Documentation/footer-link status: docs/ present and updated for Phase 3; footer Docs and GitHub links remain Phase 8.
Security/configuration notes:
  - No private keys, mnemonics, DB URLs or operator-secret values are in the repository or this checkpoint.
  - DEMO_FUNDING_ENABLED=false and PAYOUT_WORKER_ENABLED=false on Render; demo funding returned 403 on the deployed service.
  - All amounts remain integer Luna in DB and decimal strings in JSON. Rewards are recomputed from persisted consultation_responses rows; no client reward, recipient or owner ID is accepted.
  - One funding tx per session, one run per session, one response per (run, question/level), one payout per run, and unique idempotency keys are enforced by DB constraints and service logic.
  - Player mutations require the authenticated session plus CSRF; operator routes require a server-only x-operator-secret header and are audited.
  - No HTLC, mainnet send path, live LLM, evidence fetching or real DeFi execution was added.
Git commit:
  92e0eacc3c37e23c1b3e3c41d4a704442c921fc5 — feat: add funded-session gate and core game domain APIs
  This docs checkpoint is the second commit containing this file.
Single next task: Await operator acceptance of Phase 3. Do not start Phase 4 or wire the frontend until the operator gives the Phase 4 prompt.
STOPPED awaiting operator approval: yes
```

## Phase 2 — accepted

- Operator accepted Phase 2 on 3 November 2026 and independently verified transfer `899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e` through RPC/explorer: sender, recipient, value, network ID 5, inclusion, and the `LBA1` reference matched.
- On-chain reference re-confirmed: `recipientData` hex `4c4241313a31626661376632343733646437666239` decodes exactly to `LBA1:1bfa7f2473dd7fb9`; block `15762500`, network ID `5`, 1,500 Luna, confirmed.
- Seed configuration is recorded in `ARCHITECTURE.md` §15: `/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss`, `onlySecureWsConnections=true`, `desiredPeerCount=3`, TestAlbatross network ID 5.
- Seed config is env-driven (`NIMIQ_SEED_NODES` with the verified default); the adapter no longer hard-codes the seed.
- `NIMIQ_EXPLORER_BASE_URL` remains unset. It **must be set before Phase 4** using `[operator to supply verified testnet explorer URL]`; no explorer URL is guessed.

## Phase 2 checkpoint (historical)

```text
Project: LevelBreak Arena
Current phase: Phase 2 complete — backend/data/auth foundation + testnet transfer proof
Status: PASS
Preview URL: https://levelbreak-arena.vercel.app
Deployed commit SHA: fc9dba6c83f1e2e8dc768bf65d56131691acb4d0 (Render API after seed-config cleanup); Vercel remains 612809c8fca37fa6deaac31dd2ec79634c13d87e
What changed: Fastify backend foundation, health/readiness, auth nonce/verify/logout with real Ed25519 verification, initial Postgres schema, NimiqService Web Client adapter, guarded TESTNET_PROOF transfer proof, pinned @nimiq/core 2.23.0.
What works on the deployed preview: Phase 1 routes; Render API /health/live 200, /health/ready 200, /api/config/public correct; real signed auth succeeds; no Phase 3 game/session APIs.
What is intentionally incomplete: Phase 3, frontend API integration, payout worker, operator UI, final design, footer links.
Tests run and actual results: 2 unit tests passed; 18 Playwright route tests passed; local and Render testnet transfer proofs passed; negative auth cases passed; migration created 11 tables with RLS.
Payment evidence: TESTNET ONLY — 899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e, demo-agent to treasury, 1,500 Luna, block 15762500, reference LBA1:1bfa7f2473dd7fb9, confirmed. No payout.
Known issues/blockers: benign @nimiq/core warnings; Vercel edge automation issue; NIMIQ_EXPLORER_BASE_URL unset; payout and Nimiq Pay in-WebView auth unverified.
Design references/mockups status: none yet — Phase 6.
Operator visual approval status: NOT GIVEN — Phase 6 gate.
Documentation/footer-link status: docs/ present; footer links deferred to Phase 8.
Security/configuration notes: no private keys in repo; public addresses/proof only; wallet keys and AUTH_SESSION_SECRET server-only; RLS enabled on all 11 tables; CORS bound to APP_ORIGIN; one-time hashed nonces, Ed25519 verification, hash-only session tokens, HttpOnly/Secure/SameSite cookies, CSRF.
Git commit: 92cb7fddb0be07ca03d47c0584557b1db43e152e (Phase 2 code); fc9dba6c83f1e2e8dc768bf65d56131691acb4d0 (seed cleanup); docs checkpoint commit.
Single next task: Phase 3 prompt (now completed).
STOPPED awaiting operator approval: yes
```

## Task 0 winning configuration

- Seed list: `["/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss"]`
- `onlySecureWsConnections: true`
- `desiredPeerCount: 3`
- Network: `TestAlbatross`, network ID `5`
- Local: 3 peers, consensus, 10.5s
- Render: 3 peers, consensus, 17.4s
- The default client seed set and `seed.nimiqchina.com` did not connect; `onlySecureWsConnections(false)` with default seeds also failed.

## Current product decisions

- Product: LevelBreak Arena, a three-level consequence-driven DeFi learning game.
- Category: Earn for Nimiq Mini Apps Competition Cycle III.
- Core flow: player authenticates with Nimiq Pay wallet -> starts a funded session -> makes three simulated decisions -> answers or skips one consultation per level -> backend calculates rewards -> treasury pays NIM -> chain verifies payout.
- Requester: scripted demo agent in MVP, not a live LLM and not an independent external agent.
- Funding: the scripted demo requester uses a separate operator-controlled testnet wallet to send an ordinary NIM transfer to the treasury. A session stays unavailable until its incoming transfer has been verified on-chain.
- Payout: ordinary NIM transfer from operator-controlled treasury to player's verified wallet address. **No HTLC in the MVP.** The funds are treasury-custodied; database reservations do not lock them on-chain.
- Reward: 500 Luna (0.005 NIM) per accepted response; skip earns zero; one consultation per each of three levels; max per session 1,500 Luna (0.015 NIM).
- Scenario content and evidence are static/bundled; no live market data and no real trades.
- Stack: React + TypeScript + Vite; Node 24 + TypeScript + Fastify; PostgreSQL; `@nimiq/mini-app-sdk` for player wallet identity/signature; `@nimiq/core` for server-side ordinary transfers; Vercel frontend; Render persistent API/worker.
- PostgreSQL is deployed on Neon per operator preparation; the application uses the DATABASE_URL/DATABASE_URL_UNPOOLED configuration defined by the architecture. This is the operator-approved database hosting deviation from the blueprint's Supabase hosting; the Postgres schema and connection contract are unchanged.
- Node 24.22.1 and pnpm 10.34.5 are pinned in the repository.

## Critical blockers / risks

1. The payout worker and treasury payout verification have not been run against a real treasury transfer. Do not claim payment completion.
2. Nimiq Pay in-WebView wallet signature authentication still needs end-to-end frontend verification in Phase 4.
3. `NIMIQ_EXPLORER_BASE_URL` must be supplied before Phase 4; no URL is guessed.
4. The Web Client requires the explicit TestAlbatross seed; do not revert to the client default seed list.
5. No mainnet send path is allowed during preview/development. Any mainnet launch requires separate explicit operator authorization and a security/treasury review.

## Current task for coding agent

**STOP.** Phase 3 is complete and awaiting operator acceptance. Do not start Phase 4, wire the frontend, enable the payout worker, or enable demo funding on Render.

## Checkpoint requirements

At the end of each accepted phase, update this file with the exact preview URL, deployed commit SHA, changed behavior, incomplete areas, tests run and results, transaction evidence if relevant, known issues, design reference/mockup/approval status, documentation/footer-link status, and the single next task. Do not claim deployment, tests or payments without evidence.
