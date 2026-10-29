# Player Guide (MVP)

## What is LevelBreak Arena?

A short game about basic DeFi risks. You make decisions in simulated scenarios, see their virtual portfolio consequences, and can earn a small NIM reward for each completed consultation response.

## How a session works

1. Open the Mini App in Nimiq Pay and connect your wallet.
2. Start a session that is shown as funded and available.
3. Complete three simulated scenario levels.
4. At each level, review the supplied evidence and answer the consultation or skip it.
5. Each accepted answer earns 0.005 NIM; skipping earns zero. There are at most three paid responses per session.
6. At the end, the backend calculates the amount from recorded responses and requests a treasury payout. Check whether it is queued, submitted or confirmed.

## Important disclosures

- The scenarios and portfolio values are simulations. They do not open trades or guarantee real-world outcomes and are not financial advice.
- The MVP requester is scripted, not a live external AI agent.
- The MVP uses a treasury-controlled ordinary NIM transfer for funding and payouts. The treasury is controlled by the operator; this is not trustless on-chain escrow.
- The app will clearly label which Nimiq network is in use. Do not assume testnet NIM has real-world value.

## If a payout is pending

Keep the session/history page open or return later to refresh status. A pending state means the app has not verified confirmation yet. Do not assume a returned transaction hash means payment is complete. Use the displayed transaction reference only if one exists.
