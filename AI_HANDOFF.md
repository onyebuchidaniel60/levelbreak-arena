# AI_HANDOFF.md — LevelBreak Arena

**Last updated:** 29 October 2026  
**Current phase:** Pre-implementation blueprint complete; Phase 1 not started  
**Status:** No application code has been written in this project handoff session.

## Current product decisions

- Product: LevelBreak Arena, a three-level consequence-driven DeFi learning game.
- Category: Earn for Nimiq Mini Apps Competition Cycle III.
- Core flow: player authenticates with Nimiq Pay wallet -> starts a funded session -> makes three simulated decisions -> answers or skips one consultation per level -> backend calculates rewards -> treasury pays NIM -> chain verifies payout.
- Requester: scripted demo agent in MVP, not a live LLM and not an independent external agent.
- Funding: the scripted demo requester uses a separate operator-controlled testnet wallet to send an ordinary NIM transfer to the treasury. A session stays unavailable until its incoming transfer has been verified on-chain.
- Payout: ordinary NIM transfer from operator-controlled treasury to player's verified wallet address. **No HTLC in the MVP.** The funds are treasury-custodied; database reservations do not lock them on-chain.
- Reward: 500 Luna (0.005 NIM) per accepted response; skip earns zero; one consultation per each of three levels; max per session 1,500 Luna (0.015 NIM).
- Scenario content and evidence are static/bundled; no live market data and no real trades.
- Stack: React + TypeScript + Vite; Node + TypeScript + Fastify; Supabase PostgreSQL; `@nimiq/mini-app-sdk` for player wallet identity/signature; `@nimiq/core` for server-side ordinary transfers; Vercel frontend; Render persistent API/worker.

## Current implementation checkpoint

- Preview URL: **NOT YET DEPLOYED**
- Deployed commit: **NONE**
- Repository URL: **NOT PROVIDED / NOT CREATED IN THIS blueprint**
- Tests run: **None — no application code exists yet**
- Testnet funding transaction: **NOT YET RUN**
- Testnet treasury payout: **NOT YET RUN**
- Funding verification: design specified; implementation unverified
- Payout adapter: design specified; Phase 2 must prove it with an actual testnet transfer
- Design references: not collected
- Mockups: not created
- Operator approval of final visual design: **NOT GIVEN**
- README/docs package: handoff documentation drafted; implementation repository docs still need to be created and kept accurate
- Homepage Documentation/GitHub footer links: not yet created; must use actual reachable URLs when they exist

## Critical blockers / risks

1. Server-side normal NIM transfer build/sign/broadcast and chain verification must be proven on testnet before payment implementation proceeds.
2. Wallet-signature authentication must be proven in the actual Nimiq Pay Mini App environment.
3. Funding transactions must be matched to one session and verified before availability.
4. Duplicate funding, claims, answers, and payout attempts must be rejected by DB constraints and reconciliation.
5. No mainnet send path is allowed during preview/development. Any mainnet launch requires separate explicit operator authorization and a security/treasury review.

## Current task for coding agent

**Only Phase 1 of `IMPLEMENTATION_PLAN.md`:** inspect the repository and environment without modifying files, report findings, then (after this review) create/deploy the route-complete skeletal frontend preview. Phase 1 must not implement funding or payouts and must not apply final visual styling.

## Checkpoint requirements

At the end of each accepted phase, update this file with the exact preview URL, deployed commit SHA, changed behavior, incomplete areas, tests run and results, transaction evidence if relevant, known issues, design reference/mockup/approval status, documentation/footer-link status, and the single next task. Do not claim deployment, tests or payments without evidence.
