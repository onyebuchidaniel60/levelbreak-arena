# LevelBreak Arena — Project Specification

**Status:** Approved product/technical blueprint for implementation planning; no application code started  
**Prepared:** 29 October 2026  
**Competition:** Nimiq Mini Apps Competition — Cycle III, Earn category  
**Target deadline:** 11 November 2026, 23:59 UTC  
**Product name:** LevelBreak Arena  
**Source of truth:** This file defines product scope and business behavior. `ARCHITECTURE.md` defines implementation architecture; `IMPLEMENTATION_PLAN.md` defines phase gates.

## 1. Product definition

### 1.1 One-line description

LevelBreak Arena is a consequence-driven DeFi learning game in which players make decisions in simulated market scenarios and earn small, treasury-funded NIM rewards for completing evidence-backed judgment tasks presented by scripted agent requesters.

### 1.2 Problem

People who are new to DeFi often encounter concepts such as stablecoin depegs, impermanent loss, and unsustainable yield through disconnected articles, quizzes, social posts, or risky real-money experiments. Traditional learning tools can feel passive and rarely connect learning to a tangible, low-value reward.

### 1.3 Current alternatives and workarounds

- Reading, videos, and social posts: accessible but passive and inconsistent.
- Quizzes and learn-to-earn products: provide questions/rewards but often lack a scenario whose consequences visibly affect a simulated portfolio.
- Real DeFi experimentation: can teach through consequences but exposes novices to actual financial risk.
- Human task marketplaces: can pay for judgments but are not typically packaged as a consequence-driven learning game inside Nimiq Pay.

These are product-positioning observations, not a claim that no competing product has similar features. The submission must not claim “first ever.”

### 1.4 Target users

1. **Nimiq Pay users curious about DeFi:** want a short, accessible, low-risk way to learn basic concepts.
2. **New or casual crypto users:** benefit from visible examples rather than a long course.
3. **Hackathon judges and early testers:** need to understand the core loop quickly and observe an actual NIM funding/payout flow.

### 1.5 Roles

- **Player:** connects a Nimiq wallet, plays the three scenarios, answers or skips consultation tasks, sees earnings, and receives payout to their wallet.
- **Requester/agent:** a scripted requester in the MVP. A separate server-side demo wallet sends session funding. It is not a live LLM agent and does not independently reason or pay from an external service.
- **Operator:** controls the backend and treasury; monitors sessions, funding, payouts, and failures.
- **System worker:** verifies incoming NIM funding, activates sessions, calculates deterministic rewards, queues and submits payouts, and reconciles transactions.

### 1.6 Core value proposition

Learn by making simulated decisions, see the result immediately, and receive a small real NIM reward for each eligible completed consultation task. No real DeFi position is opened, and the learning portfolio is virtual.

### 1.7 Differentiator

The game combines visible consequences in a virtual DeFi portfolio with evidence-attached judgment tasks, a funded-task gate, and real NIM transfers. The MVP uses a scripted requester and centralized treasury payout; it does not claim a live agent marketplace or trustless user-side escrow.

### 1.8 Primary use case

A player opens the Mini App, connects their Nimiq Pay wallet, starts a funded session, completes up to three DeFi scenario levels, responds to each evidence-backed consultation card (or skips it), and receives an ordinary NIM transfer for each accepted response after completing the session.

### 1.9 Secondary use cases

- A player reviews their previous session and the transaction reference for a payout.
- The operator inspects a session's funding proof, answer log, payout status, and failure reason.
- A scripted requester funds a new session before it is made available to players.

### 1.10 Explicit non-goals

The MVP does **not**:

- run a live LLM agent or connect answers to a live agent workflow;
- fetch live token, market, pool, contract, or audit data;
- place real trades, connect to DeFi protocols, or manage user portfolios;
- use an HTLC for agent funding or player payout;
- promise trustless escrow or automated agent-to-player settlement;
- pay for skipped tasks or claim reward amounts from client-submitted totals;
- rank player answers as objectively correct/incorrect or provide investment advice;
- provide leaderboards, streaks, reputation, badges/NFTs, referrals, or social features;
- support variable per-task reward amounts;
- support real-money/mainnet launch during hackathon development;
- support multiple levels beyond the three specified in the MVP.

## 2. MVP scope

### 2.1 MUST HAVE

1. A navigable, responsive frontend deployed to a stable preview URL during Phase 1.
2. Three scenario levels: stablecoin peg risk, liquidity-pool impermanent loss, and yield-farming sustainability.
3. A deterministic simulation engine with virtual portfolio state and visible consequence animations.
4. One scripted evidence-backed consultation task at each level-up, with options and a free skip.
5. Nimiq Pay wallet connection and signed-message authentication; no private key enters the app or backend.
6. A prefunded-session gate: no session is playable/visible as available until the funding transaction has been verified on the intended Nimiq test network.
7. Fixed reward of **0.005 NIM (500 Luna)** for each accepted consultation response; skip earns zero.
8. A maximum of three consultation tasks per MVP session; maximum reward liability is **0.015 NIM (1,500 Luna)** per session.
9. A scripted demo requester with a separate, server-side **testnet-only** demo-agent wallet that sends an ordinary NIM transfer to the treasury to fund sessions. The UI and demo must disclose that this requester and its wallet are operator-controlled simulation infrastructure, not an external live AI agent.
10. A server-side treasury that sends ordinary NIM transfers to players after session completion, subject to authoritative answer records and a reserved session budget.
11. Transaction-status verification and a player-facing payout status, including transaction hash/explorer link where available.
12. A server-side ledger for funding, session budget reservations, reward liabilities, payouts, and unspent session balance.
13. Operator-only operational endpoints/views to inspect funded sessions, stuck payouts, and funding/payout transaction references. Keep this minimal.
14. Robust loading, error, empty, denied, success, expired, and retry states.
15. Unit, integration, E2E, and payment-security tests with testnet-only funds.
16. README, docs, AGENTS.md, AI_HANDOFF.md, real preview URL, and the real public GitHub repository link in the final home-page footer if suitable.

### 2.2 SHOULD HAVE

- Resume a started game session after accidental refresh, without duplicating answers or rewards.
- Player session history and payout receipts.
- Automated reconciliation of submitted transactions and stuck payout attempts.
- Clear disclosures for scripted requester, treasury custody, educational simulation, and testnet demo mode.

### 2.3 NICE TO HAVE

- Better motion/accessibility preferences for consequence animations.
- Optional operator activity summary.
- A more polished transaction detail panel.

These must not delay the core funded-session-to-payout journey.

### 2.4 FUTURE

- Real external agent API and independently funded agent sessions.
- Player-side HTLC redemption if an officially supported wallet path becomes available.
- A trust-minimized or independently auditable settlement mechanism.
- More levels and task types, varying reward bands, reputation, and quality evaluation.
- Mainnet use after explicit security, operational, and legal review.

### 2.5 OUT OF SCOPE

Live LLM, live evidence fetching, real protocol integrations, HTLC contracts, staking/NFTs, leaderboards, social graph, push notifications, cross-chain execution, variable rewards, fiat rails, user-facing agent creation, a full agent marketplace, and public financial advice.

### 2.6 Scope reconciliation: 3 levels vs. 10 questions

An earlier payment example used ten questions, but the locked product design has three levels and one consultation at each level-up. Expanding the game to ten paid questions would be an unapproved scope change. Therefore, the MVP has **three eligible consultations maximum** per session. At 0.005 NIM each, the session reward liability is 0.015 NIM. Funding amounts, reservation logic, UI, and tests must all use this three-question limit. The maximum can be reconsidered only as a separate product decision.

## 3. User roles and permissions

| Capability | Player | Scripted requester | Operator | System worker |
|---|---:|---:|---:|---:|
| Connect own Nimiq wallet | Yes | No | No | No |
| View available funded sessions | Yes | Own scripted session only | Yes | Yes |
| Play the game / submit answer | Yes | No | No | No |
| Skip a consultation | Yes | No | No | No |
| See own session and payout history | Yes | No | Yes | Yes |
| Fund a demo session | No | Scripted server process | Can initiate/test | Yes |
| Change reward amount or answer history | No | No | No through normal UI; guarded operational override only if explicitly implemented | No; deterministic rules only |
| Submit treasury payout | No | No | Through approved operator workflow only | Yes, from payout queue |
| View all players/funding/payout data | No | No | Limited operator access | Yes, service-only |
| Access private keys | No | No | No through UI | Signing adapter only, server environment only |

