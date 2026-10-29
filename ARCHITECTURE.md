# LevelBreak Arena — Architecture & API Contract

**Status:** Fixed implementation direction; Phase 2 must prove the Nimiq normal-transfer adapter on testnet before payment integration is treated as complete.  
**Related:** `PROJECT_SPEC.md`, `IMPLEMENTATION_PLAN.md`, `AGENTS.md`.

## 1. System context

```text
Player inside Nimiq Pay WebView
   │ @nimiq/mini-app-sdk (account + signed auth challenge)
   ▼
Vercel-hosted React/Vite frontend ── HTTPS /api ──► Render Fastify API
                                                     │
                                ┌────────────────────┼────────────────────┐
                                ▼                    ▼                    ▼
                         Supabase Postgres     Nimiq Web Client      Payout worker
                         authoritative state   chain read/broadcast  serialized outbox
                                                     ▲                    │
                                                     │                    ▼
                                              Nimiq testnet       Treasury wallet
                                                     ▲
                                                     │ ordinary NIM transfer
                                             Demo-agent wallet
                                             (scripted, operator-owned)
```

Trust boundaries:
- The frontend is an untrusted client. All game transitions and rewards are recalculated/validated server-side.
- Supabase is the source of truth; the browser never writes financial tables directly.
- The Render backend owns the testnet demo-agent and treasury signing keys. They are separate keys and addresses.
- Nimiq Pay owns player private keys. The app only requests account information/signatures via the provider.
- The agent's ordinary transfer funds the treasury, not a contract. After receipt, the operator has custody of funds and players trust the operator's payout process.

## 2. Concrete stack

| Layer | Choice | Responsibility |
|---|---|---|
| Frontend | React + TypeScript + Vite | Mini App UI, routes, accessibility, game presentation |
| Routing | React Router | Route inventory and not-found behavior |
| Styling | Tailwind CSS | Temporary consistent UI first; final design only after approval |
| Client API state | TanStack Query | Fetch/cache/retry and invalidate backend state safely |
| Shared contracts | TypeScript + Zod in `packages/contracts` | Parse request/response shapes; server validation remains authoritative |
| Backend | Node.js 24 LTS + TypeScript + Fastify | Auth, state machines, funding verification, ledger, operator endpoints |
| Validation | Zod | Strict body/params schemas and safe error handling |
| Database | Supabase PostgreSQL | Durable session/reward/payout state and transaction constraints |
| Chain | `@nimiq/core` Web Client and transaction APIs | Nimiq testnet reads, normal basic transfer building/signing/broadcast, transaction verification |
| Tests | Vitest + Playwright | Unit/integration/E2E |
| Frontend deploy | Vercel | HTTPS and stable preview deployments |
| Backend deploy | Render persistent Web Service | Fastify API and single logical payout worker; persistent process supports chain client |
| Logging | Pino/Fastify structured logging | Request correlation; secret redaction |

### Version policy

At repository setup, pin a supported Node.js 24 LTS version and exact dependency versions through `package.json` and the committed lockfile. Do not use floating `latest` dependency ranges in deployment. The coding agent must check the current official Nimiq documentation for `@nimiq/mini-app-sdk` and `@nimiq/core` method signatures and add a small integration proof before using them in financial paths. This is an implementation verification task, not permission to change the architecture.

### Rejected choices

- No Next.js full-stack app: the current stack separates a static Mini App frontend from a persistent signing/chain backend.
- No Supabase Edge Functions for payouts initially: test the `@nimiq/core` Web Client under a persistent Node service first.
- No Redis or separate queue service: PostgreSQL outbox and a serialized worker are sufficient at current scale.
- No direct frontend Supabase access to financial/session data: all mutations require centralized server-side validation.
- No HTLC: explicitly removed from the MVP.
- No LLM provider or evidence fetching: the agent is scripted.

## 3. Nimiq architecture details

### 3.1 Frontend wallet integration

Initialize the provider with the official SDK helper before invoking Nimiq APIs. Use the provider to request/list the player's account address and sign a short-lived authentication challenge. The app must handle provider unavailable, user rejection, and provider-normalized errors as normal states.

The player payout is sent by the backend treasury; the player does not sign an HTLC redemption and does not need to approve a payout transaction. Do not imply that the player's wallet sends the payout.

### 3.2 Backend chain adapter

