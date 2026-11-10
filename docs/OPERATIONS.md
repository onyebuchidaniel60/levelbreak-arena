# Operator Runbook

## Normal session flow

1. A demo requester session is created in `AWAITING_FUNDING`.
2. The demo-agent wallet sends an ordinary NIM transfer to the configured treasury, with a unique session reference where supported.
3. The chain adapter verifies network, sender, treasury destination, amount, reference and inclusion.
4. The database transaction records funding exactly once and makes the session `AVAILABLE`.
5. One player claims it; five game decisions and consultation responses are recorded server-side.
6. Accepted responses create reward liabilities of 500 Luna each; skipped consultations earn zero.
7. Session completion creates one payout row. The serialized worker sends an ordinary treasury transfer and reconciles the transaction.

## Operator endpoints

All `/api/operator/*` routes require the server-only `OPERATOR_AUTH_SECRET`
sent in the `x-operator-secret` header. The optional `x-operator-id` header is
recorded in audit events. These routes are rate-limited and never expose
private keys or signing material:

- `POST /api/operator/demo-sessions` — only when `DEMO_FUNDING_ENABLED=true`,
  `APP_ENV` is not production and the network is testnet. Reusing the same
  idempotency key resumes the existing session and never sends a second
  funding transfer.
- `GET /api/operator/sessions` — session/funding/run/payout summaries.
- `GET /api/operator/payouts` — payout queue and failure codes.
- `POST /api/operator/payouts/:payoutId/reconcile` — read-only chain
  reconciliation; never creates a new transfer.
- `POST /api/operator/payouts/:payoutId/requeue` — only a `FAILED` payout with
  no transaction hash; requires `{"confirmation":"REQUEUE"}`.
- `GET /api/operator/audit-events` — paginated redacted audit events.

## Auto-replenishing demo lobby (Phase 16)

- `AUTO_REPLENISH_SESSIONS=true` starts a background worker inside the API
  process. It runs once after startup and then five minutes after each run
  completes. When false or absent, no replenisher is started.
- The target is **3 visible `AVAILABLE` sessions**. It uses the existing
  `createDemoSession` flow, so every new session sends exactly 2,500 testnet
  Luna from the demo-agent wallet to the treasury and is only exposed after
  the chain verifies network, sender, recipient, amount, reference and
  inclusion. It never marks a session available from a returned hash alone.
- Transfers are sequential. The worker stops after a pending or failed
  transfer and retries on the next interval; it does not stack three
  transfers after a chain timeout.
- Auto-replenished sessions receive a 24-hour lobby funding deadline so they
  remain claimable while judges evaluate. Operator-created demo sessions keep
  the existing 30-minute deadline.
- Before counting, the worker moves demo sessions whose lobby deadline has
  passed from `AVAILABLE` to `EXPIRED`. External-agent sessions are untouched
  because their consultation reservation has a separate lifecycle. This keeps
  operator state counts aligned with what the lobby can actually show.
- Idempotency keys include the five-minute bucket, observed available count
  and slot. Restarting within the same bucket resumes the same session; the
  database unique constraint on `creation_idempotency_key` protects against
  duplicates.
- `AUTO_REPLENISH_SESSIONS=true` is the only path that may create demo
  sessions in production while `DEMO_FUNDING_ENABLED=false`. The protected
  operator `POST /api/operator/demo-sessions` route still requires
  `DEMO_FUNDING_ENABLED=true` and a non-production `APP_ENV`.
- Structured logs: `session_replenisher_started`, `session_replenisher_run`,
  `session_replenisher_created`, `session_replenisher_pending`,
  `session_replenisher_create_failed`, `session_replenisher_error`.
- To disable immediately, set `AUTO_REPLENISH_SESSIONS=false`, redeploy and
  confirm the stop log. Existing verified sessions remain playable. Do not
  erase or manually mark pending funding rows.
- When the lobby is empty and the flag is enabled,
  `GET /api/sessions/available` returns:
  “We are preparing a new funded session for you. Please refresh in 30 seconds.”
  The lobby displays this message and refreshes automatically every 30
  seconds.

The deployed Render service keeps `DEMO_FUNDING_ENABLED=false`. During Phase 5
the payout worker was enabled for the funded-session-to-payout proof and then
disabled after verification. The current state is `PAYOUT_WORKER_ENABLED=false`.
A real demo-session proof may be run from a controlled local process using the
same testnet keys; it must not flip Render demo funding.

## If a session is stuck awaiting funding

- Confirm the stored funding transaction hash exists.
- Query the chain for the transaction and inspect actual network, inclusion, sender, destination, amount and reference.
- Check chain client health and the funding verifier error code.
- Do not mark the session available manually just because a transaction hash exists.
- Do not send a second funding transaction before checking whether the first was submitted/included.

## If a payout is stuck

- Do not click “send again” or directly send a second transfer.
- Inspect the payout row, attempt history, recorded transaction hash and worker lease.
- Reconcile the existing hash with on-chain details and the treasury account.
- If included and matching, mark confirmed using the reconciliation workflow.
- If rejected/not found, verify no transfer was included and only then requeue the same payout record.
- If chain state is unavailable/ambiguous, keep `RECONCILING` and investigate.

## Payout worker behavior (Phase 5)

- The worker is a single logical broadcaster per deployment. It takes a
  transaction-scoped `pg_try_advisory_lock`; a second replica exits with
  `TREASURY_WORKER_BUSY` without signing or broadcasting.