No operator override that edits a reward silently is permitted. Any exceptional corrective operation must be explicit, authenticated, audited, and idempotent.

## 4. Complete user flows

### 4.1 First open and wallet authentication

**Entry:** user opens the deployed mini app inside Nimiq Pay.

**Preconditions:** app is served over HTTPS; the Nimiq provider is available; backend and database are healthy.

**Steps:**
1. Frontend loads shell and shows connection state.
2. SDK `init()` waits for the injected Nimiq provider.
3. Frontend asks for the user's Nimiq account address through the supported account-listing method.
4. Backend issues a short-lived, single-use nonce tied to the normalized address and origin.
5. Frontend asks Nimiq Pay to sign a human-readable challenge containing app name, origin, nonce, and expiry. Do not ask the wallet to sign a vague or reusable string.
6. Frontend submits address, nonce ID, signature, public key (if returned), and challenge to backend.
7. Backend verifies signature and that the public key/address match, consumes nonce atomically, then creates a short-lived secure session cookie.
8. Frontend opens the game lobby.

**State changes:** nonce transitions `issued -> consumed`; auth session is created. No financial or game state changes.

**Failure paths:** provider not present, user denies, expired/used nonce, invalid signature, address/public-key mismatch, backend unavailable. Keep user signed out; allow safe retry. The device identifier is not an identity or authentication factor.

**Exit:** authenticated player sees funded demo sessions or a clear “no funded session available” state.

### 4.2 Fund a session (MVP scripted requester)

**Entry:** operator starts a scripted session or the scheduled demo requester creates one.

**Preconditions:** backend has a unique session reference; the demo-agent wallet has testnet funds; the treasury address and network are configured; session has not already been funded.

**Steps:**
1. Backend creates a session in `AWAITING_FUNDING` with `reward_per_answer_luna=500`, `max_consultations=3`, and `max_reward_liability_luna=1500`.
2. Demo requester submits a basic NIM transfer from its separate demo-agent wallet to the treasury address, with the fixed unique transaction-data reference `LBA1:<publicRef>`. If the selected SDK cannot construct a basic transfer with this reference, stop and report the blocker rather than changing the matching rules silently.
3. Backend stores the returned transaction hash as a *candidate* funding transaction; this alone does not activate the session.
4. Blockchain adapter verifies on-chain inclusion and validates the transaction sender (demo-agent allowlist), recipient (configured treasury), network, value (at least the required amount), and unique session reference.
5. Funding record is inserted with unique transaction hash. A transaction and ledger operation reserves the session budget exactly once.
6. Only after confirmation and ledger commit does session state become `FUNDED` and then `AVAILABLE`.

**Failure paths:** transfer submission failure, not included, wrong recipient, insufficient value, wrong network, duplicate transaction hash, mismatch session reference, or database failure. Session remains unavailable; do not count pending transactions as money. A reconciliation job can safely retry verification, but must not repeat the funding transfer blindly.

**Production distinction:** future external agents will need to transfer from their own wallet and provide a funding reference. The same validation rules apply, but their source wallet must be authenticated/authorized according to the future agent integration. Do not claim that exists in the MVP.

### 4.3 Player starts and resumes a game

**Entry:** authenticated player chooses an available funded session.

**Preconditions:** session state `AVAILABLE`, budget reserved, player has no conflicting active session if the MVP limit is one active session/player.

**Steps:**
1. API atomically claims the session for the player (or creates a player-session row if the funded session is shareable, see fixed rule below).
2. MVP decision: **a funded requester session is a pool of funded consultation slots for multiple players, each player session is a separate liability**. To avoid reusing the same `session_budget`, the initial MVP is simpler: one funded requester session funds exactly one player run with three consultation opportunities. Once claimed, the session is not available to other players.
3. Backend sets state `IN_PROGRESS`, records player wallet address, and creates a deterministic initial virtual portfolio (1,000 vUSDT) in server-authoritative state.
4. Frontend renders Level 1 scenario.
5. If refreshed, frontend fetches authoritative state and resumes; it does not create a second player run.

**Important budget rule:** one funded session is assigned to exactly one player. Supporting many players means the requester funds multiple independent sessions. The backend must never let several players spend the same funding balance.

**Failure paths:** session already claimed, funding no longer valid, wallet session expired, database conflict, or player has an active run. Return a conflict/eligibility error and preserve the funded session for the valid claimant if possible.

### 4.4 Scenario decision and portfolio consequence

**Entry:** player is in an active session and sees a level.

**Preconditions:** expected `level_index` and expected state version match the server.

**Steps:**
1. Frontend displays situation and its two decision choices.
2. Player selects an option and submits once with an idempotency key and expected state version.
3. Backend validates the current level, allowed option, session ownership, and not previously completed.
4. Backend applies deterministic scenario rules and updates virtual portfolio; no real financial transaction occurs.
5. Backend writes one immutable decision record and advances state to `LEVEL_COMPLETED` / `CONSULTATION_PENDING`.
6. Frontend animates the consequence using returned values and offers the consultation card.

**Rules:** client animation never decides the outcome. Virtual asset/portfolio amounts are simulation-only and clearly marked. Do not claim the scenario outcomes predict real market behavior.

**Failure paths:** duplicate submit, stale state version, invalid option, session expired, transient network failure. Idempotent replay returns the existing result; conflicting state version returns `409 STATE_CONFLICT`.

### 4.5 Complete or skip a consultation

**Entry:** consultation card appears after each level-up.

**Preconditions:** session is `IN_PROGRESS`; current level has an assigned consultation; it has not already been answered or skipped.

**Steps:**
1. Frontend renders agent message and bundled evidence before the question.
2. Player chooses one of the listed classifications, including `Can't tell`, or selects Skip.
3. On Answer, backend validates the choice and atomically inserts one immutable answer with question ID, chosen option, evidence version, timestamps, and session/player IDs.
4. Backend computes reward from the server rule: one accepted answer = 500 Luna. Skip creates a skip record and zero reward.
5. Reward liability check confirms total earned does not exceed 1,500 Luna or funded reservation. The answer and reward ledger entry commit in one transaction.
6. UI shows “0.005 NIM earned” and the updated pending total. It does not claim payment has been sent yet.
7. On Skip, UI shows the game continues and no reward was earned.

**No objective correct/incorrect scoring:** these are judgment tasks, not quizzes. The MVP pays for a valid submitted response, not an answer matching a hidden key. No task can be paid twice.

**Failure paths:** duplicate answer request, invalid option, question already answered, expired session, insufficient reserved budget, database failure. Unique constraints and idempotency guarantee one reward at most per question.

### 4.6 Finish session and pay the player

**Entry:** player completes all three levels, or session reaches its defined terminal condition after the third consultation is answered or skipped.

**Preconditions:** session belongs to player, is not already closed, valid accepted answers are recorded, funding was verified, treasury has sufficient available balance, and no payout already exists for the session/player.

**Steps:**
1. Backend atomically transitions the player run to `COMPLETED` and computes reward from persisted accepted answers, never from a client-provided total.
2. Backend creates a payout row with unique settlement idempotency key and status `QUEUED`; locks/reserves the reward amount against the funded session and treasury aggregate.
3. Worker serializes treasury payout submissions. Before signing, it rechecks payout state and available treasury balance.
4. Server-side Nimiq adapter builds, signs, and broadcasts an ordinary basic NIM transfer to the verified wallet address. Treasury signing key is testnet-only during MVP and never reaches the browser.
5. Store the transaction hash and set payout `SUBMITTED`; poll/reconcile actual on-chain transaction state.
6. Mark payout `CONFIRMED` only after chain verification shows inclusion and matching sender, recipient, amount, and network. Then update the funded session ledger (`PAID`) and display transaction details.
7. If broadcast result is ambiguous, do not create a new payment immediately; query the existing transaction hash and treasury history first.

