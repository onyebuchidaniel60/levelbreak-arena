# LevelBreak Arena — Phased Implementation Plan

**Rule:** implement one phase only, verify it, commit it, update `AI_HANDOFF.md`, deploy to the stable preview, report evidence, and stop for operator instruction. Never execute all phases in one run.

## Global sequencing constraints

1. Early skeletal frontend deployment is Phase 1, not deferred until backend completion.
2. Keep the preview current after every verified phase. Report the exact URL, deployed commit SHA, changed behavior, tests, incomplete areas, and blockers.
3. Use safe test config and testnet keys on preview. No production data, production private keys, real-money transfer paths, or irreversible actions in preview.
4. Temporary styling only through core E2E functionality completion.
5. Phase 5 is a hard gate. Do not create final visual design before the core user journey and testnet funding/payout have been demonstrated end to end.
6. Phase 6 gathers/chooses references, produces mockups, presents them, revises them, and waits for explicit operator approval. No approval means stop before Phase 7.
7. Phase 7 applies the approved visual design without changing product behavior, APIs, data model, architecture, or payment rules.
8. Phase 8 completes frontend details, documentation, and real footer links. Never fabricate a preview, docs, or repository URL.
9. Phase 9 runs regression/security and prepares public/production release. Any mainnet treasury configuration requires a distinct explicit operator approval after testnet proof and security review.

## Phase 1 — Repository/platform foundation + skeletal frontend deployment

**Objective:** make progress visible immediately via a navigable, honest structural UI.

**Dependencies:** none beyond access to the repository/hosting accounts. If no repository exists, ask the operator to create/provide or explicitly authorize its creation; do not invent a GitHub URL.

**Tasks:**
1. Inspect the repository without changing files first: tree, package files, environment, existing deployment, branches, docs, and constraints. Summarize findings.
2. Confirm Node.js 24 LTS and package manager; use the existing repo's conventions if compatible. Do not adopt `.clinerules` as authoritative if the operator uses OpenCode; `AGENTS.md` is authoritative.
3. Create the agreed monorepo scaffold for `apps/web`, `apps/api`, `packages/contracts`, database migrations, tests and docs, only if absent.
4. Build skeletal Vite/React routes: `/`, `/play`, `/play/:runId`, `/history`, `/how-it-works`, `/privacy`, `/terms`, `/docs`, and 404. Add primary navigation, wallet connect placeholder, responsive layout and clearly labelled “not connected yet” or “demo unavailable” states.
5. Use a simple temporary visual system: readable typography, spacing, semantic controls. Do not mock transaction confirmations or portray a session as funded.
6. Set up Vercel preview with `VITE_APP_ENV=preview`, a safe API origin placeholder/health endpoint, and no treasury keys or production data. Use auth mock only if needed to exercise routing and clearly label it as preview-only.
7. Configure Vercel preview for current branch and document URL. Set a stable Render preview/development service only if useful at this stage; never enable payment worker.
8. Add CI/static checks (`lint`, `typecheck`, `test`, `build`) and a minimal Playwright route-smoke test.
9. Commit changes with an informative message.

**Expected files:** frontend routes/layout, project package files, `.env.example`, basic CI workflow, early `README.md`, `AGENTS.md`, updated `AI_HANDOFF.md`.

**Database changes:** none.

**API changes:** minimal `/health/live`, optionally `/health/ready`; no financial endpoints active.

**UI changes:** navigable shell, routes, temporary placeholders, footer shell; no real payout/funding claimed.

**Tests:** lint/typecheck/build; route rendering; 404; responsive smoke test; check no secret `VITE_` variables.

**Acceptance criteria:**
- Preview loads by HTTPS at a real URL.
- Every agreed route renders and navigation works.
- Placeholder areas are labelled; no fake funded/payment success state.
- A committed deploy SHA is recorded.
- Preview contains no mainnet keys, production data, or live payout endpoint.

**Verification procedure:** open the actual deployed URL, click every route, test 320px and desktop widths, confirm no blocking console error, inspect deployed commit, and run route smoke tests.

**Git checkpoint:** `chore: establish skeletal LevelBreak Arena preview` (or equivalent).

**Stop/report:** exact preview URL, commit SHA, routes functional, incomplete behavior, test commands/results, deployment blockers, and next task. Do not proceed until operator accepts Phase 1.

---

## Phase 2 — Backend/data/auth foundation + Nimiq transfer proof

**Objective:** establish durable infrastructure and prove the most important external assumption: the backend can send and verify an ordinary NIM transfer on testnet.