- The signed transaction hash is persisted as `SUBMITTED` **before** the
  broadcast is attempted. If the broadcast response is lost, the existing hash
  is reconciled; the worker never signs a second transfer for the same payout.
- `SUBMITTED` and `RECONCILING` payouts are reconciled before any new queued
  payout is claimed. A pending submitted payout therefore blocks the next
  broadcast until it reaches a terminal state.
- A payout is marked `CONFIRMED` only when the chain returns included details
  matching treasury sender, stored recipient, stored amount, and TestAlbatross
  network ID 5. A mismatch moves the payout to `RECONCILING`.
- Insufficient treasury balance and pre-broadcast chain failures leave the
  payout `QUEUED` with a safe failure code and a 60-second claim backoff.
- A chain-read outage after submission leaves the payout `SUBMITTED`; it is
  not marked failed or confirmed without chain evidence.
- On worker start, any leftover `BUILDING` row with a hash is moved to
  `SUBMITTED`; a `BUILDING` row without a hash is moved to `RECONCILING` for
  operator review.

### Phase 5 ambiguous-send incident

During the first Phase 5 worker enablement, the pre-hardening worker returned
`Outbound error: No response after asking a couple of peers` and left payout
`b00c882f` in `RECONCILING` with no transaction hash. Reconciliation checked:

- treasury balance unchanged;
- treasury transaction history had no outgoing transfer;
- the stored recipient had no transaction history.

The payout was reconciled to `FAILED` (`NO_TRANSACTION_HASH`) and requeued only
after the hash-before-broadcast worker was deployed. The requeued payout then
confirmed at transaction `6456c17f…`, block `15838244`. This is the reference
procedure for any ambiguous send.

### Explorer links

`NIMIQ_EXPLORER_BASE_URL` may be a path base
(`https://explorer.example/tx`) or a fragment base
(`https://test.nimiq.watch/#`). For fragment bases the API appends the
transaction hash directly; for path bases it appends `/<txHash>`. The verified
TestAlbatross explorer is `https://test.nimiq.watch/#`.

## Treasury balance

Maintain a separate operational reserve for any transaction fees and a session reward budget. Database reservations prevent the app from intentionally over-allocating rewards, but do not lock funds on-chain. The operator controls the treasury; communicate that plainly. Stop new sessions if treasury available balance falls below total unspent liabilities plus operational reserve.

## Emergency controls

- Set `PAYOUT_WORKER_ENABLED=false` to stop new submissions. Do not erase queued payouts.
- Set `AUTO_REPLENISH_SESSIONS=false` to stop automatic demo sessions; also set `DEMO_FUNDING_ENABLED=false` to block the operator creation route.
- Set `DEMO_FUNDING_ENABLED=false` to stop new operator-created demo sessions.
- Keep public API health usable while financial features are disabled.
- Rotate testnet keys if exposed; invalidate the leaked key and replace all affected testnet config.
- For any suspected mainnet/key incident, stop all transactions, preserve audit logs, and follow the operator's incident/legal process.

## Logging

Use request IDs, session/run/payout IDs, safe tx hashes and error codes. Never log private key/mnemonic, auth cookie, raw challenge, raw session token, Supabase service key, or full database URL.


## External agent operations (Phase 10)

- Agents register through `POST /api/agent/register` and receive their API key
  once. Only the SHA-256 hash is stored. There is no key-recovery endpoint; an
  agent that loses its key must register a new wallet.
- A deposit is an ordinary testnet NIM transfer from the registered agent
  wallet to `NIMIQ_TREASURY_ADDRESS`. Verify the actual transaction and require
  inclusion, testnet network, matching sender/recipient, at least 500 Luna, and
  a hash unused by session funding or another deposit.
- Agent `balance_luna` is an accounting liability backed by treasury funds, not
  a separate on-chain account. `reserved_luna` is held per posted consultation.
  The invariant is `0 <= reserved_luna <= balance_luna`.
- On an accepted answer, the backend reduces both balance and reservation by
  500 Luna. On a skip, it releases 500 Luna from the reservation. Player payouts
  still come from the treasury; do not describe agent balances as escrow.
- There is no arbitrary agent payout route. The only agent financial mutations
  are inbound deposit verification, consultation reservation, answer charge and
  skip release.
- If an agent deposit is pending, retry `POST /api/agent/deposit` with the same
  transaction hash after propagation. Never manually credit a balance without
  on-chain evidence.
- To stop new agent activity, disable the public routes at the platform/proxy
  level or rotate the deployment; there is no agent kill switch in this phase.
  Existing reserved questions should be resolved or expired with an explicit
  operator-controlled migration rather than editing balances by hand.
- Run the live proof with `scripts/agent-client.js` as documented in
  `docs/TESTING.md`. Do not run it twice with the same agent wallet; registration
  is unique per wallet.


## MCP server (Phase 11)

- `mcp-server/` is a developer/agent-side stdio wrapper. It is not deployed to
  Render or Vercel and does not add backend routes.
- A developer installs it with `cd mcp-server && npm install`, sets
  `LBA_AGENT_API_KEY` and optionally `LBA_API_BASE_URL`, and adds the command to
  Claude Desktop or Cursor. See `mcp-server/README.md`.
- The tool posts a fixed 500-Luna consultation. The agent must already have a
  verified deposit and enough unreserved balance. A successful call leaves the
  question `AVAILABLE` in the player lobby.
- The wrapper has no treasury, payout, or wallet tools. Use the normal Agent API
  for registration and deposits.
- Do not put the API key in source control, logs, prompts, or chat messages.
  If a key is exposed, register a new agent and stop using the old key.