**Failure paths:** wallet address invalid, insufficient treasury balance, signer/RPC/client unavailable, transaction rejected, transaction included with unexpected details, database unavailable before/after broadcast, player refreshes, or payout worker restarts. All stages must be resumable without duplicate payments.

### 4.7 Player views payout history

**Entry:** wallet-authenticated player visits History.

**Behavior:** return only sessions and payout records associated with the authenticated wallet principal. Show reward amount, pending/confirmed/failed status, transaction hash, and explorer link based on network configuration.

**Security:** ignore user-supplied owner IDs; determine ownership from the auth session. Never show treasury secret information, demo-agent private details, other players' wallet addresses or histories.

### 4.8 Operator handles funding/payout failure

**Entry:** authenticated operator opens internal admin route/API.

**Behavior:** show sessions in awaiting-funding/failed states, payouts pending beyond threshold, on-chain hashes, reconciliation status, and safe retry action. Retry is a reconciliation/requeue operation, not “send again” without inspecting the chain. Any manual corrective payout must require explicit operator action and create an audit event.

### 4.9 User exits or network fails mid-game

Persist authoritative state on each completed decision/answer. Frontend can be closed or refreshed; reopening the app loads the active session. A session is not silently reset. When a session times out or is administratively cancelled before any paid answer, no reward is due and the unused budget remains an internal credit to the funded requester. In the MVP there is no automatic on-chain refund flow; any return of unused funds is a separately audited ordinary transfer and is not needed for the happy-path demo.

## 5. Functional requirements

### FR-01 Wallet authentication
- **Actor:** player.
- **Inputs:** wallet address, nonce ID, signature, public key if provided.
- **Rules:** one-time nonce, expiring challenge bound to app origin and address; server verifies signature and address/public-key relation.
- **Permissions:** creates only the principal for the proven wallet.
- **Errors:** provider unavailable, denied, expired nonce, invalid signature.
- **Acceptance:** valid signatures create a session; altered challenge, replay, expired nonce, or wrong address is rejected.

### FR-02 Funded session lifecycle
- **Actor:** scripted requester/system.
- **Inputs:** session ID, expected amount, funding transaction hash.
- **Rules:** session unavailable until on-chain transaction verified; transaction hash globally unique; recipient/network/value/reference checked.
- **Acceptance:** pending transfer does not unlock; exact valid confirmed transfer unlocks once; wrong/duplicate transfer never unlocks a second session.

### FR-03 Scenario engine
- **Actor:** player.
- **Inputs:** current level, chosen option, expected state version, idempotency key.
- **Rules:** only predefined options for the current level; server owns outcomes and virtual balance changes.
- **Acceptance:** each decision changes portfolio once; duplicate returns same outcome; stale or out-of-order decision is rejected.

### FR-04 Evidence renderer
- **Actor:** player.
- **Inputs:** static scripted question JSON.
- **Rules:** supported types: `image`, `data_card`, `text_snippet`, `scenario_card`; evidence precedes question; three-line cap for key fact cards; no live fetches.
- **Acceptance:** every question has evidence, readable at mobile sizes, with alt text or text equivalent for images.

### FR-05 Consultation answer/skip
- **Actor:** player.
- **Inputs:** question ID, answer option or skip, idempotency key.
- **Rules:** exactly one terminal action per question; eligible answer earns 500 Luna; skip earns zero; no correctness scoring.
- **Acceptance:** every answer creates at most one reward entry; skipped or replayed answer cannot create payout liability.

### FR-06 Authoritative reward ledger
- **Actor:** system.
- **Inputs:** stored accepted answer.
- **Rules:** reward is deterministic; currency amounts stored as integer Luna; no floating-point financial arithmetic.
- **Acceptance:** three eligible answers total exactly 1,500 Luna and cannot exceed the funded budget.

### FR-07 Treasury payout
- **Actor:** system worker.
- **Inputs:** verified wallet, immutable payout amount, session reference.
- **Rules:** ordinary basic transfer from treasury; server-only signer; unique payout settlement key; serial submission; confirmation verified on-chain.
- **Acceptance:** one completed session yields no more than one confirmed payout; pending/failed is not shown as paid.

### FR-08 History and receipt
- **Actor:** player.
- **Rules:** only own records; distinguish earned, queued, submitted, confirmed, failed.
- **Acceptance:** other wallet’s records are inaccessible even by changing IDs.

### FR-09 Operator monitoring
- **Actor:** operator.
- **Rules:** operator access protected by allowlisted wallet/account plus strong operator secret or private preview access; actions audited.
- **Acceptance:** operator can diagnose stuck funding/payout without seeing signing keys or modifying records silently.

### FR-10 Early preview deployment
- **Actor:** coding agent/operator.
- **Rules:** Phase 1 deploys a navigable shell with all agreed routes and labeled placeholders. Safe staging only; no production keys, real data, or real money operations.
- **Acceptance:** exact preview URL and commit are reported. Each accepted phase updates preview and reports test evidence/incomplete areas.

### FR-11 Final design gate
- **Actor:** operator/coding agent.
- **Rules:** no final visual styling before core E2E pass; references and mockups presented first; explicit operator approval required.
- **Acceptance:** approval and design decision are recorded before Phase 7 begins.

### FR-12 Repository documentation and UI completeness
- **Actor:** coding agent.
- **Rules:** README and docs/ include setup, env, tests, deployment, troubleshooting and architecture; final homepage footer links to real documentation and GitHub repo when appropriate.
- **Acceptance:** links are genuine, reachable on deployed preview, and never fabricated. If repo remains private or linking is inappropriate, document the reason and obtain operator approval for an alternative.

## 6. Business logic and state machines

### 6.1 Requester session states

`DRAFT -> AWAITING_FUNDING -> FUNDING_PENDING -> FUNDED -> AVAILABLE -> CLAIMED -> IN_PROGRESS -> COMPLETED -> SETTLED`

Alternative terminal/intermediate states:
- `FUNDING_FAILED`: transfer failed or failed verification; not playable.
- `CANCELLED`: only before claimed/in progress; no rewards accepted afterward.
- `PAYOUT_PENDING`: completed run has payout queued/submitted.
- `PAYOUT_FAILED`: needs reconciliation; do not automatically duplicate transfer.
- `EXPIRED`: only if a session has an explicit claim deadline and was never claimed; no session unlock.

Allowed transitions must be implemented in a domain service and checked inside DB transactions. UI never writes state directly.

### 6.2 Player run state

`NOT_STARTED -> IN_PROGRESS(level=1) -> CONSULTATION_PENDING(level=1) -> IN_PROGRESS(level=2) -> CONSULTATION_PENDING(level=2) -> IN_PROGRESS(level=3) -> CONSULTATION_PENDING(level=3) -> COMPLETED -> PAYOUT_QUEUED -> PAYOUT_SUBMITTED -> PAYOUT_CONFIRMED`

At a consultation, the player may choose `ANSWERED` or `SKIPPED`. Either terminal action allows gameplay to continue, but only `ANSWERED` creates a reward ledger entry. If there is an interruption, fetch stored state and resume.

### 6.3 Session funding rules

- MVP session: one player run and three possible paid consultations.
- Reward per accepted answer: 500 Luna (0.005 NIM).
- Maximum reward liability: 1,500 Luna (0.015 NIM) per funded session.
- Funding amount must be at least the maximum reward liability. Recommended exact demo funding: 1,500 Luna, with treasury/operations fee reserve held separately. If protocol fees are nonzero for outgoing transfers, the treasury operator reserve covers them rather than silently reducing player reward.
- Use integer Luna only. Convert to NIM only at presentation boundary.
- On-chain received funds are not a smart-contract escrow. Once received, the operator controls the treasury; the database reserve is an accounting control, not a blockchain-enforced lock.
- Never allocate the same funding record or budget reservation to two player runs.

### 6.4 Answer and reward rules

- One consultation card per scenario level.
- Answer is earned when the user submits one of the displayed options and the backend accepts it.
- `Can't tell` is a valid answer option; no “correct answer” test exists in MVP.
- Skip is free and pays zero.
- At most one answer/skip record per player-run/question pair.
- Reward amount comes from server-side versioned configuration, not request input.
- Reward liabilities are recorded in the same database transaction as the accepted answer.
- Total earned reward cannot exceed the session's reserved liability.

