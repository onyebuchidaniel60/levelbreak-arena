# Deployment Guide (Implementation Deliverable)

## Hosting model

- Frontend: Vercel static build of `apps/web`.
- Backend: Render persistent Node service for `apps/api` and the serialized payout worker.
- Database: Supabase PostgreSQL.

Exact project/repo/preview URLs must be recorded only after creation. Never invent a URL or copy a URL from another project.

## Local development

The implementation agent must document commands based on the actual package scripts and committed lockfile. Expected workflow:

1. Install the pinned Node LTS and package-manager version.
2. Copy `.env.example` to local `.env` and fill only local/test configuration.
3. Apply local/test Supabase migrations.
4. Run lint, typecheck, unit tests and build.
5. Start backend and frontend in separate dev processes.
6. Verify wallet APIs only inside Nimiq Pay or a clearly labelled local mock mode.

Do not invent commands until scripts exist; update this guide when the repository is implemented.

## Preview safety

- `NIMIQ_NETWORK=testnet` only.
- Use separate testnet-only demo-agent and treasury keys.
- Disable `PAYOUT_WORKER_ENABLED` and `DEMO_FUNDING_ENABLED` by default; enable only after explicitly verifying isolated testnet wallet configuration.
- Use preview API/database configuration, never production data.
- Do not place server secrets in Vercel client environment variables (`VITE_*`).
- Mainnet configuration must fail closed in preview.

## Early deployment requirement

Phase 1 must deploy the skeletal, route-complete frontend as soon as it builds. Record preview URL and deployed commit SHA in `AI_HANDOFF.md`. Keep the URL updated after every verified phase. If deployment is blocked, record the exact error and local verification; do not claim deployment.

## Public release

For competition, the repository must be public and MIT-licensed. Publish only after actual repo creation. Final release requires operator approval, Phase 5 payment E2E evidence, Phase 8 frontend/doc completeness and Phase 9 security regression. Mainnet payouts are a separate explicit approval decision after testnet proof, treasury cap/key readiness and legal/risk review.
