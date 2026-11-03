# AI_HANDOFF.md — LevelBreak Arena

**Last updated:** 3 November 2026
**Current phase:** Phase 2 BLOCKED at Task 0 — Render TestAlbatross consensus check failed
**Status:** BLOCKED — no Phase 2 application code, migrations, auth, or transfer proof started.

## Current deployment and wallets

- Preview URL: https://levelbreak-arena.vercel.app
- Vercel deployed commit: 612809c8fca37fa6deaac31dd2ec79634c13d87e (Phase 1, accepted)
- Repository URL: https://github.com/onyebuchidaniel60/levelbreak-arena
- Vercel deployment ID: dpl_HhxZdomUrSFAHGAzYwegwbto1Ura
- Vercel project: uhhh2/levelbreak-arena; Root Directory apps/web; Framework Vite; Node 24.x
- Render service: `levelbreak-arena`; normal start command restored to `node apps/api/dist/server.js`; `/health/live` verified `200 {"status":"ok"}` after restore.
- Render service build currently at Phase 1 checkpoint commit `12d130a01fdf5519c1a4e9454fce6ceb5abb4bff`.
- Demo-agent wallet: `NQ23 RSJF DP1Q 894D Q346 V1HK C8F5 GM4F 0J9T`
- Treasury wallet: `NQ83 S85U 0B01 BVY2 RR74 C23E 845S NAKE 1YM3`
- `NIMIQ_NETWORK`: `"testnet"`
- Testnet funding transaction: **NOT YET RUN**
- Testnet treasury payout: **NOT YET RUN**
- Design references: not collected
- Mockups: not created
- Operator approval of final visual design: **NOT GIVEN**

## Phase 2 checkpoint

```text
Project: LevelBreak Arena
Current phase: Phase 2 — BLOCKED at Task 0 (Render consensus check)
Status: BLOCKED
Preview URL: https://levelbreak-arena.vercel.app
Deployed commit SHA: 612809c8fca37fa6deaac31dd2ec79634c13d87e
What changed: No Phase 2 application source, Fastify code, migrations, auth routes, Nimiq adapter, or transfer proof was written. A temporary consensus-check script was created for Task 0, run locally, run once on the Render web service via a temporary start command, then deleted. Render's start command was restored and the normal service redeployed.
What works on the deployed preview: Phase 1 remains accepted: all nine routes render at 320px and 1280px with HTTP 200, one page-level h1 each, no horizontal overflow; wallet control present and disabled with the exact Phase 1 label; no financial or wallet behavior active. The Render Phase 1 API health endpoint is restored and returns 200.
What is intentionally incomplete: all Phase 2 work — Fastify skeleton expansion, schema/migrations, auth nonce/verify/logout/me, NimiqService adapter, and the testnet transfer proof. Phase 2 cannot proceed until chain consensus is resolved.
Tests run and actual results:
  Local baseline (@nimiq/core 2.23.0, Node 24.22.1):
    consensus_check_result={"network":"TestAlbatross","networkId":5,"expectedTestnetNetworkId":5,"consensus":false,"headHeight":null,"peerCount":0,"attempts":36,"elapsedSeconds":181.9,"error":null}
    consensus_check=FAILED
    seed WSS dial attempts repeatedly closed with connections=0

  Render run:
    Render one-off job API rejected: HTTP 400 "new paid services not allowed"
    Fallback used: temporary Render web-service start command executing the same check
    consensus_check_result={"network":"TestAlbatross","networkId":5,"expectedTestnetNetworkId":5,"consensus":false,"headHeight":null,"peerCount":0,"attempts":36,"elapsedSeconds":183.8,"error":null}
    consensus_check=FAILED
    NIMIQ_CONSENSUS_EXIT=1
    Render log retrieval used the Render API; no public log URL is available without exposing the service ID.

  Post-restore:
    GET https://levelbreak-arena.onrender.com/health/live -> 200 {"status":"ok"}

  Migrations: none created or applied.
  Transfer proof: not attempted; no transaction hash.

Payment evidence (if applicable, testnet/mainnet stated clearly): NOT APPLICABLE — no payment code or transfer proof was attempted.
Known issues/blockers: @nimiq/core Web Client cannot reach TestAlbatross consensus from either the local VPS or the Render service. Both runs report networkId=5, consensus=false, peerCount=0, no thrown error, and repeated seed WSS disconnects. This is a blocking infrastructure/network issue, not an application-code failure. Render one-off jobs are unavailable on the current free service plan. Awaiting operator decision on (a) Render networking troubleshooting, (b) explicit approval of a hybrid sign-locally/broadcast-via-RPC adapter as a documented deviation, or (c) changing hosting.
Design references/mockups status: none yet — Phase 6.
Operator visual approval status: NOT GIVEN — Phase 6 gate.
Documentation/footer-link status: docs/ present; footer Docs and GitHub links deferred to Phase 8.
Security/configuration notes: no private keys in the repository; only public wallet addresses are recorded. Render wallet env vars were already set and were not changed during Task 0. No VITE_ secrets. The temporary consensus check used no private keys. The normal Render start command and service health were restored.
Git commit: 612809c8fca37fa6deaac31dd2ec79634c13d87e (Vercel Phase 1 deployment); 12d130a01fdf5519c1a4e9454fce6ceb5abb4bff (Render Phase 1 checkpoint build); this Phase 2 checkpoint commit is the new docs commit.
Single next task: Await operator decision on the Render/TestAlbatross consensus blocker before any further Phase 2 work.
STOPPED awaiting operator approval: yes
```