Implement `NimiqService` behind an interface so domain logic does not depend on raw SDK calls. Required methods:
- `getNetworkId()`
- `getHeadHeight()` / readiness check
- `getAccount(address)` or equivalent balance query
- `getTransaction(txHash)` and/or verified transaction history query
- `buildSignAndBroadcastBasicTransfer(input)` for server-held testnet wallet only
- `verifyIncomingFunding(input)` which reads actual chain data, verifies matching transaction and returns normalized verified details
- `getTransactionStatus(txHash)` returning `PENDING|INCLUDED|REJECTED|UNKNOWN` plus actual recipient/value/sender/network/block reference
- `close()` and health state for graceful shutdown

The adapter must fail closed if configured network does not match testnet. It must never expose key material to API responses or logs. It may not use browser wallet APIs for server-side treasury signing.

### 3.3 Transaction verification rules

An incoming funding transaction can activate one session only if all conditions hold:
1. It is on the configured Nimiq testnet.
2. The actual recipient is exactly `NIMIQ_TREASURY_ADDRESS`.
3. Its value is at least the configured session funding requirement (1,500 Luna in the MVP).
4. Its sender matches the demo-agent address allowlist in demo mode.
5. Its transaction data contains the session's opaque unique reference in the approved format `LBA1:<publicRef>`. If the chosen SDK cannot construct this ordinary transfer with the reference, stop and report the blocker rather than silently changing the funding model.
6. The transaction is included/verified according to the Nimiq client/provider verification contract; a returned hash alone is not enough.
7. Its transaction hash has not funded another session.

The app must not use client-reported balance, screenshot, explorer URL, or an unverified webhook as proof of funding.

### 3.4 Outgoing payout rules

The server computes payment from accepted consultation records; it does not accept a client amount. Build and sign a basic transfer from the treasury with a server-only key. Broadcast through the Web Client. Store hash immediately if known. Then verify actual on-chain state. When broadcast outcome is ambiguous, query the transaction and treasury history before any retry.

The single configured treasury worker processes one payout at a time for MVP. This is not a blockchain guarantee, but it limits nonce/validity conflicts and makes reconciliation simple. Database constraints still prevent duplicate business payouts.

### 3.5 Blocker/gate

Official docs show `@nimiq/core` can build/sign/broadcast ordinary NIM transfers and that the Web Client works in Node.js. This supports the chosen technical path, but **the exact normal transfer must pass on testnet in Phase 2**. Do not assume that the backend key format, key derivation, client initialization, network configuration, or broadcast path is correct until the proof works.

## 4. Backend modules

- `auth`: nonce issuance, message signature verification, session cookie lifecycle, CSRF.
- `players`: wallet principal storage and status.
- `sessions`: requester session creation/state machine, availability/claim.
- `funding`: demo funding transfer, on-chain verification, unique funding ledger.
- `game`: scenario metadata, deterministic rules, expected state transitions.
- `consultations`: bundled questions, evidence mapping, answer/skip validation.
- `rewards`: server-side fixed reward calculation and liability invariant.
- `ledger`: append-only financial event entries, reserved/available balances.
- `payouts`: create, queue, broadcast, status/reconciliation.
- `operator`: minimal protected operational endpoints; audits every mutation.
- `nimiq`: provider-independent adapter for `@nimiq/core` chain actions.
- `observability`: request IDs, health/readiness checks, safe logs.

Domain modules must not write database tables directly from route handlers. Routes parse/authorize, call domain services, and map typed errors to HTTP.

## 5. API conventions

- Prefix: `/api`.
- Content type: `application/json`.
- Date/time: ISO 8601 UTC strings.
- UUIDs for internal IDs.
- Amounts: decimal strings in Luna (e.g. `"500"`) to avoid JSON number precision/float issues.
- Auth: secure HttpOnly cookie; mutating requests require CSRF defense.
- Every response should include an `X-Request-Id` or matching `requestId` in errors.
- Use standard errors:

```json
{
  "error": {
    "code": "SESSION_NOT_FUNDED",
    "message": "This session is not available yet.",
    "requestId": "req_opaque"
  }
}
```

- Return 400 for malformed input, 401 unauthenticated, 403 forbidden, 404 absent/not visible resource, 409 stale state/duplicate conflict, 422 business-rule validation, 429 rate limit, 500 internal error, and 503 dependency unavailable. Do not leak stack traces or raw provider responses.

## 6. Public and player API endpoints

