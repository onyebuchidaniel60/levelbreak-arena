# AI_HANDOFF.md — LevelBreak Arena

**Last updated:** 3 November 2026
**Current phase:** Phase 2 accepted — Phase 3 gate pending seed-configuration refactor
**Status:** Phase 2 PASS / ACCEPTED; Phase 3 NOT STARTED.

## Current deployment and wallets

- Vercel preview URL: https://levelbreak-arena.vercel.app
- Vercel deployed commit: 612809c8fca37fa6deaac31dd2ec79634c13d87e (Phase 1, accepted)
- Render API URL: https://levelbreak-arena.onrender.com
- Render deployed commit: 92cb7fddb0be07ca03d47c0584557b1db43e152e
- Repository URL: https://github.com/onyebuchidaniel60/levelbreak-arena
- Vercel deployment ID: dpl_HhxZdomUrSFAHGAzYwegwbto1Ura
- Vercel project: uhhh2/levelbreak-arena; Root Directory apps/web; Framework Vite; Node 24.x
- Render service: `levelbreak-arena`; normal start command `node apps/api/dist/server.js`; `/health/ready` verified 200.
- Demo-agent wallet: `NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T`
- Treasury wallet: `NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3`
- `NIMIQ_NETWORK`: `"testnet"`
- Testnet transfer proof: `899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e`
- Testnet proof data reference: `LBA1:1bfa7f2473dd7fb9`
- Testnet payout: **NOT YET RUN**
- `NIMIQ_EXPLORER_BASE_URL`: **must be set before Phase 4** — `[operator to supply verified testnet explorer URL]`
- Design references: not collected
- Mockups: not created
- Operator approval of final visual design: **NOT GIVEN**

## Phase 2 acceptance and pre-Phase 3 gate

- Operator accepted Phase 2 on 3 November 2026 and independently verified transfer `899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e` through RPC/explorer: sender, recipient, value, network ID 5, inclusion, and the `LBA1` reference matched.
- On-chain reference re-confirmed: `recipientData` hex `4c4241313a31626661376632343733646437666239` decodes exactly to `LBA1:1bfa7f2473dd7fb9`; block `15762500`, network ID `5`, 1,500 Luna, confirmed.
- Seed configuration is recorded in `ARCHITECTURE.md` §15: `/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss`, `onlySecureWsConnections=true`, `desiredPeerCount=3`, TestAlbatross network ID 5.
- **Open gate:** `apps/api/src/nimiq/web-client.ts` currently contains the winning seed as a literal `TESTNET_SEED_NODES` constant. It does **not** yet read the seed from environment/configuration, so future seed rotation would still require a code change. Per the operator's "no new code" instruction, no code was changed in this acceptance task.
- The seed must be moved to configuration and deployed before Phase 3 begins, or the operator must explicitly accept the hard-coded seed as a documented exception.
- `NIMIQ_EXPLORER_BASE_URL` remains unset. It **must be set before Phase 4** using `[operator to supply verified testnet explorer URL]`; no explorer URL is guessed.

## Phase 2 checkpoint