### 6.5 Payout rules

- Payout recipient is the address that authenticated the run; changes require re-authentication and are not allowed once the run begins.
- A payout requires a completed run and a reward liability > 0.
- Exactly one payout row per player run.
- A payout row is never marked confirmed based solely on a client report or returned tx hash.
- Every outgoing transfer must match the stored recipient, amount, network, and treasury.
- Use an outbox pattern and serialized treasury transaction queue to prevent races and double sends.
- A timeout or network issue changes UI to pending/reconciling; it does not allow a second payout.
- Unused budget is an internal requester credit/accounting balance. No on-chain refund is required for MVP. Refunds, if enabled, are ordinary transfer operations with unique idempotency keys and audit trails.

### 6.6 Game logic

**Starting portfolio:** 1,000 vUSDT (purely simulated; no real token).

**Level 1 — Stablecoin peg risk:** hold a stablecoin; a new token advertises 12% APY. The player chooses `Stay` or `Move`. The predefined scenario reveals that the new token depegs in the simulation; the outcome changes virtual portfolio according to the authored scenario. All scenario claims are fictional training outcomes, not a prediction.

**Level 2 — Liquidity pool / impermanent loss:** provide virtual ETH/USDT liquidity; ETH's simulated price rises 30%. Choose `Stay` or `Exit`; the simulation illustrates how pool exposure can underperform holding the assets due to impermanent loss and fees. Do not generalize the exact result beyond the scenario math.

**Level 3 — Yield sustainability:** a farm advertises 400% APY. Choose `Ape` or `Read`; the scenario reveals a fork/unaudited contract and a rug-pull outcome for the risky choice. The lesson is to inspect sustainability and risk, not that every high APY is a rug.

All portfolio changes must be defined in a versioned static scenario JSON file with tests for each branch. Consultation evidence is bundled static content, not live market data.

### 6.7 Concurrency and conflicts

- `version` integer on player runs is optimistic concurrency control.
- Accept decision/answer only if version matches and expected state is current.
- Unique database constraints defend against duplicate submissions even if API logic has a bug.
- A per-session unique claimant/player-run constraint ensures one funded session cannot be consumed twice.
- A treasury lock/queue ensures no overlapping payout builder uses stale treasury balance or sends the same settlement twice.
- Use row locks (`SELECT ... FOR UPDATE`) or serializable/appropriate isolation for claim, answer/reward, session reservation, payout creation, and operator retry.

## 7. Data model

All timestamps are UTC `timestamptz`; all NIM amounts are integer Luna (`bigint` in Postgres; serialized as decimal strings in JSON). IDs are UUIDs except wallet/network transaction hashes.

### 7.1 `players`
- `id uuid primary key`
- `nimiq_address text not null unique`
- `public_key_hex text not null`
- `created_at`, `last_authenticated_at timestamptz not null`
- `status text not null default 'ACTIVE'` (`ACTIVE|SUSPENDED`)
- Do not store private keys or mnemonic.

### 7.2 `auth_nonces`
- `id uuid primary key`
- `nimiq_address text not null`
- `nonce_hash text not null unique` (store hash, not raw nonce if feasible)
- `challenge_origin text not null`
- `expires_at timestamptz not null`
- `consumed_at timestamptz null`
- `created_at timestamptz not null`
- Index `(nimiq_address, expires_at)`; one-time consume in transaction.

### 7.3 `auth_sessions`
- `id uuid primary key`
- `player_id uuid references players(id)`
- `token_hash text not null unique` (cookie carries opaque token; DB stores hash)
- `expires_at timestamptz not null`
- `revoked_at timestamptz null`
- `created_at timestamptz not null`
- Store no raw bearer token.

### 7.4 `requester_sessions`
- `id uuid primary key`
- `public_ref text not null unique` (unguessable short ref; no PII)
- `requester_type text not null` (`SCRIPTED_DEMO` for MVP)
- `state text not null`
- `network_id text not null` (`testnet` during MVP)
- `treasury_address text not null`
- `expected_funding_luna bigint not null`
- `reward_per_answer_luna bigint not null default 500`
- `max_consultations smallint not null default 3`
- `max_reward_liability_luna bigint not null default 1500`
- `reserved_liability_luna bigint not null default 1500`
- `unused_credit_luna bigint not null default 0`
- `funding_deadline timestamptz not null`
- `claimed_by_player_run_id uuid null unique`
- `created_at`, `updated_at timestamptz not null`
- Check positive amounts and `max_reward_liability_luna = reward_per_answer_luna * max_consultations` for configured MVP values.

### 7.5 `funding_transactions`
- `id uuid primary key`
- `requester_session_id uuid not null unique references requester_sessions(id)`
- `tx_hash text not null unique`
- `sender_address text not null`
- `recipient_address text not null`
- `amount_luna bigint not null`
- `network_id text not null`
- `reference text not null`
- `status text not null` (`PENDING|INCLUDED|VERIFIED|REJECTED|REORGED`)
- `block_height bigint null`, `included_at timestamptz null`, `verified_at timestamptz null`
- `verification_error text null` (redacted, no secrets)
- `created_at`, `updated_at timestamptz not null`
- Index `(status, updated_at)`. Unique transaction hash prevents replay across sessions.

### 7.6 `player_runs`
- `id uuid primary key`
- `requester_session_id uuid not null unique references requester_sessions(id)` (one run per funded session)
- `player_id uuid not null references players(id)`
- `state text not null`
- `level_index smallint not null default 1 check 1..3`
- `portfolio_state jsonb not null` (virtual data only, validated against schema)
- `state_version integer not null default 0`
- `reward_earned_luna bigint not null default 0`
- `started_at timestamptz not null`, `completed_at timestamptz null`
- `created_at`, `updated_at timestamptz not null`
- Index `(player_id, state)`, `(state, updated_at)`. Add a partial unique index allowing at most one active run per player, where `state IN ('IN_PROGRESS', 'CONSULTATION_PENDING')` (adapt the predicate to the final state representation and test it in migration tests).

### 7.7 `scenario_decisions`
- `id uuid primary key`
- `player_run_id uuid not null references player_runs(id)`
- `level_index smallint not null check 1..3`
- `decision_key text not null`
- `result jsonb not null` (server-generated resulting portfolio and explanation)
- `idempotency_key text not null`
- `state_version_before integer not null`
- `created_at timestamptz not null`
- Unique `(player_run_id, level_index)` and unique `(player_run_id, idempotency_key)`.

### 7.8 `consultation_questions`
- Bundled, version-controlled JSON; for MVP it need not be in a table. Each question includes `id`, `level`, `evidence_version`, `agent_context`, `agent_confidence`, `agent_message`, `evidence.type`, evidence payload, `question`, options, and `reward_luna` (must match server policy).
- If questions are moved to a table later, only operator writes; players read published active versions.

### 7.9 `consultation_responses`
- `id uuid primary key`
- `player_run_id uuid not null references player_runs(id)`
- `question_id text not null`
- `evidence_version text not null`
- `response_key text null` (`SAFE|RISKY|CANT_TELL` or question-specific allowed value)
- `result text not null` (`ANSWERED|SKIPPED`)
- `reward_luna bigint not null default 0`
- `idempotency_key text not null`
- `created_at timestamptz not null`
- Unique `(player_run_id, question_id)`; unique `(player_run_id, idempotency_key)`; check skip reward = 0, answered reward equals configured rate.

### 7.10 `ledger_entries`
- `id uuid primary key`
- `requester_session_id uuid null references requester_sessions(id)`
- `player_run_id uuid null references player_runs(id)`
- `entry_type text not null` (`FUNDING_CONFIRMED|REWARD_RESERVED|PAYOUT_QUEUED|PAYOUT_CONFIRMED|UNUSED_CREDIT|REFUND_SENT|MANUAL_ADJUSTMENT`)
- `amount_luna bigint not null` (use signed direction or `direction` explicitly; recommend `direction text IN ('CREDIT','DEBIT')` and positive amount)
- `direction text not null`
- `idempotency_key text not null unique`
- `external_ref text null`
- `metadata jsonb not null default '{}'`
- `created_at timestamptz not null`
- Append-only; do not update old financial events. Corrections are new compensating entries.

