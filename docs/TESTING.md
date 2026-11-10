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
- Five-answer reward calculation, skip=0 and 2,500-Luna cap.
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
- Five bundled consultations: one per level, evidence before question,
  `Can't tell` allowed, fixed 500-Luna reward, no hidden correct answer.
- Incoming funding validation for inclusion, network, sender, recipient,
  amount and `LBA1:` reference.
- Two simultaneous claims: exactly one succeeds.
- Two simultaneous answers: exactly one response and one reward ledger row.
- Two simultaneous finishes: exactly one payout row.
- Ledger arithmetic: 5 answers = 2,500 Luna; 1 skip + 4 answers = 2,000 Luna;
  0 answers = zero payout and a 2,500-Luna unused-credit entry.
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
verify, lobby claim, all five levels, answer/skip, refresh/resume, finish,
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
same session (one 200, one 409), plays the five levels, replays the same
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

- Landing -> wallet auth -> available funded session -> claim -> five decisions -> consultations -> finish -> payout status -> history.
- Mix of answer and skip; correct reward total.
- Refresh halfway and resume same run.
- No funded session state blocks start.
- Double-click/duplicate requests do not duplicate decision, answer, reward or payout.
- One player cannot access another player's history by modifying IDs.
- Check 320, 375, 768, 1024 and 1440px layouts.
- Verify all nav/footer/Docs/GitHub links on the deployed preview.
- Verify error, loading, empty, denial, pending, confirmed, failed, 404 states.

## Security tests

Replay signed challenge; raw/unframed signature; tampered challenge; signer different from `listAccounts()[0]`; cross-player IDOR; modify reward amount; send duplicate funding hash; use transaction for wrong session; concurrent claim/answer/payout; CSRF; rate-limit routes; inspect logs for secrets; try mainnet configuration in preview.

`apps/api/src/auth.integration.test.ts` covers Nimiq signed-message verification, session cookie issuance, a non-first account signer, raw-signature rejection, and tampered-challenge rejection.

## Design gate

Do not begin final visual design until all critical funded-session-to-payout E2E checks have passed on preview and evidence is recorded. Design/visual regression tests occur after the operator approves mockups.


## Phase 7 UI and agent coverage

`tests/e2e/phase7.ui.spec.ts` runs against a mocked API and covers:

- five-level progress (`Level 3 of 5`, `03 / 05`) and the five-step rail;
- the LLM agent message, `LLM draft` source badge, typewriter rendering, and static evidence panel;
- the confirmed-payout **Withdraw to Fiat** action, the `Nimiq Pay Off-Ramp` dialog, the labelled demo rate, and the simulated success state with no fiat transfer;
- no horizontal overflow at 320 px and 1280 px.

`apps/api/src/services/llm.test.ts` covers prompt sanitization, output capping, and context construction without wallet identity. The integration suite covers the scripted fallback when `LLM_API_KEY` is not configured and rejects a non-owner run.

The five-level migration and integration tests were also run against a fresh PostgreSQL 16 database:

```bash
DATABASE_URL_UNPOOLED=postgres://... pnpm db:migrate
LBA_INTEGRATION_DATABASE_URL=postgres://... pnpm test:integration
```


## Phase 8.2 AI-generated levels

`apps/api/src/services/phase3.integration.test.ts` now covers generated-content persistence:

1. Create a funded test session, claim it, and advance to the consultation.
2. `GET /api/runs/:runId` generates level content and stores it in `player_runs.generated_content`.
3. Modify the stored scenario title directly and request the run again.
4. The second response returns the modified saved title, proving the run reused stored content instead of regenerating it.

`apps/api/src/services/llm-success.test.ts` covers strict JSON validation/normalization for `generateLevelScenario` and the static fallback on provider failure. The live Groq path was also exercised directly with the production model; level content returned `source: "llm"` with SAFE/RISKY decisions and a text-snippet evidence payload.


## Phase 10 external Agent API coverage

The integration suite now covers the external-agent marketplace in addition to
the Phase 3-8 flows:

- registration returns a one-time API key and stores only its SHA-256 hash;
- duplicate agent wallets are rejected;
- a verified testnet deposit from the registered wallet credits the agent
  balance, while duplicate hashes, wrong sender/recipient/network, pending
  transactions and amounts below 500 Luna are rejected;
- a posted consultation reserves 500 Luna, appears in the player lobby with the
  agent name and question preview, and can be claimed without a session funding
  transaction;
- the player sees the agent's name, question and context, answers it, earns 500
  Luna, and the agent's `balance_luna` and `reserved_luna` are each reduced;
- a skipped agent consultation releases the reservation without charging the
  agent;
- finishing the answered run creates exactly one 500-Luna payout row.

