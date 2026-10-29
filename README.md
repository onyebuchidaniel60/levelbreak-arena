# LevelBreak Arena — Implementation Blueprint Package

This package is the approved product and technical handoff for the LevelBreak Arena MVP. It is a planning/documentation package; it does not contain application implementation code.

## Read in this order

1. `PROJECT_SPEC.md` — source of truth for product, MVP boundaries, user flows, requirements, state machines, data model, security, UX structure, payment rules, tests and audit.
2. `ARCHITECTURE.md` — fixed stack, trust boundaries, Nimiq adapter, API contracts, database transaction rules, deployment and environment variables.
3. `IMPLEMENTATION_PLAN.md` — phased work and mandatory stop/verification gates.
4. `AGENTS.md` — persistent coding-agent instructions.
5. `AI_HANDOFF.md` — actual current checkpoint. It intentionally says no preview/app implementation has been deployed yet.
6. `docs/` — operational, test, deployment, security, design and user-facing docs for the implementation repository.
7. `PROPER_VIBE_CODING_WORKFLOW.md` — the workflow reference supplied by the operator.

## Product in one paragraph

LevelBreak Arena is a three-level simulated DeFi learning game. At each level-up the player sees one evidence-backed consultation request from a scripted requester. Players may answer or skip; each accepted response earns 0.005 NIM, while skipping earns zero. A maximum of three responses can earn 0.015 NIM per session. The requester’s session is unavailable until an ordinary NIM funding transfer to the operator treasury is verified on-chain. At session completion, the backend calculates the reward from the persisted answer ledger and the operator treasury sends an ordinary NIM transfer to the player's wallet. The MVP does **not** use HTLC; this is a treasury-custody model, not trustless escrow, and the scripted requester is not a real external AI agent.

## Non-negotiable workflow

**Early skeletal frontend deployment → core functionality → end-to-end verification → references/mockups → explicit operator design approval → final UI implementation → frontend/docs/footer completeness → security and release.**

The coding agent implements one phase at a time, tests it, commits, updates `AI_HANDOFF.md`, verifies the deployed preview, reports evidence, and stops. It may not automatically proceed to the next phase.

## Current status

No application repository or preview URL was provided or created while preparing this blueprint. Exact URL/commit fields are intentionally marked `NOT YET DEPLOYED`/`NONE` in `AI_HANDOFF.md`; do not fabricate them.

## Competition-facing constraints

Cycle III rules require a working Mini App that meaningfully integrates Nimiq Pay, a public GitHub repo under MIT, and a written description of no more than 250 words. The current official rules include paid surveys, microtasks and learn-to-earn formats as possible earning-app patterns. See the source links in `PROJECT_SPEC.md` and `docs/DEPLOYMENT.md`. Verify current submission portal requirements before final submission.