### 7.11 `payouts`
- `id uuid primary key`
- `player_run_id uuid not null unique references player_runs(id)`
- `player_id uuid not null references players(id)`
- `recipient_address text not null`
- `amount_luna bigint not null check > 0`
- `network_id text not null`
- `status text not null` (`QUEUED|BUILDING|SUBMITTED|CONFIRMED|FAILED|RECONCILING|CANCELLED`)
- `idempotency_key text not null unique`
- `tx_hash text null unique`
- `failure_code text null`, `failure_message_safe text null`
- `attempt_count integer not null default 0`
- `submitted_at`, `confirmed_at timestamptz null`
- `created_at`, `updated_at timestamptz not null`
- Index `(status, updated_at)`, `(player_id, created_at desc)`.

### 7.12 `audit_events`
- `id uuid primary key`
- `actor_type text not null` (`PLAYER|OPERATOR|SYSTEM|DEMO_AGENT`)
- `actor_id text null`
- `action text not null`
- `resource_type text not null`, `resource_id text not null`
- `request_id text null`, `ip_hash text null` (avoid storing full IP unless needed)
- `details_redacted jsonb not null default '{}'`
- `created_at timestamptz not null`
- No secret, auth token, signature challenge raw nonce, or private key in details.

### 7.13 Relationships

`players 1—many auth_sessions`; `players 1—many player_runs`; `requester_sessions 1—0/1 funding_transactions`; `requester_sessions 1—0/1 player_runs`; `player_runs 1—many scenario_decisions`; `player_runs 1—0/3 consultation_responses`; `player_runs 1—0/1 payouts`; financial events append to `ledger_entries`; all admin operations create `audit_events`.

### 7.14 Data visibility

- Public/unauthenticated: static marketing/intro, published game rules, no private state.
- Player: own run, own answers, own payout statuses/receipts, current funded session details without sensitive requester data.
- Operator: operational session/funding/payout summaries and redacted error metadata.
- Server only: Treasury and demo-agent signing keys; database service credentials; raw auth tokens/nonces; provider/network credentials.
- Never expose other players' wallet histories, internal risk controls, server secrets, auth nonce records, or signing material.

## 8. System architecture

See `ARCHITECTURE.md` for detailed components, chosen stack, API contracts, database operations, deployment, and environment variables. The fixed direction is:

- React + TypeScript + Vite frontend, deployed on Vercel.
- Node.js + TypeScript + Fastify backend on a persistent Render Web Service.
- Supabase PostgreSQL as the authoritative database; browser does not query privileged tables directly.
- Nimiq Mini App SDK inside Nimiq Pay for user wallet identity and signed-message authentication.
- `@nimiq/core` Web Client/transaction APIs in the backend adapter for testnet transaction building, signing, reading, and broadcasting; exact API calls must be proven in Phase 2 before financial flow integration.
- A separate server-only scripted demo-agent wallet and treasury wallet, both testnet-only. They must use different keys and different addresses.
- No HTLC, no mainnet funds, no live LLM, no additional queue service, no direct frontend-to-database mutations.

## 9. Technology stack

- **Frontend:** React + TypeScript + Vite; React Router for routes; Tailwind CSS for consistent temporary styling and later approved UI; TanStack Query for API state; Zod shared schemas for client-side shape validation (server repeats all authoritative validation).
- **Backend:** Node.js 24 LTS + TypeScript + Fastify; Zod validation; structured logger with secret redaction; `@nimiq/core` Web Client adapter for Nimiq blockchain reads and basic transfer construction/signing/broadcast.
- **Database:** Supabase PostgreSQL; schema migrations tracked in repository; all app financial/session changes go through Fastify; privileged keys server-side only.
- **Tests:** Vitest for unit/integration; Playwright for browser E2E; testnet integration test guarded by explicit environment flag and testnet network ID.
- **Deployment:** Vercel for static frontend/preview deployments; Render persistent Node service for backend and blockchain client; Supabase managed PostgreSQL.
- **Secrets:** Render environment variables during MVP; never use `VITE_` prefixes for secrets. Testnet-only keys in isolated environments.

Alternatives are rejected to reduce complexity: no Next.js full-stack deployment because the backend needs a persistent Nimiq client/serialized payout worker; no Supabase Edge Functions for signing/broadcast until the chosen Web Client runtime is proven there; no Redis/queue service while one worker and Postgres outbox are sufficient; no LLM API because scripted tasks are locked for MVP.

## 10. API specification

Detailed request/response and endpoint rules are in `ARCHITECTURE.md`. All JSON errors use:

```json
{
  "error": {
    "code": "SESSION_NOT_FUNDED",
    "message": "This session is not available yet.",
    "requestId": "opaque-id"
  }
}
```

All financial values in APIs are decimal Luna strings, not floating-point NIM numbers. The UI may display NIM with fixed formatting.

## 11. Database operations

All state-changing finance/game operations use a Postgres transaction with constraints as the final defence. Critical operations:

- claim funded session + create run: lock session row; require `AVAILABLE`; create run; set `CLAIMED/IN_PROGRESS`; unique session/run ensures no double-claim.
- submit decision: lock player run; validate state version and level; insert decision under uniqueness; update virtual state/version in same transaction.
- submit answer: lock run; verify question is expected; insert response; insert reward ledger entry; update earned sum/level state/version in same transaction.
- create payout: lock run and funding ledger/session; derive amount from immutable responses; create unique payout/outbox row; reserve treasury/session liability in same transaction.
- broadcast payout: worker claims one queued payout with a lease/row lock; first check whether a hash has already been assigned; persist transaction hash immediately when available; reconcile before any retry.
- funding confirm: verify chain outside DB transaction, then in DB transaction insert/update funding record under unique tx hash, append ledger entry with unique idempotency key, reserve budget, and activate session once.
- manual payout recovery: audited operator action; no blind re-send.

## 12. Authentication and authorization

Player login is a Nimiq-wallet signature challenge, not a device ID. Backend creates single-use nonces that expire after five minutes; signature verification binds exact challenge text, origin, address, and nonce. On success use an opaque random session cookie with `HttpOnly`, `Secure` in HTTPS, `SameSite=Lax` or stricter compatible setting, and server-side session record. Rotate session tokens on login; revoke on logout; enforce expiry. CSRF protection is required for cookie-authenticated mutating endpoints (same-site checks plus CSRF token or equivalent double-submit protection).

Every player endpoint derives player identity from the authenticated server session. Never accept `player_id` as authoritative ownership input. All record accesses include ownership conditions. Operator endpoints require a separate operator authorization path; a player wallet alone does not imply operator access.

## 13. Security architecture

1. **Key security:** demo-agent and treasury private keys are testnet-only, server-only, separate, never returned from API, never logged, and never bundled. Before mainnet use, require a dedicated key-management review and explicit operator approval.
2. **Wallet authentication:** challenge is unpredictable, single-use, short-lived, origin-bound, and consumed atomically. Reject replay, wrong address, altered challenge, and signatures that do not map to claimed address.
3. **IDOR:** all run, response, payout, and session queries are scoped to authenticated wallet and server-derived ownership.
4. **Payment manipulation:** server computes payouts from immutable answer rows; never trust client reward totals, payout amount, recipient, or transaction status. Payout destination is bound to the authenticated wallet at run start.
5. **Double spending/duplicate payouts:** unique DB idempotency keys, unique payout per run, serialized worker, treasury balance checks, and reconciliation before retry.
6. **Funding replay:** funding transaction hash unique globally; recipient/network/amount/sender/reference checked; a funding transaction can fund one session only.
7. **CSRF/XSS:** HttpOnly cookie, CSRF defense, output escaping, React escaping defaults, avoid unsafe HTML; CSP configured for required Nimiq provider environment and known API hosts.
8. **Injection:** all inputs Zod-validated and parameterized; no dynamic SQL from user input; no shell execution.
9. **Rate limits:** wallet challenge, login verify, session claim, decision, answer, history, funding callbacks, and operator endpoints rate-limited. Add per-wallet and per-IP abuse caps, without treating IP as identity.
10. **Sensitive logging:** redact cookie, signature payloads, raw nonce, keys, DB URLs, and full auth tokens. Log request IDs and safe failure codes only.
11. **External chain data:** do not trust a client-reported tx hash or an RPC response alone without validating actual transaction details and network. Compare source, destination, value, data/ref, and inclusion.
12. **Race conditions:** DB locks/versioning, unique constraints, idempotent mutations, payout worker lease, transactional outbox.
13. **Abuse/fraud:** one funded run per session, at most three answer rewards, no client control over reward rate, no arbitrary repeated session resets, per-wallet concurrency limit.
14. **Preview safety:** testnet-only keys and addresses; do not put production secrets/data in preview; no mainnet send endpoint enabled. Protect operator routes and disable scripted wallet funding in non-test environments.
15. **Financial disclosure:** player payout is a normal transfer from operator-controlled treasury. Session funding is not HTLC escrow or on-chain restricted reserve. The operator can misuse funds; product wording must not call this trustless escrow.
16. **Educational safety:** conspicuous disclosure that all scenarios are simulations, not financial or investment advice; no real trades or deposits by players are required.
17. **MIT/public repository:** no secrets or production address metadata that creates an avoidable security risk in repo. Public repo required by contest rules, and licensing configured accordingly.

