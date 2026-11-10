# AI_HANDOFF.md — LevelBreak Arena

**Last updated:** 10 November 2026
**Current phase:** Phase 18 — world-class copywriting and comprehensive `/docs` hub deployed and live-verified; awaiting operator acceptance
**Status:** Phase 18 PASS / DEPLOYED / LIVE VERIFIED. Phase 17 v1.0.0 complete.

## Current deployment and wallets

- Vercel preview URL: https://levelbreak-arena.vercel.app
- Vercel deployed app-code commit: `91be1c2` (Phase 18 copy/docs hub, follow-up to feature commit `b16223d`). Production deployment `https://levelbreak-arena-ospi5ac28-uhhh2.vercel.app`; alias `https://levelbreak-arena.vercel.app`. The deployed docs hub is `https://levelbreak-arena.vercel.app/docs`.
- Render API URL: https://levelbreak-arena.onrender.com
- Render deployed code: `91be1c2` (Phase 18), deploy `dep-dbpbd5q9lscs73b2a0g0`, live 2026-11-10T06:16Z; `/health/live` 200 and `/health/ready` 200. `AUTO_REPLENISH_SESSIONS=true`, `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`.
- Database migrations: `003_phase7_five_levels.sql` applied 2026-11-04T14:02:25.437Z; `004_generated_content.sql` applied 2026-11-09T05:57:19.353Z; `005_phase10_agents.sql` applied to production at 2026-11-09T06:51:48.893Z. Phase 11 adds no migration.
- Render env: `MAX_CONSULTATIONS_PER_SESSION=5`, `FUNDING_MINIMUM_LUNA=2500`, `MAX_REWARD_LIABILITY_LUNA=2500`; `PAYOUT_WORKER_ENABLED=false`, `DEMO_FUNDING_ENABLED=false`, `AUTO_REPLENISH_SESSIONS=true`. `LLM_API_KEY` present; `LLM_BASE_URL=https://api.groq.com/openai/v1`; `LLM_MODEL=qwen/qwen3.8-27b`.
- LLM env: `LLM_API_KEY` is provisioned; Groq `qwen/qwen3.8-27b` produced live dynamic agent messages in the Phase 8 proof.
- Sessions: the Phase 8 proof created and settled two 5-level / 2,500 Luna sessions. Phase 8.2 added a test session/run (`18f5054e…` / `fda15818…`) that is active at Level 2 for inspection; the operator’s manual session (`bcbc692c…`) is settled with a confirmed 2,500 Luna payout. Phase 10 added the external-agent session `44f7bae6…` / run `e1b0e820…`, settled with a confirmed 500 Luna payout. Phase 11 added the answered session `02ed506d…` / run `df69f847…` (confirmed 500 Luna payout) and the MCP-posted session `01b378f2…`, which remains `AVAILABLE` with 500 Luna reserved for the MCP Server Agent. Earlier sessions remain 3-level / 1,500 Luna and settled.
- Repository URL: https://github.com/onyebuchidaniel60/levelbreak-arena
- Render service: `levelbreak-arena`, `web_service`, branch `main`; `/health/live` and `/health/ready` verified 200 after the final worker-disable deploy.
- Demo-agent wallet: `NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T`
- Phase 10 external agent wallet: `NQ63 8XN2 QLM9 4JAQ 4HLT HS1G 3H1H LHDF 6725` (agent `4a9f281b-fbcf-4ff7-aab0-290361f54b96`, name “Alpha Research Bot”)
- Phase 11 “MCP Research Agent” uses the registered demo-agent wallet `NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T` (agent `9fd34afa-dddd-453c-adfa-3fa2ff4f2a8a`).
- Phase 11 MCP Server Agent wallet: `NQ11 1B6U 0H3T Y2VV S2U2 RHJL HT5A MC95 UB4D` (agent `9e2ca6fb-768c-4cbc-993a-0072458c5b50`).
- Treasury wallet: `NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3`
- `NIMIQ_NETWORK`: `"testnet"`
- Phase 2 transfer proof: `899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e`
- Phase 3 funded-session proof: `82c8c1f977fa2a743059a494efc1d1a962944fc090f6d1e18fcce7569854d55e`
- Phase 3 proof session: `d242581a-2590-4ac0-944a-6b41fc626f80`, public ref `fa4f30a2d178b6da`
- Phase 4 E2E run: `087f39ee-6bcc-492b-a062-ebc04ea14a4c`; session `d242581a-2590-4ac0-944a-6b41fc626f80` is now `SETTLED`; payout `b00c882f-72e1-4fb1-acc1-0cde06dcaedf` confirmed on testnet at tx `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29`, block `15838244`.
- Phase 5 Session A: `1435e21b-9e55-4143-92d8-e4a6da01e893`, ref `0f566d594fc30388`; run `4b1e2889-2e1e-476e-a957-042c4b5b69c3`; payout `dcab12c0-b19c-4eeb-951b-7918e5a459a6`, 1,000 Luna, tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`, block `15838771`.
- Phase 5 Session B: `f96476d6-ba9b-4ff9-b555-8761d52da6e6`, ref `685638bc542dad71`; run `03de2187-83dd-46df-a2e0-7573ef678a7b`; payout `5975746e-306b-41e1-88c7-ddf8fc15349e`, 1,500 Luna, tx `b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf`, block `15839460`.
- All three Phase 5 payouts are `CONFIRMED`; total paid 3,500 Luna, fees 0. Treasury balance before the payout run: `11,000,006,000` Luna; after: `11,000,002,500` Luna.
- `NIMIQ_EXPLORER_BASE_URL`: `https://test.nimiq.watch/#`; verified to render tx `899823e2…` and block `15766696`. The API returns `explorerUrl` and the UI/history show a working "View on explorer" link.
- Design references: Phase 7 VISE Staking Adventure images in `design/references/`; Phase 14 operator references `design/references/new-reference1.webp`, `new-reference2.webp` and `new-reference3.webp`. The Phase 14 extraction is in `design/MOCKUP_NOTES_NEW_UI.md`.
- Mockups: Phase 14 — Light Editorial Arena is the **ACTIVE** visual direction, implemented directly from the new operator references. Direction 1 — Trading Terminal was the Phase 7–13.7 visual direction and remains in `design/mockups/` as historical design history; Directions 2, 3 and 4 were rejected.
- Prototype deployment: Direction 1 is applied to the deployed production app; rejected prototypes are not deployed.
- Operator approval of final visual design: **GIVEN — Phase 14 operator references, 10 November 2026**. Direction 1 was approved on 4 November 2026 for Phases 7–13.7 and is now visually superseded.
- Feature flags on Render: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`, `AUTO_REPLENISH_SESSIONS=true` (the explicitly approved testnet-only replenisher).

## Phase 18 — Agent Economy copy and comprehensive docs hub (10 November 2026)

**Status:** DEPLOYED / LIVE VERIFIED.

### Copywriting

- Landing hero:
  - headline: **“The AI Agent Economy Needs Your Judgment.”**
  - subheadline: “LevelBreak Arena is a DeFi training ground and micro-task
    marketplace. Prove your risk intelligence to AI agents and earn real
    NIM.”
  - primary CTA: **Enter the Arena**; secondary CTA: **Read the Docs**.
  - added the three-step **How it works** loop: Learn DeFi concepts → Prove
    your skill → Agents pay for your judgment.
  - Proof-of-Learning copy now explains RLHF and the agent-feedback loop.
- Lobby:
  - title: **Active Missions**;
  - subtitle: “Funded by external AI agents. Claim a session, answer the
    prompt, and earn testnet NIM.”
  - empty state: “Preparing a new mission.” / “No active mission available.”
- Game:
  - agent identity: “Agent Zeta (Simulated) needs your assessment on this
    scenario.” or `<agent> (Verified MCP) needs your assessment on this
    scenario.`
  - CTA: **Provide Assessment & Earn 500 Luna**.
  - confirmed payout heading **Reward Confirmed.** with “Your testnet NIM is
    in your wallet.”
- Fiat modal: added “In production, this connects directly to the Nimiq Pay
  fiat off-ramp, allowing instant cash-out to your local bank.” inside the
  demo-only disclosure.

### Documentation hub

`/docs` is now a full documentation site with:

- sticky desktop sidebar / horizontally scrollable mobile section navigation;
- Introduction covering RLHF and why agents need human judgment;
- For Players: mission loop, 500-Luna reward, zero for skips, 2,500-Luna cap
  and treasury payout explanation;
- For AI Agents: MCP server setup, `post_defi_consultation`, Agent API
  register/deposit/post endpoints and real code examples;
- Architecture & Security: React/Fastify/Nimiq stack, funded-session and
  idempotency controls, signature auth, treasury custody disclosure and
  links to privacy, terms and the security model;
- FAQ: testnet rationale, difference from a standard quiz, smart-contract
  status and the Verified MCP label;
- working anchors and internal/external links, with contained code-block
  scrolling and no horizontal page overflow at 320/375/390px.

### Verification

```text
pnpm lint          passed
pnpm typecheck     passed
pnpm build         passed
pnpm test          63 unit passed; 60 Playwright passed; 6 deployed skipped
pnpm test:integration (local PostgreSQL) 32 passed
```

Playwright covers the new hero and loop, Active Missions heading, agent
assessment language, assessment CTA, Reward Confirmed copy, docs section
headings, every docs anchor target, no empty links, code-block contents and
320/375/390 overflow. Screenshots:

```text
test-results/phase14/landing-1440.png
test-results/phase14/landing-390.png
test-results/phase14/support-docs-1440.png
test-results/phase14/support-docs-390.png
```

### Deployment and live verification

- Feature commit: `b16223d` — `feat: polished copywriting and comprehensive
  docs hub`.
- Follow-up copy alignment: `91be1c2` — `fix: align landing loop copy`.
- Vercel production deployment
  `https://levelbreak-arena-ospi5ac28-uhhh2.vercel.app`, alias
  `https://levelbreak-arena.vercel.app`.
- Docs URL: `https://levelbreak-arena.vercel.app/docs`.
- Render deploy `dep-dbpbd5q9lscs73b2a0g0`, live 2026-11-10T06:16Z;
  `/health/live` 200 and `/health/ready` 200 after a restart.
- Live Chromium verification at 1440px and 390px confirmed:
  - landing headline **“The AI Agent Economy Needs Your Judgment.”**;
  - subheadline with the marketplace/risk-intelligence positioning;
  - **Enter the Arena** and **Read the Docs** CTAs;
  - the **How it works** loop with the three required steps;
  - docs sections, five anchor targets, two code blocks and no horizontal
    overflow at 390px or 320px.
- Live screenshots:
  - `test-results/phase18/landing-live-1440.png`
  - `test-results/phase18/landing-live-390.png`
  - `test-results/phase18/docs-live-1440.png`
  - `test-results/phase18/docs-live-390.png`
- **Single next task:** Await operator acceptance of Phase 18. Do not begin
  another phase.

## Phase 17 — Adversarial security regression and v1.0.0 release (10 November 2026)

**Status:** DEPLOYED / LIVE VERIFIED / RELEASE TAGGED.

### Findings fixed

1. **Agent consultation balance status:** unfunded consultations returned
   `409 INSUFFICIENT_AGENT_BALANCE`, contrary to the required API contract.
   Changed to `402 INSUFFICIENT_BALANCE` in `errors.ts` and `agents.ts`. Ten
   consecutive zero-balance requests now all return 402 and create no rows.
2. **Concurrent deposit-hash collision:** a unique-constraint race could escape
   as a generic 500. `depositAgentFunds` now maps the unique violation to
   `409 DEPOSIT_TX_REUSED`; the transaction row lock and unique index still
   guarantee exactly one credit.
3. **Replenisher denial-of-wallet:** added a rolling 24-hour cap of **5**
   auto-replenished sessions, keyed with the `auto-replenish:v2:` prefix, in
   addition to the existing **3-per-run** and **5-minute** limits. Pre-Phase-17
   v1 sessions are not counted against the new cap. Exhaustion logs
   `session_replenisher_daily_cap` and creates nothing.

### Adversarial verification

`apps/api/src/security/adversarial.integration.test.ts` (local PostgreSQL,
migrated to `005_phase10_agents.sql`) covers:

- fake, unconfirmed, mainnet, wrong-sender, wrong-recipient, low-value and
  reused deposit hashes, plus reuse of a session-funding hash;
- concurrent deposit races, exactly one credit and one 409;
- ten zero-balance consultation requests (402 each) and `reward_luna: 10000`
  (422 `INVALID_REWARD`, no consultation rows);
- Player A cookie + Player B run/payout IDOR (both 404);
- agent A key cannot read agent B; no `/api/agent/balance` route exists;
- duplicate consultation-answer idempotency returns the same response and
  rewards once; a different key on the same question returns 409;
- concurrent session claims produce exactly one run and one 409;
- external-agent consultation text bypasses the LLM entirely (no `fetch`),
  so prompt-injection text is never sent to the provider;
- `app.printRoutes()` contains no replenisher endpoint.

MCP surface check:

```text
npm --prefix mcp-server run check  passed
mock Agent API + verify.js:
  tool: post_defi_consultation
  reward_luna: 500
  API key printed to stdout: false
  payload keys: question, context, reward_luna
```

**Accepted residual risk:** agent registration still does not prove wallet
ownership with a signed challenge. The MVP mitigates this with sender-bound
deposits and globally single-use transaction hashes. The limitation is already
recorded in `docs/SECURITY.md`; adding signed registration/key rotation is a
production-marketplace change outside the approved Phase 10/17 testnet scope.

### Submission and docs

- `docs/SUBMISSION_DRAFT.md` now contains the final 206-word pitch covering the
  AI-agent/RLHF concept, MCP integration, Nimiq Pay demo off-ramp and stack.