The UI suite `tests/e2e/phase10.ui.spec.ts` checks the agent lobby card, the
"Request from <agent>" label and "Agent submission" source in the game, and the
landing-page Active Agents directory at 320px and 1280px.

The live client proof is `scripts/agent-client.js`:

```bash
API_BASE_URL=https://levelbreak-arena.onrender.com \
APP_ORIGIN=https://levelbreak-arena.vercel.app \
AGENT_PRIVATE_KEY=<testnet-agent-key> \
NIMIQ_TREASURY_ADDRESS=<treasury-address> \
  node scripts/agent-client.js
```

It registers an agent, sends/uses a real testnet deposit, posts a consultation,
authenticates a fresh player wallet, finds the question in the lobby, claims it,
answers it and finishes the run. Set `AGENT_DEPOSIT_TX_HASH` to use an existing
transfer instead of sending one. Set `WAIT_FOR_PAYOUT=true` to poll the payout
until confirmed. The script never prints the API key or private key.


## Phase 11 agent and MCP verification

### Agent API live proof

`scripts/agent-client.js` was run against the production API with the registered
demo-agent wallet and `WAIT_FOR_PAYOUT=true`. The script registered
`MCP Research Agent`, sent a real 500-Luna testnet deposit, posted a
consultation, authenticated a fresh player wallet, found the consultation in the
lobby, claimed it, submitted a decision, answered `CANT_TELL`, finished the run
and observed the confirmed treasury payout.

Live evidence:

- agent `9fd34afa-dddd-453c-adfa-3fa2ff4f2a8a`
- deposit tx `28653f6583096dea84168180ca183a98598e2689b47451fbe774119929511cad`, block `16351977`
- consultation `2fab0bf1-56ba-4198-b8fa-942d98e81b14`, session `02ed506d-bf24-4eac-9b53-2413a72aa239`, ref `b3e1239888e5befb`
- player `NQ38 JSSP 0TTR A4K6 E61N ABQU KKER D2CN LSC8`, run `df69f847-09c7-4547-b0f9-3e06dc52140b`
- payout `bcafc355-b87e-422f-95cf-33763b354cfa` confirmed at tx `fc8cc06317b3f4d5cc8843017215263cd74b71aee06281b159f2ebd53887ec9f`

### MCP server

`mcp-server/` is a standalone stdio package. It uses
`@modelcontextprotocol/sdk@1.32.2` and `zod@4.1.12` and exposes
`post_defi_consultation(question, context)`. The tool posts to
`POST {LBA_API_BASE_URL}/api/agent/consultations` with
`reward_luna: 500` and `Authorization: Bearer $LBA_AGENT_API_KEY`.

Local checks:

```bash
cd mcp-server
npm install
npm run check
LBA_AGENT_API_KEY='lba_agent_...' node verify.js
LBA_AGENT_API_KEY='lba_agent_...' LBA_VERIFY_CALL=true node verify.js
```

The verification client spawns the server over stdio, lists the tool and
optionally makes a live call. A live call reserves 500 Luna from the agent
balance. The Phase 11 proof used a separate funded agent:

- agent `9e2ca6fb-768c-4cbc-993a-0072458c5b50`, “MCP Server Agent”, wallet `NQ11 1B6U 0H3T Y2VV S2U2 RHJL HT5A MC95 UB4D`
- deposit tx `109b426e67dad2076ec3e422c2fe182e59593935be72bbf9997ec8b96297d2f3`, block `16352029`
- MCP-posted consultation `7fdfd984-259b-412f-ac9c-4c9f232d01d3`, session `01b378f2-3815-4ed5-bd77-82e02f8fcf07`, ref `5fde4fd45d4b3f32`, status `AVAILABLE`
- an authenticated player lobby check found the question with `agentName: "MCP Server Agent"` and the question preview
- the public directory returned `questionsPosted=1`, `activeQuestions=1`

The root `pnpm test` suite does not install or run the standalone MCP package;
`mcp-server/README.md` documents the separate install and verification flow.


## Phase 12 mobile readiness

`tests/e2e/phase12.mobile.spec.ts` covers every required surface at both
**375px** and **390px**:

- landing page and the premium `/agents` directory;
- lobby with an external-agent question;
- game decision state;
- Agent Request / consultation state;
- confirmed payout with the off-ramp modal open;
- history.

The tests assert no horizontal overflow at either width, 44px minimum decision
and consultation-option controls, 16px minimum Agent Request card and Fiat
off-ramp modal edges, and the presence of the agent name plus `Verified MCP`
badge. Reduced-motion emulation keeps screenshots deterministic.

390px screenshots are written to `test-results/phase12/`:

```text
landing-390.png
agents-390.png
lobby-390.png
game-decision-390.png
game-agent-request-390.png
game-payout-modal-390.png
history-390.png
```

Final local verification:

