# AI_HANDOFF.md — LevelBreak Arena

**Last updated:** 3 November 2026
**Current phase:** Phase 4 complete — functional frontend integrated
**Status:** Phase 4 PASS; awaiting operator acceptance before Phase 5.

## Current deployment and wallets

- Vercel preview URL: https://levelbreak-arena.vercel.app
- Vercel deployed code commit: `7ad825690c6cb55798d8036631bcce7dd01286e4` (Phase 4 frontend + run-detail fix); final `9764b770bf65f4b143299f981f0b51d4541d42a5` is a script-only CI ordering fix with identical app code
- Render API URL: https://levelbreak-arena.onrender.com
- Render deployed code commit: `9764b770bf65f4b143299f981f0b51d4541d42a5`; backend includes the `7ad8256` scenario serialization fix
- Repository URL: https://github.com/onyebuchidaniel60/levelbreak-arena
- Render service: `levelbreak-arena`; `/health/live` and `/health/ready` verified 200 after the Phase 4 deploy.
- Demo-agent wallet: `NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T`
- Treasury wallet: `NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3`
- `NIMIQ_NETWORK`: `"testnet"`
- Phase 2 transfer proof: `899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e`
- Phase 3 funded-session proof: `82c8c1f977fa2a743059a494efc1d1a962944fc090f6d1e18fcce7569854d55e`
- Phase 3 proof session: `d242581a-2590-4ac0-944a-6b41fc626f80`, public ref `fa4f30a2d178b6da`
- Phase 4 E2E run: `087f39ee-6bcc-492b-a062-ebc04ea14a4c`; session now `PAYOUT_PENDING`, run `PAYOUT_QUEUED`, payout `b00c882f-72e1-4fb1-acc1-0cde06dcaedf` for `1000` Luna (`QUEUED`)
- Testnet payout: **NOT YET RUN** — payout worker disabled, so the Phase 4 payout remains `QUEUED`
- `NIMIQ_EXPLORER_BASE_URL`: **still unset**; no explorer URL was fabricated. Payout UI shows the tx hash text and "Explorer link not available" when a hash exists without a configured explorer.
- Design references: not collected
- Mockups: not created
- Operator approval of final visual design: **NOT GIVEN**
- Feature flags on Render: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`

## Cross-origin cookie decision (3 November 2026)

- **Problem:** `levelbreak-arena.vercel.app` and `levelbreak-arena.onrender.com` are different registrable domains, so a browser treats API calls as cross-site. A `SameSite=Lax` session cookie is not attached to cross-site `fetch()` requests.
- **Approach:** Vercel rewrite proxy. `apps/web/vercel.json` rewrites `/api/:path*` and `/health/:path*` to Render before the SPA catch-all, so the browser only talks to `https://levelbreak-arena.vercel.app`.
- **Frontend configuration:** `VITE_API_BASE_URL` is set to an empty string in both Vercel Production and Preview. The new `apps/web/src/lib/api.ts` resolves an empty/unset value to relative `/api/...` paths and only prefixes an explicitly configured local base URL.
- **No Render URL in frontend source or bundle:** the only Render URL is the required rewrite destination in `apps/web/vercel.json`; the deployed JS bundle contains no `onrender.com` string.
- **Cookie attributes verified in Chromium/Playwright:**
  - `lba_session=...; Max-Age=604800; Path=/; HttpOnly; Secure; SameSite=Lax`
  - `lba_csrf=...; Max-Age=604800; Path=/; Secure; SameSite=Lax`
  - Both cookies are host-only for `levelbreak-arena.vercel.app`; `SameSite=Lax`, not `None`.