## 14. UI/UX architecture (structure, not final visual design)

### 14.1 Routes and screens

Use React Router with these routes:

- `/` — landing/start screen: concise promise, “Play”/“Connect wallet,” Nimiq integration explanation, game/reward disclosure, navigation to How it works and History after auth.
- `/play` — lobby: wallet status, available funded session card, expected number of levels/reward cap, start/resume button, explicit no-funded-session state.
- `/play/:runId` — game screen: progress across 3 levels, virtual portfolio, scenario, decision controls, consequence result, consultation card layer, skip, earned counter, finish state.
- `/history` — player's own sessions, answer count, total earned, payout status, transaction hash/link, empty/error state.
- `/how-it-works` — game rules, reward rules, funded session/treasury disclosure, scripted-agent disclosure, simulation disclaimer.
- `/privacy` — concise privacy notice covering wallet address, auth nonce/signature verification metadata, session history, transaction history, and retention.
- `/terms` — simple hackathon MVP terms and risk/disclosure page; do not draft legal guarantees; clearly state NIM testnet during demo and treasury payout model.
- `/docs` — in-app overview and link to public repository/docs page (real URL set only after repository/docs publication). Do not fabricate a deployment URL.
- `*` — not-found page with working route to Home.

Admin routes live in a separate protected operator surface (`/operator`) only if preview access protection and authentication can be secured. Prefer a minimal protected operator page over many admin features. At minimum the operational monitoring APIs exist; if the UI would delay the MVP, logs + protected endpoint-based operational view is acceptable only if documented and explicit.

### 14.2 Layout hierarchy

- Global shell: product mark/name placeholder, wallet connection/status, primary nav (Play, History, How it works), main content, accessible footer.
- Lobby: status first (wallet, funded/not funded), then one obvious next action; show max payout in NIM and Luna-equivalent internals not necessary to player.
- Game: persistent three-step progress and virtual portfolio; one primary decision/action area; consultation is a layer/card after each level; evidence before question; obvious `Can't tell` and `Skip` actions.
- End state: separate `Reward earned`, `Payout pending`, `Paid` states; never conflate earned amount with confirmed payment.
- History: compact session rows/cards; status plus transaction details; never show fake transaction hash.
- How it works/privacy/terms: readable short content; disclose scripted agent and centralized treasury model in MVP.

### 14.3 Interaction rules

- Buttons have real action; disabled buttons explain why.
- During wallet/API requests, show loading state and prevent duplicate interaction.
- When response state conflicts, refetch authoritative state and tell user the game state was refreshed.
- Animations are short and non-essential; respect `prefers-reduced-motion`.
- All essential information appears in text, not only animation/color.
- Use semantic heading order, labels, keyboard navigation, clear focus rings, high-enough contrast, alt text, and accessible announcements for consequence/reward changes.
- At 320px viewport, no horizontal page overflow; consultation evidence remains readable without pinch-zoom.

### 14.4 Temporary UI vs final visual design

Temporary UI is clean, consistent, accessible, and minimally styled. No final aesthetic is approved. Complete end-to-end functionality first. After acceptance, gather references and show mockups for desktop and mobile principal screens/states. Stop for explicit operator approval before final styling. Record references, mockups, feedback, final decisions, and deviations in `docs/DESIGN_DECISIONS.md`.

### 14.5 Final frontend inventory

Before release verify all routes, global nav/footer, real links, mobile responsiveness, loading/empty/error/success/denied/not-found states, accessibility basics, titles/meta description, app icon/favicon, social preview metadata if appropriate, privacy/terms/how-to pages, and no dead/inert controls. Footer links to real Documentation and actual GitHub repository are required by default. Repository must be public under MIT for contest entry, so the GitHub link is appropriate. The Docs link must lead to a reachable web destination, e.g. `/docs` or published repo docs—not a local filesystem path.

## 15. Design references, mockups, and approval gate

No final visual reference has been approved as of this blueprint. The coding agent must not silently choose a final aesthetic. After Phase 5 E2E functionality gate:
1. Ask the operator to supply references or present three concise candidate directions for selection.
2. Record reference URL/image, attribute to explore (layout, density, typography, color, motion), and original treatment required.
3. Make mockups/prototypes for Home/Lobby, Game level + consequence, Consultation evidence card, cash-out/payout status, and History, in desktop and mobile views and key error/loading states.
4. Present mockups and wait for explicit approval.
5. Revise based on feedback. Only after approval implement Phase 7 visuals.
6. Record approved decisions, mockup paths, references, changes, and intentional deviations.
7. Visual changes must not alter game logic, reward rules, APIs, auth, or payout semantics. Obtain separate approval for any behavior change.

## 16. Third-party integrations

### Mandatory

- **Nimiq Pay Mini App SDK:** provider initialization, account selection, message signature/auth, and on-chain transfer request only where needed for user-directed actions. The player's MVP payout does not require a player signing a transaction; the treasury makes a normal transfer.
- **Nimiq network/Web Client:** verify funding transaction and broadcast/verify treasury payout. Testnet only for the MVP.
- **Supabase Postgres:** authoritative session/reward/payout ledger.
- **Vercel:** static frontend and stable previews.
- **Render:** persistent backend process and payout worker.

### Optional/not used in MVP

- LLM provider: not used; requests are scripted.
- External analytics: not used unless separately approved.
- Firecrawl, price APIs, RPC marketplace, push notifications: not used.

### Failure policy

If chain consensus/read access is unavailable, new sessions cannot become funded/available and payouts remain pending/reconciling. Do not fall back to client claims or set payouts confirmed based on network errors. Retry reads with bounded exponential backoff. For transaction submission, store the transaction hash as soon as known and reconcile before retry. DB outages block financial state changes and should not produce a second transfer on recovery.

## 17. AI architecture

No live AI model is used by the MVP. The “agent” persona is a scripted requester defined in static, versioned JSON. This is a deliberate scope constraint. Each prompt/evidence set is reviewed manually for clarity, neutrality, and answerability using only the supplied context. There is no hidden answer key, autonomous tool call, prompt injection channel, or live agent-to-player loop. Future live AI must be a separate product/architecture decision with structured outputs, deterministic validation, cost limits, prompt injection defenses, data minimization, and human confirmation controls.

## 18. Payment architecture

### 18.1 Chosen model

- No HTLC in MVP.
- Scripted demo requester sends an ordinary basic NIM transfer from its own separate server-side **testnet demo wallet** to the operator's treasury address.
- Backend verifies the deposit on-chain before activating the session.
- The player finishes the session; the backend derives reward from accepted response rows.
- Treasury sends the player a normal NIM transfer from a server-side treasury wallet.
- The same treasury keys are not exposed to the browser. Demo-agent and treasury keys are separate.

### 18.2 Trust model and truthful positioning

