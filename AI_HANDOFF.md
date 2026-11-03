# AI_HANDOFF.md — LevelBreak Arena

**Last updated:** 3 November 2026
**Current phase:** Phase 1 complete — skeletal frontend deployed and accepted
**Status:** PASS — Phase 1 accepted; Phase 2 not started.

## Current deployment

- Preview URL: https://levelbreak-arena.vercel.app
- Deployed commit: 612809c8fca37fa6deaac31dd2ec79634c13d87e
- Repository URL: https://github.com/onyebuchidaniel60/levelbreak-arena
- Deployment ID: dpl_HhxZdomUrSFAHGAzYwegwbto1Ura
- Vercel project: uhhh2/levelbreak-arena; Root Directory apps/web; Framework Vite; Node 24.x
- CI: GitHub Actions run for 612809c8 succeeded
- Testnet funding transaction: **NOT YET RUN**
- Testnet treasury payout: **NOT YET RUN**
- Design references: not collected
- Mockups: not created
- Operator approval of final visual design: **NOT GIVEN**

## Phase 1 checkpoint

```text
Project: LevelBreak Arena
Current phase: Phase 1 complete — skeletal frontend deployed and accepted
Status: PASS
Preview URL: https://levelbreak-arena.vercel.app
Deployed commit SHA: 612809c8fca37fa6deaac31dd2ec79634c13d87e
What changed: pnpm monorepo scaffold (apps/web Vite+React+TS+Router+Tailwind+TanStack Query; apps/api Fastify /health/live; packages/contracts placeholder; db/migrations, tests/e2e|integration|testnet placeholders); root package.json with packageManager pnpm@10.34.5 and engines.node 24.22.1; pnpm-workspace.yaml; pnpm-lock.yaml; .nvmrc; .gitignore; blank .env.example; MIT LICENSE (2026 Buchi <onyebuchidaniel60@gmail.com>); implementation README; .github/workflows/ci.yml; all nine routes plus 404; responsive temporary UI; apps/web/vercel.json.
What works on the deployed preview: all nine routes render at 320px and 1280px with HTTP 200, one page-level h1 each, no horizontal overflow; wallet control present and disabled with the exact Phase 1 label; no financial or wallet behavior active.
What is intentionally incomplete: wallet authentication and Nimiq SDK integration; funding verification and treasury payout; database/Supabase schema; real frontend–API integration; scenario/consultation gameplay; final visual design; final Documentation/GitHub footer links; any payment evidence.
Tests run and actual results:
  Local commands:
    $ pnpm install --frozen-lockfile
    Lockfile is up to date, resolution step is skipped
    Already up to date
    Done in 2.1s using pnpm v10.34.5

    $ pnpm lint
    (no output; exit 0)

    $ pnpm typecheck
    Scope: 3 of 4 workspace projects
    packages/contracts typecheck: Done
    apps/api typecheck: Done
    apps/web typecheck: Done

    $ pnpm test
    Test Files  1 passed (1)
    Tests       2 passed (2)
    Playwright: 18 passed (10.1s)

    $ pnpm build
    apps/api build: Done
    apps/web build: 98 modules transformed
    apps/web build: built in 3.14s
    apps/web build: dist/index.html 0.57 kB; dist/assets/index-CnGH-l17.css 11.32 kB; dist/assets/index-Czl9fQu3.js 301.40 kB

  Local API checks:
    GET /health/live -> HTTP 200 {"status":"ok"}
    CORS Origin http://localhost:5173 -> access-control-allow-origin: http://localhost:5173
    NODE_ENV=production without APP_ORIGIN -> exit code 1, "APP_ORIGIN is required when NODE_ENV=production"

  Deployed Playwright run (before Vercel edge challenge activated):
    Nine routes x two viewports: all PASS
    Each route: HTTP 200, one h1, wallet control visible and disabled with
    label "Wallet connection coming in Phase 2", no horizontal overflow
    api_requests=0

  CI:
    GitHub Actions run for 612809c8fca37fa6deaac31dd2ec79634c13d87e succeeded
    Check run: verify — completed / success

  Vercel commit match:
    githubCommitSha=612809c8fca37fa6deaac31dd2ec79634c13d87e
    githubCommitRef=main
    githubCommitRepo=levelbreak-arena
Payment evidence (if applicable, testnet/mainnet stated clearly): NOT APPLICABLE — no payment code in Phase 1.
Known issues/blockers: Vercel edge Security Checkpoint returns 403 to automation from this VPS after the successful Playwright run. Operator owns browser verification of the production alias. No application error; no code fix required.
Design references/mockups status: none yet — Phase 6.
Operator visual approval status: NOT GIVEN — Phase 6 gate.
Documentation/footer-link status: docs/ present; footer Docs and GitHub links deferred to Phase 8.
Security/configuration notes: no secrets in repo or in VITE_ vars; static Vite build with no API routes deployed; funding and payout absent; API CORS fails closed in production without APP_ORIGIN; testnet-only direction preserved.
Git commit: 612809c8fca37fa6deaac31dd2ec79634c13d87e (deployed); checkpoint commit will be the new commit created below.
Single next task: Awaiting operator approval to begin Phase 2 (backend/data/auth foundation + Nimiq testnet transfer proof).
STOPPED awaiting operator approval: yes
```

