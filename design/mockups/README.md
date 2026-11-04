# LevelBreak Arena — Trading Terminal mockups (Phase 6)

**Status:** PROPOSED direction. Not approved. No application code has been changed.

This directory is a static design artifact for operator review. It is not imported by
`apps/web`, has no build step and makes no API calls. The deployed application keeps its
temporary Tailwind styling.

## How to view

Open any screen directly in a browser:

```text
design/mockups/01-landing.html
design/mockups/02-wallet-connect.html
...
design/mockups/12-states-composite.html
```

Each file is standalone and loads `_shared/tokens.css` plus local webfonts from
`_shared/fonts/`. There is no JavaScript in any screen. Links between mockup files are
provided so the review set is navigable; the “Documentation”, “GitHub repository” and
“Privacy & terms” footer entries are deliberately labelled placeholders for Phase 8.

`_shared/shell.html` is the base frame reference. It is not a product route.

## Screens

| # | File | State |
|---|---|---|
| 01 | `01-landing.html` | Landing, both entry states, trust strip, 3-step explainer |
| 02 | `02-wallet-connect.html` | Provider available / provider unavailable side by side |
| 03 | `03-lobby-available.html` | Authenticated lobby with one funded session and empty “other sessions” panel |
| 04 | `04-lobby-empty.html` | Authenticated lobby with no funded session |
| 05 | `05-game-level1.html` | Level 1 decision, virtual portfolio 1,000 vUSDT |
| 06 | `06-game-consequence.html` | Level 1 MOVE consequence, portfolio 800 vUSDT |
| 07 | `07-consultation.html` | Level 1 consultation: agent context, evidence, question, options, skip |
| 08 | `08-consultation-answered.html` | Brief +500 Luna reward flash and auto-return state |
| 09 | `09-payout-states.html` | QUEUED / SUBMITTED / CONFIRMED side by side |
| 10 | `10-zero-reward.html` | Completed session with all three consultations skipped |
| 11 | `11-history.html` | Populated history with two real Phase 5 payouts plus empty-state reference |
| 12 | `12-states-composite.html` | Loading, 500 error, 404, 401 expired-session composite |

## Screenshots

| Directory | Contents |
|---|---|
| `screenshots/desktop/` | 1440×900 viewport capture per screen, plus `-full` full-page capture |
| `screenshots/mobile/` | 375×812 viewport capture per screen, plus `-full` full-page capture |
| `screenshots/mobile/` | `05-game-level1-320.png` and `07-consultation-320.png` viewport stress tests, plus `-320-full` captures |

The unsuffixed files are the requested `1440×900`, `375×812` and `320×568` viewport
captures. The `-full` files capture the complete scrollable page for screens that are
taller than the viewport (notably landing, consultation and history). Review both: the
viewport files prove the responsive layout, the full files show every state.

Fonts are local: Inter (SIL OFL) and JetBrains Mono (SIL OFL). Licence texts are in
`_shared/fonts/`.

## Content and evidence sources

Scenario and consultation copy is taken from the actual implementation, not invented:

- `apps/api/src/domain/scenario-definitions.ts`
- `apps/api/src/domain/consultation-definitions.ts`

The brief pointed at `packages/contracts/src/content/` or `db/seed/content/`; neither
exists in this repository. The real, server-owned content lives in the domain files above.
The mockups use that text verbatim, including the Level 1 **MOVE → 800 vUSDT** outcome.
The direction brief’s illustrative “850 vUSDT” is not used.

Real Phase 5 evidence used in the mockups:

| Use | Value |
|---|---|
| Session A ref | `0f566d594fc30388` |
| Session A run | `4b1e2889-2e1e-476e-a957-042c4b5b69c3` |
| Session A payout | 1,000 Luna, confirmed |
| Session A tx / block | `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4` / `15838771` |
| Session B ref | `685638bc542dad71` |
| Session B run | `03de2187-83dd-46df-a2e0-7573ef678a7b` |
| Session B payout | 1,500 Luna, confirmed |
| Session B tx / block | `b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf` / `15839460` |
| Orphan recovery tx / block | `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29` / `15838244` |
| Player wallet A | `NQ98 54S9 LBJR JUH9 MKL3 YACQ TD3T JBXJ PHEQ` |
| Player wallet B | `NQ15 UQ1C N85L V8TB 9Y3S FCVF SEUL 8F2N 2623` |
| Explorer URL pattern | `https://test.nimiq.watch/#<txHash>` |

No transaction hash, block number, address, session reference or scenario value was
fabricated. “Completed 04 NOV 2026” is the documented Phase 5 date; exact completion clock
times were not recorded and are therefore not shown.

The history screen is a design composite: the two required Phase 5 rows came from
different generated testnet player wallets. Recipient addresses are omitted there, and the
header uses wallet A (`NQ98…PHEQ`) for illustration. This is disclosed again in
`design/MOCKUP_NOTES.md`; it is not a claim that one wallet earned both payouts.

## Reproduce the screenshots and checks

```bash
node design/capture-mockups.mjs
```

The script uses Playwright Chromium, captures viewport and full-page images, and verifies:

- no console errors and no page errors;
- no horizontal document overflow at 1440px, 375px or 320px for **every** screen;
- zero `<script>` tags in the screen HTML;
- the mockup watermark is present in every screen;
- every screenshot exists.

Machine-readable results: `screenshots/validation.json`.

Latest run: **52 captures, 0 console errors, 0 page errors, 0 overflow at 1440/375/320,
0 failures.**

## Scope guard

- Mockup-only. `apps/web/` and `apps/api/` are untouched.
- The deployed app at https://levelbreak-arena.vercel.app is unchanged.
- No payment state is presented as confirmed without a real Phase 5 transaction hash and
  block number.
- No real wallet signature, challenge string, cookie, private key or database credential
  appears in these files.
- Operator approval status remains **NOT GIVEN** until explicitly recorded.
