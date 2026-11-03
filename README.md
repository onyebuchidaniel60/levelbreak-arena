# LevelBreak Arena

LevelBreak Arena is a three-level simulated DeFi learning game for Nimiq Mini Apps. This repository is the implementation workspace for the approved blueprint.

**Current phase:** Phase 4 — functional frontend integrated.

Phase 4 connects the frontend to the Phase 3 APIs: real wallet challenge/signature authentication, funded-session lobby, three-level game decisions, evidence-backed consultations, reward display, finish/payout status and player history. Styling remains temporary; final visual design is Phase 6/7. No payout worker or demo funding is enabled on the deployed Render service.

## Stack

- Frontend: React + TypeScript + Vite + React Router + Tailwind CSS + TanStack Query
- Backend: Node.js 24 + TypeScript + Fastify
- Database: PostgreSQL (Neon hosting; server-only access, RLS enabled)
- Nimiq integration: `@nimiq/core` backend adapter on TestAlbatross; `@nimiq/mini-app-sdk` wallet auth in Phase 4
- Tests: Vitest + Playwright

## Repository layout

```text
apps/
  web/                  Vite React frontend
  api/                  Fastify API, domain services and worker
packages/
  contracts/            Zod API response contracts shared with the frontend
db/
  migrations/           Versioned PostgreSQL migrations
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
pnpm db:migrate   # requires DATABASE_URL_UNPOOLED
```

Phase 3 integration/concurrency tests run locally when
`LBA_INTEGRATION_DATABASE_URL` points at a migrated test database, and in CI
against an ephemeral Postgres service through `DATABASE_URL_UNPOOLED`:

```bash
LBA_INTEGRATION_DATABASE_URL="$DATABASE_URL" pnpm test:integration

PHASE4_E2E_BASE_URL=https://levelbreak-arena.vercel.app \
PHASE4_EXPECTED_PUBLIC_REF=fa4f30a2d178b6da \
  pnpm exec playwright test -c tests/e2e/playwright.deployed.config.ts
```

The API exposes health routes plus auth, player game, and protected operator
routes documented in `ARCHITECTURE.md`. The payout worker and demo funding are
disabled by default (`PAYOUT_WORKER_ENABLED=false`, `DEMO_FUNDING_ENABLED=false`).

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

The frontend is functional in Phase 4 using temporary Tailwind styling. Wallet signing requires Nimiq Pay; a normal browser shows the “Open this app in Nimiq Pay” prompt. Payment status is shown only from API responses and remains distinct from an earned amount.

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