- **Verified flow (real browser, no `context.addCookies()`):** `/api/auth/nonce` 200 → real `/api/auth/verify` 200 with the Set-Cookie headers above → `/api/me` 200 with `Cookie: lba_session=...` → reload → `/api/me` 200 → logout 204 → `/api/me` 401.
- **Verification auth path:** the real `/api/auth/verify` endpoint was used with a throwaway Nimiq key generated in the Playwright runner. No preview-mock-signin endpoint was added, so there is no preview-only auth surface to disable. `PREVIEW_MOCK_AUTH_ENABLED` remains false/unset; production must keep it false.
- **CSRF:** Vercel forwards the browser `Origin` unchanged. `POST /api/auth/nonce` with `Origin: https://levelbreak-arena.vercel.app` returned 200; the same request with `Origin: https://evil.example.com` was rejected by the backend (`ORIGIN_MISMATCH`). The existing API contract returns **400** for this rejection, not 403; this was not changed because an API status change is outside this fix's approved scope.
- **Proxy limits:** no rate-limit, timeout, or response-size errors were observed across the nonce, verify, me, reload, logout and post-logout requests.
- **Scope:** `apps/api/` has no diff for this fix; no API contract, schema, game logic, cookie attribute, CSRF rule or `APP_ORIGIN` was changed.

## Phase 4 checkpoint

```text
Project: LevelBreak Arena
Current phase: Phase 4 complete — functional frontend integrated
Status: PASS
Preview URL: https://levelbreak-arena.vercel.app
Deployed commit SHA: 7ad825690c6cb55798d8036631bcce7dd01286e4 (Phase 4 frontend + run-detail fix, tested by E2E); final 9764b770bf65f4b143299f981f0b51d4541d42a5 is a script-only CI ordering fix with identical app code
What changed:
  - Added @levelbreak-arena/contracts with Zod schemas for every frontend API response.
  - Added a typed relative-path API client with credentials: "include", CSRF header from lba_csrf, typed ApiError/request ID handling and 401 redirect behaviour.
  - Added TanStack Query hooks with cache invalidation, one retry after 2s for 503, and typed mutations.
  - Added Nimiq Pay provider detection and real nonce → sign → verify authentication; provider absence shows "Open this app in Nimiq Pay to connect your wallet."
  - Wired the lobby, claim conflict handling, three-level game, scenario decisions, all four evidence renderers, answer/skip, reward flash, finish, payout status, history and logout.
  - Fixed GET /api/runs/:runId BigInt serialization by returning a safe scenario projection with decisions only ({decisionKey,label}); outcome math remains server-side and is returned by the decision endpoint.
  - Added permanent serialization regression coverage to the Postgres integration suite.
  - Updated support pages and README for the functional Phase 4 testnet preview; styling remains temporary Tailwind.
What works on the deployed preview:
  - / — unauthenticated Nimiq Pay prompt; authenticated wallet summary, play/resume and history links.
  - /play — available funded session listing, no-session empty state, claim; ACTIVE_RUN_EXISTS falls back to GET /api/me.activeRunId per the approved Option A.
  - /play/:runId — authoritative state, portfolio, level progress, scenario decisions, evidence-first consultation, answer/skip, reward message, finish and payout status. 404/401/error/loading states are implemented.
  - /history — completed runs, earned NIM/Luna, payout status and tx hash/explorer handling.
  - /how-it-works, /privacy, /terms, /docs and 404 remain reachable with updated truthful copy.
  - Logout clears local query state and redirects home; CSRF is required and verified.
What is intentionally incomplete:
  - Final visual design (Phase 6/7) — temporary Tailwind defaults only.
  - Nimiq Pay device-level wallet verification (Phase 5). The deployed browser E2E used a generated Ed25519 key because this environment has no Nimiq Pay provider.
  - Real payout confirmation: PAYOUT_WORKER_ENABLED=false, so the Phase 4 payout is QUEUED. Phase 5 owns worker enablement and confirmation.
  - NIMIQ_EXPLORER_BASE_URL is unset, so no explorer links are shown; tx hashes are text with "Explorer link not available" where applicable.
Tests run and actual results:
  $ pnpm lint -> passed
  $ pnpm typecheck -> passed (contracts build + apps/api/apps/web/contracts)
  $ pnpm test -> 35 unit tests passed; 18 Playwright route tests passed; 2 deployed-E2E entries skipped without env
  $ pnpm build -> contracts, apps/api and apps/web built successfully
  $ pnpm exec vitest run apps/api/src/services/phase3.integration.test.ts --reporter=verbose
    9 integration tests passed, including "serializes run detail without BigInt and strips scenario outcomes"
  Local UI E2E against a local API + local Postgres test session: all 10 journey steps passed, including logout and 320–1440px overflow checks.
  Deployed Playwright E2E against https://levelbreak-arena.vercel.app:
    STEP 1 PASS: unauthenticated prompt shown
    STEP 2 PASS: real auth and session cookie established
    STEP 3 PASS: claimed fa4f30a2d178b6da, run 087f39ee-6bcc-492b-a062-ebc04ea14a4c
    STEP 4 PASS: level 1 decision and answer
    STEP 9 PASS: refresh resumed level 2 unchanged
    STEP 5 PASS: level 2 decision and skip
    STEP 6 PASS: level 3 decision and answer
    Payout status observed: Payout queued
    STEP 7 PASS: finish created or reused a payout record
    STEP 8 PASS: history shows 1,000 Luna earned
    STEP 10 PASS: no horizontal overflow at 320–1440px
    PHASE4_DEPLOYED_E2E_PASS (1 passed)
Payment evidence (if applicable, testnet/mainnet stated clearly):
  TESTNET ONLY. The E2E claimed the funded session and created exactly one payout record:
  run 087f39ee-6bcc-492b-a062-ebc04ea14a4c; earned 1000 Luna (2 answers + 1 skip);
  payout b00c882f-72e1-4fb1-acc1-0cde06dcaedf; status QUEUED; no treasury transaction hash exists.
  No payout transaction was fabricated or claimed as paid. Phase 5 must enable/verify the worker.
Known issues/blockers:
  - Render cold-start/Nimiq readiness can still return 503 on /health/ready; /health/live is the configured health check. No 503 retry was required during the final E2E.
  - Vercel Security Checkpoint did not block the Playwright E2E. A direct curl to /health/live returned the checkpoint HTML once; health was therefore verified against Render directly.
  - NIMIQ_EXPLORER_BASE_URL is unset in Render; payout UI never fabricates a URL.
  - The funded session's original 30-minute funding_deadline had expired before the E2E; the operator-designated session deadline was extended once in the database (state/funding unchanged) so the approved E2E could run. No reward/API/schema change.
  - The final E2E player/run/payout are retained for history inspection. A failed E2E pre-claim player was removed.
Design references/mockups status: none yet — Phase 6.
Operator visual approval status: NOT GIVEN — Phase 6 hard gate.
Documentation/footer-link status: docs/ updated; footer Docs/GitHub links remain Phase 8.
Security/configuration notes:
  - No private keys, mnemonics, DB URLs or auth tokens are in the repository or this checkpoint.
  - DEMO_FUNDING_ENABLED=false and PAYOUT_WORKER_ENABLED=false remain set on Render.
  - All financial values are integer Luna from the API; the client never submits a reward amount or recipient.
  - The frontend uses relative /api paths and the Vercel rewrite; VITE_API_BASE_URL remains "" in Production/Preview.
  - No preview-mock auth endpoint exists.
Git commit:
  7ad825690c6cb55798d8036631bcce7dd01286e4 — feat: wire frontend to Phase 3 APIs
  9764b770bf65f4b143299f981f0b51d4541d42a5 — fix: build contracts before typecheck and tests
  This docs checkpoint is the new commit containing this file.
Single next task: Await operator acceptance of Phase 4 before starting Phase 5 (end-to-end completion and hard functionality gate).
STOPPED awaiting operator approval: yes
```