Session funding is a normal transfer into an operator-controlled treasury, not a contract-level lock. Database “reserved” funds are bookkeeping controls; they are not enforced by Nimiq consensus. The operator controls payout execution and can fail or misuse funds. The MVP is therefore **funded and auditable, but not trustless escrow**. The demo requester is scripted and controlled by the operator. Public wording must not imply a real independent AI agent paid out of its own funds.

### 18.3 Amount and rewards

- NIM denomination: integer Luna; 1 NIM = 100,000 Luna.
- Reward per accepted consultation: 500 Luna = 0.005 NIM.
- MVP session: up to 3 accepted consultations.
- Maximum liability per session: 1,500 Luna = 0.015 NIM.
- Skip: 0 Luna.
- A separate treasury operational balance covers any transfer fee if a fee is required; the reward budget must not be reduced silently.
- Rewards display as pending until confirmed on-chain.

### 18.4 Funding verification

A received transaction is accepted only after authoritative chain verification and checks of network, destination address, amount, sender/allowlist in demo mode, unique transaction hash, and session reference. Store the transaction hash uniquely. A returned hash or client screenshot is not payment proof.

### 18.5 Payout and reconciliation

Payouts are generated from database records; they are never requested as “pay me this amount” from the browser. Create one payout per run in a database transaction and dispatch through an outbox. Broadcast from the treasury using a single serialized worker, save tx hash, then reconcile with chain details. Do not re-send after timeout until the existing hash and treasury history have been checked. Mark `CONFIRMED` only when actual transaction details match expected amount/recipient/network and inclusion is verified.

### 18.6 Refunding unused requester budget

The MVP may display the computed unused budget as accounting credit to the requester, but not claim it is on-chain isolated. Automatic refunds are not necessary for the hackathon happy path; if implemented, they are ordinary audited treasury transfers. No automatic refunds are ever sent based solely on client state.

### 18.7 Mainnet rule

All MVP keys/config must target testnet. Any mainnet transaction path is disabled by configuration and fails closed. Mainnet requires a separate explicit approval, treasury design, key management review, and legal/risk review.

## 19. Admin and operations

Minimum ops capabilities:
- list sessions by state and creation time;
- inspect funding transaction verification details;
- inspect player-run and response count / computed liability;
- see payout queue and safe status/error metadata;
- reconcile a funding or payout transaction by hash;
- requeue an existing payout after reconciliation (not create a new payout ID);
- suspend a wallet from participating if obvious abuse is detected;
- view audit events.

No mass-edit, arbitrary reward override, private-key reveal, or unrestricted arbitrary-payment endpoint. Operator UI must be private; require an allowlisted operator identity plus server-side protection. If a UI cannot be delivered safely before the deadline, expose only protected operational endpoints and structured logs and record the exception in `AI_HANDOFF.md`.

## 20. Error and edge-case matrix

| Area | Condition | Expected behavior |
|---|---|---|
| Wallet | Provider unavailable | Show open-in-Nimiq-Pay guidance; do not pretend authenticated |
| Wallet | User denies signature | Remain signed out; offer retry |
| Auth | Nonce expired/replayed | Reject, issue a new nonce |
| Auth | Signature/address mismatch | Reject; log safe security event |
| Funding | Tx hash returned but not included | Keep funding pending; session unavailable |
| Funding | Wrong destination/network/amount/reference | Reject verification; no session activation |
| Funding | Same tx submitted twice | Unique constraint; no second credit |
| Session claim | Two users claim simultaneously | One transaction wins; other receives `409 SESSION_UNAVAILABLE` |
| Game | Duplicate decision submit | Return existing decision by idempotency key; no extra portfolio change |
| Game | Stale state version | `409 STATE_CONFLICT`; refetch current run |
| Consultation | Duplicate answer | Return existing response; no second reward |
| Consultation | Skip | Continue with zero reward |
| Consultation | Invalid answer key | `422 INVALID_ANSWER` |
| Balance | Earned amount exceeds reserved liability | Reject mutation, alert ops, keep no over-budget ledger entry |
| Payout | Treasury balance insufficient | Payout remains failed/reconciling; no false paid state |
| Payout | Timeout during broadcast | Query existing tx/hash/history before retry |
| Payout | DB fails after broadcast | Reconcile chain and match idempotency record; never blindly re-send |
| Payout | Transaction rejected | Mark safe error and allow reconciled retry only |
| Payout | Duplicate payout request | Unique payout/run key returns existing payout |
| Network | Consensus/RPC unavailable | Pending/reconciling; do not activate or confirm by guess |
| Session | Player refreshes | Resume server state, not start a duplicate run |
| Session | Session cancelled before claim | Mark cancelled; don't accept answers |
| Security | Player requests another run by ID | Ownership scope check returns 404/403 without leaking data |
| Admin | Unauthorized operator request | Deny and log; never reveal existence of secrets |
| UI | Any primary control | Must have a working action and loading/disabled/error behavior |
| Deploy | Preview connected to wrong chain | Fail health/config check; do not enable funding/payout |

## 21. Testing strategy and acceptance

### Unit tests
- Wallet challenge formatting, expiry, one-use consumption and signature verification adapter.
- Scenario decision outcome for every branch at each of three levels.
- Portfolio state math and invariant checks.
- Reward calculation for 0/1/2/3 answered consultations and skipped tasks.
- Session state transition guards.
- NIM/Luna conversion and formatting; financial storage uses integers.
- Payout idempotency key derivation and outbox transition rules.

### Integration tests
- Supabase migrations/constraints and transactional rollback.
- Concurrent session claim race; exactly one succeeds.
- Concurrent answer submissions; at most one response/reward.
- Duplicate funding hash; one session credit only.
- Funding verifier checks wrong sender, wrong recipient, wrong network, too-low amount, wrong reference, missing inclusion.
- Payout queue and reconciliation with mocked Web Client adapter.
- Session resumes after browser refresh.

### Testnet integration tests
- Explicit opt-in only; fail if network ID is mainnet.
- Generate/use dedicated testnet treasury and demo-agent wallets.
- Send demo-agent → treasury funding transfer; verify inclusion; session unlocks only after verification.
- Complete one player run; treasury → player payout; verify tx recipient, amount, sender and inclusion.
- Simulate worker restart/timeout; reconcile without duplicate transfer.
- Test insufficient treasury balance and network outage.

### E2E tests (Playwright)
1. Unauthenticated landing and route navigation.
2. Staging mock-auth mode (only enabled on preview) and wallet-auth unit/integration adapter path.
3. Funded lobby -> start -> three scenario decisions -> three consultations (answer/skip variations) -> completion -> payout status.
4. Refresh mid-level and resume; state is unchanged.
5. No funded session: cannot start; clear messaging.
6. Double-click answer and payout/retry surfaces: one reward/payout only.
7. History displays only current player records.
8. Responsive layout at 320, 375, 768, 1024, and 1440 widths; no horizontal overflow.
9. All navigation/footer/docs/GitHub links tested on preview.
10. Error, empty, loading, denied, not-found, and pending-payment states rendered.

### Security tests
- Replay signed login challenge.
- Tamper address, nonce, origin, request body reward amount, user/run ID, state version, and transaction hash.
- Try to read another player's session/history.
- Submit more than three answers or duplicate answer IDs.
- Replay payout endpoint concurrently.
- Submit unverified incoming funding and a tx for another session.
- Trigger logs/errors and confirm no secret or auth token appears.
- Try to switch `networkId` or mainnet config in preview.

### Critical end-to-end gate before visual design
All of these must pass on the deployed preview/testnet:
1. Wallet identity authenticated or explicitly isolated preview mock is used without ever confusing mock mode with production.
2. Session created and funded by demo requester transfer.
3. Funding is verified from the chain before session is available.
4. Player completes the 3-level game with an answer/skip combination.
5. Server ledger records no duplicate decisions/responses/reward.
6. Payout is built and broadcast from treasury; actual chain details match the stored recipient and reward.
7. The UI distinguishes earned, submitted, and confirmed.
8. Refresh/retry does not create an extra payout.
9. The preview shows no production secret or mainnet send path.

Final visual design cannot begin until the critical gate passes or the operator explicitly approves a documented exception. A missing working payment cycle is a blocker, not a polish task.

