# Operator Runbook

## Normal session flow

1. A scripted requester session is created in `AWAITING_FUNDING`.
2. The demo-agent wallet sends an ordinary NIM transfer to the configured treasury, with a unique session reference where supported.
3. The chain adapter verifies network, sender, treasury destination, amount, reference and inclusion.
4. The database transaction records funding exactly once and makes the session `AVAILABLE`.
5. One player claims it; three game decisions and consultation responses are recorded server-side.
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
- Set `DEMO_FUNDING_ENABLED=false` to stop new scripted sessions.
- Keep public API health usable while financial features are disabled.
- Rotate testnet keys if exposed; invalidate the leaked key and replace all affected testnet config.
- For any suspected mainnet/key incident, stop all transactions, preserve audit logs, and follow the operator's incident/legal process.

## Logging

Use request IDs, session/run/payout IDs, safe tx hashes and error codes. Never log private key/mnemonic, auth cookie, raw challenge, raw session token, Supabase service key, or full database URL.
