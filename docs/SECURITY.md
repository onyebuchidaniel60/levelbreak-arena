# Security Decisions and Threat Model

## Assets

- Treasury private key and demo-agent private key.
- Player auth sessions and signature challenge nonces.
- Verified funding transactions and reserved liabilities.
- Accepted answer records and payout state.
- Operator access and database credentials.

## Threat actors

- A player attempting to claim another wallet's records or earn extra rewards.
- A caller replaying funding, answers, or payout requests.
- An attacker exploiting leaked config/secrets or a compromised deployment.
- A race condition or worker restart accidentally sending duplicate payouts.
- A malicious or incorrect chain response/source.

## Required controls

- Testnet-only keys in server environment, separate demo-agent/treasury keys, never in frontend or Git.
- Wallet signature nonce is single-use, expires, and binds app origin/address/purpose.
- Cookie authentication uses HttpOnly/Secure/SameSite settings with CSRF and Origin defenses.
- Server derives the player identity; never trust client player ID, reward amount, payout recipient, or transaction state.
- Strict request validation and parameterized SQL; ownership scopes on every resource lookup.
- Unique funding tx hash, unique session run, unique response per question, unique payout per run and unique idempotency keys.
- Row locks/version checks for concurrent state transitions, transactional ledger updates, serialized treasury sender and reconciliation before retry.
- Incoming transfers verified by actual network/sender/destination/value/reference/inclusion; hash alone is insufficient.
- Outgoing transaction confirmed only from actual chain facts matching stored payout.
- Operator endpoints are protected, logged and limited; no arbitrary unaudited payout tool.
- Structured logging redacts keys, mnemonics, cookies, signatures, raw challenges, tokens and DB credentials.
- Preview deployments use testnet and safe test data; mainnet path is disabled by default.

## Product trust disclosure

Funds are ordinary transfers to an operator-controlled treasury. Once received, funds are not locked by an HTLC or another on-chain escrow. A database reservation is not a blockchain-enforced restriction. The operator is responsible for executing player payouts, and this trust assumption must be visible in the product and pitch.

## Mainnet launch gate

Mainnet is not enabled as part of automatic build/deploy. It requires separate operator approval, dedicated mainnet keys, explicit treasury cap, key-storage review, a proven testnet flow, current balance/reconciliation monitoring, abuse controls and appropriate legal/risk review. If these are not ready, ship the demo on testnet and clearly label the network.
