# LevelBreak Arena — Direction 3 v3

**Interactive orbital prototype.** React + TypeScript + Vite + Three.js.

This is a standalone design prototype for operator review. It is not wired into
`apps/web`, `apps/api`, the database, Nimiq Pay, or the payout worker. No wallet
or API connection exists, and no funds can move from this directory.

## Run it

```bash
cd design/mockups-direction3-interactive
npm install
npm run dev
```

Open `http://localhost:5173`. Requires a WebGL-capable browser.

Production build:

```bash
npm run build
npm run preview
```

## Review flow

1. **Orbit map.** Sector 01 is active and slowly rotating. Sectors 02 and 03 are
   dimmed with floating padlock markers. Three raster planet textures, custom
   rim-light shaders, glowing dotted routes and a Three.js starfield carry the
   navigation. The top-right **TESTNET — NOT REAL MONEY** badge is permanent.
2. **Sector briefing.** Click the active planet, its label, or **Open Sector 01**.
   The camera zooms in and a glass overlay shows the scenario, the 1,000 vUSDT
   virtual portfolio and the two decisions.
3. **Consequence.** Choosing a position updates the simulated portfolio and
   shows the outcome and lesson. **Open the consultation** continues.
4. **Consultation.** Evidence comes first. A scripted requester header, fixed
   500 Luna fee and the three risk options follow. Skip earns zero.
5. **Reward.** A valid answer seals +500 Luna and +100 run XP, fills the HUD XP
   bar, and fires the CSS burst / floating +500 label and in-scene sparkles.
6. **Sector clear.** The overlay closes, the camera reframes the new active
   sector, the cleared planet gains rings, the dotted path lights up, and the
   **SECTOR 01 CLEARED** banner offers Sector 02.
7. **Final summary.** After Sector 03, the summary shows 1,500 simulated Luna /
   300 XP (for three answers), the QUEUED → SUBMITTED → CONFIRMED simulation,
   the real Phase 5 testnet reference receipt, and the Operator Treasury / scripted
   requester disclosures.

A full play-through takes three sectors. A zero-answer run is also supported:
skipping all three tasks produces **0 Luna** and a no-payout state, not a
fabricated receipt.

## What is implemented

- Three textured 3D planets with atmospheric shaders, hover scaling, clickable
  in-scene HTML labels, orbit rings, floating lock markers and dotted routes.
- A single-screen state machine: `orbit → sector → consultation → reward →
  sector clear → next sector → summary`.
- Real Phase 3 scenario content, consultation evidence and decision math.
- Fixed 500 Luna rewards, 100 XP per accepted response, 300 XP cap, 1,500 Luna
  maximum per run.
- Persistent HUD (XP, Luna, sectors), trust badge, toast states for locked
  sectors, archive replays for cleared sectors, demo reset.
- Responsive mobile layout at 390 px and reduced-motion support.
- Playwright capture and verification scripts.

## Trust and honesty constraints

- **Testnet simulation only.** No real money, wallet, API or treasury transfer is
  connected in this prototype.
- **Fixed reward.** Every valid classification earns 500 Luna; skip earns zero.
  There is no hidden correct/incorrect rubric.
- **Scripted requester.** The consultation is operator-authored static content,
  not a live AI agent.
- **Operator custody.** The production payout model is an ordinary Nimiq transfer
  from an operator-controlled treasury. It is not HTLC, escrow or trustless.
- **Reference payout, not this run's payout.** The summary displays Phase 5
  play-through A's real testnet payout:
  `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`
  (1,000 Luna, block 15,838,771, confirmed). It is explicitly labelled as a
  **reference** and is not equated to the prototype's simulated earnings. The
  simulated payout status is also labelled **SIMULATION**.
- **No fabricated success.** If all tasks are skipped, the summary shows zero
  payout and no payout lifecycle.

## Verification evidence

Run against a local Vite dev server at `http://127.0.0.1:5173`:

```bash
npm run lint      # oxlint: clean
npm run build     # tsc + Vite production build: success
npm run verify    # 16/16 assertions passed, 0 console errors
npm run capture   # 9 screenshots, 0 console errors
```

The capture reports the simulated payout status as `CONFIRMED` and the Phase 5
explorer link as:

```text
https://test.nimiq.watch/#139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4
```

Screenshots are in [`screenshots/`](./screenshots):

| File | State |
| --- | --- |
| `01-orbit.png` | Orbit map, Sector 01 active, lock markers |
| `02-sector-briefing.png` | Sector detail and decisions |
| `03-sector-consequence.png` | Decision outcome and portfolio delta |
| `04-consultation.png` | Evidence-first scripted consultation |
| `05-reward.png` | Accepted response, +500 Luna and XP |
| `06-sector-cleared.png` | Camera reframe, rings, lit path, banner |
| `07-run-complete.png` | All-clear orbit |
| `08-summary.png` | Final summary, payout lifecycle and Phase 5 receipt |
| `09-mobile-orbit.png` | 390 × 844 orbit layout |

`npm run capture` expects the dev server to already be running. If Playwright's
Chromium is not installed, run `npx playwright install chromium` first.

The root `pnpm lint` command ignores standalone design prototypes and locally
installed agent skills, because those have their own tooling (oxlint here). The
application code (`apps/`, `packages/`, `tests/`) remains under the root ESLint
configuration.

## Asset note (important)

The requested planet downloads were run exactly as specified. The three.js
`earth_atmos_2048.jpg` and `moon_1024.jpg` URLs resolved, but
`mars_1k_color.jpg` returns **404** from the three.js repository (verified on
`master`, `dev` and several release tags). The missing texture was replaced with
the public Solar System Scope 2k Mars map (CC BY 4.0) so the map still has three
real, distinct planet textures. Attribution is in [CREDITS.md](./CREDITS.md).
No invented texture was used.

The `stageshow` skill was installed locally at
`.agents/skills/stageshow/` to guide framing, hierarchy and HUD composition. It
is local tooling and is not vendored into this prototype or committed.

## Known limitations

- No persistence: a page reload restarts the demo.
- No wallet, authentication, API, database or payout worker.
- No audio, gamepad support or sound cues.
- WebGL is required; the prototype was verified in Chromium with SwiftShader.
- The reference bitmap is a local, operator-supplied third-party screenshot and
  is not part of the prototype.
- The icon/brand mark is an original placeholder orbital glyph for this design
  direction; it is not an official LevelBreak Arena logo.
- The 390 px layout is verified. 320 px was not separately captured.

## Next step

**STOP — operator review.** Do not begin Phase 7, apply this visual direction to
`apps/web`, or change the product’s payment/auth architecture until the operator
explicitly approves the direction.