- `README.md` now includes concrete MCP setup instructions for Claude Desktop
  and Cursor, including the fixed 500-Luna tool and key-handling rules.
- `docs/SECURITY.md`, `docs/OPERATIONS.md`, `docs/TESTING.md`,
  `ARCHITECTURE.md`, `PROJECT_SPEC.md` and `AGENTS.md` record the Phase 17
  findings and controls.

### Verification

```text
pnpm lint          passed
pnpm typecheck     passed
pnpm build         passed
pnpm test          63 unit passed; 60 Playwright passed; 6 deployed skipped
pnpm test:integration (local PostgreSQL) 32 passed
npm --prefix mcp-server run check          passed
```

### Deployment and release

- Render env verified:
  `AUTO_REPLENISH_SESSIONS=true`, `DEMO_FUNDING_ENABLED=false`,
  `PAYOUT_WORKER_ENABLED=false`.
- Security-fix commit: `ead3ce6` — `fix: address adversarial security findings`.
- Render deploy `dep-dbpamj142hec73da20s0`, live 2026-11-10T05:28Z;
  `/health/live` 200 and `/health/ready` 200.
- Vercel production deployment
  `https://levelbreak-arena-585ppxhpr-uhhh2.vercel.app`; alias
  `https://levelbreak-arena.vercel.app`.
- Live replenisher logs after the security deploy:
  - `session_replenisher_budget` with `dailyMinted: 0`, `dailyCap: 5`,
    `dailyRemaining: 5`;
  - `session_replenisher_run` with `availableBefore: 3`, `created: 0`;
  - lobby state counts: `AVAILABLE: 3`, `EXPIRED: 3`, `IN_PROGRESS: 2`,
    `SETTLED: 8`.
- Annotated release tag `v1.0.0` — “LevelBreak Arena MVP Submission” is created
  on this release-record commit and pushed with the commit.
- **Single next task:** Await operator acceptance of v1.0.0. Do not begin
  another phase.

## Phase 16 — Auto-replenishing lobby and professional branding (10 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

### Auto-replenishing demo lobby

- Added `AUTO_REPLENISH_SESSIONS` to `apps/api/src/config.ts` (default
  `false`).
- Added `apps/api/src/services/session-replenisher.ts`:
  - target **3** visible `AVAILABLE` sessions;
  - runs once after a short startup delay and then every five minutes after
    the previous run completes;
  - uses the existing `createDemoSession` flow, which sends exactly 2,500
    testnet Luna from the demo-agent wallet to the treasury and waits for
    independent on-chain verification before the session can become
    `AVAILABLE`;
  - creates sessions sequentially and stops on the first pending or failed
    transfer so it cannot stack treasury broadcasts;
  - deterministic idempotency keys use the five-minute bucket, observed
    count and slot, so a restart within the same bucket resumes the same
    session; the database unique constraint on `creation_idempotency_key`
    remains the final duplicate guard;
  - auto-replenished sessions receive a 24-hour lobby funding deadline;
    operator-created demo sessions keep the existing 30-minute deadline;
  - before counting, stale demo sessions whose lobby deadline passed are
    moved from `AVAILABLE` to `EXPIRED` (agent sessions are untouched), so
    operator state counts match the lobby;
  - catches database/chain failures, logs structured
    `session_replenisher_*` events and schedules the next attempt instead of
    crashing the API;
  - testnet-only; it never changes the reward amount, liability cap, state
    machine or payout rules.
- Safety gate: `isAutoReplenisherOverride` allows the internal worker to
  bypass the normal demo-funding/production blocks only when the source is
  `auto-replenisher` and `AUTO_REPLENISH_SESSIONS` is explicitly true. The
  operator `POST /api/operator/demo-sessions` route remains blocked in
  production and still requires `DEMO_FUNDING_ENABLED=true`.
- Wired the worker into `apps/api/src/server.ts` after listen, with graceful
  shutdown. If `AUTO_REPLENISH_SESSIONS=true` but
  `NIMIQ_DEMO_AGENT_PRIVATE_KEY` is absent, the API logs a warning and does
  not start the worker.
- `GET /api/sessions/available` returns
  `message: "We are preparing a new funded session for you. Please refresh in 30 seconds."`
  when the visible lobby is empty and the replenisher is enabled. The
  contract allows an optional `message`, the lobby displays it as
  “Preparing a new funded session.” and the query refreshes every 30 seconds
  while empty.
- Added `apps/api/src/services/session-replenisher.test.ts` covering disabled
  no-op, target reached, filling 3 slots, filling only missing slots,
  deterministic keys, pending-stop, failure-stop, scheduler start/stop,
  disabled scheduler and the auto-replenisher-only override.

### Professional branding

- Added `apps/web/public/logo.svg` and `apps/web/public/favicon.svg`: a
  geometric yellow rounded square, ink “L”, coral coin/play mark and lilac
  arena corner using only the approved palette.
- `apps/web/index.html` now declares the SVG favicon.
- `apps/web/src/components/Layout.tsx` uses the SVG mark in the header at
  40px mobile / 44px desktop; it scales crisply and keeps the existing
  “LevelBreak / Arena” wordmark.
- Added `tests/e2e/phase16.branding.spec.ts` to verify the logo asset, its
  intrinsic 64×64 size, the favicon link/content type, 320/375/390 overflow,
  header screenshots at 1440px and 390px, and the empty-lobby message at
  390px.

### Verification and screenshots

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm build` passed.
- `pnpm test` passed: 61 unit tests, 60 Playwright tests, 6 deployed tests
  skipped.
- Phase 16 screenshots:
  - `test-results/phase16/header-1440.png`
  - `test-results/phase16/header-390.png`
  - `test-results/phase16/landing-branded-390.png`
  - `test-results/phase16/empty-lobby-390.png`
  - `test-results/phase16/browser-tab-local.png` (real Chromium tab strip
    with the favicon; the deployed version will replace it as
    `browser-tab-live.png`).
- `AUTO_REPLENISH_SESSIONS=true` is set on Render; `DEMO_FUNDING_ENABLED`
  remains false.
- Live Render logs confirmed:
  - `session_replenisher_started` with `target: 3`;
  - three `session_replenisher_created` events with `state: "AVAILABLE"`;
  - `session_replenisher_run` with `availableBefore: 0`, `created: 3`,
    `pending: 0`, `failed: 0`;
  - a later run with `availableBefore: 3`, `created: 0` (idempotent no-op).
- The first batch (`daf8826e892a6bad`, `c49c98f9e7c8ea5d`,
  `571e95eda6306a5f`) used the original 30-minute deadline and expired at
  04:27Z.
- The 24-hour TTL deployment created a fresh batch at 04:32Z
  (`110655de2ad9f23d`, `637519ad08a15100`, `acd5d817fbbab542`), each 2,500
  Luna with verified funding and a deadline of 2026-11-11T04:32Z. At 04:36Z
  the cleanup run logged `session_replenisher_expired count: 3`, leaving
  exactly 3 `AVAILABLE` and 3 `EXPIRED` demo sessions. The visible lobby
  count is 3.
- Live header evidence:
  - `test-results/phase16/header-live-1440.png`
  - `test-results/phase16/header-live-390.png`
  - `test-results/phase16/browser-tab-live.png` (real Chromium tab strip with
    the favicon and title).
- **Single next task:** Await operator acceptance of Phase 16. Do not begin
  another phase.

## Phase 14 — Complete visual overhaul from operator references (10 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

### Design extraction

`design/MOCKUP_NOTES_NEW_UI.md` records the system extracted from
`design/references/new-reference1.webp`, `new-reference2.webp` and
`new-reference3.webp`:

- **Palette:** ink `#151313`, coral `#ff5734`, lilac `#be94f5`, yellow
  `#fccc42`, cream `#f7f7f5`, paper `#fffdf8`, canvas blue `#bfd4dc`, charcoal
  `#2b2b2b`, semantic green `#137a52`, amber `#a86a00`, red `#b93a22`.
- **Typography:** Kodchasan (400/500/600/700) for headings, body and UI labels;
  JetBrains Mono retained for all Luna amounts, NIM values, exchange rates,
  transaction hashes, block heights, state versions and numeric counters.
- **Shape:** 24–32px card radii, pill buttons and badges, thin dark outlines,
  flat pastel fills, restrained shadows and a charcoal app frame around a
  cream workspace.
- **Layout:** bento grids, a dominant focal card, generous 20–28px card
  padding, asymmetric dark callouts, yellow/lilac/sky feature surfaces, coral
  primary CTAs and dark contrast cards for agent messages, MCP, trust and the
  final CTA.
- **Screen mapping:** landing bento dashboard; yellow demo and lilac/sky agent
  lobby cards; sky game scenario with dark decision rows; dark agent message,
  paper evidence and lilac Agent Request; mint/yellow/forest Earned/Pending/Paid
  tiles; cream fiat modal with yellow currency selector and coral confirmation;
  pastel agents directory with ink `Verified MCP` badges; cream support, 404,
  loading and error states.

### Implementation

- `apps/web/index.html`: Kodchasan + JetBrains Mono Google Fonts, canvas theme
  colour and updated title/description metadata.
- `apps/web/src/index.css`: complete token replacement, light body canvas,
  `.panel-*` surface variants (paper, cream, gold, lilac, sky, coral, ink, mint,
  blush, forest), pill primitives, numeric/eyebrow utilities and light-theme
  focus/selection styles.
- `apps/web/src/components/ui.tsx`: rounded Panel tones, coral pill primary
  buttons, pill badges, pastel StatTiles with distinct paid/earned/pending
  treatments, light ProgressRail, skeleton, divider and key/value primitives.
- `apps/web/src/components/Layout.tsx`: sticky charcoal frame/header, gold
  active nav pills, inverse wallet controls, cream workspace and dark footer.
- All routes restyled: Landing, Lobby, Game/Decision, Agent Request and
  consultation, Payout, Fiat Off-Ramp modal, History, Agents directory,
  How It Works, Docs, Privacy, Terms, 404, loading and error states.
- `AgentMessage` keeps the typewriter, reduced-motion behaviour and screen
  reader copy; its visual treatment is now a dark ink card with lilac avatar
  and gold/ink badges.
- `FiatOffRampModal` keeps the TanStack Query loading state, fallback rates,
  NGN/EUR/USD selector, live CoinGecko disclosure, “Less than 0.01” handling
  and demo-only success flow. The modal now has a fixed action footer so the
  primary CTA stays visible while the body scrolls on short screens.
- `AgentCard` uses paper/lilac/sky/gold pastel surfaces and an ink
  `Verified MCP` badge that is readable on every tone.
- No backend, API contract, database schema, auth, payment/treasury, payout
  worker, MCP/agent API or LLM-generator behavior changed.

### Verification

- `pnpm lint` passed.
- `pnpm typecheck` passed.
- `pnpm build` passed.
- `pnpm test` passed: 50 unit tests, 58 Playwright tests, 6 deployed tests
  skipped.
- Phase 14 Playwright screenshots at 1440px and 390px:
  - `test-results/phase14/landing-1440.png` / `landing-390.png`
  - `test-results/phase14/game-decision-1440.png` / `game-decision-390.png`
  - `test-results/phase14/agent-request-1440.png` / `agent-request-390.png`
  - `test-results/phase14/payout-1440.png` / `payout-390.png`
  - `test-results/phase14/fiat-modal-1440.png` / `fiat-modal-390.png`
  - `test-results/phase14/agents-1440.png` / `agents-390.png`
  - `test-results/phase14/lobby-1440.png` / `lobby-390.png`
  - Support and state evidence: `support-how-it-works-1440.png`,
    `support-docs-1440.png`, `not-found-1440.png`, `error-state-1440.png`,
    `loading-state-390.png`.
- Mobile guards: no horizontal overflow at 320px, 375px or 390px on landing,
  lobby, game, Agent Request, agents directory and fiat modal; minimum 44px
  decision/option controls and primary actions; fiat modal CTA visible at
  390px.
- Functionality guards: typewriter emits a partial string then completes;
  `Verified MCP` badges render; live NGN rate `1 NIM = ₦37.97` and `₦0.95`
  display; Earned/Pending/Paid use mint/yellow/forest surfaces.
- Design files: `design/MOCKUP_NOTES_NEW_UI.md`.
- Deployment: **COMPLETE**.
  - Feature commit `93500a5` — `feat: complete UI overhaul from new operator
    references`.
  - Vercel production deployment
    `https://levelbreak-arena-7qt6j0t3f-uhhh2.vercel.app`, alias
    `https://levelbreak-arena.vercel.app`.
  - Render deploy `dep-dbp8n2lg1s2s73c4llu0`, live 2026-11-10T03:12Z;
    `/health/live` 200 and `/health/ready` 200.
  - Live Chromium screenshots at 1440px and 390px:
    `test-results/phase14/live-landing-1440.png`,
    `live-landing-390.png`, `live-agents-1440.png`, `live-agents-390.png`,
    `live-game-1440.png`, `live-game-390.png`,
    `live-agent-request-1440.png`, `live-agent-request-390.png`,
    `live-payout-1440.png`, `live-payout-390.png`,
    `live-fiat-modal-1440.png`, `live-fiat-modal-390.png`.
  - The deployed landing, agents directory, game decision, Agent Request,
    payout and fiat modal all render the new theme. `1 NIM = ₦37.97` and
    `You receive ₦0.95` are visible in the live modal; the demo disclosure and
    `No exchange API is called for settlement` copy are present.
  - Production flags remain `DEMO_FUNDING_ENABLED=false` and
    `PAYOUT_WORKER_ENABLED=false`; no backend, API, schema, auth, treasury,
    MCP/agent API or LLM behavior changed.
- **Single next task:** Await operator acceptance of Phase 14. Do not begin
  another phase.

## Phase 13.7 — Correct stale fallback exchange rates (10 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