## 22. Repository structure

See `ARCHITECTURE.md`. Monorepo structure:

```text
levelbreak-arena/
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── AGENTS.md
├── AI_HANDOFF.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── apps/
│   ├── web/                  # Vite React frontend
│   └── api/                  # Fastify backend + payout worker
├── packages/
│   └── contracts/            # Shared Zod request/response schemas
├── db/
│   ├── migrations/
│   └── seed/                 # scripted scenarios, test fixtures only
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── testnet/
└── docs/
    ├── ARCHITECTURE_NOTES.md
    ├── DEPLOYMENT.md
    ├── OPERATIONS.md
    ├── TESTING.md
    ├── DESIGN_DECISIONS.md
    ├── SECURITY.md
    └── USER_GUIDE.md
```

The coding agent must inspect the real repository before changing it. If it is empty, create this structure. If it already exists, preserve the existing agreed structure or document a necessary deviation and seek approval.

## 23. Environment variables

All backend variables are server-only. Values below are names/placeholders, not real secrets.

### Frontend (Vercel)
- `VITE_API_BASE_URL` — public HTTPS backend origin; required, client-safe.
- `VITE_APP_ENV` — `preview|production`; client-safe.
- `VITE_NIMIQ_NETWORK_LABEL` — user-facing network label; client-safe.
- No treasury/demo-agent private key, Supabase service key, or database credential may use a `VITE_` prefix.

### Backend (Render)
- `NODE_ENV` — `development|test|production`; server-only.
- `APP_ENV` — `local|preview|production`; server-only.
- `APP_ORIGIN` — exact allowed frontend origin; server-only.
- `API_PORT` — listener port provided by Render or explicit default.
- `DATABASE_URL` — Supabase PostgreSQL connection string; server-only.
- `DATABASE_POOL_MAX` — pool size; server-only.
- `AUTH_SESSION_SECRET` — high-entropy secret for opaque session/token hashing or signing; server-only.
- `AUTH_NONCE_TTL_SECONDS` — fixed at 300 for MVP unless explicitly tested.
- `OPERATOR_ALLOWLIST_ADDRESSES` — operator wallet/address allowlist; server-only.
- `OPERATOR_AUTH_SECRET` — high-entropy server-only secret for the operator access layer; never exposed to the frontend.
- `NIMIQ_NETWORK` — must be `testnet` for all hackathon builds; server-only.
- `NIMIQ_TREASURY_ADDRESS` — treasury receive/pay address for selected network; server-only.
- `NIMIQ_TREASURY_PRIVATE_KEY` or an agreed encrypted key reference — server-only, testnet only, never logged.
- `NIMIQ_DEMO_AGENT_ADDRESS` — separate demo-agent source address; server-only.
- `NIMIQ_DEMO_AGENT_PRIVATE_KEY` — separate demo-agent testnet key; server-only; never used in production.
- `NIMIQ_RPC_OR_CLIENT_CONFIG` — only if required by the tested Nimiq client configuration; server-only, no guessed placeholder endpoint until configured.
- `NIMIQ_EXPLORER_BASE_URL` — real testnet explorer URL chosen and verified during integration; server-only or public configuration.
- `FUNDING_MINIMUM_LUNA` — `1500` for MVP, server-only.
- `REWARD_PER_ANSWER_LUNA` — `500`, server-only; no API client override.
- `MAX_CONSULTATIONS_PER_SESSION` — `3`, server-only.
- `PAYOUT_WORKER_ENABLED` — `false` by default in local dev; only enabled in explicitly configured testnet service.
- `DEMO_FUNDING_ENABLED` — `false` by default; true only in isolated testnet demo environment.
- `PREVIEW_MOCK_AUTH_ENABLED` — true only on preview when necessary for early shell; must be false in production and testnet money flows requiring wallet auth.
- `LOG_LEVEL` — structured log severity; server-only.
- `RATE_LIMIT_*` — server-side rate-limit settings as documented in `docs/SECURITY.md`.

If either key cannot be safely configured in a hosted preview, disable funding and payouts there and use mocked adapters. Do not silently use mainnet or commit any key.

## 24. Implementation plan reference

The required nine-phase sequence, phase tasks, file expectations, acceptance criteria, deployment checkpoints, and stop instructions are fully specified in `IMPLEMENTATION_PLAN.md`. Required order:

**Early skeletal frontend deployment → backend/data/auth → core logic/APIs → functional integration → E2E functionality gate → references/mockups → explicit operator approval → approved final UI → frontend/docs/footer completion → security/release.**

## 26. Sources and verified constraints

- Nimiq Mini Apps overview: https://nimiq.dev/mini-apps
- Nimiq Provider API: https://nimiq.dev/mini-apps/api-reference/nimiq-provider
- Nimiq Web Client: https://nimiq.dev/web-client
- Nimiq `Client` reference: https://nimiq.dev/web-client/reference/classes/client
- Nimiq `Transaction` reference: https://nimiq.dev/web-client/reference/classes/transaction
- Nimiq Accounts / basic account protocol: https://nimiq.dev/protocol/accounts
- Nimiq Device Identifier docs: https://nimiq.dev/mini-apps/features/device-identifier
- Nimiq Mini Apps FAQ (transaction hash alone is not proof of payment): https://nimiq.dev/mini-apps/faq
- Competition rules: https://miniappscompetition.com/rules
- Competition scoring: https://miniappscompetition.com/scoring
- Cycle III: https://miniappscompetition.com/cycle3

**Verified from current official documentation on 29 October 2026:** Cycle III runs 14 October–11 November 2026; submissions need to be working and meaningfully integrate Nimiq Pay; public GitHub repo under MIT is required; the official rules explicitly list paid surveys, microtasks, learn-to-earn quizzes, bounty boards, and related formats as possible earning app patterns. The Nimiq Mini App provider documents `sendBasicTransaction` for user-approved ordinary transfers. The Web Client documentation describes transaction building/signing/broadcasting for normal NIM transfers and documents transaction queries, but the backend payout adapter must still be proven with a testnet end-to-end transaction before treating the integration as implemented.

## 27. Pre-implementation audit (decision log)

1. **No HTLC in MVP:** supersedes the concept handoff's former HTLC settlement section. The user-side redemption path was not available in the documented Mini App APIs, and an agent-side HTLC did not solve player payment guarantees. Remove HTLC from the MVP rather than preserve an unnecessary primitive.
2. **Funded-before-available:** session activation depends on verified ordinary NIM transfer to the treasury, not on client claim or a returned transaction hash.
3. **Custodial operator treasury:** explicitly disclosed; database reservation is not on-chain escrow.
4. **Scripted requester:** demo-agent wallet and treasury are both operator-controlled testnet wallets; describe the resulting flow as a simulation, not a real independent AI paying users.
5. **Three tasks, not ten:** preserve the locked three-level product and one consultation per level. Three accepted responses max; reward cap 0.015 NIM. A ten-question design would require a separate approved product change.
6. **Wallet auth not device ID:** Nimiq's device identifier is device-scoped and must not authenticate users.
7. **Backend transaction adapter:** choose `@nimiq/core` with a persistent backend process as the initial implementation approach; Phase 2 must prove key import/derivation, normal transfer signing, broadcasting, and verification using dedicated testnet wallets. No production signing enabled before proof.
8. **No UI final design yet:** no aesthetic is approved. Temporary UI is intentional until E2E payment flow passes.
9. **Category:** Earn is appropriate given the rules' explicit inclusion of microtasks and learn-to-earn formats; submission wording should still be grounded in actual functionality.
10. **Public source:** competition requires public MIT repository; real GitHub link will be inserted only after actual repo creation.
11. **Deadline reality:** 13 calendar days remain on 29 October 2026. Prioritize an end-to-end 3-level run and actual testnet payout. Cut polish/features before cutting funding verification or payout safety.

**Coding agent start point:** Read `AGENTS.md`, then inspect the repository and current environment without changing files. Execute Phase 1 only: produce the route-complete skeletal frontend, configure a safe test-only preview deploy, deploy it, and report the exact URL, commit, route checklist, and incomplete behavior. Do not implement payments or final visual styling in Phase 1.