### `GET /health/live`
- **Purpose:** process liveness.
- **Auth:** none.
- **Success:** `200 {"status":"ok"}`.
- **Side effects:** none.

### `GET /health/ready`
- **Purpose:** readiness for API traffic.
- **Auth:** none; avoid exposing sensitive detail.
- **Processing:** checks DB connection and chain adapter readiness; do not require chain consensus for all static UI paths, but payout/funding functions must be disabled if chain unavailable.
- **Success:** `200 {"status":"ready"}` or `503 {"status":"not_ready"}`.

### `GET /api/config/public`
- **Purpose:** expose safe presentation config.
- **Auth:** none.
- **Response:** `{ "productName":"LevelBreak Arena", "networkLabel":"Nimiq Testnet", "rewardPerAnswerLuna":"500", "maxConsultations":3, "demoMode":true }`.
- **Never return:** keys, database URL, private endpoints, treasury signer details.

### `POST /api/auth/nonce`
- **Auth:** none; aggressive rate limit.
- **Request:** `{ "address":"NQ…", "origin":"https://actual-app-origin" }`.
- **Validation:** normalize address, compare origin to exact `APP_ORIGIN`, reject malformed address.
- **Response:** `{ "nonceId":"uuid", "challenge":"LevelBreak Arena login…", "expiresAt":"ISO" }`.
- **Side effects:** store nonce hash and expiry; challenge includes product, origin, address, nonce, and timestamp.

### `POST /api/auth/verify`
- **Auth:** none; rate-limited.
- **Request:** `{ "nonceId":"uuid", "address":"NQ…", "publicKey":"hex", "signature":"hex", "challenge":"exact signed text" }`.
- **Validation/logic:** load nonce; ensure unexpired and unused; verify exact signed bytes; verify public key corresponds to wallet address; atomically consume nonce; upsert player; create opaque server session; set HttpOnly cookie.
- **Response:** `{ "player":{"address":"NQ…"}, "expiresAt":"ISO" }`.
- **Errors:** `401 INVALID_SIGNATURE`, `409 NONCE_ALREADY_USED`, `410 NONCE_EXPIRED`, `400 ORIGIN_MISMATCH`.

### `POST /api/auth/logout`
- **Auth:** player session; CSRF.
- **Response:** `204`.
- **Side effects:** revoke server session and clear cookie.

### `GET /api/me`
- **Auth:** player.
- **Response:** `{ "player":{"address":"NQ…"}, "activeRunId":"uuid|null" }`.

### `GET /api/sessions/available`
- **Auth:** player.
- **Logic:** return only sessions that are verified funded, `AVAILABLE`, not expired/cancelled, and not already claimed.
- **Response:** `{ "sessions":[{"id":"uuid","publicRef":"…","maxConsultations":3,"rewardPerAnswerLuna":"500","maxRewardLuna":"1500","funded":true,"state":"AVAILABLE"}] }`.
- **Do not display:** other player IDs or treasury signing data.

### `POST /api/sessions/:sessionId/claim`
- **Auth:** player; idempotency required.
- **Request:** `{ "idempotencyKey":"uuid" }`.
- **Logic:** transaction locks session row, requires `AVAILABLE`, verified funding, reserves exactly one player run, creates `IN_PROGRESS` run with initial virtual portfolio, binds wallet address, changes session to `CLAIMED`.
- **Response:** `{ "runId":"uuid","state":"IN_PROGRESS","levelIndex":1,"stateVersion":0 }`.
- **Errors:** `409 SESSION_UNAVAILABLE`, `409 ACTIVE_RUN_EXISTS`, `422 SESSION_NOT_FUNDED`.

### `GET /api/runs/:runId`
- **Auth:** player; owner scope mandatory.
- **Response:** authoritative run state, current scenario/question if available, virtual portfolio, answered/skipped questions, earned Luna, and payout status. Do not return internal funding source signer data.
- **Errors:** use `404` for non-owned or absent run to limit ID enumeration.

### `POST /api/runs/:runId/decision`
- **Auth:** player owner; idempotency required.
- **Request:** `{ "levelIndex":1, "decisionKey":"STAY", "expectedStateVersion":0, "idempotencyKey":"uuid" }`.
- **Validation:** only the configured decision keys for the current level; expected version must match; run must be in the expected level state.
- **Response:** `{ "decisionId":"uuid","levelIndex":1,"result":{"portfolioValue":"100000000","explanation":"…"},"nextState":"CONSULTATION_PENDING","stateVersion":1 }`. Portfolio values use domain-specified virtual units, not NIM.
- **Side effects:** insert decision and update portfolio/version in a DB transaction.

