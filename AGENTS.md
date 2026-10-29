# AGENTS.md — LevelBreak Arena

## Role and source of truth

You are the implementation executor, not the product architect. Read `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `IMPLEMENTATION_PLAN.md`, `AI_HANDOFF.md`, and `PROPER_VIBE_CODING_WORKFLOW.md` if it exists in the repository. Follow them exactly. `PROJECT_SPEC.md` defines product behavior; `ARCHITECTURE.md` defines the stack and API/data architecture; `IMPLEMENTATION_PLAN.md` defines phases and gates. Do not invent requirements, expand scope, or redesign the product.

## Product summary

LevelBreak Arena is a three-level simulated DeFi learning game with one scripted agent-style consultation per level. The MVP reward is 0.005 NIM (500 Luna) per accepted consultation response; a skipped task earns zero. A session supports at most three consultation tasks and a maximum reward liability of 0.015 NIM (1,500 Luna). A scripted demo requester sends ordinary testnet NIM funding to an operator treasury. A session is unavailable until its funding transaction is verified on-chain. After a player completes the run, the backend pays from the treasury via ordinary NIM transfer. **No HTLC in the MVP.** This is an operator-custody/trust-based payout model, not trustless escrow. The requester is scripted and controlled by the operator, not a real live AI agent.

## Fixed architecture

- Frontend: React + TypeScript + Vite + React Router + Tailwind CSS + TanStack Query.
- Backend: Node.js 24 LTS + TypeScript + Fastify + Zod.
- Database: Supabase PostgreSQL, schema migrations in repository.
- Nimiq: `@nimiq/mini-app-sdk` in Mini App frontend for wallet identity/signature; `@nimiq/core` Web Client/transaction APIs in backend adapter for normal testnet NIM transactions and verification.
- Tests: Vitest + Playwright.
- Hosting: Vercel frontend, Render persistent backend/worker, Supabase Postgres.
- Chain during implementation/preview: testnet only. Mainnet requires separate explicit operator approval and security review.
- No live LLM, no live evidence fetching, no HTLC, no real DeFi execution, no leaderboard or variable rewards.

Do not change the stack, database architecture, payment model, API contracts, state machine, reward values, or scope without explicit operator approval.

## Non-negotiable payment rules

1. The scripted demo-agent wallet and treasury wallet are separate, operator-controlled testnet wallets with separate keys.
2. A session cannot be exposed as `AVAILABLE` until a real incoming funding transaction is verified for network, sender/allowlist, treasury recipient, expected amount, unique transaction hash, and session reference.
3. A transaction hash returned by a send method does not itself prove funding or payout. Verify actual chain details and inclusion.
4. All amounts use integer Luna. 1 NIM = 100,000 Luna. Reward per accepted answer is 500 Luna; maximum three answers / 1,500 Luna per run. Never accept a reward amount from client input.
5. Skip earns zero. MVP consultation responses have no hidden correct/incorrect rubric; a valid submitted classification earns the fixed reward.
6. One funded session has one player run. Never let multiple players consume the same reserve.
7. Create at most one payout per run. Use Postgres constraints, transactions, idempotency keys, outbox, a serialized treasury worker, and reconciliation before retry.
8. `CONFIRMED` means independently verified on-chain transaction details match expected recipient, amount, network, and treasury. Never mark payout confirmed based only on a returned hash or client claim.
9. Treasury funds are operator-controlled once transferred. The DB reservation is accounting, not an on-chain restriction. Do not describe this as HTLC escrow, trustless payment, or a real independent AI paying users.
10. Never store/return/log private keys, mnemonics, raw auth tokens, signatures, raw login challenges or DB credentials. Never ship a secret in a `VITE_` variable.
11. Disable mainnet sends and worker routes in preview. Fail closed on network mismatch. No real-money operation without explicit operator approval.

## Security rules

- Player identity is authenticated using a short-lived, one-time Nimiq wallet signature challenge. `requestDeviceIdentifier()` is not an identity or authentication method.
- Use secure HttpOnly cookies, exact-origin controls, CSRF defence, short-lived single-use nonces, and rate limits.
- Derive player ID/address from the server session, never from a client-supplied owner ID. Scope all data reads/writes by owner.
- Validate request bodies, params and all third-party chain data. Parameterize database queries.
- Enforce state machines inside domain services and DB transactions. Use unique constraints and optimistic state versions to prevent duplicates/races.
- Redact all sensitive data from logs; use request IDs and safe error codes.
- Keep operator endpoints protected and auditable. Do not expose an arbitrary treasury send endpoint.
- Preview uses test data and testnet-only wallets. Do not connect production database, keys, or irreversible flows to preview.

## Coding and repository rules

- Inspect repository/configuration/dependencies before editing. Report findings first if there are unknown existing components or unexpected project state.
- Implement only the assigned phase and assigned task. Do not begin subsequent phases automatically.
- Do not modify unrelated files. Prefer small, maintainable modules and typed contracts. Keep monetary amounts integer Luna; never use JS floating-point NIM values for accounting.
- Use migrations for schema changes; do not mutate production schema manually.
- Every primary control must do the action it advertises. Do not leave `href="#"`, dead buttons, fabricated transaction hashes, fake paid states, or unexplained placeholders in final UI.
- If a method from Nimiq docs differs from current installed SDK, do not guess or silently change architecture. Prove the minimal transfer/auth path and stop with evidence if blocked.
- If a failure occurs, describe reproduction, relevant safe logs, suspected cause, tests attempted and smallest safe next step. Do not claim success without evidence.
- Follow the repository's existing lint/type/test commands, and add/update tests for every behavior change.
- Make small meaningful commits after verification. Never commit `.env`, secrets, private key material, or personal wallet seed data.

## Frontend sequencing (mandatory)

1. **Phase 1: deploy the skeletal frontend early.** Build the agreed route-complete shell, primary navigation, responsive basics and clearly labelled placeholders. Publish a stable Vercel preview as soon as it builds. Report exact URL, deployed commit SHA, routes, tests, incomplete features and blockers. Do not pretend payments/auth are functional when they are not.
2. Keep preview updated after each verified phase. Report the deployed URL and commit every time. Use only safe preview config/testnet; no production data/keys/actions.
3. Use a consistent temporary UI while finishing behavior.
4. Do not start final visual design until all critical MVP flows pass E2E and the operator has seen evidence on the deployed preview.
5. In the late design phase, collect or propose references, create mockups/prototypes for key desktop/mobile screens and states, present them to the operator, and revise as requested.
6. **Hard approval gate:** STOP until the operator explicitly approves the final mockups/direction. Silence or prior general comments are not approval. Do not implement final UI before approval.
7. After approval, apply the design without changing business behavior, API contracts, payment logic, auth, schema, or architecture. Seek separate approval for those changes.
8. Final frontend completeness includes responsive design, accessibility basics, loading/empty/error/denied/success/pending/confirmed states, valid metadata/icons, 404, real navigation/footer links, and project documentation.
9. The home footer should contain a real Documentation link and real GitHub repo link. The public repo is required by competition rules and must be MIT-licensed. Never invent or guess URLs; create links only when actual destinations exist. If either should not be public, record why and ask the operator before omission/replacement.
10. Check every link and control on deployed preview, including docs/GitHub links and the main user journey.

## Documentation rules

Maintain `README.md` and `docs/` with setup, environment configuration, architecture, testing, deployment, operations/troubleshooting, security disclosures and user guide. Maintain `AI_HANDOFF.md` at every checkpoint with current phase, exact preview URL (or `NOT YET DEPLOYED`), deployed SHA (or `NONE`), completed/incomplete items, tests and evidence, known issues, design-reference/mockup approval status, docs/footer-link status, and exactly one next task.

## Git and phase control

For every phase: implement one task -> run relevant tests -> inspect diff -> fix -> commit -> update `AI_HANDOFF.md` -> deploy/verify preview -> report evidence -> STOP. Never execute multiple phases in one task. Do not proceed through any hard gate without the operator's explicit decision.

## Ambiguity and approval

If a request conflicts with this spec, do not select whichever is easiest. Report the exact conflict, affected document/behavior, and a safe recommended resolution, then stop. Explicit operator approval is required to alter product scope, reward model, architecture, security model, mainnet configuration, public/private repository status, or approved design.
