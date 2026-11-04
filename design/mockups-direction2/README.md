# LevelBreak Arena — Playful Learning Game mockups (Direction 2, Phase 6)

**Status:** PROPOSED for comparison with Direction 1 (Trading Terminal). **Neither direction is approved.**
No application code has been changed; `apps/web/` and `apps/api/` are untouched.

This directory is a static design artifact. It has no build step, no API calls and no
JavaScript in the screens. The deployed application keeps its temporary Tailwind styling.

## How to view

Open any screen directly in a browser:

```text
design/mockups-direction2/01-landing.html
design/mockups-direction2/02-wallet-connect.html
...
design/mockups-direction2/12-states-composite.html
```

Each file is standalone and loads `_shared/tokens.css` plus local webfonts from
`_shared/fonts/`. Links between mockup files keep the review set navigable. The
“Documentation”, “GitHub repository” and “Privacy & terms” footer entries are deliberate
Phase 8 placeholders.

`_shared/shell.html` is the base frame reference, not a product route.

## Screens

| # | File | State |
|---|---|---|
| 01 | `01-landing.html` | Warm landing, learning promise, 3-level path, plain-language trust cards |
| 02 | `02-wallet-connect.html` | Provider available / provider unavailable side by side |
| 03 | `03-lobby-available.html` | Funded session `0f566d59…c30388`, reward ladder, start CTA, friendly “more sessions” empty panel |
| 04 | `04-lobby-empty.html` | Encouraging empty lobby, last check, funding gate |
| 05 | `05-game-level1.html` | Level 1 decision, 1,000.00 vUSDT, STAY/MOVE with no outcomes previewed |
| 06 | `06-game-consequence.html` | Real MOVE outcome: 800.00 vUSDT, −200.00 / −20.00%, lesson |
| 07 | `07-consultation.html` | Guide → evidence → question → options → skip |
| 08 | `08-consultation-answered.html` | +500 Luna reward celebration, earned-not-paid note |
| 09 | `09-payout-states.html` | QUEUED / SUBMITTED / CONFIRMED, real `b693acd3…` tx and block `15839460` |
| 10 | `10-zero-reward.html` | Gentle zero-reward state with no fabricated receipt |
| 11 | `11-history.html` | Two real Phase 5 rows plus empty-state reference |
| 12 | `12-states-composite.html` | Loading, 500, 404 and 401 states in one sheet |

## Screenshots

| Directory | Contents |
|---|---|
| `screenshots/desktop/` | 1440×900 viewport capture per screen, plus `-full` full-page capture |
| `screenshots/mobile/` | 375×812 viewport capture per screen, plus `-full` full-page capture |
| `screenshots/mobile/` | 320×568 viewport captures for screens 05, 07 and 09, plus `-320-full` companions |

The unsuffixed files are the requested exact viewport captures. The `-full` files show the
complete scrollable page for screens taller than the viewport.

## Content and evidence sources

Scenario and consultation copy is taken verbatim from the real server-owned implementation:

- `apps/api/src/domain/scenario-definitions.ts`
- `apps/api/src/domain/consultation-definitions.ts`

The brief’s `packages/contracts/src/content/` and `db/seed/content/` paths do not exist.
No scenario or consultation text was invented.

Real Phase 5 evidence used:

| Use | Value |
|---|---|
| Session A ref | `0f566d594fc30388` |
| Session A payout | 1,000 Luna, confirmed |
| Session A tx / block | `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4` / `15838771` |
| Session B ref | `685638bc542dad71` |
| Session B run | `03de2187-83dd-46df-a2e0-7573ef678a7b` |
| Session B payout | 1,500 Luna, confirmed |
| Session B tx / block | `b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf` / `15839460` |
| Player wallet A | `NQ98 54S9 LBJR JUH9 MKL3 YACQ TD3T JBXJ PHEQ` |
| Player wallet B | `NQ15 UQ1C N85L V8TB 9Y3S FCVF SEUL 8F2N 2623` |
| Explorer URL pattern | `https://test.nimiq.watch/#<txHash>` |

The Level 1 MOVE outcome is the real **800 vUSDT (−20%)**, not 850.

The history screen is a design composite: the two required Phase 5 rows came from
different generated testnet player wallets. Recipient addresses are omitted there, and the
header uses wallet A for illustration. This is a mockup, not a claim that one wallet earned
both payouts.

## Reproduce screenshots and checks

```bash
node design/mockups-direction2/capture.mjs
```

The script uses Playwright Chromium and verifies:

- no console errors and no page errors;
- no horizontal document overflow at 1440px, 375px or 320px for **every** screen;
- zero `<script>` tags in screen HTML;
- the mockup watermark is present in every screen;
- every screenshot exists.

Machine-readable results: `screenshots/validation.json`.

Latest run: **54 captures, 0 console errors, 0 page errors, 0 overflow and 0 off-screen
elements at 1440/375/320, 0 failures.**

## Scope guard

- Mockup-only. `apps/web/` and `apps/api/` are untouched.
- Direction 1 (`design/mockups/`) is untouched and frozen for comparison.
- The deployed app at https://levelbreak-arena.vercel.app still serves the existing
  temporary Tailwind UI, not either mockup direction.
- No payment state is presented as confirmed without a real Phase 5 transaction hash and
  block number.
- No real wallet signature, challenge string, cookie, private key or database credential
  appears here.
- Operator approval: **NOT GIVEN** for either direction.
