# LevelBreak Arena — Gamified / Risk Orbit mockups (Direction 3, Phase 6)

**Status:** PROPOSED for comparison with Direction 1 (Trading Terminal) and Direction 2 (Playful Learning Game). **None is approved.**
No application code has been changed. Direction 1 and Direction 2 are frozen.

This directory is a static design artifact. It has no build step, no API calls and no
JavaScript in the screens. The deployed application keeps its temporary Tailwind styling.

## How to view

Open any screen directly in a browser:

```text
design/mockups-direction3/01-landing.html
design/mockups-direction3/02-wallet-connect.html
...
design/mockups-direction3/14-session-summary.html
```

Each file is standalone and loads `_shared/tokens.css` plus local webfonts from
`_shared/fonts/`. Links between mockup files keep the review set navigable. The
“Documentation”, “GitHub repository” and “Privacy & terms” footer entries are Phase 8
placeholders.

`_shared/shell.html` is the base frame reference, not a product route.

## Reference anchor

The operator supplied three cosmic “Discover Planets” staking-game screenshots in
`design/references/`. The extraction, adoption/translation decisions and the deliberate
exclusions are recorded in `design/MOCKUP_NOTES_DIRECTION3.md` before the screens were
built.

## Screens

| # | File | State |
|---|---|---|
| 01 | `01-landing.html` | Risk Orbit landing, orbital sector map, trust strip, mission map, trophy bay |
| 02 | `02-wallet-connect.html` | Launch console, provider available / unavailable |
| 03 | `03-lobby-available.html` | Mission board, real session `0f566d59…c30388`, reward/XP strip |
| 04 | `04-lobby-empty.html` | Radar empty state, scan timestamp, funding gate |
| 05 | `05-game-level1.html` | Sector 01 decision, HUD with XP/streak, locked sectors |
| 06 | `06-game-consequence.html` | Visceral 1,000 → 800 vUSDT impact, exact explanation/lesson |
| 07 | `07-consultation.html` | Guide transmission, evidence, question, options, skip |
| 08 | `08-consultation-answered.html` | Loot-card reward reveal: +500 Luna, +100 XP, streak |
| 09 | `09-payout-states.html` | Reward vault as QUEUED → SUBMITTED → CONFIRMED ledger |
| 10 | `10-zero-reward.html` | Empty vault, 0 Luna, no payout record |
| 11 | `11-history.html` | Mission log with two real Phase 5 receipts and empty reference |
| 12 | `12-states-composite.html` | Loading, 500, 404, 401 signal states |
| 13 | `13-level-complete.html` | Sector 01 complete: badge unlock, +100 XP, sector 02 unlocked |
| 14 | `14-session-summary.html` | Full-run summary, 1,500 Luna, 3/3, full XP, confirmed receipt |

## Screenshots

| Directory | Contents |
|---|---|
| `screenshots/desktop/` | 1440×900 viewport capture per screen, plus `-full` full-page capture |
| `screenshots/mobile/` | 375×812 viewport capture per screen, plus `-full` full-page capture |
| `screenshots/mobile/` | 320×568 viewport captures for screens 05, 07, 09, 13 and 14, plus `-320-full` companions |

The unsuffixed files are the requested exact viewport captures. The `-full` files show the
complete scrollable page.

## Content and evidence

Scenario and consultation copy comes verbatim from the real server-owned implementation:

- `apps/api/src/domain/scenario-definitions.ts`
- `apps/api/src/domain/consultation-definitions.ts`

- Level 1 MOVE outcome: **800 vUSDT / −20%**.
- 1,000 Luna: tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`, block `15838771`.
- 1,500 Luna: tx `b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf`, block `15839460`.
- Orphan recovery: tx `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29`, block `15838244`.
- Session refs: `0f566d594fc30388`, `685638bc542dad71`.
- Player wallets: `NQ98 54S9 … PHEQ`, `NQ15 UQ1C … 2623`.

No hash, block, address, session reference or scenario value was fabricated. The history
screen is a composite of the two required Phase 5 rows, which came from different generated
testnet wallets; recipient addresses are omitted there and the header uses wallet A for
illustration. This is disclosed in the notes.

## Reproduce screenshots and checks

```bash
node design/mockups-direction3/capture.mjs
```

Checks include:

- 0 console errors / page errors;
- 0 horizontal overflow and 0 off-screen elements at 1440, 375 and 320px for every screen;
- 0 `<script>` tags in screen HTML;
- mockup marker present on every screen;
- required trust copy present per screen (case-insensitive, tag-stripped text check).

Machine-readable results: `screenshots/validation.json`.

Latest run: **66 captures, 0 console errors, 0 page errors, 0 overflow, 0 off-screen
elements, 0 missing trust copy, 0 failures.**

## Scope guard

- Mockup-only. `apps/web/` and `apps/api/` are untouched.
- Direction 1 (`design/mockups/`) and Direction 2 (`design/mockups-direction2/`) are frozen.
- The deployed app at https://levelbreak-arena.vercel.app still serves the existing
  temporary Tailwind UI.
- No payment is presented as confirmed without a real Phase 5 hash, block and chain receipt.
- No wallet signature, challenge string, cookie, private key or DB credential is included.
- Operator approval: **NOT GIVEN** for any direction.