```text
pnpm lint          passed
pnpm typecheck     passed
pnpm build         passed
pnpm test          46 unit passed; 50 Playwright passed; 6 deployed skipped
```

The existing 320px route smoke suite and 1280px desktop suite remain green, as
do the Phase 7/8/10/11 UI tests.


## Phase 13.5 multi-currency off-ramp

The Phase 12 payout test now also covers the Fiat Off-Ramp currency selector:

- default **NGN** is selected;
- rate line is `1 NIM = 1,350.00 NGN`, and `2,500 Luna` displays `₦33.75`;
- switching to **EUR** shows `1 NIM = 0.82 EUR` and `€0.02`;
- switching to **USD** shows `1 NIM = 0.89 USD` and `$0.02`;
- the success state carries the selected currency (`Simulated USD handoff`);
- the segmented control fits at 320px with 16px modal edges and no horizontal overflow;
- the "You receive" amount is non-wrapping JetBrains Mono with the correct symbol.

390px screenshots are written to:

```text
test-results/phase12/fiat-modal-ngn-390.png
test-results/phase12/fiat-modal-eur-390.png
test-results/phase12/fiat-modal-usd-390.png
```

Final local verification:

```text
pnpm lint          passed
pnpm typecheck     passed
pnpm build         passed
pnpm test          46 unit passed; 50 Playwright passed; 6 deployed skipped
```


## Phase 13.6 live exchange rates

`apps/api/src/services/exchange-rates.test.ts` covers:

- successful CoinGecko parsing and five-minute coalesced caching;
- fallback to `{ usd: 0.0282, eur: 0.0251, ngn: 37.97 }` with a warning on
  provider failure;
- fallback on an invalid provider shape;
- refresh after the five-minute cache window.

The public endpoint can be checked directly:

```bash
curl -sS https://levelbreak-arena.onrender.com/api/config/exchange-rates
```

The Phase 12 payout test now delays the mock exchange-rate response and asserts
that the modal opens with a loading state before the live rate appears. It also
covers the live-rate NGN amount, `Less than 0.01` for sub-cent EUR/USD amounts,
and the 320px segmented-control layout.

Local verification:

```text
pnpm lint          passed
pnpm typecheck     passed
pnpm build         passed
pnpm test          50 unit passed; 50 Playwright passed; 6 deployed skipped
```

Screenshots at 390px:

```text
test-results/phase12/fiat-modal-ngn-390.png
test-results/phase12/fiat-modal-eur-390.png
test-results/phase12/fiat-modal-usd-390.png
```

The final live verification additionally screenshots the deployed modal with
the actual live NGN rate from CoinGecko.


## Phase 14 visual overhaul

The Phase 14 Playwright project (`tests/e2e/phase14.visual.spec.ts`) runs at
1440x1000 and captures the required 390px states by resizing the page. It
writes:

```text
test-results/phase14/landing-1440.png
test-results/phase14/landing-390.png
test-results/phase14/game-decision-1440.png
test-results/phase14/game-decision-390.png
test-results/phase14/agent-request-1440.png
test-results/phase14/agent-request-390.png
test-results/phase14/payout-1440.png
test-results/phase14/payout-390.png
test-results/phase14/fiat-modal-1440.png
test-results/phase14/fiat-modal-390.png
test-results/phase14/agents-1440.png
test-results/phase14/agents-390.png
test-results/phase14/lobby-1440.png
test-results/phase14/lobby-390.png
test-results/phase14/support-how-it-works-1440.png
test-results/phase14/support-docs-1440.png
test-results/phase14/not-found-1440.png
test-results/phase14/error-state-1440.png
test-results/phase14/loading-state-390.png
```

The suite also checks:

- no horizontal overflow on the landing, lobby, game, agent request, agents
  directory and fiat modal at 320px, 375px and 390px;
- 44px minimum decision/option controls, the off-ramp CTA and the primary
  action buttons;
- the LLM typewriter emits an intermediate partial string, finishes, and
  leaves the full agent message visible;
- `Verified MCP` badges render on external-agent cards and the Agent Request;
- the live NGN rate (`1 NIM = ₦37.97`), `₦0.95` fiat display, CoinGecko
  disclosure and demo-only fiat disclosure remain visible;
- Earned/Pending/Paid tiles use mint/yellow/forest surfaces so the three payout
  states stay visually distinct;
- support pages, 404, loading and API error states use the new theme.

Local verification:

```text
pnpm lint          passed
pnpm typecheck     passed
pnpm build         passed
pnpm test          50 unit passed; 58 Playwright passed; 6 deployed tests skipped
```

The deployed preview was also checked in Chromium at 1440px and 390px for the
landing, agents directory, game decision, Agent Request, payout and fiat modal.
Those screenshots are stored as `test-results/phase14/live-*.png`.
