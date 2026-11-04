# Architecture Notes

This file summarizes the fixed architecture from `ARCHITECTURE.md` for people working inside the implementation repository.

## Components

- `apps/web`: React/Vite Mini App frontend; calls Fastify APIs and requests player wallet identity/signature through `@nimiq/mini-app-sdk`.
- `apps/api`: Fastify API, game/session domain logic, auth verification, funding verifier, ledger and payout worker.
- `packages/contracts`: shared Zod schemas and TypeScript types for request/response payloads.
- Supabase PostgreSQL: authoritative player, session, funding, response, ledger and payout state.
- Nimiq adapter: isolated interface around official `@nimiq/core` client and basic transfer APIs.

## Trust model

The browser is untrusted. Reward and game state are authoritative only after backend validation and database commit. The operator controls a treasury that receives the demo requester's ordinary NIM transfer and sends player rewards. Funding is verified before a session is available, but the treasury is not on-chain escrow. Do not use “trustless escrow” in copy.

## Fixed monetary rules

- 1 NIM = 100,000 Luna.
- One consultation at each of five levels.
- 0.005 NIM / 500 Luna for one accepted answer.
- Skip = zero.
- Maximum = 0.025 NIM / 2,500 Luna per session.
- Use integer Luna in all backend/database logic. The agent message may be LLM-drafted; the scripted fallback is authoritative when the LLM is unavailable. The fiat off-ramp modal is a labelled demo.

## Integration hard gate

Before any payout feature is treated as complete, send one ordinary testnet transfer from a dedicated server-only test wallet, verify the actual chain details, and document the transaction hash and test output. The incoming funding verifier must also be proven. No mainnet keys in preview.