### `POST /api/runs/:runId/consultations/:questionId/respond`
- **Auth:** player owner; idempotency required.
- **Request:** `{ "action":"ANSWER", "answerKey":"CANT_TELL", "expectedStateVersion":1, "idempotencyKey":"uuid" }` or `{ "action":"SKIP", "expectedStateVersion":1, "idempotencyKey":"uuid" }`.
- **Validation:** expected active question matches level; option is allowed by bundled question; no existing terminal response.
- **Logic:** answer -> insert response and 500 Luna reward ledger; skip -> insert skip with zero reward. Atomic and immutable.
- **Response:** `{ "responseId":"uuid","result":"ANSWERED","rewardLuna":"500","earnedLunaTotal":"500","nextState":"IN_PROGRESS","stateVersion":2 }`.
- **Errors:** `409 QUESTION_ALREADY_RESOLVED`, `409 STATE_CONFLICT`, `422 INVALID_ANSWER`, `422 REWARD_CAP_EXCEEDED`.

### `POST /api/runs/:runId/finish`
- **Auth:** player owner; idempotency required.
- **Request:** `{ "idempotencyKey":"uuid" }`.
- **Logic:** only after level 3 scenario and consultation terminal action; re-compute accepted reward total from DB; mark run completed; create zero or one payout record. If total is zero, mark `COMPLETED_NO_REWARD` and no blockchain transaction is sent. If total > 0, create unique payout/outbox item in same DB transaction.
- **Response:** `{ "runId":"uuid","state":"PAYOUT_QUEUED|COMPLETED_NO_REWARD","earnedLuna":"1000","payoutId":"uuid|null","payoutStatus":"QUEUED|NONE" }`.

### `GET /api/runs/:runId/payout`
- **Auth:** player owner.
- **Response:** `{ "payoutId":"uuid|null","status":"QUEUED|SUBMITTED|CONFIRMED|FAILED|RECONCILING|NONE","amountLuna":"1000","txHash":"hex|null","explorerUrl":"https://real-configured-explorer/…|null" }`.
- **Rule:** do not create or resubmit payout through GET.

### `GET /api/history`
- **Auth:** player.
- **Query:** optional bounded `limit` and opaque cursor; hard max limit 50.
- **Response:** player's own sessions/runs/payouts ordered newest first.

## 7. Operator endpoints

Every `/api/operator/*` endpoint requires operator authentication and CSRF controls; record `audit_events`.

### `POST /api/operator/demo-sessions`
- **Purpose:** create and fund one scripted session on Nimiq testnet.
- **Request:** `{ "idempotencyKey":"uuid" }`.
- **Logic:** require `APP_ENV=preview|development`, `NIMIQ_NETWORK=testnet`, and `DEMO_FUNDING_ENABLED=true`; create session and session-specific reference; submit funding transfer from separate demo-agent wallet to treasury; persist hash; verify on chain; only activate after confirmation. If verification is pending, return a pending status and no available session.
- **Response:** `{ "sessionId":"uuid","state":"FUNDING_PENDING|AVAILABLE","fundingTxHash":"hex|null" }`.
- **Safety:** fail closed if network is mainnet, feature disabled, agent wallet balance insufficient, or reference collision.

### `GET /api/operator/sessions`
- **Purpose:** inspect state/funding summaries.
- **Returns:** paginated sessions, safe transaction facts, never private keys.

### `GET /api/operator/payouts`
- **Purpose:** inspect queue and stuck statuses.
- **Returns:** bounded list with payout ID, status, amount, recipient (operator-only), tx hash, timestamps, safe failure code.

### `POST /api/operator/payouts/:payoutId/reconcile`
- **Purpose:** force a read-only chain reconciliation of an existing payout.
- **Request:** `{ "idempotencyKey":"uuid" }`.
- **Side effects:** updates status based on chain observation and adds audit event; never creates a new transaction.

### `POST /api/operator/payouts/:payoutId/requeue`
- **Purpose:** requeue a failed payout only after reconciliation concludes that no successful transaction exists.
- **Preconditions:** operator authenticated; explicit confirmation phrase or request field; payout status supports safe requeue; current tx hash checked first.
- **Side effects:** reuses same payout row/idempotency identity; any new transaction attempt is linked to the payout and attempt history. No duplicate payout row.