## Known issues resolved during Phase 4

- **BigInt serialization in `GET /api/runs/:runId`:** `getRunDetail()` passed the full scenario definition, whose `outcomes` contained `bigint basisPoints`. Fastify returned 500 `Do not know how to serialize a BigInt`. The endpoint now returns a `scenarioDTO` projection containing only `id`, `version`, `levelIndex`, `title`, `setting`, `situation`, `prompt` and `choices: [{decisionKey,label}]`. No outcome math is exposed before a decision.
- **Audit of Phase 3 response paths:**
  - `GET /api/runs/:runId` — FIXED (safe projection).
  - `GET /api/sessions/available` — PASS (all Luna values stringified).
  - `POST /api/runs/:runId/decision` — PASS (evaluation result fields are decimal strings; verified by E2E).
  - `POST /api/runs/:runId/consultations/:questionId/respond` — PASS (strings).
  - `POST /api/runs/:runId/finish` — PASS (strings).
  - `GET /api/runs/:runId/payout` — PASS (strings).
  - `GET /api/history` — PASS (strings).
  - Operator session/payout/audit endpoints — PASS (no scenario/question content; Luna values stringified).
- **Regression test:** `apps/api/src/services/phase3.integration.test.ts` now starts a real Fastify instance with the run-detail result, asserts 200, asserts choices contain exactly `decisionKey`/`label`, and asserts the serialized body contains no `outcomes`, `resultingPortfolio`, `explanation` or `basisPoints`. It ran against a fresh local PostgreSQL 16 database and in the CI ephemeral Postgres job.
- When CI initially failed, the cause was contracts package build ordering for web typecheck; scripts now build `@levelbreak-arena/contracts` before typecheck and unit tests.

