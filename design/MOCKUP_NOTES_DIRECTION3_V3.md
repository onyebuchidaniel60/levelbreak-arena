# Direction 3 v3 — interactive orbital prototype notes

**Status:** prototype ready for operator review. Visual direction **not approved**.
**Location:** `design/mockups-direction3-interactive/`
**Deployment:** not deployed; run locally with `npm run dev`.
**Application impact:** `apps/web` and `apps/api` are untouched.

## Why v3 exists

Direction 3 v2 was rejected as a flat web dashboard with a space palette. V3 is a
structural pivot from static HTML mockups to a working React + Three.js
prototype: the 3D orbit map is the navigation, and real planets, motion, camera
reframing and a persistent HUD carry the game feel. CSS gradients are no longer
standing in for the world.

The three operator-supplied reference images were used only as input for
composition, hierarchy and game-loop expectations. No reference artwork,
trademarks or spacecraft designs were copied.

## Stageshow principles applied

- **One focal object.** The active sector planet is always central, oversized and
  atmospheric; completed sectors retreat to the left as dimmed archive objects;
  locked sectors wait to the right with floating padlocks.
- **Depth and layering.** Scene → HUD → glass overlays → toast. Panels use
  `backdrop-filter: blur(18px)`, hairline edges, deep shadows and cut corners,
  not flat white cards.
- **A game HUD, not a dashboard.** Micro-labels in uppercase mono, tabular
  numerals, chopped-corner action shapes, a permanent trust badge, ticked XP
  track and a bottom signal rail.
- **Restraint.** Real strings stay on what matters: the current sector, the
  scenario, the evidence, the question and the reward. Secondary metadata is
  quiet and small.
- **Every motion has a cause.** Planets bob/hover, camera pushes toward a chosen
  sector, dashed routes light in sequence, rings appear on clear, reward bursts
  are tied to accepted responses, and the XP bar moves only when XP is earned.
- **Trust in the same frame as reward.** Testnet, scripted requester, fixed fee
  and operator treasury disclosures sit beside the numbers, not in a footer.

## State and content mapping

| Product state | Prototype treatment |
| --- | --- |
| Orbit / sector select | Three textured planets, active reticle, lock badges, dotted route |
| Sector briefing | Glass overlay; scenario copy, 1,000 vUSDT starting portfolio, two decisions |
| Consequence | Portfolio delta, outcome explanation, lesson; decision cannot be changed |
| Consultation | Scripted requester strip, evidence first, question and SAFE/RISKY/CAN’T TELL |
| Accepted response | +500 Luna, +100 XP, fixed fee, “not paid yet”; burst and floating value |
| Skipped task | 0 Luna, 0 XP, zero payout in the final summary |
| Sector cleared | Camera reframes to the next active planet; rings, lit route, banner |
| Run summary | Earned XP/Luna, simulated payout lifecycle, real Phase 5 reference receipt, trust disclosure |

Scenario text, evidence and outcome math are copied from the Phase 3 static
definitions. The 3D prototype does not fetch live prices, call an LLM, connect a
wallet, use the API or move funds.

## Visual decisions

- **Palette:** near-black deep space, ion mint for primary actions/XP, Nimiq-like
  gold for the testnet trust layer, coral for loss/pending, violet for the final
  yield sector. Sector accents update inside their overlays.
- **Type:** Space Grotesk for display/body; JetBrains Mono for numbers, hashes,
  status and HUD micro-labels.
- **Planets:** actual raster textures under custom atmosphere rim shaders, tinted
  per sector. Cleared planets become smaller, dimmer archives; locked planets are
  desaturated, with a floating amber padlock marker plus inline label.
- **Routes:** additive glow dots between planet surfaces. A route turns mint/amber
  and receives a travelling comet when its preceding sector is cleared.
- **HUD:** permanent testnet badge top-right; XP, Luna and cleared-count readouts;
  bottom signal rail; reset. The active-sector dossier is hidden on mobile so the
  labels and planet taps remain the main control.
- **Overlays:** bottom-sheet glass on desktop with a cut top-right corner;
  full-height sheet with a fixed action footer on the summary. Mobile uses the
  full width and preserves scrolling.

## Honesty guardrails

- The real Phase 5 payout hash is displayed but explicitly marked as a **reference
  receipt** for a different 1,000 Luna play-through, not as this run's payout.
- The payout lifecycle is labelled **SIMULATION** and says no funds move.
- A zero-answer run shows **0 Luna / no payout record**, not a fabricated
  confirmed transfer.
- 500 Luna is never derived from client input; it is a static prototype constant
  matching the product rule.
- No HTLC/trustless wording. “Operator Treasury” explains ordinary transfer
  custody in plain language.

## Verification

- `npm run lint` — oxlint clean.
- `npm run build` — TypeScript + Vite production build passes.
- `npm run capture` — 9 states captured; 0 console or page errors; summary status
  reaches `CONFIRMED`; reference href is the real testnet explorer URL.
- `npm run verify` — 16/16: locked-sector refusal toast, active-planet open,
  Escape close, skip=0, reset, all-skip zero payout, operator disclosure, replay,
  390 px overflow checks, reduced motion, 0 console errors.
- Root `pnpm lint` passes after ignoring standalone prototypes and installed
  skills from the product lint.
- `apps/web` and `apps/api` have no changes.

## Known limitations / open questions

1. The Mars texture path requested by the operator is 404 upstream; a CC BY 4.0
   Solar System Scope Mars map is used and attributed. Is that acceptable, or
   should the prototype ship only two textures / a different source?
2. The summary uses Phase 5 play-through A (1,000 Luna) as the real receipt while
   a three-answer prototype run simulates 1,500 Luna. The mismatch is labelled,
   but should the prototype instead simulate a 1,000-Luna run for a cleaner story?
3. The desktop orbit screen rewards a still frame; mobile is a vertical route
   rather than a scaled desktop composition. Does the mobile layout read as the
   same game?
4. The 3D prototype has no save/resume or real auth. Is that acceptable for a
   direction decision, or should the next round connect read-only Phase 5 data?
5. Do the floating lock markers, active reticle arcs and game HUD proportions
   now read as a real game rather than a dashboard? Name any screen that still
   feels flat.