**Dependencies:** accepted Phase 1; Supabase and Render access; dedicated testnet demo-agent and treasury wallets funded with testnet NIM.

**Tasks:**
1. Create Fastify API skeleton, request IDs, typed errors, CORS/origin rules, rate limits, security headers, structured redacted logs and graceful shutdown.
2. Configure Supabase Postgres with migrations, service-only backend access, RLS enabled and no end-user write policies.
3. Implement schema foundation: players, auth_nonces, auth_sessions, requester_sessions, funding_transactions, player_runs, decisions, consultation_responses, ledger_entries, payouts and audit_events.
4. Implement signature challenge issuance and verification using the official Mini App SDK for frontend signing and a verified server-side Nimiq signature/address-check method. Do not silently substitute device ID.
5. Implement `NimiqService` adapter and a throwaway integration test for a server-side ordinary basic transfer: load a testnet-only key, initialize `@nimiq/core` client, construct/sign/broadcast transfer to a controlled testnet address, and verify included transaction details.
6. Prove incoming transaction verification from sender/recipient/amount/network/transaction reference. Use testnet only and low-value transactions.
7. Confirm chain-client availability and whether a persistent Render process works reliably. Do not enable scheduled worker or user payouts yet.
8. If transaction construction/signing/broadcasting cannot be proven, STOP and report the exact SDK/API limitation. Do not emulate success, use arbitrary RPC responses, or proceed to payout integration.

**Expected files:** backend app, DB migrations, `NimiqService` interface and adapter, auth modules, typed schemas, integration test harness, updated `docs/SECURITY.md` and `docs/DEPLOYMENT.md`.

**Database changes:** initial migrations; constraints and indexes.

**API changes:** health/readiness, `/api/config/public`, `/api/auth/nonce`, `/api/auth/verify`, `/api/auth/logout`, `/api/me`.

**UI changes:** connect actual auth/wallet status; retain temporary styling.

**Tests:** signature replay/expiry/address mismatch; DB constraints; chain adapter testnet transfer round-trip and status verification; secrets not logged.

**Acceptance criteria:**
- Valid signed login works in Nimiq Pay test environment.
- Used/expired/replayed signatures fail.
- Server-side normal testnet NIM transfer is sent and independently verified.
- `NIMIQ_NETWORK` mismatch or any mainnet config fails closed.
- Transfer details are read from the chain, not inferred from returned hash alone.

**Verification procedure:** show exact test transaction hash and verified recipient/value/network, with private keys redacted; report source lines/docs used and test output.

**Git checkpoint:** `feat: establish secure backend and Nimiq testnet adapter`.

**Stop/report:** confirm each criterion, preview URL + commit, test transaction hash/explorer if real, remaining limitations. Do not proceed unless ordinary transfer proof is successful.

---

## Phase 3 — Core domain, funded-session gate, and APIs

**Objective:** implement deterministic game/session/reward rules without polished visuals.

**Dependencies:** accepted Phase 2 and verified ordinary transfer adapter.

**Tasks:**
1. Implement domain state machines for requester session, player run, consultation response and payout.
2. Implement server-owned static scenario definitions and tests for all decision branches.
3. Implement three static consultation questions, one per level, including bundled evidence and allowed answer options. Evidence must render before the question.
4. Implement the scripted demo-agent flow: create session `AWAITING_FUNDING`, send a real testnet funding transfer from a separate server-only demo-agent wallet to treasury with a unique safe reference, save transaction hash, verify chain data, then mark the session `AVAILABLE` only after DB ledger commit.
5. Use exact MVP financial settings: 500 Luna per accepted answer, 3 consultation maximum, maximum liability 1,500 Luna (0.015 NIM), one funded session per player run. Fees are held separately by operator treasury.
6. Implement atomic session claim, server-authoritative decision outcomes, one answer/skip per question, append-only ledger, one payout record per run, no HTLC.
7. Implement API routes in `ARCHITECTURE.md`; use Zod and correct HTTP errors.
8. Add unique DB keys, row locks/version checks and transaction-scoped operations for funding verification, session claims, answer/reward ledger, payout creation.
9. Implement a payout outbox with single logical worker in disabled-by-default mode. In this phase, it can be tested with the adapter mocked; no public automatic payout until Phase 4+ and gate acceptance.
10. Implement a small operator inspection surface or protected endpoints for sessions/payouts/funding verification.

**Expected files:** domain services, routes, DB migrations, scripts/scenario JSON, payout outbox, operator endpoints, unit/integration tests.