## Phase 3 acceptance (3 November 2026)

- Operator accepted Phase 3 after independently verifying `82c8c1f977fa2a743059a494efc1d1a962944fc090f6d1e18fcce7569854d55e` via RPC: network ID 5, demo-agent sender, treasury recipient, 1,500 Luna, `LBA1:fa4f30a2d178b6da` reference, included at block `15766696`. All fields matched.
- Option A selected for CI coverage: the **integration** GitHub Actions job now runs the 8 concurrency/ledger tests against an ephemeral `postgres:16` service container. It applies migrations 001 and 002 with `DATABASE_URL_UNPOOLED`, then runs `pnpm test:integration`. The production Neon database is not used in CI.
- CI run for commit `0e253c8778ddcb8aaf4e3c2f6775e9c1b59ba002`: https://github.com/onyebuchidaniel60/levelbreak-arena/actions/runs/41584226010 — `verify` passed and `integration` passed (8/8 tests, job ID `125745865580`).
- Test-record cleanup check (last 2 hours): players `0`, player_runs `0`, requester_sessions `1`. The only session is `d242581a-2590-4ac0-944a-6b41fc626f80`; it remains `AVAILABLE` with funding `VERIFIED`, tx `82c8c1f977fa2a743059a494efc1d1a962944fc090f6d1e18fcce7569854d55e`, reference `LBA1:fa4f30a2d178b6da`, and the `FUNDING_CONFIRMED` ledger entry of 1,500 Luna. No test players or runs remain.
- The funded session was preserved for Phase 4 E2E and was consumed by the Phase 4 deployed run (see the Phase 4 checkpoint above).

## Phase 3 checkpoint

```text
Project: LevelBreak Arena
Current phase: Phase 3 accepted — core domain, funded-session gate and APIs
Status: PASS / ACCEPTED
Preview URL: https://levelbreak-arena.vercel.app (unchanged Phase 1 shell; Phase 3 did not wire the frontend)
Deployed commit SHA: 92e0eacc3c37e23c1b3e3c41d4a704442c921fc5 (Phase 3 code, Render live); 0e253c8778ddcb8aaf4e3c2f6775e9c1b59ba002 (CI integration coverage); this docs checkpoint is the new commit containing this file
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

  CI integration job (commit 0e253c8, ephemeral postgres:16):
    https://github.com/onyebuchidaniel60/levelbreak-arena/actions/runs/41584226010
    verify: success; integration: success (8/8 tests, job 125745865580).
    Migrations 001 and 002 applied with CI-provided DATABASE_URL_UNPOOLED.
    No production Neon database was used in CI.

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
  - The previously manual-only concurrency test gap is closed: CI now runs the 8 DB integration tests against ephemeral Postgres on every push/PR.
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
  0e253c8778ddcb8aaf4e3c2f6775e9c1b59ba002 — ci: run Phase 3 concurrency tests against ephemeral Postgres
  This docs checkpoint is the new commit containing this file.
Single next task: Await the operator's Phase 4 prompt. Do not start Phase 4, wire the frontend, or enable demo funding/payout worker.
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

**STOP.** Phase 4 is complete and awaiting operator acceptance. Do not start Phase 5, enable the payout worker, enable demo funding on Render, or begin final visual design. Phase 5 owns the treasury payout worker and the hard end-to-end payment gate.

## Checkpoint requirements

At the end of each accepted phase, update this file with the exact preview URL, deployed commit SHA, changed behavior, incomplete areas, tests run and results, transaction evidence if relevant, known issues, design reference/mockup/approval status, documentation/footer-link status, and the single next task. Do not claim deployment, tests or payments without evidence.