## Task 0 execution details

- **Method:** The Render one-off job API was attempted but rejected with `HTTP 400 new paid services not allowed`. The authorized fallback was used: temporarily replace the web service start command with a command that installs `@nimiq/core@2.23.0` in `/tmp`, writes the check script, and runs it. The service was redeployed, logs were read via the Render API, and the normal start command was restored.
- **Exact command shape used on Render:**
  ```text
  bash -lc 'set -u; rm -rf /tmp/lba-consensus; mkdir -p /tmp/lba-consensus; cd /tmp/lba-consensus; echo "<gzip-base64 script>" | base64 -d | gzip -d > check.cjs; npm init -y >/dev/null 2>&1; npm install @nimiq/core@2.23.0 --no-audit --no-fund >/dev/null 2>&1 || { echo NIMIQ_CONSENSUS_INSTALL_FAILED; exit 2; }; echo NIMIQ_CONSENSUS_START; NIMIQ_NETWORK=testnet NIMIQ_CONSENSUS_TIMEOUT_MS=180000 node check.cjs; code=$?; echo NIMIQ_CONSENSUS_EXIT=$code; exit $code'
  ```
- **Render network result:** `networkId=5`, `consensus=false`, `headHeight=null`, `peerCount=0`, `attempts=36`, `elapsedSeconds=183.8`, `error=null`.
- **Peer discovery state:** zero connected peers; TestAlbatross seed WSS dials repeatedly closed. The local run showed the same behavior against the public Nimiq seed hosts.
- **Render log URL:** No public log URL is available without exposing the Render service ID. Logs are available in the Render dashboard under the `levelbreak-arena` service's deploy logs; retrieval was performed through the Render API.
- **Retries:** 36 polling attempts at 5-second intervals; no consensus reached within the 180-second limit.
- **Restoration:** Normal `node apps/api/dist/server.js` start command restored; Render deployment completed live; `/health/live` returned 200 `{"status":"ok"}`.
- **Not done:** No Fastify implementation, migrations, auth routes, NimiqService adapter, or transfer proof. No RPC broadcast substitution. No architecture change.

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

1. **Render consensus failure:** The Web Client cannot establish TestAlbatross consensus from Render or the local VPS; zero peers and repeated seed WSS disconnects. This blocks the entire Phase 2 chain adapter and transfer proof.
2. **No RPC substitution:** The verified RPC endpoint was used only for wallet balance preparation; it must not be silently substituted for Web Client broadcast/signing.
3. Server-side normal NIM transfer build/sign/broadcast and chain verification remain unproven.
4. Wallet-signature authentication in the actual Nimiq Pay environment remains unproven.
5. Funding transaction matching and payout duplicate protections remain unimplemented.
6. No mainnet send path is allowed during preview/development.

## Current task for coding agent

**STOP.** Await the operator's decision on the Render/TestAlbatross consensus blocker. Do not implement Phase 2, Fastify changes, migrations, auth, or the Nimiq transfer proof until the operator chooses a path and explicitly authorizes it.

## Checkpoint requirements

At the end of each accepted phase, update this file with the exact preview URL, deployed commit SHA, changed behavior, incomplete areas, tests run and results, transaction evidence if relevant, known issues, design reference/mockup/approval status, documentation/footer-link status, and the single next task. Do not claim deployment, tests or payments without evidence.