### `GET /api/operator/audit-events`
- Protected, paginated, safe metadata only.

## 8. Database and transactional rules

### 8.1 Funding transaction

1. Create session with `AWAITING_FUNDING` and a unique ref.
2. Request demo-agent transfer through Nimiq adapter.
3. Persist transaction hash as `PENDING`.
4. Chain verifier reads transaction details and validates all required fields.
5. In one DB transaction: lock session, insert/mark funding verified (unique `tx_hash`), append `FUNDING_CONFIRMED` ledger entry with a unique idempotency key, reserve liability, set `AVAILABLE`.
6. If the backend crashes after transfer but before DB update, worker discovers/queries the recorded hash and finishes verification; it does not send another funding transaction.

### 8.2 Answer/reward transaction

1. Lock run.
2. Validate owner, state, level, expected version, answer.
3. Insert unique response.
4. If answered, insert unique reward liability ledger event and update earned total.
5. Update run state/version.
6. Commit. If any step fails, rollback all.

### 8.3 Payout outbox

`payouts` is both durable business state and outbox for a small MVP. Worker claims one `QUEUED` row using row-level lock/lease. Before broadcast it checks `tx_hash` is empty or reconciles existing hash. It builds/sends transaction, saves hash immediately, then queries on-chain details. A worker crash never justifies blind resend.

### 8.4 Treasury serialization

Single active payout broadcaster in MVP. Use a DB lock/lease (`treasury_worker_lock`) or transaction-scoped advisory lock. Multiple API replicas may exist, but only one can submit treasury transfers at a time. If scaling out, keep distributed coordination in Postgres; no in-memory-only lock.

### 8.5 Monetary invariants

- One `requester_session` has one funding transaction and one player run.
- `funding_amount_luna >= max_reward_liability_luna`.
- `max_reward_liability_luna = 3 * 500 = 1500 Luna` in MVP.
- `0 <= reward_earned_luna <= max_reward_liability_luna`.
- One response per question per run; max 3 responses.
- `payout.amount_luna = SUM(response.reward_luna)` for the run; never from client input.
- One payout row per run; one funding tx per session; no transaction hash attached to more than one financial operation.
- If transaction fee is nonzero, treasury operational reserve covers it; user reward amount stays fixed.

## 9. Background worker and jobs

No external queue. Run a background loop inside the Render backend with a single logical worker:
- poll/reconcile `FUNDING_PENDING` records;
- poll/reconcile `SUBMITTED` payouts;
- claim `QUEUED` payouts in order;
- retry transient chain *reads* with bounded exponential backoff;
- never retry ambiguous *sends* without checking chain state;
- expire unused `AWAITING_FUNDING` sessions and `AVAILABLE` sessions after configured expiry (e.g. 30 minutes for demo); expiration never converts unconfirmed funds into available funding;
- write operational counters to logs.

Use jitter and bounded retry. A dead-letter state is `FAILED` or `RECONCILING` requiring operator visibility, not an infinite loop.

## 10. Authentication / authorization architecture

### Player signature challenge

- `POST /auth/nonce` creates at least 128 bits of cryptographically secure random nonce; store only a hash where practical.
- Challenge binds `LevelBreak Arena`, exact app origin, normalized address, nonce, created/expiry time, and purpose.
- Signature verified against exact challenge bytes and supplied/derived public key.
- Nonce is consumed in the same transaction that creates the session; replays rejected.
- Cookie is opaque random token; DB stores its hash. `HttpOnly`, `Secure` under HTTPS, `SameSite=Lax` or stricter, narrow path/domain, expiry.
- Mutations require CSRF proof and/or strict Origin/Referer checks.
- Development mock auth is preview-only, visibly labeled, and cannot access testnet funding/payout routes unless a separate explicit test-only configuration is enabled.

### Operator auth

- Use a strong server-side operator secret and an allowlisted operator wallet/address or a private preview access layer.
- Never make every connected wallet an operator.
- Rate-limit operator login and all operator endpoints.

## 11. Deployment architecture

### Vercel frontend
- Build static Vite output.
- Configure rewrite/proxy only if required; otherwise use `VITE_API_BASE_URL` pointing to Render.
- Preview must use preview backend origin and testnet-only config.
- Frontend runtime health state should clearly show network unavailable; never fake successful funding/payout.
- Add a pre-deploy check preventing a production build from using preview URLs or vice versa.

