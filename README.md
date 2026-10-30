# LevelBreak Arena

LevelBreak Arena is a three-level simulated DeFi learning game for Nimiq Mini Apps. This repository is the implementation workspace for the approved blueprint.

**Current phase:** Phase 1 — skeletal, route-complete frontend and project foundation.

Phase 1 intentionally does **not** implement wallet authentication, Nimiq SDK integration, funding verification, payouts, a database, or final visual design. No financial action is available in this phase.

## Stack

- Frontend: React + TypeScript + Vite + React Router + Tailwind CSS + TanStack Query
- Backend: Node.js 24 + TypeScript + Fastify
- Planned database: Supabase PostgreSQL
- Planned Nimiq integration: `@nimiq/mini-app-sdk` and `@nimiq/core`
- Tests: Vitest + Playwright

## Repository layout

```text
apps/
  web/                  Vite React frontend
  api/                  Fastify API skeleton (/health/live only)
packages/
  contracts/            Shared-contract placeholder
db/
  migrations/           Database migration placeholder
tests/
  e2e/                  Playwright route smoke tests
  integration/          Integration-test placeholder
  testnet/              Testnet-test placeholder
docs/                   Product, deployment, security and operations documentation
```

## Prerequisites

- Node.js **24.22.1** (see `.nvmrc`)
- pnpm **10.34.5** (pinned in `package.json`)

## Commands

```bash
pnpm install
pnpm dev          # run the web and API development servers
pnpm lint
pnpm typecheck
pnpm test         # Vitest unit checks plus Playwright route smoke tests
pnpm build
```

The API exposes `GET /health/live` and returns `{"status":"ok"}`. It has no database, auth, Nimiq, funding, or payout routes.

## Phase 1 routes

- `/` — landing and Play call to action
- `/play` — lobby with an explicit no-funded-session state
- `/play/:runId` — game shell with a not-connected state
- `/history` — empty history state
- `/how-it-works` — planned game rules and disclosures
- `/privacy` — Phase 1 privacy notice
- `/terms` — Phase 1 terms and risk disclosure
- `/docs` — in-app documentation overview
- `*` — not-found page with a working link home

The wallet control is deliberately a disabled placeholder until Phase 2. No button or link claims that funding or payment is active.

## Preview

The verified preview URL and deployed commit SHA are recorded in [`AI_HANDOFF.md`](AI_HANDOFF.md) after deployment verification. No URL or SHA is fabricated in this repository.

## Source documents

- [`AGENTS.md`](AGENTS.md) — persistent implementation rules
- [`PROJECT_SPEC.md`](PROJECT_SPEC.md) — product source of truth
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — fixed architecture and API contracts
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — phased implementation and approval gates
- [`docs/`](docs/) — deployment, operations, security, testing, design and user documentation
- [`PROPER_VIBE_CODING_WORKFLOW.md`](PROPER_VIBE_CODING_WORKFLOW.md) — workflow reference

## Safety and scope

- Testnet only; no mainnet path is enabled.
- No HTLC and no trustless-escrow claim. The planned MVP uses an operator-controlled treasury and ordinary NIM transfers.
- The requester is planned as a scripted demo requester, not a live AI agent.
- No secrets belong in the repository. `.env.example` contains blank placeholders only.