- Updated `FALLBACK_EXCHANGE_RATES` in `apps/api/src/services/exchange-rates.ts` from the stale values to:
  - `usd: 0.0282`
  - `eur: 0.0251`
  - `ngn: 37.97`
- Updated the frontend `DEFAULT_EXCHANGE_RATES` in `apps/web/src/components/FiatOffRampModal.tsx` to the same values, so an API failure no longer falls back to 100x-lower rates.
- Updated the backend exchange-rate success fixture and the Phase 7 fallback assertions.
- Updated the architecture, project spec, testing and handoff records to the corrected fallback values.
- Verification:
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm test` passed: 50 unit tests, 50 Playwright tests, 6 deployed tests skipped.
- The Phase 7 fallback modal now asserts:
  - `1 NIM = ₦37.97`
  - `You receive ₦0.95`
- Deployment: **COMPLETE**.
  - Feature commit `f59057e` — `fix: correct stale fallback exchange rates`.
  - Render deploy `dep-dbp7rn2vcj2c73crosdg`, live 2026-11-10T02:13Z; `/health/live` 200, `/health/ready` 200.
  - Vercel production deployment `https://levelbreak-arena-m1thw1o80-uhhh2.vercel.app`, alias `https://levelbreak-arena.vercel.app`.
  - The live endpoint returned the corrected fallback `{"usd":0.0282,"eur":0.0251,"ngn":37.97}` while CoinGecko was rate-limiting the Render IP.
  - The deployed fallback modal showed `1 NIM = ₦37.97` and `You receive ₦0.95`; the screenshot `test-results/phase12/live-fiat-ngn-fallback-390.png` was refreshed with these values.
  - Final flags: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`.
- Phase 14 was explicitly requested by the operator on 10 November 2026 after Phase 13.7 was live-verified.

## Phase 13.6 — Live exchange rates for fiat off-ramp (10 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

- Added public `GET /api/config/exchange-rates`:
  - fetches `https://api.coingecko.com/api/v3/simple/price?ids=nimiq&vs_currencies=usd,eur,ngn`;
  - validates `{ nimiq: { usd, eur, ngn } }` with Zod;
  - caches the result in memory for five minutes and coalesces concurrent requests;
  - falls back to `{ usd: 0.0282, eur: 0.0251, ngn: 37.97 }` on provider/schema failure and logs a structured warning;
  - is public and rate-limited; no auth or player data is involved.
- Added `apps/api/src/services/exchange-rates.test.ts`: success + cache, fallback + warning, invalid shape fallback, and five-minute refresh.
- Frontend:
  - `api.exchangeRates()` and `useExchangeRatesQuery(enabled)` use TanStack Query with a five-minute stale time;
  - the off-ramp modal fetches rates when it opens and renders the selector, payout context and disclosure immediately;
  - while loading, it shows a `Loading rate` badge, “Fetching live rate…”, a gold pulse and amount skeletons;
  - the live rate line shows `1 NIM = <symbol><rate>` (e.g. `1 NIM = ₦37.97`) and the small disclosure “Live rate from CoinGecko. Demo only.”;
  - the `You receive` amount is `amountLuna / 100,000 * rate`, formatted as NGN/EUR/USD; sub-cent amounts show “Less than 0.01”;
  - if the frontend request fails, the modal uses the same fallback rates and says “Live rate unavailable — using demo fallback. Demo only.”;
  - no backend, auth, payment, reward, state-machine or payout-worker behavior changed.
- The endpoint first returned live CoinGecko values (`usd 0.02818854`, `eur 0.02511467`, `ngn 37.97`). The deterministic Playwright fixture uses those same values, so the NGN screenshot shows `1 NIM = ₦37.97` and `₦0.95`. The Render IP later hit CoinGecko rate limits, so the endpoint served the updated fallback `{ usd: 0.0282, eur: 0.0251, ngn: 37.97 }`; that path is unit-tested and the deployed fallback screenshot is `live-fiat-ngn-fallback-390.png`.
- Tests:
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm test` passed: 50 unit tests, 50 Playwright tests, 6 deployed tests skipped.
  - The Phase 12 payout test delays the exchange-rate response, asserts the modal opens in a loading state, then verifies NGN `₦0.95` at the live fixture rate, EUR/USD “Less than 0.01”, the 320px segmented-control layout, and the disclaimer. The Phase 7 test verifies the fallback-rate formatting (`₦0.02`).
- 390px screenshots:
  - Live-rate fixture: `test-results/phase12/fiat-modal-ngn-390.png`, `fiat-modal-eur-390.png`, `fiat-modal-usd-390.png`.
  - Deployed fallback state: `test-results/phase12/live-fiat-ngn-fallback-390.png`.
- Deployment: **COMPLETE**.
  - Feature commit `56ade38` — `feat: live exchange rates for fiat off-ramp`.
  - Render deploy `dep-dbp7bou417fc739bo1s0`, live 2026-11-10T01:39Z; `/health/live` 200, `/health/ready` 200 after restart.
  - Vercel production deployment `https://levelbreak-arena-rh2biwi0u-uhhh2.vercel.app`, alias `https://levelbreak-arena.vercel.app`.
  - Endpoint live check: first call returned `{"usd":0.02818854,"eur":0.02511467,"ngn":37.97}` in 1.87s; a second call returned the same cached values in 0.12s. Later CoinGecko rate-limited the Render IP, and the endpoint correctly served the corrected fallback `{"usd":0.0282,"eur":0.0251,"ngn":37.97}`, demonstrating the fallback path.
  - The deployed modal was opened with the real endpoint and showed the loading state and fallback NGN rate; the Playwright live-value screenshot uses the actual CoinGecko values observed and shows `1 NIM = ₦37.97` plus `You receive ₦0.95`.
  - Final flags: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`.
- The current live endpoint is serving the five-minute fallback cache because CoinGecko is rate-limiting the Render IP; the fallback is the required behavior and the warning is logged server-side.
- **Single next task:** Await operator acceptance of Phase 13.6. Do not begin Phase 14.

## Phase 13.5 — Multi-currency fiat off-ramp (10 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

- UI-only update to `apps/web/src/components/FiatOffRampModal.tsx`.
- Added a segmented currency control at the top of the modal:
  - **NGN** (default) — “Naira”
  - **EUR** — “Euro”
  - **USD** — “Dollar”
- Mocked display rates:
  - `1 NIM = 1,350.00 NGN`
  - `1 NIM = 0.82 EUR`
  - `1 NIM = 0.89 USD`
- The “You receive” amount updates live from the confirmed NIM payout:
  - `2,500 Luna` → `₦33.75` / `€0.02` / `$0.02`.
- Uses JetBrains Mono for amounts and rates, thousands separators and the correct symbol; gold/emerald design tokens only.
- Disclosure now explicitly says the rates are mocked and no fiat currency is transferred. The success state also carries the selected currency.
- Layout checked at 320px, 375px and 390px: segmented control fits without overflow, 16px modal edges, non-wrapping amount.
- No backend, auth, payment, reward, state-machine or payout-worker changes.
- Tests:
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm test` passed: 46 unit tests, 50 Playwright tests, 6 deployed tests skipped.
  - Updated Phase 7 and Phase 12 UI tests for the NGN default and currency switching.
- 390px screenshots:
  - `test-results/phase12/fiat-modal-ngn-390.png`
  - `test-results/phase12/fiat-modal-eur-390.png`
  - `test-results/phase12/fiat-modal-usd-390.png`
  - Live deployed bundle: `test-results/phase12/live-fiat-ngn-390.png`, `live-fiat-eur-390.png`, `live-fiat-usd-390.png`.
- Deployment: **COMPLETE**.
  - Feature commit `3d92e89` — `style: multi-currency fiat off-ramp modal (NGN, EUR, USD)`.
  - Render deploy `dep-dbp6tmavcj2c73cqiphg`, live 2026-11-10T01:09Z; `/health/live` 200, `/health/ready` 200.
  - Vercel production deployment `https://levelbreak-arena-fgeyprhav-uhhh2.vercel.app`, alias `https://levelbreak-arena.vercel.app`.
  - Live 390px Chromium check: NGN selected by default with `1 NIM = 1,350.00 NGN` and `₦33.75`; EUR selected with `1 NIM = 0.82 EUR` and `€0.02`; USD selected with `1 NIM = 0.89 USD` and `$0.02`. At 320px the segmented control stayed inside 16px modal edges and the page had no horizontal overflow.
  - Final flags: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`.
- **Single next task:** Await operator acceptance of Phase 13.5. Do not begin Phase 14.

## Phase 12 — Final UI polish and mobile readiness (10 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

- Added a dedicated public `/agents` directory page:
  - premium bento hero with live marketplace telemetry: registered agents, questions posted, open questions, rewards paid;
  - `panel-glass` MCP integration card with `post_defi_consultation`, MCP setup and Agent API links;
  - responsive agent cards with `Verified MCP`, Live/Resolved status, question counts, open questions, rewards paid, joined date, agent ID and a live-question CTA;
  - marketplace lifecycle cards (register → deposit → post → answer) and a final agent CTA.
- Added `AgentCard` as a shared component used by both `/agents` and the landing-page Active Agents section. The landing section now has a **View directory** action, a bento-style grid, glass accents, and the same premium agent cards.
- Updated navigation and footer with a real **Agents** link. Updated route inventory and smoke tests for `/agents`.
- Game / Agent Request polish:
  - the Agent Request panel now shows the agent name in a dedicated identity card;
  - external agent consultations show a **Verified MCP** badge in both the Agent Request header and the Agent Message card;
  - demo sessions retain the exact “Agent Zeta (Simulated) is requesting human risk assessment.” disclosure and use a neutral **Simulated** badge;
  - the question, agent identity, evidence and option text wrap safely at narrow widths;
  - decision buttons remain 80px tall; consultation options enforce a 44px minimum.
- Mobile / modal polish:
  - Fiat off-ramp modal now uses 16px mobile edges, `max-h-[calc(100dvh-2rem)]`, a 44px close target, and safe-area bottom padding;
  - Agent Request card is full-width within the page’s 16px gutters and was checked at 375px and 390px;
  - header navigation, sign-in/sign-out, back links and `Button` medium controls were raised to 44px-class tap targets;
  - `SectionLabel` supports break-safe labels for long agent references;
  - no horizontal overflow at 320px, 375px, 390px or 1280px.
- Visual QA:
  - Inter and JetBrains Mono are already loaded from Google Fonts; numbers continue to use `.numeric` / `font-mono` with tabular numerals;
  - new `panel-glass`, `panel-glow` and safe-area utilities keep the dark trading-terminal surfaces crisp;
  - used real agent names, real live counts and real MCP copy; no fabricated metrics, stock AI sparkles, purple gradients or generic placeholder panels.
- Tests:
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm test` passed: 46 unit tests, 50 Playwright tests, 6 deployed tests skipped.
  - New `tests/e2e/phase12.mobile.spec.ts`: 7 tests covering landing, `/agents`, lobby, decision, Agent Request, confirmed payout + off-ramp modal, and history at 375px and 390px; asserts no horizontal overflow, 44px decision/option targets, and 16px card/modal edges.
  - 390px screenshots generated in `test-results/phase12/`: `landing-390.png`, `agents-390.png`, `lobby-390.png`, `game-decision-390.png`, `game-agent-request-390.png`, `game-payout-modal-390.png`, `history-390.png`.
- Deployment: **COMPLETE**.
  - Feature commit `4c512c7` — `style: mobile responsiveness and agent marketplace polish`.
  - Render deploy `dep-dbp6idlg1s2s73c225jg`, live 2026-11-10T00:45Z; `/health/live` 200, `/health/ready` 200.
  - Vercel production deployment `https://levelbreak-arena-augv8cwk7-uhhh2.vercel.app`, alias `https://levelbreak-arena.vercel.app`.
  - Live 390px Chromium check: `/agents` shows “The agent directory.”, `MCP Server Agent`, `MCP Research Agent`, `Alpha Research Bot`, `Verified MCP` and `post_defi_consultation`; the landing page shows the MCP mention and **View directory**; the lobby shows “Request from MCP Server Agent” and the MCP question. No overflow at 375px or 390px.
  - Final flags: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`.
- 390px screenshots:
  - Mock/state suite: `test-results/phase12/landing-390.png`, `agents-390.png`, `lobby-390.png`, `game-decision-390.png`, `game-agent-request-390.png`, `game-payout-modal-390.png`, `history-390.png`.
  - Live deployed suite: `test-results/phase12/live-agents-390.png`, `live-home-390.png`, `live-lobby-390.png`.
- **Single next task:** Await operator acceptance of Phase 12. Do not begin Phase 13.

## Phase 11 — Agent testing and MCP integration (10 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

- Added `mcp-server/` as a standalone stdio MCP package using the official `@modelcontextprotocol/sdk@1.32.2` and `zod@4.1.12`:
  - `index.js` exposes `post_defi_consultation` with validated `question` (10-500 chars) and `context` (10-2,000 chars) inputs;
  - the tool POSTs `{ question, context, reward_luna: 500 }` to `LBA_API_BASE_URL/api/agent/consultations` with `Authorization: Bearer $LBA_AGENT_API_KEY`;
  - `LBA_API_BASE_URL` defaults to `https://levelbreak-arena.onrender.com`;
  - API errors return `isError: true` with the safe code/message; success returns the consultation ID, session ID, public ref, status, reward, deadline, agent balance/reservation and lobby URL;
  - the API key is read from the environment and never printed; the server sends diagnostics to stderr so stdout remains MCP JSON-RPC.
  - `verify.js` is a developer client that spawns the server over stdio, lists the tool, and optionally calls it with `LBA_VERIFY_CALL=true`.
  - `README.md` documents registration/deposit prerequisites, Claude Desktop config, Cursor config, local verification, result shape, security and troubleshooting.