**Database changes:** complete MVP schema and constraints.

**API changes:** funding/session/game/consultation/history/operator endpoint set.

**UI changes:** bind lobby/level responses/consultation structure to API, still temporary styling.

**Tests:** state transition tests, exact payout math, session funding verification, unique transaction/ref constraint, concurrent claims, concurrent answers, maximum three responses, skip earns zero.

**Acceptance criteria:**
- Session cannot become available unless funding verifies.
- Every funded session can be claimed by one player only.
- State changes are server-authoritative and idempotent.
- Max earned reward is 1,500 Luna; client cannot submit a reward amount.
- `Can't tell` is a valid response; no hidden correctness scoring exists.
- HTLC is absent from code paths and product claims.

**Verification procedure:** run migrations against test database; show tests for invalid funding, duplicate tx, two simultaneous claims and duplicate answer; inspect ledger total.

**Git checkpoint:** `feat: add funded-session and game domain APIs`.

**Stop/report:** API contract changes, migration names, test evidence, preview URL + SHA, known issues. Do not proceed until reviewed.

---

## Phase 4 — Functional frontend integration

**Objective:** connect the skeletal UI to real API state and implement all key paths with ordinary temporary visuals.

**Dependencies:** accepted Phase 3.

**Tasks:**
1. Wire wallet auth challenge/signature/verify and logout.
2. Wire available funded session lobby and no-funded-session state.
3. Wire session claim and resume behavior.
4. Wire each scenario decision to server outcome and state-version response; animate returned consequences rather than calculating outcomes in the browser.
5. Wire consultation evidence renderers for image, data card, text snippet, scenario card; implement answer and skip states.
6. Show earned pending rewards distinctly from actual payout transaction status.
7. Wire finish, payout polling/reconciliation status, history, and explorer links only after a real transaction hash exists.
8. Wire operator monitoring surface if included; keep it private.
9. Keep preview pointed only to the preview backend/testnet. Ensure feature flags disable payout/funding if config is missing or mismatched.
10. At end of the phase, update preview and run smoke/E2E partial tests.

**Expected files:** all player screens/hooks/API clients/validation; reusable feedback and loading components; Playwright flows.

**Database changes:** none unless a validated migration is approved; no schema redesign during UI integration.

**API changes:** no contract changes unless required bug is reported and operator approves.

**UI changes:** lobby, game, consultation cards, session completion, history, help/disclosures, errors.

**Tests:** component tests for question types; frontend API integration tests; navigation; answer/skip; refresh/resume; no fake payment states.

**Acceptance criteria:**
- User can traverse the entire game using the deployed preview and real backend state.
- Game outcome persists after refresh.
- Question evidence precedes question; answer and skip controls work.
- UI labels simulation and treasury-funded payout honestly.
- Payment status is clearly `earned/queued/submitted/confirmed/failed`.

**Verification procedure:** walk through with an actual testnet wallet in Nimiq Pay and a separate staging browser; inspect network and console; compare UI values against database state.

**Git checkpoint:** `feat: connect game and consultation UI to backend`.

**Stop/report:** deployed preview URL + SHA, completed flows, actual wallet/test setup, test results, incomplete states and blockers.

---

## Phase 5 — End-to-end completion and hard functionality gate

**Objective:** prove funding → availability → gameplay → deterministic reward → treasury payout → confirmed transaction.

**Dependencies:** accepted Phase 4; testnet keys/balances; payout worker feature explicitly enabled only on staging/testnet.

**Tasks:**
1. Complete/fix payout worker, serial treasury lock, DB outbox, status reconciliation, safe retry, and balance guard.
2. Execute full funded-session test: demo-agent wallet sends funding transfer; server confirms recipient/amount/network/reference; session activates.
3. Use player wallet authentication and complete all three levels, including at least one answer and one skip in a run; then execute a three-answer run for max payout.
4. Verify treasury payout amount equals accepted answer count × 500 Luna; confirm actual recipient, sender, network, amount and inclusion.
5. Simulate double-clicks, duplicate finish, refresh, worker restart, ambiguous broadcast result, chain outage, insufficient treasury funds, and DB failure at appropriate checkpoints.
6. Confirm payout and funding txs are unique and the session cannot be claimed twice.
7. Run all required unit, integration, E2E and security tests. No final visual design yet.
8. Publish an evidence report in `AI_HANDOFF.md`: tx hashes (testnet only), deployed commit, test command/results, known nonblocking issues.

