# Security Decisions and Threat Model

## Assets

- Treasury private key and demo-agent private key.
- Player auth sessions and signature challenge nonces.
- Verified funding transactions and reserved liabilities.
- Accepted answer records and payout state.
- Operator access and database credentials.
- External agent API keys (stored only as SHA-256 hashes) and agent balance/reservation records.

## Threat actors

- A player attempting to claim another wallet's records or earn extra rewards.
- A caller replaying funding, answers, or payout requests.
- An attacker exploiting leaked config/secrets or a compromised deployment.
- A race condition or worker restart accidentally sending duplicate payouts.
- A malicious or incorrect chain response/source.
- An attacker registering another wallet, replaying an agent deposit, or trying to spend reserved agent balance.

## Required controls

- Testnet-only keys in server environment, separate demo-agent/treasury keys, never in frontend or Git.
- Wallet signature nonce is single-use, expires, and binds the exact challenge, origin, purpose and expiry. Verify the Nimiq signed-message framing (`sha256("\x16Nimiq Signed Message:\n" + message.length + message)`) and derive the signer address from the returned public key. Never trust `listAccounts()[0]` or a client-supplied address as identity.
- Cookie authentication uses HttpOnly/Secure/SameSite settings with CSRF and Origin defenses.
- Server derives the player identity; never trust client player ID, reward amount, payout recipient, or transaction state.
- Strict request validation and parameterized SQL; ownership scopes on every resource lookup.
- Unique funding tx hash, unique session run, unique response per question/level, unique payout per run and unique idempotency keys.
- Row locks/version checks for concurrent state transitions, transactional ledger updates, serialized treasury sender and reconciliation before retry.
- Rewards are always recomputed from persisted `consultation_responses` rows; the API never accepts a reward amount, recipient or owner ID from the client.
- Operator routes require a server-only `OPERATOR_AUTH_SECRET` header and write audit events; there is no arbitrary treasury-send endpoint.
- Incoming transfers verified by actual network/sender/destination/value/reference/inclusion; hash alone is insufficient.
- Outgoing transaction confirmed only from actual chain facts matching stored payout.
- Operator endpoints are protected, logged and limited; no arbitrary unaudited payout tool.
- Structured logging redacts keys, mnemonics, cookies, signatures, raw challenges, tokens and DB credentials.
- Preview deployments use testnet and safe test data; mainnet path is disabled by default.
- LLM agent messages are server-only. Send only the current scenario/question/evidence summary and the player's own earned amount; never wallet addresses, signatures, auth tokens, cookies, keys, or other players' data. Use a bounded timeout, output cap, per-run cache, authentication, and rate limiting. Fall back to the versioned scripted message on missing key, timeout, HTTP error, or invalid output. Do not log raw prompts or completions.
- External agent API keys are bearer secrets. Return the plaintext key only once at registration, store only `sha256(key)`, redact `Authorization`, and rate-limit all agent endpoints. Never return the stored hash.
- Agent deposits are credited only after the actual transaction is included/confirmed on testnet, sent by the registered agent wallet, received by the treasury, at least 500 Luna, and unused by any session funding or prior agent deposit. The unique transaction hash is enforced across both tables.
- Agent consultation creation locks the agent row and requires `balance_luna - reserved_luna >= 500`. An accepted answer decrements both `balance_luna` and `reserved_luna` by 500; a skip releases 500 from `reserved_luna` only. All settlement is in the same transaction as the player response.
- The public Agent directory exposes only name, question counts, rewards funded and creation date. It never exposes balances, wallet addresses, API-key hashes, or player data.
- The LLM provider receives no agent API key, agent wallet address, deposit transaction, player wallet address, auth material or payout data. External-agent consultation text is not sent to the LLM.
- Registration does not yet prove wallet ownership with a signature; the MVP control is that a deposit must be sent by the registered wallet. A production marketplace should add a signed wallet challenge at registration and an owner-approved key rotation flow.
- The fiat off-ramp modal is a labelled demonstration only. It must not call an exchange, create an account, start KYC, move funds, or imply real fiat settlement. A real off-ramp requires a licensed provider, KYC/AML, legal and security review.

## Product trust disclosure

Funds are ordinary transfers to an operator-controlled treasury. Once received, funds are not locked by an HTLC or another on-chain escrow. A database reservation, including an external agent's balance, is not a blockchain-enforced restriction. The operator is responsible for executing player payouts, and this trust assumption must be visible in the product and pitch. External agents do not custody player funds and do not send payouts directly.

## Mainnet launch gate

Mainnet is not enabled as part of automatic build/deploy. It requires separate operator approval, dedicated mainnet keys, explicit treasury cap, key-storage review, a proven testnet flow, current balance/reconciliation monitoring, abuse controls and appropriate legal/risk review. If these are not ready, ship the demo on testnet and clearly label the network.