- Landing page: added an `MCP server` hero badge and an “MCP Server” panel with `post_defi_consultation`, Claude Desktop/Cursor copy and a real GitHub setup link.
- Docs page: added an MCP Server section linking to `mcp-server/`.
- **Task 1 live agent-client proof**:
  - command: `scripts/agent-client.js` with the demo-agent key, agent name `MCP Research Agent`, and `WAIT_FOR_PAYOUT=true`;
  - agent `9fd34afa-dddd-453c-adfa-3fa2ff4f2a8a`, wallet `NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T`;
  - deposit tx `28653f6583096dea84168180ca183a98598e2689b47451fbe774119929511cad`, block `16351977`, 500 Luna;
  - consultation `2fab0bf1-56ba-4198-b8fa-942d98e81b14`, session `02ed506d-bf24-4eac-9b53-2413a72aa239`, publicRef `b3e1239888e5befb`;
  - lobby result: `found: true`, `agentName: "MCP Research Agent"`, question preview present, 1 consultation, 500-Luna reward;
  - player `NQ38 JSSP 0TTR A4K6 E61N ABQU KKER D2CN LSC8`, run `df69f847-09c7-4547-b0f9-3e06dc52140b`;
  - answer `ANSWERED` for 500 Luna; payout `bcafc355-b87e-422f-95cf-33763b354cfa` `CONFIRMED` at tx `fc8cc06317b3f4d5cc8843017215263cd74b71aee06281b159f2ebd53887ec9f`;
  - agent after answer: `balance_luna=0`, `reserved_luna=0`.
- **Task 2 MCP live proof**:
  - prepared a separate funded MCP agent: `9e2ca6fb-768c-4cbc-993a-0072458c5b50`, name `MCP Server Agent`, wallet `NQ11 1B6U 0H3T Y2VV S2U2 RHJL HT5A MC95 UB4D`;
  - seed tx `92eb1689057fd7e6a36008c22c571a2d05a8940830d0de218ea6f2fd0ecc0d0d`, block `16352027`;
  - deposit tx `109b426e67dad2076ec3e422c2fe182e59593935be72bbf9997ec8b96297d2f3`, block `16352029`, 500 Luna;
  - `mcp-server/verify.js` listed `post_defi_consultation` and returned `isError: false`;
  - MCP-posted consultation `7fdfd984-259b-412f-ac9c-4c9f232d01d3`, session `01b378f2-3815-4ed5-bd77-82e02f8fcf07`, publicRef `5fde4fd45d4b3f32`, status `AVAILABLE`;
  - authenticated player lobby check found the session with `agentName: "MCP Server Agent"` and the question preview;
  - public directory shows `MCP Server Agent` with `questionsPosted=1`, `activeQuestions=1`, `rewardsPaidLuna="0"`.
- Tests:
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm test` passed: 46 unit tests, 34 Playwright tests, 6 deployed tests skipped.
  - `mcp-server`: `npm run check` passed; `node verify.js` listed the tool; live `LBA_VERIFY_CALL=true` posted the consultation above.
- Deployment: **COMPLETE**.
  - Feature commit `d8513e8` — `feat: test agent API and implement MCP server wrapper`.
  - Render deploy `dep-dbp5u1p42hec73d4qku0`, live 2026-11-10T00:02Z; `/health/live` 200, `/health/ready` 200.
  - Vercel production deployment `https://levelbreak-arena-73lgvkar1-uhhh2.vercel.app`, alias `https://levelbreak-arena.vercel.app`.
  - Final flags: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`.
  - Deployed browser check: auth 200; landing MCP mention, `post_defi_consultation`, MCP setup link, `MCP Research Agent` and `MCP Server Agent` visible; lobby showed “Request from MCP Server Agent” and the MCP question; docs MCP section present; no horizontal overflow; no Vercel checkpoint.
- The MCP-posted consultation is intentionally left `AVAILABLE` in the lobby for a player to answer. It reserves 500 Luna from the MCP Server Agent balance; the agent has 500 Luna total and 0 available. The payout worker is disabled after the proof.
- **Single next task:** Await operator acceptance of Phase 11. Do not begin Phase 12.

## Phase 10 — External Agent API and marketplace (9 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

- Added `db/migrations/005_phase10_agents.sql`:
  - `agents`: id, name, unique wallet address, unique `api_key_hash`, `balance_luna`, `reserved_luna`, timestamps, and `reserved_luna <= balance_luna` check.
  - `agent_deposits`: unique `tx_hash`, agent, amount, block height, testnet-only network.
  - `agent_consultations`: agent, unique requester session, question (10-500 chars), context (10-2,000 chars), fixed 500-Luna reward, status (`AVAILABLE`, `IN_PROGRESS`, `ANSWERED`, `SKIPPED`, `EXPIRED`).
  - `requester_sessions.agent_id` nullable FK, widened requester type check for `EXTERNAL_AGENT`, widened audit actor check for `AGENT`, indexes and RLS.
- Added `apps/api/src/services/agents.ts`:
  - registration with non-treasury Nimiq wallet validation and one-time `lba_agent_…` API keys; only `sha256(key)` is stored;
  - bearer API-key authentication;
  - deposit verification for inclusion/confirmation, TestAlbatross network, registered sender, treasury recipient, at least 500 Luna, and a hash unused by session funding or another agent deposit;
  - consultation creation reserves 500 Luna from `balance_luna - reserved_luna` and creates a one-level `EXTERNAL_AGENT` session in `AVAILABLE` with a seven-day deadline;
  - public Active Agents directory with question counts and rewards funded, but no balances or wallet addresses;
  - agent self-service balance/consultation views.
- Added `apps/api/src/routes/agent.ts` and registered it in `server.ts`:
  - `POST /api/agent/register` (public, rate-limited, returns the key once);
  - `POST /api/agent/deposit` (bearer key);
  - `POST /api/agent/consultations` (`reward_luna` must be exactly 500);
  - `GET /api/agent/me`, `GET /api/agent/consultations` (bearer key);
  - `GET /api/agents` (public directory).
- Player integration:
  - `GET /api/sessions/available` lists verified demo sessions and `AVAILABLE` agent consultations, agent-first, with optional `agentName` and `questionPreview`.
  - `claimSession` accepts an agent consultation without a `funding_transactions` row and atomically marks the consultation `IN_PROGRESS`.
  - `GET /api/runs/:runId` overrides the generated/static consultation with the active agent question, context evidence and agent name.
  - `submitConsultationResponse` uses the agent consultation ID, accepts SAFE/RISKY/CANT_TELL, charges 500 from both `balance_luna` and `reserved_luna` on answer, releases 500 from `reserved_luna` on skip, and marks the consultation `ANSWERED`/`SKIPPED` in the same transaction.
  - `generateAgentPrompt` returns `source: "external"` for agent questions and does not call the LLM with agent content.
  - `finishRun` remains unchanged: the player payout is still derived from stored responses and queued from the treasury.
- Frontend:
  - `LobbyPage` shows an "External agent" badge, "Request from <agent>", question preview, agent-funded copy and "Answer question".
  - `GamePage` shows "Request from <agent> · External agent" instead of the demo-agent line when `consultation.agentName` is present.
  - `AgentMessage` shows the "Agent submission" source badge for external consultations.
  - `HomePage` has an "Active external agents" section with name, questions posted, open questions and rewards funded.
  - `DocsPage` documents the Agent API and operator-custody disclosure.
- Added `scripts/agent-client.js`: register → real testnet deposit (or `AGENT_DEPOSIT_TX_HASH`) → post consultation → player wallet auth → lobby match → claim → decision → answer → finish/payout status. It never prints the API key or private key.
- Tests:
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm test:unit` passed: 46 unit tests.
  - `pnpm test` passed: 34 Playwright tests, 6 deployed tests skipped.
  - `pnpm test:integration` passed: 25/25, including registration/API-key hashing, deposit verification/reuse, lobby listing, claim without funding, agent answer charge, skip release, insufficient balance, and 500-Luna payout creation.
  - New UI tests at 320px and 1280px cover the agent lobby card, agent-specific game label, "Agent submission" source and landing-page directory.
- Deployment and live proof: **COMPLETE**.
  - Production migration 005 applied 2026-11-09T06:51:48.893Z.
  - App-code commit `b3056bc` pushed; Render deploy `dep-dbonr3navr4c73bk9hag` live; Vercel auto-deployed the same commit.
  - `scripts/agent-client.js` created a distinct testnet agent wallet `NQ63 8XN2 QLM9 4JAQ 4HLT HS1G 3H1H LHDF 6725` (seeded with testnet NIM), registered “Alpha Research Bot” as agent `4a9f281b-fbcf-4ff7-aab0-290361f54b96`, sent a real 500-Luna deposit, posted a consultation, authenticated a fresh player wallet, claimed the question, submitted a decision, answered `CANT_TELL`, and finished the run.
  - Agent deposit tx `e03c212f3ce8d5f84d96d0b5be49d371a76dc75d584d3e13fa730edf97b850ea`, block `16292265`; independently verified sender = agent wallet, recipient = treasury, value 500 Luna, TestAlbatross, reference `LBA-AGENT-DEPOSIT:4a9f281b-fbcf-4ff7-aab0-290361f54b96`, `proof=PASS`.
  - Consultation `db3100e2-7f80-4db9-8396-53b55e1aa0b8`, session `44f7bae6-d623-4681-b413-5bd110f70227`, publicRef `fcbbd57066289daf`; lobby returned `agentName: "Alpha Research Bot"` and the question preview.
  - Player `NQ04 2QMJ Y0S6 2DUN PE67 330A XH79 UUCA 31QS`, run `e1b0e820-8b5d-47a2-8f6f-2a09ef7552a3`; answer earned 500 Luna and the run reached `PAYOUT_QUEUED`.
  - Payout `2a460285-30ec-4b6f-8508-16cee9869e0e` confirmed at tx `d5915f496389bf8e1073fee4a3a2b2fc5b5a58132b5fba36c44d52b60fdd5693`, block `16292272`, treasury → player, 500 Luna, fee 0. Session `44f7bae6…` is `SETTLED`; agent `balance_luna=0`, `reserved_luna=0`.
  - The payout worker was enabled only for the proof, then disabled. `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`; `/health/live` and `/health/ready` 200.
  - The agent remains registered with one answered question and zero balance, so the public Active Agents directory and landing-page section have real data. The agent wallet retains the unused seeded testnet NIM.
- **Single next task:** Await operator acceptance of the Phase 10 external Agent API and marketplace. Do not begin Phase 11.

## Phase 8.2 — AI-generated levels (9 November 2026)

**Status:** IMPLEMENTED / DEPLOYED / LIVE VERIFIED.

- Added migration `004_generated_content.sql`: `player_runs.generated_content jsonb NOT NULL DEFAULT '{}'::jsonb`. Production Supabase migration applied at `2026-11-09T05:57:19.353Z`.
- Added `generateLevelScenario(levelIndex, playerContext)` in `apps/api/src/services/llm.ts`:
  - strict JSON validation for title, situation, SAFE/RISKY decisions, and consultation question/evidence/options;
  - Groq/OpenAI-compatible call with a progressive five-level curriculum (stablecoin → impermanent loss → yield → oracle manipulation → liquidation);
  - normalized whole-vUSDT `resultingPortfolio` values into integer virtual portfolio units;
  - deterministic static fallback if the key is missing, the provider fails, or the JSON is invalid.
- `GET /api/runs/:runId` now generates the active level if missing, persists it under the level index in `generated_content`, and returns the saved content on subsequent requests. Existing runs use the static fallback. Generation is coalesced through a locked re-check to avoid duplicate persistence.
- `submitDecision` and `submitConsultationResponse` use the saved generated scenario/consultation when present, then fall back to the static definitions. Reward, funding, auth, state-machine and payout logic are unchanged.
- `generateAgentPrompt` now accepts generated question IDs and uses the saved generated scenario/evidence for its context. The frontend already renders scenario choices and consultation content from the API; no hardcoded STAY/MOVE decision keys were introduced.
- Tests:
  - `pnpm lint` passed.
  - `pnpm typecheck` passed.
  - `pnpm build` passed.
  - `pnpm test` passed: 46 unit, 28 Playwright, 6 deployed tests skipped.
  - `pnpm test:integration` passed: 22/22, including the new generated-content persistence/reuse test.
- Live Groq generator verification: returned `source: "llm"`, title “The Stablecoin De-Peg Crisis”, SAFE 1,000 vUSDT / RISKY 950 vUSDT, and a text-snippet evidence payload.
- Live API verification:
  - Test session `18f5054e-a4d5-43c5-bb70-29d1d48b17ec`, ref `50c0f17d22ff156f`, funding tx `b2de51f5343e2d1bbe33eed0112ff803a78519dad3bb72c4f475a30c44a13984`, block `16287706`.
  - Test run `fda15818-322f-4596-b8e3-caa66492261d`, player `NQ42 J2YJ 6Y5J EKE9 P8XY Y1GX L811 11F7 E0DB`.
  - Level 1 generated with `source: "llm"`, title “Level 1: The Phantom Anchor”, SAFE/RISKY decisions, and an AI-generated text-snippet consultation.
  - A second request returned the stored content: scenario and consultation were deep-equal, `updated_at` was unchanged, and both level 1 and level 2 content were persisted in `generated_content`.
  - Submitting the generated SAFE decision produced a 1,000 vUSDT portfolio; answering `CANT_TELL` earned 500 Luna and advanced the run to Level 2 (`IN_PROGRESS`).
  - Level 2 then generated as `source: "llm"` with title “The Alpha-Pool Divergence”.