```text
Project: LevelBreak Arena
Current phase: Phase 2 complete — backend/data/auth foundation + testnet transfer proof
Status: PASS
Preview URL: https://levelbreak-arena.vercel.app
Deployed commit SHA: 92cb7fddb0be07ca03d47c0584557b1db43e152e (Render API); Vercel remains 612809c8fca37fa6deaac31dd2ec79634c13d87e
What changed: Added the Fastify backend foundation (request IDs, safe error envelopes, Pino redacted logging, security headers, strict APP_ORIGIN CORS, rate limiting, graceful shutdown); added /health/live, /health/ready, /api/config/public; added auth nonce/verify/logout and /api/me with real @nimiq/core Ed25519 signature verification and hash-only session tokens; added the initial Postgres/Neon schema and migration runner; added the NimiqService interface and Web Client adapter with the verified TestAlbatross seed; added the guarded TESTNET_PROOF_ENABLED transfer proof; pinned @nimiq/core 2.23.0. No payout path or Phase 3 game/session APIs were added.
What works on the deployed preview: Phase 1 routes remain accepted. The Render API is live at commit 92cb7fd; /health/live returns 200, /health/ready returns 200, and /api/config/public returns rewardPerAnswerLuna="500", maxConsultations=3, demoMode=true. Real signed auth succeeds against the deployed API, including session creation, /api/me, CSRF logout, and post-logout 401.
What is intentionally incomplete: Phase 3 game/session/consultation APIs; frontend-to-API integration; payout worker and treasury payout path; operator UI; final visual design; final Documentation/GitHub footer links. No payout evidence exists.
Tests run and actual results:
  Task 0 connectivity:
    $ getent hosts seed1.pos.nimiq-testnet.com
    157.90.145.49   seed1.pos.nimiq-testnet.com
    $ nc -vz seed1.pos.nimiq-testnet.com 8443
    Connection to seed1.pos.nimiq-testnet.com (157.90.145.49) 8443 port [tcp/*] succeeded!
    openssl: CONNECTION ESTABLISHED, TLSv1.3, verification OK
    $ getent hosts seed.nimiqchina.com
    (no address)
    nc: getaddrinfo for host "seed.nimiqchina.com" port 8443: No address associated with hostname

    Local winning config:
    diag_result={"network":"TestAlbatross","seeds":["/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss"],"onlySecureWsConnections":true,"consensus":true,"networkId":5,"headHeight":15761316,"connectedPeers":3,"attempts":3,"elapsedSeconds":10.5,"error":null}
    diag_verdict=PASS

    Local China seed:
    diag_result={"network":"TestAlbatross","seeds":["/dns4/seed.nimiqchina.com/tcp/8443/wss"],"onlySecureWsConnections":true,"consensus":false,"networkId":5,"headHeight":null,"connectedPeers":0,"attempts":6,"elapsedSeconds":30.4,"error":null}
    diag_verdict=FAIL

    Local default seeds + insecure config:
    diag_result={"network":"TestAlbatross","seeds":"<client-default>","onlySecureWsConnections":false,"consensus":false,"networkId":5,"headHeight":null,"connectedPeers":0,"attempts":60,"elapsedSeconds":300.8,"error":null}
    diag_verdict=FAIL

    Render winning config:
    diag_result={"network":"TestAlbatross","seeds":["/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss"],"onlySecureWsConnections":true,"consensus":true,"networkId":5,"headHeight":15761492,"connectedPeers":3,"attempts":3,"elapsedSeconds":17.4,"error":null}
    diag_verdict=PASS

  Local API:
    GET /health/live -> 200 {"status":"ok"}
    GET /health/ready -> 200 {"status":"ready"}
    GET /api/config/public -> 200 {"productName":"LevelBreak Arena","networkLabel":"Nimiq Testnet","rewardPerAnswerLuna":"500","maxConsultations":3,"demoMode":true}
    POST /api/auth/nonce -> 200
    POST /api/auth/verify (real signature) -> 200
    GET /api/me -> 200
    POST /api/auth/logout with CSRF -> 204
    GET /api/me after logout -> 401

  Deployed Render API:
    GET /health/live -> 200 {"status":"ok"}
    GET /health/ready -> 200 {"status":"ready"}
    GET /api/config/public -> 200 with expected values
    Auth: nonce 200, verify 200, me 200, logout 204, me-after-logout 401
    Negative auth: invalid signature 401, replay 409, expired nonce 410,
    origin mismatch 400, logout without CSRF 403

  Database:
    Migration applied: 001_initial_schema.sql
    Tables created: players, auth_nonces, auth_sessions, requester_sessions,
    funding_transactions, player_runs, scenario_decisions,
    consultation_responses, ledger_entries, payouts, audit_events
    RLS enabled on all 11 application tables; public policies = 0
    Test auth rows were removed after verification; no seed data remains.

  Testnet transfer proof:
    txHash: 899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e
    sender: NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T
    recipient: NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3
    valueLuna: 1500
    feeLuna: 0
    network: testalbatross
    state: confirmed
    blockHeight: 15762500
    reference: LBA1:1bfa7f2473dd7fb9
    proof=PASS
    explorerBaseUrl: null (NIMIQ_EXPLORER_BASE_URL was not configured)

  Full suite:
    $ pnpm install --frozen-lockfile -> success
    $ pnpm lint -> passed
    $ pnpm typecheck -> apps/api, apps/web, packages/contracts passed
    $ pnpm test -> 2 unit tests passed; 18 Playwright route tests passed
    $ pnpm build -> apps/api and apps/web built successfully

  CI:
    GitHub Actions run for 92cb7fddb0be07ca03d47c0584557b1db43e152e:
    CI — completed / success

Payment evidence (if applicable, testnet/mainnet stated clearly): TESTNET ONLY. Normal basic transfer from demo-agent to treasury, 1,500 Luna, confirmed at block 15762500 with reference LBA1:1bfa7f2473dd7fb9. No payout was attempted.
Known issues/blockers: The Web Client adapter still hard-codes the verified seed and must be moved to configuration before Phase 3 (or explicitly accepted as an exception). `@nimiq/core` emits benign Node warnings about IndexedDB and a WASM event listener; they do not block consensus or transfer proof. Vercel's edge Security Checkpoint remains an automation issue for the unrelated Phase 1 preview; the operator verified the production alias in a normal browser. `NIMIQ_EXPLORER_BASE_URL` is not configured and must be set before Phase 4. Payout execution and Nimiq Pay in-WebView authentication remain unverified until later phases.
Design references/mockups status: none yet — Phase 6.
Operator visual approval status: NOT GIVEN — Phase 6 gate.
Documentation/footer-link status: docs/ present; footer Docs and GitHub links deferred to Phase 8.
Security/configuration notes: no private keys in the repository; only public wallet addresses and the public testnet proof hash are recorded. Wallet keys and AUTH_SESSION_SECRET are server-only Render environment variables. RLS is enabled on all 11 application tables with no public policies. CORS is bound to APP_ORIGIN; production fails closed without it. Auth uses one-time hashed nonces, real Ed25519 verification, hash-only session tokens, HttpOnly/Secure/SameSite cookies, and CSRF double-submit checks. The Web Client uses the verified TestAlbatross seed and no RPC endpoint for signing/broadcast.
Git commit: 92cb7fddb0be07ca03d47c0584557b1db43e152e (Phase 2 code); this docs checkpoint is the new commit containing this file.
Single next task: Move the TestAlbatross seed from the hard-coded adapter constant into configuration and deploy it, or obtain explicit operator acceptance of the hard-coded seed, before Phase 3 begins.
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

1. Payout worker and treasury payout verification are not implemented; do not claim payment completion.
2. Nimiq Pay in-WebView wallet signature authentication still needs end-to-end verification in Phase 4.
3. Funding transaction-to-session matching and duplicate protections are Phase 3 work.
4. The Web Client requires the explicit TestAlbatross seed; do not revert to the client default seed list.
5. No mainnet send path is allowed during preview/development. Any mainnet launch requires separate explicit operator authorization and a security/treasury review.

## Current task for coding agent

**STOP.** Phase 2 is accepted, but Phase 3 is gated on the seed-configuration refactor or explicit operator acceptance of the hard-coded seed. Do not start Phase 3, payout work, frontend integration, or final design until the operator resolves this gate and gives the Phase 3 prompt.

## Checkpoint requirements

At the end of each accepted phase, update this file with the exact preview URL, deployed commit SHA, changed behavior, incomplete areas, tests run and results, transaction evidence if relevant, known issues, design reference/mockup/approval status, documentation/footer-link status, and the single next task. Do not claim deployment, tests or payments without evidence.