## Current product decisions

- Product: LevelBreak Arena, a three-level consequence-driven DeFi learning game.
- Category: Earn for Nimiq Mini Apps Competition Cycle III.
- Core flow: player authenticates with Nimiq Pay wallet -> starts a funded session -> makes three simulated decisions -> answers or skips one consultation per level -> backend calculates rewards -> treasury pays NIM -> chain verifies payout.
- Requester: scripted demo agent in MVP, not a live LLM and not an independent external agent.
- Funding: the scripted demo requester uses a separate operator-controlled testnet wallet to send an ordinary NIM transfer to the treasury. A session stays unavailable until its incoming transfer has been verified on-chain.
- Payout: ordinary NIM transfer from operator-controlled treasury to player's verified wallet address. **No HTLC in the MVP.** The funds are treasury-custodied; database reservations do not lock them on-chain.
- Reward: 500 Luna (0.005 NIM) per accepted response; skip earns zero; one consultation per each of three levels; max per session 1,500 Luna (0.015 NIM).
- Scenario content and evidence are static/bundled; no live market data and no real trades.
- Stack: React + TypeScript + Vite; Node 24 + TypeScript + Fastify; Supabase PostgreSQL; `@nimiq/mini-app-sdk` for player wallet identity/signature; `@nimiq/core` for server-side ordinary transfers; Vercel frontend; Render persistent API/worker.
- Node 24.22.1 and pnpm 10.34.5 are pinned in the repository.

## Critical blockers / risks

1. Vercel edge Security Checkpoint currently returns 403 to automation from this VPS. The operator will verify the production alias in a normal browser. This is an edge bot challenge, not an application error, and requires no code change.
2. Server-side normal NIM transfer build/sign/broadcast and chain verification must be proven on testnet before payment implementation proceeds.
3. Wallet-signature authentication must be proven in the actual Nimiq Pay Mini App environment.
4. Funding transactions must be matched to one session and verified before availability.
5. Duplicate funding, claims, answers, and payout attempts must be rejected by DB constraints and reconciliation.
6. No mainnet send path is allowed during preview/development. Any mainnet launch requires separate explicit operator authorization and a security/treasury review.

## Current task for coding agent

**Phase 2 only after operator approval:** backend/data/auth foundation and Nimiq testnet transfer proof, per `IMPLEMENTATION_PLAN.md`. Do not begin Phase 2 without approval.

## Checkpoint requirements

At the end of each accepted phase, update this file with the exact preview URL, deployed commit SHA, changed behavior, incomplete areas, tests run and results, transaction evidence if relevant, known issues, design reference/mockup/approval status, documentation/footer-link status, and the single next task. Do not claim deployment, tests or payments without evidence.