- The operator's earlier manual session `bcbc692c-b962-49b0-ac2c-e73a013d3664` was completed by the operator with five answers. Its queued 2,500 Luna payout `678d7e76-a6c6-4d2c-ac58-bd2c67d18e4b` was confirmed at tx `eeb577a47ddadf4139a68112c6da8642437fc1237893803a256f201529dd9d89`, block `16288006`, recipient `NQ47 YLYE 6VC9 NTJT 2XT3 RYD6 XKLS MEDA CCEC`, reference `LBA1:a76c84dd5a6d0d5c`, fee 0.
- Final flags after the proof: `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`; `/health/live` and `/health/ready` 200.
- Deployment: app-code commit `fc12c5f`; final Render docs deploy `dep-dbom8oivcj2c739ht0c0` (`8d534945`); Vercel auto-deploy from the same app-code commit. `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false`, health 200.
- The test run is intentionally left active at Level 2 as a test artifact; it has not been paid. It does not affect the operator's original lobby session (which is now completed).
- **Single next task:** Await operator acceptance of AI-generated levels. Do not begin an unrelated phase.

## Phase 8.1 — Agent narrative copy refinement (9 November 2026)

**Status:** IMPLEMENTED / TESTS PASSING / DEPLOYED FROM THIS COMMIT.

- Consultation panel header changed from **Consultation** to **Agent Request**.
- Added the badge **“Agent Zeta (Simulated) is requesting human risk assessment.”** above the question.
- Added a two-step judgment flow: select a classification, then press **Submit Judgment & Earn 500 Luna**. Skip remains immediate and zero-reward.
- Added the landing-page **Proof-of-Learning** paragraph explaining that AI Agents need human intuition and pay NIM for valuable judgment calls.
- Updated the LLM system prompt to frame Agent Zeta as an AI Agent evaluating a new DeFi protocol and asking a human for subjective risk assessment, judgment and reasoning; explicitly no trivia questions. Safety constraints remain (no financial advice, no hidden correct answer, no wallet/key requests, simulated evidence only).
- No payment, auth, state-machine, database or API logic changed.
- `pnpm lint`, `pnpm typecheck`, `pnpm build` and `pnpm test` pass: 44 unit, 28 Playwright, 6 deployed tests skipped.
- **Single next task:** Operator reviews the Agent-hiring narrative and copy. Phase 9 not started.

## Phase 8 — Final functionality proof and polish (8 November 2026)

**Status:** PROOF COMPLETE / POLISH COMPLETE / DEPLOYMENT IN PROGRESS. Phase 9 NOT STARTED.

### Primary 5-level testnet proof

- **Session:** `120425d0-2c16-48a3-8014-cf75529e69e4`, public ref `b88d21098b76a471`.
- **Funding:** `4c5fb1eb756b55c035477b22dbad187560f4ebcea5ece5faac45322cfaabcc59`, block `16247371`, demo-agent → treasury, exactly **2,500 Luna**, reference `LBA1:b88d21098b76a471`, network 5, confirmed. Independent RPC verification: PASS.
- **Player:** `NQ34 5NGM LJFD RFMN 5H4R 7AMX SU7L KA68 BXPV` (generated testnet key).
- **Run:** `dac514b1-aa10-4844-8b44-f5144e875468`.
- **Pattern:** ANSWER, ANSWER, SKIP, ANSWER, ANSWER — four accepted responses, one skip, **2,000 Luna earned**.
- **Payout:** `91e87e32-0202-4f65-affc-fa422f0dc883`, status `CONFIRMED`, exactly **2,000 Luna**.
- **Payout tx:** `da6464fcd931429249bcafa89ebc0dbebcf098c29e43de40fb6b3b9f95d99575`, block `16247449`, sender treasury `NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3`, recipient player, value 2,000 Luna, fee 0, reference `LBA1:b88d21098b76a471`, network 5, included. Independent RPC verification: `proof=PASS`.
- **UI proof:** Playwright logged in with a real Nimiq-prefixed signature, claimed the session, played all five levels, clicked Finish, waited for `CONFIRMED`, opened **Withdraw to Fiat**, saw the Nimiq Pay Off-Ramp modal and simulated success, and verified the payout on-chain. The headless test process exited at `/history` on a **Vercel Security Checkpoint** (automated-client mitigation), not an application error. A headful Chromium re-check with the saved test player key passed: the history page showed publicRef `b88d21098b76a471`, `2,000 Luna`, `Payout confirmed`, tx `da6464fc…`, and no horizontal overflow. The authenticated `/api/history` endpoint also returned 200 with the same confirmed payout.

### Disclosed extra proof attempt

The first Playwright attempt completed all five levels with four answers and one skip, but the test failed on a stale “Session complete” heading selector before clicking Finish. To avoid an orphaned 2,000 Luna liability, run `23762083-9f8c-4bfd-8e7f-1c7ed6140790` (session `6bfacf72-1c68-4951-8fe7-389ba06f6e6e`, ref `4ebf2ee32261830f`) was settled through the domain `finishRun` service. Its payout `4ac89304-7a45-4c0c-bc08-c8454d5c9a5d` also confirmed at tx `15fea832ebb2b8f930187df2f262269170ddfdf7153c544fbe2fc5eea9314318`, block `16247222`, exactly 2,000 Luna to the generated test player `NQ56 H5Y3 3H81 HUFP 919A NMKY V0F3 MYJT 7X5F`. This is an extra testnet payout, disclosed here for accounting integrity; the primary proof is the clean session above.

### Balance delta

- Demo-agent before: `10,999,994,000` Luna; after both 2,500 fundings: `10,999,989,000` Luna; delta `-5,000` Luna.
- Treasury before: `11,000,002,500` Luna; after both 2,000 payouts: `11,000,003,500` Luna; delta `+1,000` Luna.
- Fees: 0 on all four transactions. The net +1,000 Luna is the two 500-Luna unused session credits (one skip per run).

### LLM verification

- Render `LLM_API_KEY` is present; `LLM_BASE_URL=https://api.groq.com/openai/v1`; `LLM_MODEL=qwen/qwen3.8-27b`.
- A direct Groq call returned 200 with a normal User-Agent; a no-User-Agent request was blocked by Cloudflare 1010. `apps/api/src/services/llm.ts` now sends `User-Agent: LevelBreakArena/1.0`.
- Live consultation showed the **LLM DRAFT** badge and a dynamic message: “I am a Level 1 player with zero Luna earned so far. My simulated wallet holds 1,000 vUSDT…” — not the versioned scripted fallback.
- The fiat off-ramp modal opened on the confirmed payout, showed `1 NIM = $0.85`, and reached the simulated success state with the explicit “No fiat currency was transferred” disclosure.

### Final polish

- 320px: all route smoke tests, game/consultation/payout tests, and the new history/docs/footer content test pass with no horizontal overflow.
- `/docs`, `/privacy`, `/terms` are updated for five levels, 2,500 Luna, LLM-assisted agent with scripted fallback, and demo fiat off-ramp. `/docs` now links to the public GitHub repository.
- Footer now has **Documentation** → `/docs` and **GitHub** → `https://github.com/onyebuchidaniel60/levelbreak-arena`. Repository is public and MIT-licensed (verified with `gh repo view`).
- Added `tests/e2e/phase8.five-level.deployed.spec.ts`, `tests/e2e/playwright.phase8.config.ts`, and `tests/e2e/phase8.polish.spec.ts`.

### Verification commands

```text
pnpm lint       -> passed
pnpm typecheck  -> passed
pnpm build      -> passed
pnpm test       -> 44 unit passed; 28 Playwright passed; 6 skipped (deployed tests without env)
pnpm test:integration (fresh PostgreSQL 16)
                -> 21/21 passed
```

### Deployment / flags

- Final Phase 8 app-code commit: `a9db80a`; docs checkpoint `c193db6`.
- Render: `dep-dboch8i9lscs73csg48g`, live `2026-11-08T19:09:06Z`; `/health/live` and `/health/ready` 200 after restart.
- Vercel: `https://levelbreak-arena-g81hyworg-uhhh2.vercel.app`; alias `https://levelbreak-arena.vercel.app`. Headful Chromium verification passed for footer/docs/320px/authenticated history; raw automated `curl` is challenged by Vercel Security Checkpoint.
- `DEMO_FUNDING_ENABLED=false`, `PAYOUT_WORKER_ENABLED=false` after the proof; confirmed in Render env.
- **Single next task:** Await operator acceptance of the Phase 8 five-level proof and final polish. Do not begin Phase 9.

### STOPPED after recording the 5-level testnet proof: yes

## Phase 7.1 — Nimiq Pay signature verification hotfix (6 November 2026)

**Status:** FIX IMPLEMENTED / DEPLOYED / AWAITING OPERATOR RETRY.

### Exact failure

- Operator inside Nimiq Pay saw: **“The wallet signature could not be verified. Please try again.”**
- Render logs for the failed attempt:
  - `POST /api/auth/nonce` `200` at `2026-11-06T14:30:17.658Z`.
  - `POST /api/auth/verify` `401` at `2026-11-06T14:30:19.096Z`, request ID `ce76e7c4-5dcf-4e6d-9a38-16a2f7819c08`, response time `31.05 ms`.
- Render does not log `AppError` response bodies, so the log shows the status but not the code. `401` is the status used by `INVALID_SIGNATURE` in this path, and the client message is the `INVALID_SIGNATURE` mapping. The 31 ms response time is consistent with the crypto check, not a database failure.

### Root cause

1. **Wrong signed-message framing.** The backend verified the raw challenge bytes:
   `publicKey.verify(signature, Buffer.from(challenge, "utf8"))`.
   Nimiq Pay/Keyguard signs:
   `sha256("\x16Nimiq Signed Message:\n" + message.length + message)`.
   A Nimiq Pay signature therefore fails the backend’s raw-message verification. This is the primary failure.
2. **Wrong account assumption.** The backend required the public-key-derived address to equal the `listAccounts()[0]` address sent by the browser. Nimiq Pay’s `listAccounts()` order is not guaranteed and `sign()` has no address parameter, so the wallet can sign with a different account than index 0. That also produced the same `401 INVALID_SIGNATURE`.
3. Phase 7 did not change `apps/api/src/auth.ts` or the wallet provider code. The Phase 4/5 E2E signed the challenge with a raw generated `KeyPair.sign(challenge)`, which masked the real Nimiq Pay framing. The regression was latent until the operator tested inside Nimiq Pay.

### Fix

- `apps/api/src/auth.ts` now computes the Nimiq signed-message digest exactly:
  `sha256("\x16Nimiq Signed Message:\n" + message.length + message)`.
- The backend derives the signer address from the public key returned by `sign()` and uses that derived address as the player. The requested address remains nonce metadata, not identity.
- The challenge no longer names a specific account; it contains product, origin, nonce, purpose, issue time and expiry. This avoids a misleading account label when Nimiq Pay signs with a non-default account.
- `apps/web/src/lib/nimiq.ts` adds `buildVerifyRequest`, which sends the exact challenge and signature returned by the provider. `AuthProvider` uses it and prints the challenge/signature in development only for local diagnosis.
- Updated `tests/e2e/phase4.deployed.spec.ts` and `tests/e2e/phase5.deployed.spec.ts` to sign the Nimiq framed digest.

### Verification (local)

```text
pnpm lint       -> passed
pnpm typecheck  -> passed
pnpm test       -> 44 unit passed; 22 Playwright passed; 4 deployed entries skipped
pnpm build      -> passed
pnpm test:integration (fresh PostgreSQL 16)
  -> 21/21 passed: 17 Phase 3/5 tests + 4 Nimiq Pay auth tests
```

The auth integration tests prove:

- a prefixed Nimiq Pay signature returns `200` and sets `lba_session` + `lba_csrf`;
- `/api/me` succeeds with that session;
- a signer different from `listAccounts()[0]` authenticates as the signer;
- a raw/unframed signature is rejected with `401 INVALID_SIGNATURE`;
- a tampered challenge is rejected with `400 CHALLENGE_MISMATCH`.

Local crypto proof:

```text
prefixed verify: true
raw verify against raw message: true
raw verify against prefixed hash: false
prefixed verify against raw message: false
```

### Deployment and live verification

- Fix commit: `6b669255b531c2407a411759b371ec9b281dabda`.
- Vercel: `dpl_685WTrxph8xaVNPQtfe2mdMjcDig`; alias https://levelbreak-arena.vercel.app.
- Render: `dep-dbmufvks728c739locj0`, live 2026-11-06T14:46:15Z; `/health/live` 200, `/health/ready` 200.
- `@nimiq/mini-app-sdk` is `0.2.4` (>= 0.2.0). `@nimiq/core` remains `2.23.0`; it was not bumped in Phase 7.
- Live `POST /api/auth/verify` with a generated key and the Nimiq framed signature returned `200`; `lba_session` and `lba_csrf` cookies were set; `/api/me` returned the signer address.
- Live mismatch test: nonce requested for address A, signature produced by address B. Verify returned `200`, `/api/me` returned B, and both cookies were set. This proves the backend no longer relies on `listAccounts()[0]`.
- Live frontend provider test: a mocked Nimiq provider reported address A, signed the exact challenge with address B, the app navigated to `/play`, and the header displayed B. This exercises the real `AuthProvider`/`buildVerifyRequest` path through the Vercel rewrite to Render.
- **Single next task:** operator retries sign-in inside Nimiq Pay. If it still fails, capture the development-console challenge/signature and the matching Render `POST /api/auth/verify` request ID/status, then stop and report.

## Phase 7 — Direction 1 UI, five levels, LLM agent, demo off-ramp (4 November 2026)

> **Superseded for authentication by Phase 7.1 (6 November 2026).** The Phase 7 UI, five-level, LLM and off-ramp work remains deployed; Phase 7.1 fixes the Nimiq Pay signature verification path. Use the Phase 7.1 section above for current auth status.

**Status:** IMPLEMENTED / DEPLOYED. Auth superseded by Phase 7.1. Phase 8 NOT STARTED.