**Expected files:** robust worker/reconciliation; expanded test suites; `docs/TESTING.md`, `docs/OPERATIONS.md`.

**Database changes:** only targeted migrations for state/attempt audit fields if necessary and approved.

**API changes:** no unapproved API redesign.

**UI changes:** complete functional states; still temporary visual style.

**Tests:** all critical testnet E2E and race/retry cases.

**Acceptance criteria (hard gate):**
- Funding transaction is verified before a session becomes available.
- Three-level game works end to end.
- Every accepted answer has exactly one 500-Luna reward record; skipped tasks earn zero.
- Payout matches immutable ledger; transaction verified on chain.
- Duplicate/retry/restart cannot cause duplicate payout.
- Player only sees own history.
- Treasury keys are not exposed/logged; mainnet cannot be selected in preview.
- No critical E2E/security blocker remains.

**Verification procedure:** demonstrate on deployed preview; provide transaction hashes and verification results. Do not claim “payment complete” without chain evidence. If any criterion fails, fix within the phase and repeat.

**Git checkpoint:** `test: verify funded session and NIM payout end to end`.

**Stop/report:** gate results in writing. **Do not begin Phase 6 until operator accepts the functionality gate.**

---

## Phase 6 — Design references, mockups, and operator approval

**Objective:** reach a final visual direction without letting the coding agent choose it autonomously.

**Dependencies:** Phase 5 gate accepted. No final UI changes should precede this phase.

**Tasks:**
1. Ask operator for references or provide three short reference candidates with URLs and notable attributes for operator selection.
2. Record which attribute from each reference is relevant; do not copy protected branding/assets.
3. Produce mockups/prototypes for landing/lobby, Level 1/2/3 scenario and consequence, consultation evidence card, session finish/payout pending/paid, history, and key loading/error/no-funding states.
4. Show desktop and mobile layouts.
5. Capture feedback and iterate until operator explicitly approves.
6. Write `docs/DESIGN_DECISIONS.md` with references, mockup paths, approved direction, typography/color/spacing/component guidelines, responsive principles, and deviations.

**Expected files:** mockups/prototype artifacts and design-decision document; no final app CSS implementation yet.

**Database/API changes:** none.

**UI changes:** prototype/mocks only; working app keeps existing temporary style.

**Tests:** review checklist for all routes/states and responsive layouts represented.

**Acceptance criteria:** operator explicitly approves a named/versioned direction in chat or project decision log. “Looks fine” inferred from silence is not approval.

**Verification procedure:** present mockups and written source-to-design rationale; record approve/revise decision.

**Git checkpoint:** `docs: record approved design direction` after approval.

**Stop/report:** hard stop awaiting explicit approval. No final visual implementation before approval.

---

## Phase 7 — Implement approved final UI

**Objective:** apply the approved design to proven functional screens without changing behavior.

**Dependencies:** Phase 6 explicit approval recorded.

**Tasks:**
1. Implement approved visual tokens, typography, spacing, cards, buttons, forms, layout and motion.
2. Apply styles to existing flows; do not change API contracts, state machines, reward math, wallet auth, or payout semantics.
3. Preserve accessible focus, labels, reduced motion and contrast from the approved design.
4. Update preview each checkpoint and verify screenshots against approved mockups.
5. If a visual requirement appears to require a product/architecture change, stop and request separate approval; do not quietly rework behavior.

**Expected files:** design token files, UI components, responsive CSS, design notes updated for deviations.

**Database/API changes:** none.

**UI changes:** full approved design.

**Tests:** component tests, visual/layout checks, all key flows still function.

**Acceptance criteria:** visual direction matches approved mockups; no functionality regression; responsive layouts pass.

**Verification procedure:** compare actual preview at desktop/mobile to mockups; run E2E suite.

**Git checkpoint:** `feat: implement approved LevelBreak Arena UI`.

**Stop/report:** preview URL + SHA, deviations, tests, then stop for acceptance.

---

## Phase 8 — Frontend completeness, documentation, footer, and release polish

**Objective:** finish the full product shell rather than only the main gameplay screen.

**Dependencies:** accepted Phase 7.