### Render backend
- Persistent Node service; one logical chain client and payout worker.
- Start worker only when `PAYOUT_WORKER_ENABLED=true`; fail startup if network/key config conflicts.
- Health route reports readiness without leaking config.
- Use graceful shutdown: stop accepting payout work, finish/release worker lease, close client and DB pool.

### Supabase database
- migrations committed in `db/migrations` and applied through controlled commands.
- all tables RLS enabled; no anonymous or end-user table policies for financial writes. Because backend uses server privileges, authorization is still mandatory in Fastify services.
- Backups/point-in-time recovery configured if available; test restore not required for hackathon but document backup responsibility.

### Preview safety
- `NIMIQ_NETWORK=testnet` enforced on backend.
- Testnet-only demo-agent and treasury keys.
- Any mismatch causes startup failure/financial routes disabled.
- No production wallet, real funds, or sensitive production data in preview.
- `PREVIEW_MOCK_AUTH_ENABLED` cannot be true in a real-money/mainnet deployment.

## 12. Logging, monitoring, and alerts

Structured fields: `requestId`, `route`, `actorType`, safe `actorId`, `resourceId`, `event`, `status`, `durationMs`, `txHash` where public, error code. Never log signatures, nonce body, cookie, private keys, mnemonic, Supabase service key, or full DB connection string.

Monitor:
- API errors/latency;
- DB errors;
- funding pending too long;
- rejected funding transaction;
- payout pending/submitted too long;
- insufficient treasury balance;
- repeated failed auth/rate-limit hits;
- chain client disconnected/no consensus;
- worker lock timeout.

For MVP, structured Render logs and a protected operator status page are sufficient. External alerting is optional.

## 13. Exact environment variables

### Frontend
- `VITE_API_BASE_URL` — required public API origin.
- `VITE_APP_ENV` — preview/production label.
- `VITE_NIMIQ_NETWORK_LABEL` — display-only label.

### Backend
- `NODE_ENV`
- `APP_ENV`
- `APP_ORIGIN`
- `API_PORT`
- `DATABASE_URL`
- `DATABASE_POOL_MAX`
- `AUTH_SESSION_SECRET`
- `AUTH_NONCE_TTL_SECONDS=300`
- `OPERATOR_ALLOWLIST_ADDRESSES`
- `OPERATOR_AUTH_SECRET`
- `NIMIQ_NETWORK=testnet` (mandatory during MVP)
- `NIMIQ_TREASURY_ADDRESS`
- `NIMIQ_TREASURY_PRIVATE_KEY` or reviewed encrypted key-reference mechanism
- `NIMIQ_DEMO_AGENT_ADDRESS`
- `NIMIQ_DEMO_AGENT_PRIVATE_KEY`
- `NIMIQ_EXPLORER_BASE_URL` (verified real testnet explorer URL; do not guess)
- `FUNDING_MINIMUM_LUNA=1500`
- `REWARD_PER_ANSWER_LUNA=500`
- `MAX_CONSULTATIONS_PER_SESSION=3`
- `PAYOUT_WORKER_ENABLED=false` by default
- `DEMO_FUNDING_ENABLED=false` by default
- `PREVIEW_MOCK_AUTH_ENABLED=false` outside isolated UI-only preview
- `LOG_LEVEL`
- per-route `RATE_LIMIT_*` configuration if using explicit environment settings

All NIMIQ private keys, session secrets, DB URLs and privileged DB credentials are server-only. No secret may have a `VITE_` prefix. Use `.env.example` with blank placeholders only.

## 14. Links and official technical references

- Mini App overview and provider lifecycle: https://nimiq.dev/mini-apps
- Mini App Nimiq provider API: https://nimiq.dev/mini-apps/api-reference/nimiq-provider
- Web Client overview (Node.js/browser): https://nimiq.dev/web-client
- Client API reference including `sendTransaction` and verified reads: https://nimiq.dev/web-client/reference/classes/client
- Transaction API (construction, signing limitations): https://nimiq.dev/web-client/reference/classes/transaction
- Basic account and NIM transfers: https://nimiq.dev/protocol/accounts
- Device identifier warning (not an identity): https://nimiq.dev/mini-apps/features/device-identifier
- Mini App FAQ including checking payment on backend: https://nimiq.dev/mini-apps/faq
- Competition rules: https://miniappscompetition.com/rules