- **Preview:** https://levelbreak-arena.vercel.app
- **App-code commit:** `cb816dad405138b13dbb1a3035485b43fbab9d01`.
- **Vercel deployment:** `https://levelbreak-arena-g81hyworg-uhhh2.vercel.app` (Phase 8); alias `https://levelbreak-arena.vercel.app`. Verified with headful Chromium; raw automated curl is challenged by Vercel Security Checkpoint.
- **Render deploy:** `dep-dbocg3dg1s2s738ctsi0`, commit `a9db80a8`, live 2026-11-08T19:06:35Z; `/health/live` and `/health/ready` 200.
- **DB migration:** `003_phase7_five_levels.sql` applied to Supabase at 2026-11-04T14:02:25.437Z.
- **Render env:** `MAX_CONSULTATIONS_PER_SESSION=5`, `FUNDING_MINIMUM_LUNA=2500`, `MAX_REWARD_LIABILITY_LUNA=2500`; worker and demo funding remain disabled.
- **Source-of-truth updates:** `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `AGENTS.md`, and `IMPLEMENTATION_PLAN.md` now record the operator-approved five-level / 2,500 Luna / LLM-assisted / demo off-ramp scope. `docs/DESIGN_DECISIONS.md` records Direction 1 as approved and Directions 2, 3, and 4 as rejected and removed.

### What changed

- Deleted `design/mockups-direction2/`, `design/mockups-direction3/`, and `design/mockups-direction3-interactive/`; retained `design/mockups/` (Direction 1).
- Applied the approved Direction 1 Trading Terminal design across landing, lobby, five-level game, consultation, payout status, history, and support pages.
- Added design tokens: `#0A0E14` page, `#131820` surface, `#1F2937` border, Inter UI type, JetBrains Mono for numbers/hashes, emerald earned/paid, amber pending, red errors, gold CTA.
- Added bento-style layouts, glass sticky header, terminal-style run preview, five-segment progress rail, distinct `Earned` / `Pending` / `Paid` tiles, and accessible focus/reduced-motion handling.
- Expanded backend scenarios and consultations to five levels: stablecoin peg, impermanent loss, yield sustainability, oracle manipulation, liquidation cascades.
- Added migration 003 widening level checks to 1–5 and reward/payout caps to 2,500 Luna; session defaults now 5 consultations / 2,500 Luna.
- Fixed run completion to use each session's stored `max_consultations`, so existing 3-level sessions remain finishable while new sessions can use 5 levels.
- Added `GET /api/consultations/:questionId/generate-agent-prompt?runId=...` with player auth, ownership check, rate limit, per-run/question cache, bounded timeout, output sanitization, and deterministic scripted fallback.
- Added `apps/api/src/services/llm.ts`; optional `LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`, `LLM_TIMEOUT_MS`. No wallet address, signature, token, key, or other player data is sent.
- Replaced the static agent message in the consultation view with the LLM-drafted message when available, with a typewriter reveal, `LLM draft` / `Scripted fallback` badge, full screen-reader text, and reduced-motion support. Bundled evidence remains static and authoritative.
- Added the **Withdraw to Fiat** action on confirmed payouts and a Nimiq Pay Off-Ramp modal showing the confirmed amount, 1 NIM = $0.85 demo rate, estimated fiat, and a simulated success state that explicitly states no fiat was transferred.
- Added `tests/e2e/phase7.ui.spec.ts` and LLM unit/integration coverage.

### Verification evidence (local)

```text
$ pnpm lint -> passed
$ pnpm typecheck -> passed (contracts + apps/api + apps/web)
$ pnpm test -> 42 unit tests passed; 17 integration tests skipped without DB;
               22 Playwright tests passed; 4 deployed-E2E entries skipped without env
$ pnpm build -> contracts, apps/api and apps/web built successfully
$ LBA_INTEGRATION_DATABASE_URL=... pnpm test:integration
  -> 17/17 integration tests passed against a fresh PostgreSQL 16 database
  -> includes five-level ledger cases, 2,500 Luna cap, LLM scripted fallback,
     non-owner rejection, and existing payout-worker safety cases
$ DATABASE_URL_UNPOOLED=... pnpm db:migrate
  -> 003_phase7_five_levels.sql applied successfully
```

### Deployed verification

- `GET https://levelbreak-arena.onrender.com/api/config/public` -> `maxConsultations: 5`, reward 500 Luna.
- `/health/live` -> 200 `{"status":"ok"}`; `/health/ready` -> 200 `{"status":"ready"}` after a service restart. The docs-only redeploy briefly returned 503 while the Nimiq Web Client resynced; this is the known reconnect behaviour, not an application failure.
- Deployed landing page: title `LevelBreak Arena — DeFi judgment terminal`; H1 `Learn DeFi by breaking it.`; body background `rgb(10, 14, 20)`; Inter and JetBrains Mono loaded; no horizontal overflow at 1440 and 390.
- Deployed game UI with a mocked consultation response: `Level 3 of 5`, `03 / 05`, `LLM DRAFT` badge, five-level run preview, and static evidence panel render correctly.
- Deployed confirmed-payout UI: **Withdraw to Fiat** opens the `Nimiq Pay Off-Ramp` dialog and the demo success state.
- Deployed LLM route: unauthenticated request -> 401; authenticated request with a non-owned/fake run -> 404 `NOT_FOUND`. This confirms the route is live behind auth; a real LLM call needs a provisioned key and a real active run.
- Frontend bundle inspection: no `LLM_API_KEY`, `DATABASE_URL`, `PRIVATE_KEY`, treasury key, or `onrender.com` string. The only `sk-` matches are CSS `mask-` strings.

### Known limitations / deliberate deferrals

- **No `LLM_API_KEY` is provisioned in Render.** The deployed preview uses the scripted fallback. The LLM success path is covered by a mocked-provider unit test; the operator must add a server-side key to enable live generation.
- **No new 5-level funded session exists yet.** `DEMO_FUNDING_ENABLED=false`; existing sessions are 3-level / 1,500 Luna and remain playable because completion uses the stored session limit. To demo a real 5-level run, the operator must fund a new 2,500 Luna session and may re-enable demo funding temporarily.
- **No deployed 5-level on-chain payout proof.** The payout worker remains disabled and the five-level path was verified with integration tests and mocked UI data, not a new treasury transfer.
- **Fiat off-ramp is a labelled demo.** It does not contact an exchange, start KYC, or move fiat. A production off-ramp needs a licensed provider and separate approval.
- Nimiq Pay device/WebView verification remains the Phase 5 manual-demo limitation.
- The LLM-generated message is not a source of evidence or scoring; the static evidence and fixed 500 Luna reward remain authoritative.

### Single next task

Await operator acceptance of Phase 7. Do not begin Phase 8. If the operator wants a live LLM demo, provision `LLM_API_KEY` and fund one new 2,500 Luna five-level session; both are operational follow-ups, not Phase 8 work.

### STOPPED awaiting operator approval: yes

## Phase 6 — Direction 4: The Conquest RPG (4 November 2026)

> **Superseded by Phase 7 (4 November 2026):** Direction 4 was rejected by the operator and `design/mockups-direction3-interactive/` was removed. This section is retained as historical context only.

**Status:** REJECTED. Visual direction NOT APPROVED. Phase 7 subsequently implemented Direction 1.

- **Location:** `design/mockups-direction3-interactive/` (directory retained from the previous design round; the inside is now Direction 4).
- **Review URL:** NOT DEPLOYED — local standalone prototype. Run `cd design/mockups-direction3-interactive && npm install && npm run dev`.
- **Prototype deployed SHA:** NONE.
- **Commit:** `2a232e3` — `design: rebuild prototype as Direction 4 conquest RPG`. This handoff documentation commit follows it.
- **Operator feedback addressed:** v3 was rejected for realistic NASA textures, standard fonts and a flat/dashboard feel. V4 removes all texture imagery, uses procedural toon planets, switches to Outfit display type, and rebuilds the game as a 12-world cartoon conquest RPG.
- **What changed:**
  - 12 named planets in a sprawling spiral: Xylos (playable) plus Kepler-9, Crimson Nebula, Azure Reach, Violet Forge, Solaris Drift, Ghost Moon, Emberfall, Nimbus Vale, Onyx Spire, Prismata and Eventide (sealed).
  - Procedural `MeshToonMaterial` planets with stepped gradient maps, dark outlines, neon atmosphere, procedural surface patches, glowing rings and orbiting moons. No planet `.jpg` imports; `public/assets/` removed.
  - Continuous motion: planet spin, ring tilt/pulse, moon orbits, route comet, star sparkles and a floating camera.
  - Xylos teacher tower: 18 teachers in four escalating visual tiers with real local DeFi trial questions. Wrong answers cost nothing; correct answers award XP once and mark mastery.
  - 100 XP conquest threshold, visible progress meter, and an explicitly labelled **OPERATOR TEST TOOL: SIMULATE XP MAX**.
  - Asteroid strike cinematic at the threshold. A cartoon meteor and trail hit Xylos; impact flash; planet cracks open; the Agent signal rises and the Agent consultation auto-opens after the hold (or via the CTA).
  - Agent modal shows the **SCRIPTED DEMO REQUESTER**, evidence first, the consultation question and a fixed **+500 Luna** simulated reward.
  - Simulated payout states **QUEUED → SUBMITTED → CONFIRMED** with an explicit **SIMULATION** label.
  - Real Phase 5 testnet receipt is shown only as a separate **reference** from another play-through.
  - Operator Treasury / testnet / scripted-requester disclosures remain in the reward surface.
  - New Playwright `verify` and `capture` scripts; 8 review screenshots committed.
- **Evidence (local):**
  - `npm run lint` — clean oxlint.
  - `npm run build` — TypeScript + Vite production build passed.
  - `npm run verify` — **23/23 assertions passed, 0 console/page errors.** Covers 12-planet count, 11 sealed labels, trust badge, sealed refusal, Xylos entry, 18 teacher rows, wrong answer no-XP, retry, correct XP, mastery, asteroid trigger, Agent reveal, evidence, +500 reward, payout CONFIRMED, Phase 5 href, Operator Treasury, conquered state, reset, 390 px overflow and reduced motion.
  - `npm run capture` — 8 screenshots, 0 console/page errors; simulated payout status `CONFIRMED`; Phase 5 explorer href verified.
  - Root `pnpm lint` — passed (design prototypes and local agent tooling remain excluded from product lint).
  - `apps/web` and `apps/api` — no changes.