**Tasks:**
1. Complete route not-found experience, global nav/footer, responsive states, loading/skeleton/empty/error/denied/success/pending/confirmed states, page titles/meta description, favicon/app icon, keyboard/focus and accessible announcements.
2. Complete `/how-it-works`, `/privacy`, `/terms`, `/docs` with truthful statements and no unreviewed legal guarantees.
3. Finalize repository `README.md` and docs for setup, env vars, architecture, user/operator guidance, testing, deployment and troubleshooting.
4. Add home footer Documentation link to reachable `/docs` or published repo docs; add actual public GitHub repo link only after a real public MIT repo exists. Never fabricate URLs.
5. Check every link and control on deployed preview; remove dead links, inert buttons, unresolved placeholders, false live-agent claims and fake transaction hashes.
6. Ensure docs match current architecture (no HTLC; one funded session/one run; treasury payout is trusted/custodial).

**Expected files:** `README.md`, docs, icons/metadata, footer/nav, empty/failed states.

**Database/API changes:** none unless issue fixes are separately approved.

**UI changes:** full route/support/completeness shell.

**Tests:** link checker/manual audit, all routes and UI states, accessibility/keyboard, responsive, E2E regression.

**Acceptance criteria:** all relevant frontend completeness items pass; footer Docs/GitHub links resolve; any exception documented and operator-approved; no dead links/inert controls/unexplained placeholders.

**Verification procedure:** use deployed preview; test every nav/footer link, 404, mobile and desktop; inspect actual GitHub public/MIT repository and docs target.

**Git checkpoint:** `docs: complete product docs and frontend release details`.

**Stop/report:** preview URL + commit, docs paths, link/accessibility/regression evidence, known issues.

---

## Phase 9 — Security regression, release readiness, production deployment, monitoring

**Objective:** ship only an actually verified and authorized version.

**Dependencies:** accepted Phase 8; public repo and MIT license for submission; explicit operator release authorization.

**Tasks:**
1. Run full lint/typecheck/build/unit/integration/E2E and testnet financial flow.
2. Perform adversarial security tests: signature replay, IDOR, CSRF, duplicate submit/claim/payout, funding replay, amount tampering, concurrent payout, secret logging and configuration drift.
3. Verify deployment environment, exact origins, cookie security, CORS, rate limits, DB migrations, key isolation, worker status, backup/operator recovery notes.
4. Confirm no code path silently switches to mainnet. Mainnet is disabled unless a separate operator approval and a separate environment-config review are recorded.
5. For public hackathon release, deploy the working app as approved. If the operator opts for real mainnet payouts, require explicit approval, capped hot-wallet balance, separate mainnet keys, verified live payout test, treasury reconciliation, and completed security/legal review. Otherwise leave the public demo on testnet and make this visible.
6. Smoke-test the final production URL in Nimiq Pay and normal browser fallback; verify the release commit and transaction behavior.
7. Add monitoring/runbook: chain unavailable, insufficient balance, payout stuck, key rotation, DB restore, abuse, emergency payout disable.

**Expected files:** final CI/test evidence, operations runbook, release checklist, deployment record, updated `AI_HANDOFF.md`.

**Database changes:** production migrations only after backup and compatibility checks.

**API changes:** none except approved security fixes.

**UI changes:** release-ready details only.

**Tests:** complete suite plus production smoke test; mainnet test only if explicitly approved.

**Acceptance criteria:** all required tests pass; no critical/high security finding unresolved; deployment config audited; actual URLs documented; no claim of mainnet or real-agent usage unless true; operator explicitly approves release.

**Verification procedure:** deployed URL smoke test; check live commit/build; verify transaction status if payment occurs; inspect logs for errors and absence of secrets.

**Git checkpoint:** `chore: prepare verified release` and tagged release only after approval.

**Stop/report:** release URL, repo URL, commit SHA, test evidence, network used, exact disclosures, monitoring instructions and next-step status.

## Required checkpoint template (every phase)

```text
Project: LevelBreak Arena
Current phase:
Status: PASS / FAIL / BLOCKED
Preview URL: NOT YET DEPLOYED until actual URL exists
Deployed commit SHA:
What changed:
What works on the deployed preview:
What is intentionally incomplete:
Tests run and actual results:
Payment evidence (if applicable, testnet/mainnet stated clearly):
Known issues/blockers:
Design references/mockups status:
Operator visual approval status:
Documentation/footer-link status:
Security/configuration notes:
Git commit:
Single next task:
STOPPED awaiting operator approval: yes/no
```

## Per-phase stop policy

After implementing the assigned phase: test, inspect diffs, fix issues, commit, update `AI_HANDOFF.md`, deploy/verify preview, report exact evidence, then stop. Do not continue to the next phase because it is listed below. Any ambiguity about product behavior, architecture, payment semantics, mainnet enablement, visual direction, or scope is a stop-and-report issue.