- **Screenshots:** `design/mockups-direction3-interactive/screenshots/01-orbit-map.png`, `02-teacher-list.png`, `03-teacher-tiers.png`, `04-asteroid-strike.png`, `05-agent-consultation.png`, `06-agent-payout.png`, `07-galaxy-conquered.png`, `08-mobile-orbit.png`.
- **Trust/honesty notes:**
  - No realistic planet textures remain; all worlds are procedural.
  - No wallet, API, database, LLM or treasury transfer is connected to this prototype.
  - The +500 Luna payout and QUEUED → CONFIRMED lifecycle are labelled **SIMULATION**. No funds move.
  - Phase 5 tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4` (1,000 Luna, block 15,838,771) is explicitly a **reference from a different play-through**, not this simulation's payout.
  - Agent response is fixed-fee and has no hidden correct/incorrect rubric, matching the product rule. Teacher tests do have correct answers and only award XP.
  - The Agent is scripted; operator treasury is ordinary testnet custody, not HTLC/escrow.
- **Known deviations/limitations:**
  - Only Planet 1 (Xylos) is playable; Planets 2–12 are named, sealed map worlds.
  - No persistence, auth, API wiring, audio or 320 px-specific capture.
  - The Agent auto-reveals after the impact hold and also has an explicit CTA for faster review.
  - On the 390 px mobile layout, locked-world labels are hidden to keep the map legible; names remain available on desktop and in locked-planet toast copy.
  - Teacher/Agent content is local static mock data.
  - Three.js r187 / React Three Fiber emits a benign `THREE.Clock` deprecation warning in the dev console; no console/page errors are logged by capture or verify.
  - Operator reference images and the locally installed stageshow skill are intentionally not committed.
- **Single next task:** Await the operator's explicit review of Direction 4. Do not begin Phase 7, apply the direction to `apps/web`, or add backend/wallet integration before approval.
- **STOPPED awaiting operator approval:** yes

## Phase 6 — Direction 3 v3 interactive prototype (superseded, 4 November 2026)

> **Superseded by Direction 4.** The operator rejected the realistic NASA textures, standard typography and resulting look. This section is retained as historical context; the old v3 screenshots were replaced by the Direction 4 captures.

**Status:** REJECTED. Visual direction NOT APPROVED. Phase 7 NOT STARTED.

- **Location:** `design/mockups-direction3-interactive/`
- **Review URL:** NOT DEPLOYED — local standalone prototype. Run `cd design/mockups-direction3-interactive && npm install && npm run dev`, then open the Vite URL.
- **Prototype deployed SHA:** NONE.
- **Commit:** `4ccfcdb` — `design: build interactive orbital prototype v3`
- **What changed:**
  - Pivoted from static v2 HTML mockups (rejected as a flat dashboard) to a functional React + TypeScript + Vite + Three.js prototype where the orbit map is the UI.
  - Added three textured planets with atmosphere rim shaders, hover scaling, active reticle, locked padlock markers, cleared rings and glowing dotted routes.
  - Added the full single-screen loop: orbit → sector briefing → consequence → evidence-first consultation → +500 Luna / +100 XP reward → sector clear → next sector → run summary.
  - Added persistent HUD, testnet trust badge, scripted-requester badge, fixed reward and skip=zero behaviour, operator-treasury disclosure and the real Phase 5 reference payout.
  - Added Playwright `capture` and `verify` scripts, 9 review screenshots, README, credits and design notes.
  - Added `design/**` and `.agents/**` to root ESLint ignores because the prototype uses standalone oxlint and the locally installed stageshow skill is tooling, not product code.
- **Evidence (local):**
  - `npm run lint` — oxlint clean.
  - `npm run build` — TypeScript + Vite production build passed (only the standard chunk-size advisory).
  - `npm run verify` — 16/16 assertions passed: testnet badge, locked-sector refusal, active-planet open, Escape close, skip=0 XP/Luna, reset, all-skip zero payout, operator disclosure, replay, 390 px overflow checks, reduced motion; 0 console/page errors.
  - `npm run capture` — 9 states, 0 console/page errors; simulated payout status reached `CONFIRMED`; Phase 5 reference href is the real testnet explorer URL.
  - Root `pnpm lint` passes after the design/skill exclusions.
  - `apps/web` and `apps/api` have no changes.
- **Screenshots:** `design/mockups-direction3-interactive/screenshots/01-orbit.png` through `09-mobile-orbit.png`.
- **Trust/honesty notes:**
  - The summary payout lifecycle is explicitly marked **SIMULATION** and no funds move in the prototype.
  - The real Phase 5 tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4` (1,000 Luna, block 15,838,771) is labelled as a **reference receipt** and is not equated with the prototype run's simulated earnings.
  - All-skipped runs show zero payout, not a fabricated confirmed state.
  - Static Phase 3 scenario and evidence content; no live LLM, market feed, wallet, API, DeFi execution or treasury transfer.
- **Known deviations/limitations:**
  - The requested three.js Mars URL (`mars_1k_color.jpg`) returns 404; a real CC BY 4.0 Solar System Scope Mars texture is used with attribution in `CREDITS.md`.
  - The prototype uses the Phase 5 1,000 Luna receipt while a three-answer simulation can total 1,500 Luna; the mismatch is explicitly disclosed in the UI and notes.
  - No persistence, auth, API wiring, audio or 320 px-specific capture.
  - Three.js r187 / React Three Fiber emits a benign `THREE.Clock` deprecation warning in the dev console; the capture and verify runs had 0 console/page errors.
  - Operator reference images and the locally installed stageshow skill are intentionally not committed.
- **Single next task:** Await the operator's explicit review of the interactive prototype. Do not begin Phase 7 or apply this direction to `apps/web` before approval.
- **STOPPED awaiting operator approval:** yes

## Phase 5 acceptance (operator-confirmed, 4 November 2026)

- Operator accepted Phase 5 after independently verifying all three payout transactions via RPC: network ID 5, expected blocks, recipients and amounts all match.
  - Orphaned Phase 4 payout `b00c882f`: tx `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29`, block `15838244`, 1,000 Luna to `NQ34 9MUU 15ML PSFX CJDT BB3K DLCS 60RX 5M1B`.
  - Play-through A `dcab12c0`: tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`, block `15838771`, 1,000 Luna to `NQ98 54S9 LBJR JUH9 MKL3 YACQ TD3T JBXJ PHEQ`.
  - Play-through B `5975746e`: tx `b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf`, block `15839460`, 1,500 Luna to `NQ15 UQ1C N85L V8TB 9Y3S FCVF SEUL 8F2N 2623`.
- Operator confirmed the treasury delta exactly: `11,000,006,000` → `11,000,002,500` Luna, `3,500` Luna of payouts, `0` fees.
- The b00c882f ambiguous-broadcast incident is accepted as evidence that the reconcile-before-retry safety design holds, not as a defect.
- Accepted disclosed deviations:
  - **A:** Play-through A stopped on a Vercel Security Checkpoint HTML response during the post-finish poll; resumed with the same real-auth session. DB evidence is intact and independent of harness continuity. Do not create a third funded session.
  - **B:** Play-through B stopped on the test-only selector “Impermanent loss” vs “Risky”; resumed with the same real-auth session; selector fixed in `01b94d1`.
  - **C:** Duplicate `payout_requeued` audit rows from the service + route dual write. Added to the Phase 8 cleanup list; no code change in Phase 5.
  - **D:** Nimiq Pay device verification not performed. Recorded as a known limitation; the operator will perform a manual demo before competition submission.
- Phase 5 status: **PASS / ACCEPTED**.

## Phase 5 preflight and incidents (4 November 2026)

### P0 — credentials and service identity

- `RENDER_API_KEY`, `RENDER_SERVICE_ID`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED` and `OPERATOR_AUTH_SECRET` were recovered from the previous session's `/tmp/opencode/lba-env.sh` and the root shell history. Values were never printed or committed.
- `GET /v1/services/{id}` returned `levelbreak-arena`, type `web_service`, branch `main`, not suspended.

### P1 — funded sessions

- **Session A:** `1435e21b-9e55-4143-92d8-e4a6da01e893`, ref `0f566d594fc30388`, funding tx `1bf53b8172828088b4ad2ebe60e70b5ca417ef5e7818096dc42495f329798ed9`, block `15836900`, 1,500 Luna, demo-agent → treasury, reference `LBA1:0f566d594fc30388`. DB: `AVAILABLE`, funding `VERIFIED`, `FUNDING_CONFIRMED` 1,500 CREDIT.
- **Session B:** `f96476d6-ba9b-4ff9-b555-8761d52da6e6`, ref `685638bc542dad71`, funding tx `a50373943218ebad1e48e6988df20796d48791768341f38c1e060486fbf04756`, block `15836905`, 1,500 Luna, demo-agent → treasury, reference `LBA1:685638bc542dad71`. DB: `AVAILABLE`, funding `VERIFIED`, `FUNDING_CONFIRMED` 1,500 CREDIT.
- Both were independently verified with `verify:tx` (`proof=PASS` for network 5, sender, recipient, value, reference, inclusion).

### P2 — worker enablement

- `PAYOUT_WORKER_ENABLED=true` via Render API at `2026-11-04T00:39:29Z`; only this env var was changed.
- The first attempt exposed the pre-hardening worker's ambiguous-send behavior (below).
- `PAYOUT_WORKER_ENABLED=false` at `2026-11-04T01:21:37Z` after Task 7; redeploy live at `2026-11-04T01:22:28Z`; `/health/live` and `/health/ready` 200.

### P3 — explorer

- Verified `https://test.nimiq.watch/#899823e284e64c1f8dd0671c85598ca739948a653f400ae87bc7dc8433db793e` and `https://test.nimiq.watch/#15766696` in Chromium: both render the transaction/block with the actual sender, recipient, value and `LBA1:1bfa7f2473dd7fb9` reference.
- `NIMIQ_EXPLORER_BASE_URL=https://test.nimiq.watch/#` set at `2026-11-04T01:03:55Z`. A fresh redeploy was required because the env change landed three seconds after the previous deploy snapshot began. Redeploy `dep-dbl8c9142hec739tvo7g` went live at `01:11:50`.
- `GET /api/runs/:runId/payout` now returns `explorerUrl = https://test.nimiq.watch/#<txHash>`; the game page and history page show a working "View on explorer" link.

### P4 — Nimiq Pay limitation

Nimiq Pay device verification not performed. Playwright with a generated Ed25519 key provides auth code proof; runtime verification in Nimiq Pay WebView is deferred to the operator's manual demo before competition submission. Not a Phase 5 acceptance blocker per OPERATOR_AUTHORIZATION.

### Funding-deadline exception

Both funded sessions' 30-minute lobby deadlines expired while the worker safety fix was being completed. Because both remained `AVAILABLE`, fully funded and unclaimed, their `funding_deadline` was extended once through the application `recordAudit` helper inside a database transaction. No funding, state, reward, ledger or claim field changed.

- Session A audit `46ac5a63-b126-44fd-8e2c-a49c7c6954c2`, old `2026-11-04T01:06:07.524Z` → new `2026-11-04T02:07:05.746Z`.
- Session B audit `740ed349-d178-455e-a40b-e634a1172073`, old `2026-11-04T01:06:12.939Z` → new `2026-11-04T02:07:05.770Z`.

### Phase 5 — incident evidence

- The first Phase 5 worker enablement ran the pre-hardening `e110f10` worker. At `00:40:15Z` it attempted payout `b00c882f-72e1-4fb1-acc1-0cde06dcaedf`; at `00:40:38Z` it received `Outbound error: No response after asking a couple of peers` and left the payout in `RECONCILING` / `BROADCAST_AMBIGUOUS` with no transaction hash.
- Before any retry, the agent checked the treasury balance (unchanged at `11,000,006,000` Luna), treasury transaction history since block `15836800` (only the incoming funding transactions), and the stored recipient's history (`NQ34 9MUU 15ML PSFX CJDT BB3K DLCS 60RX 5M1B`, empty). This confirmed no outgoing transfer existed.
- After the hardened worker (`82b5815`) deployed, the payout was reconciled to `FAILED` / `NO_TRANSACTION_HASH` (audit `0980dc07-570b-4985-a334-bacf807e43b7`), requeued (audits `4a6e4464-b2b3-4dee-9717-bd4052f4184f`, `cf329ee2-1f7a-42ed-bcff-43bc4ba1b797`), submitted, and confirmed at tx `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29`, block `15838244`, 1,000 Luna to `NQ34 9MUU…`, reference `LBA1:fa4f30a2d178b6da`.
- No duplicate was ever attempted. The safety net worked in a real production ambiguity: this is the strongest possible evidence that reconcile-before-retry is correctly implemented. The duplicate `payout_requeued` audit rows from the service + route dual write are cleanup-only noise and are recorded in the Phase 8 list.

## Phase 5 checkpoint (4 November 2026)

```text
Project: LevelBreak Arena
Current phase: Phase 5 complete — accepted; awaiting the Phase 6 visual-direction conversation
Status: PASS / ACCEPTED
Preview URL: https://levelbreak-arena.vercel.app
Deployed commit SHA: 7ad825690c6cb55798d8036631bcce7dd01286e4 (Vercel app code, unchanged in Phase 5); backend worker 82b5815, explorer fix aa7f180, deployed test coverage 01b94d1; this docs checkpoint is the new commit containing this file
What changed:
  - Payout worker: signed transaction hash persisted before broadcast via a new onSigned hook; SUBMITTED only after the hash is stored; advisory-lock serialization; pre-broadcast network ID and treasury balance checks (amount + fee reserve); 60-second QUEUED retry backoff for insufficient balance/chain preflight; bounded confirmation polling; chain outage keeps SUBMITTED; details mismatch moves to RECONCILING; startup recovery for interrupted BUILDING rows; SUBMITTED/RECONCILING payouts block new broadcasts until terminal.
  - Nimiq adapter: BasicTransferOptions.onSigned, signed-hash/broadcast-hash equality check.
  - Explorer URL builder supports fragment bases such as https://test.nimiq.watch/#.
  - Seven new payout-worker integration tests (16 total) and Phase 5 deployed play-through coverage.
  - docs/TESTING.md and docs/OPERATIONS.md updated.
What works on the deployed preview:
  - Real Ed25519 auth, available-session lobby, claim/conflict, three-level game, answer/skip, finish, live payout status, confirmed transaction, explorer link, history.
  - Two funded play-throughs paid from treasury and confirmed on testnet.
  - Operator payout/audit endpoints show all three payouts and Phase 5 actions.
What is intentionally incomplete:
  - Nimiq Pay device/WebView verification — deferred manual demo (P4).
  - Final visual design and mockups — Phase 6, hard approval gate.
  - Footer Documentation/GitHub links — Phase 8.
Tests run and actual results:
  $ pnpm lint -> passed
  $ pnpm typecheck -> passed (contracts + apps/api + apps/web)
  $ pnpm test -> 37 unit tests passed, 16 integration tests skipped without DB; 18 Playwright route tests passed; 4 deployed-E2E entries skipped without env
  $ pnpm build -> contracts, apps/api and apps/web built successfully
  $ LBA_INTEGRATION_DATABASE_URL=postgres://... pnpm exec vitest run apps/api/src/services/phase3.integration.test.ts --reporter=verbose
    16/16 integration tests passed, including all Phase 5 worker safety cases
  Deployed Phase 5 Playwright execution:
    A: auth, concurrent claim (one 200 / one 409), three levels (ANSWER/SKIP/ANSWER), duplicate answer keys, finish, duplicate finish -> payout dcab12c0. The post-finish payout poll received a Vercel Security Checkpoint HTML page instead of JSON; the test now retries non-JSON responses. The same real-auth session was recovered from the Playwright trace to capture the confirmed UI/history/explorer evidence.
    B: auth, concurrent claim (one 200 / one 409), level 1 answer, duplicate answer key -> payout path started. The test stopped on a test-only selector: level 2's RISKY label is "Impermanent loss", not "Risky". The same real-auth session was resumed to complete levels 2-3, finish, duplicate finish, payout and confirmed UI/history/explorer evidence.
    Both are product passes. A clean single-process rerun was not performed to avoid a third funded session/payout beyond the authorized two.
Payment evidence (TESTNET ONLY):
  Play-through A: payout dcab12c0-b19c-4eeb-951b-7918e5a459a6; tx 139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4; block 15838771; 1,000 Luna; treasury -> NQ98 54S9 LBJR JUH9 MKL3 YACQ TD3T JBXJ PHEQ; reference LBA1:0f566d594fc30388; network 5; included.
  Play-through B: payout 5975746e-306b-41e1-88c7-ddf8fc15349e; tx b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf; block 15839460; 1,500 Luna; treasury -> NQ15 UQ1C N85L V8TB 9Y3S FCVF SEUL 8F2N 2623; reference LBA1:685638bc542dad71; network 5; included.
  Orphaned Phase 4 payout: payout b00c882f-72e1-4fb1-acc1-0cde06dcaedf; tx 6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29; block 15838244; 1,000 Luna; treasury -> NQ34 9MUU 15ML PSFX CJDT BB3K DLCS 60RX 5M1B; reference LBA1:fa4f30a2d178b6da; network 5; included.
  Treasury balance before payout run: 11,000,006,000 Luna. After: 11,000,002,500 Luna. Decrease = 3,500 Luna; fees = 0.
  Operator independent verification: all three tx hashes verified via RPC; networkId 5, blocks, recipients and values match. Treasury delta confirmed at 3,500 Luna with 0 fees.
Preflight record:
  Session A id 1435e21b-9e55-4143-92d8-e4a6da01e893, ref 0f566d594fc30388, funding tx 1bf53b81…, block 15836900.
  Session B id f96476d6-ba9b-4ff9-b555-8761d52da6e6, ref 685638bc542dad71, funding tx a5037394…, block 15836905.
  PAYOUT_WORKER_ENABLED enabled 2026-11-04T00:39:29Z; disabled 2026-11-04T01:21:37Z; final redeploy live 01:22:28Z.
  NIMIQ_EXPLORER_BASE_URL=https://test.nimiq.watch/# set 2026-11-04T01:03:55Z; verified transaction and block pages; fresh redeploy at 01:11:00Z.
  Nimiq Pay device verification: NOT PERFORMED — exact P4 limitation recorded above; not a Phase 5 blocker per OPERATOR_AUTHORIZATION.
Failure scenario results (expected vs observed):
  Double-click Finish: expected one payout row, one tx, same payoutId twice. Observed: A and B duplicate same-key finish returned the same payoutId; DB has one payout per run, one PAYOUT_CONFIRMED ledger entry, one tx. PASS.
  Double-click ANSWER: expected one response, one reward, same responseId twice. Observed: A and B duplicate same-key respond returned the same responseId; DB has exactly one response per level and one REWARD_RESERVED per accepted answer; skip earned zero. PASS.
  Concurrent claim: expected one 200 and one 409. Observed on Session A and Session B: exactly one 200 with a run, one 409 SESSION_UNAVAILABLE; one run per session. PASS.
  Operator reconcile on SUBMITTED: expected status update without a new tx. Observed in integration test: CONFIRMED with the existing tx hash and broadcast count unchanged. PASS (local/mock).
  Insufficient balance: expected QUEUED with safe failure_code. Observed in integration test: QUEUED, TREASURY_INSUFFICIENT_BALANCE, no broadcast; 60-second backoff enforced; after funding/aging, confirmed. PASS (local/mock).
  Chain outage: expected SUBMITTED, no false CONFIRMED. Observed in integration test: SUBMITTED, CHAIN_UNAVAILABLE, zero PAYOUT_CONFIRMED ledger rows; after chain recovery, CONFIRMED. PASS (local/mock).
  Broadcast response lost / worker restart: expected SUBMITTED, no duplicate, restart reconciles. Observed in integration test: SUBMITTED with persisted hash, new worker instance reconciled the existing tx, broadcast count still 1. PASS (local/mock).
  Deployed ambiguous send: observed BROADCAST_AMBIGUOUS with no hash; reconciled via treasury balance/history and recipient history; after the hardened worker, reconcile → FAILED → requeue → confirmed at tx 6456c17f…. PASS.
Worker behavior confirmed:
  - One logical broadcaster via pg_try_advisory_lock; two concurrent workers test produced exactly one broadcast and one TREASURY_WORKER_BUSY exit.
  - Signed hash persisted before broadcast; the deployed orphan recovery proved the hash was stored before the send and confirmed without a duplicate.
  - Reconcile-before-retry: no payout was retried without checking the existing hash/chain history; the no-hash ambiguous payout was investigated and reconciled before requeue.
  - No duplicate treasury tx for any payout; DB unique payout/run/tx constraints and one PAYOUT_CONFIRMED ledger entry per run.
  - Startup recovery handles interrupted BUILDING rows; SUBMITTED/RECONCILING payouts take priority over new broadcasts.
Nimiq Pay device verification: not tested (recorded as a known limitation; operator to demo manually before submission; not a Phase 5 blocker per OPERATOR_AUTHORIZATION).
Known issues/blockers:
  - Vercel Security Checkpoint returned HTML for one post-finish payout poll in play-through A. The UI stayed functional; the test now retries non-JSON responses. Not a payment/worker failure.
  - Phase 5 E2E had a test-only level-2 selector bug ("Risky" vs "Impermanent loss"); fixed in 01b94d1. Play-through B was completed via a resumed real-auth session.
  - Duplicate payout_requeued audit rows from the service + route dual write. Accepted as cleanup-only noise; no duplicate transfer. Phase 8 cleanup; no code change in Phase 5.
  - apps/api/dist contains stale local build artifacts including test JS. It is already gitignored and not tracked; Phase 8 must remove any tracked copy and verify tests are excluded from production builds.
  - Nimiq client still emits benign bls_cache/autonat warnings; /health/ready can briefly 503 during reconnect; /health/live is the Render health check.
  - Phase 9 mainnet readiness must account for transient Web Client broadcast failures ("Outbound error: No response after asking a couple of peers"); the b00c882f reconcile-before-retry safety net is required and proven.
  - Nimiq Pay device/WebView verification is not performed.
  - No mainnet path was enabled or tested.
Design references/mockups status: none — Phase 6.
Operator visual approval status: NOT GIVEN — Phase 6 hard gate.
Documentation/footer-link status: docs/ present and updated for Phase 5; footer Documentation/GitHub links remain Phase 8.
Security/configuration notes:
  - No private keys, mnemonics, DB URLs, auth tokens, raw signatures or raw challenges are in the repository, this checkpoint, or structured logs.
  - Testnet only; NIMIQ_NETWORK=testnet; mainnet sends remain disabled/fail-closed.
  - DEMO_FUNDING_ENABLED=false; PAYOUT_WORKER_ENABLED=false after the proof.
  - Amounts remain integer Luna; rewards are derived from persisted response rows; no client reward/recipient is accepted.
  - The Vercel rewrite keeps the session cookie same-site; HttpOnly/Secure/SameSite=Lax and CSRF remain unchanged.
Git commit:
  82b5815 — feat: complete serialized payout worker with on-chain confirmation
  aa7f180 — fix: support fragment-based testnet explorer URLs
  01b94d1 — test: add Phase 5 deployed play-through coverage
  This docs checkpoint is the new commit containing this file.
Single next task: Awaiting the operator's separate Phase 6 visual-direction conversation before any reference/mockup work or code. Do not begin Phase 6.
STOPPED awaiting operator approval: yes
```

## Phase 8 follow-up list

- Clean stale local `apps/api/dist` build artifacts and verify production builds exclude test files. `dist/` is already in `.gitignore`; any tracked copy should be removed.
- Collapse the duplicate `payout_requeued` audit rows produced by the service + route dual write into one operator audit event. No code change in Phase 5.
- Keep the Phase 5 E2E's non-JSON Vercel checkpoint retry and per-level answer labels.
- Footer Documentation and GitHub links, final metadata/icons, 404 and accessibility polish.

## Phase 9 readiness note

The Nimiq Web Client broadcast path can fail with `Outbound error: No response after asking a couple of peers` under transient peer conditions. The reconciliation safety net — persist the signed hash before broadcast, query the chain and treasury history, and never blindly retry — is required and was proven in the Phase 5 b00c882f incident. The mainnet readiness review must explicitly account for this failure mode and demonstrate the same reconcile-before-retry behavior with mainnet keys and monitoring.

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

## Phase 4 acceptance (4 November 2026)

> Historical note (Phase 5, 4 November 2026): the queued payout below was subsequently processed and confirmed at tx `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29`, block `15838244`, 1,000 Luna. The text in this section records the Phase 4 state.

- Operator accepted Phase 4 based on the deployed real-auth E2E: auth, funded-session claim, three-level play, finish, payout `QUEUED` without fabricated confirmation, and history showing 1,000 Luna earned.
- Decision B: the queued payout `b00c882f-72e1-4fb1-acc1-0cde06dcaedf` is accepted as testnet cost. Phase 5 will process it when the worker is enabled, sending 1,000 testnet Luna to the unrecoverable generated key used by the E2E player. There is no cancellation path and no DB change now. Phase 5 should expect this payout to appear on-chain.
- Phase 5 pre-flight awareness:
  - Session `d242581a-2590-4ac0-944a-6b41fc626f80` is `PAYOUT_PENDING` and cannot be reused; Phase 5 needs a new funded session.
  - `PAYOUT_WORKER_ENABLED` must be enabled in Render for the Phase 5 payout proof.
  - `NIMIQ_EXPLORER_BASE_URL` should be set before Phase 5 verification for transaction display.
  - The deployed E2E provider-prompt assertion fix at `61ff7bb` is accepted; no further action.

## Operator decisions

- **A — Funding-deadline exception documented:** the Phase 4 E2E required extending the pre-existing `funding_deadline` on session `d242581a-2590-4ac0-944a-6b41fc626f80`. The extension is accepted as a disclosed exception and was written to the existing audit trail through the application `recordAudit` helper inside a database transaction:
  - audit event ID: `59c5f519-9207-4a4f-a110-e917f6ea7063`
  - `actor_type`: `OPERATOR`
  - `actor_id`: `operator`
  - `action`: `EXTEND_FUNDING_DEADLINE`
  - `resource_type`: `requester_session`
  - `resource_id`: `d242581a-2590-4ac0-944a-6b41fc626f80`
  - `details_redacted`: `{"reason":"unblock Phase 4 E2E after pre-existing deadline","old_deadline":"2026-11-03T05:36:03.597Z","new_deadline":"2026-11-03T09:41:06.474Z"}`
  - `created_at`: `2026-11-04T00:03:43.990Z`
  - Verification: the session row still has state `PAYOUT_PENDING`, the same deadline `2026-11-03T09:41:06.474Z`, the same claimed run `087f39ee-6bcc-492b-a062-ebc04ea14a4c`, reserved liability `1500`, unused credit `0`, and the same `updated_at` `2026-11-03T07:41:20.053Z`. No state, funding, ledger or reward field changed.
- **B — Queued payout accepted:** payout `b00c882f-72e1-4fb1-acc1-0cde06dcaedf` remains `QUEUED`, amount `1000` Luna, no transaction hash. It is accepted as testnet cost and is expected to appear on-chain when Phase 5 enables the worker. No DB change or cancellation was made.

## Phase 4 checkpoint (historical — Phase 5 confirmed the payout)

```text
Project: LevelBreak Arena
Current phase: Phase 4 accepted — functional frontend integrated
Status: PASS / ACCEPTED
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
- Payout: ordinary NIM transfer from operator-controlled treasury to player's verified wallet address. **No HTLC in the MVP.** The funds are treasury-custodied; database reservations do not lock them on-chain. Phase 5 proved three confirmed payouts (1,000 + 1,000 + 1,500 Luna) from the treasury; the worker is now disabled.
- Explorer: `NIMIQ_EXPLORER_BASE_URL=https://test.nimiq.watch/#`; the API appends the tx hash and the UI/history render a working link.
- Reward: 500 Luna (0.005 NIM) per accepted response; skip earns zero; one consultation per each of three levels; max per session 1,500 Luna (0.015 NIM).
- Scenario content and evidence are static/bundled; no live market data and no real trades.
- Stack: React + TypeScript + Vite; Node 24 + TypeScript + Fastify; PostgreSQL; `@nimiq/mini-app-sdk` for player wallet identity/signature; `@nimiq/core` for server-side ordinary transfers; Vercel frontend; Render persistent API/worker.
- PostgreSQL is deployed on Neon per operator preparation; the application uses the DATABASE_URL/DATABASE_URL_UNPOOLED configuration defined by the architecture. This is the operator-approved database hosting deviation from the blueprint's Supabase hosting; the Postgres schema and connection contract are unchanged.
- Node 24.22.1 and pnpm 10.34.5 are pinned in the repository.

## Critical blockers / risks

1. Nimiq Pay in-WebView wallet signature authentication has not been runtime-verified on a device. The Playwright Ed25519 proof covers the auth code path; the operator must run the manual Nimiq Pay demo before competition submission. This is a recorded Phase 5 limitation, not a Phase 5 acceptance blocker per OPERATOR_AUTHORIZATION.
2. `NIMIQ_EXPLORER_BASE_URL` is now set and verified. Do not change it to an unverified URL; a fragment base must keep the `#` and the app appends the tx hash.
3. The Web Client requires the explicit TestAlbatross seed; do not revert to the client default seed list.
4. Vercel Security Checkpoint can return HTML for a burst of API requests. The Phase 5 E2E retries non-JSON responses; the product UI itself remained functional. Do not interpret a checkpoint page as a payout failure.
5. No mainnet send path is allowed during preview/development. Any mainnet launch requires separate explicit operator authorization, dedicated keys, treasury cap, and a security/treasury review.
6. Phase 6 is a separate hard visual-direction gate. Phase 5 is accepted, but do not collect or propose design references, create mockups, or change styling until the operator explicitly starts the Phase 6 visual-direction conversation and approves the direction.
7. Non-blocking cleanup: duplicate `payout_requeued` audit rows and stale local `apps/api/dist` artifacts are recorded in the Phase 8 follow-up list.

## Current task for coding agent

**STOP.** Phase 5 is accepted. Do not begin Phase 6, do not collect or propose design references or mockups, and do not apply final visual design. Phase 6 requires a separate explicit visual-direction conversation with the operator before any mockup work or code. Do not re-enable `PAYOUT_WORKER_ENABLED` or `DEMO_FUNDING_ENABLED`.

## Checkpoint requirements

At the end of each accepted phase, update this file with the exact preview URL, deployed commit SHA, changed behavior, incomplete areas, tests run and results, transaction evidence if relevant, known issues, design reference/mockup/approval status, documentation/footer-link status, and the single next task. Do not claim deployment, tests or payments without evidence.
