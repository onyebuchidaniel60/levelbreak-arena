# Direction 4 — The Conquest RPG (interactive prototype notes)

**Status:** ready for operator review. Visual direction **not approved**.
**Location:** `design/mockups-direction3-interactive/`
**Deployment:** local only. Run `npm run dev`.
**Impact on product app:** none. `apps/web` and `apps/api` are untouched.

## Why Direction 4 exists

The operator rejected Direction 3 v3 after reviewing it. The realistic NASA
textures, standard typography and dashboard-like density were the wrong visual
language. Direction 4 goes back to the original VISE Staking Adventure references:
bright cartoon planets, neon glow, saturated pink/lime/cyan/violet, large reward
moments, and a map that feels like a game rather than a themed admin screen.

The prototype is now a conquest RPG rather than a three-step form:

- 12 named planets in a sprawling spiral galaxy.
- Xylos is the only playable world.
- 18 escalating risk teachers.
- A 100 XP conquest threshold.
- An asteroid strike that cracks the world open.
- A scripted Agent consultation with a fixed 500 Luna simulated reward and
  QUEUED → SUBMITTED → CONFIRMED payout lifecycle.

## Reference extraction

The VISE reference images show:

- a deep indigo/purple space ground with strong magenta and lime bloom;
- cartoon planets at multiple sizes, with simple circular surface patches, bright
  ring systems and tiny satellites;
- a glowing dotted path connecting worlds;
- a large central world with a smaller completed world behind and a locked world
  ahead, plus a clear title/stat HUD;
- big, friendly headers, small technical labels and pill-shaped bright CTAs;
- reward/claim moments treated as events, not table values.

Direction 4 takes those principles without copying the reference's staking theme,
artwork, ship designs, logos or exact layout.

## What changed from v3

- Removed all realistic `.jpg` planet textures and deleted `public/assets/`.
- Rebuilt every planet from primitives: toon-shaded spheres, dark back-face
  outlines, stepping gradient map, neon atmosphere, procedural surface spots,
  glowing ring geometry, mini-moons and a rotating route.
- Replaced Space Grotesk with **Outfit** for bold headings/UI and kept
  **JetBrains Mono** for numbers and hashes.
- Added a 12-world galaxy with named worlds. Labels are DOM-projected so they
  stay crisp; no nested Three.js HTML roots, which also removed a React console
  error seen with 11+ in-scene labels.
- Added continuous animation: planet spin, ring tilt/pulse, orbiting moons, a
  travelling route comet, star sparkles and a drifting camera.
- Added the Xylos teacher tower, 18 teachers across four visual tiers, test
  modals, scored XP and a conquest bar.
- Added the Operator **SIMULATE XP MAX** test tool.
- Added the asteroid impact cinematic and the Agent consultation modal with
  payout simulation.
- Added the real Phase 5 reference receipt and the Operator Treasury disclosure.

## Screen and state map

| State | What the player sees | Gate/exit |
| --- | --- | --- |
| Galaxy | 12 planets, Xylos unlocked, 11 sealed labels, Agent sealed | Enter Xylos |
| Teacher tower | 18 teachers, XP bar, tier colours, Agent status, operator tool | Teacher test / Galaxy |
| Teacher test | DeFi question, three options, retry on wrong, XP on correct | Correct/close |
| Threshold | XP reaches 100, meteor cinematic, planet cracks | Open Agent / auto after cinematic |
| Agent consultation | Scripted requester, evidence first, one question, +500 Luna | Answer |
| Payout | QUEUED → SUBMITTED → CONFIRMED simulation; real Phase 5 reference | Return to galaxy |
| Conquered galaxy | Xylos labelled conquered, Agent receipt available | Reset / revisit |

The Agent modal auto-reveals after the impact hold and also has an explicit
**Open Agent Transmission** button for operators who want to skip the wait.

## Teacher tiers

The 18 teachers are all static mock content, intentionally varied:

- **INITIATE** (rows 1–5): lime/cyan, 4–6 XP, foundational questions about
  stablecoins, impermanent loss, slippage, bridges and oracles.
- **ADEPT** (rows 6–10): violet, 6–10 XP, leverage, yields, approvals, liquidity
  concentration and admin keys.
- **MASTER** (rows 11–15): orange, 11–15 XP, APR/APY, MEV, emissions, liquidation
  and custody.
- **SOVEREIGN** (rows 16–18): pink/gold, 16–25 XP, rebases, concentration and a
  final risk synthesis. Overseer Nova is the boss row.

A wrong answer costs nothing and can be retried; a correct answer awards XP once
and marks the row mastered. The teacher tests are separate from the Agent
consultation and do have a correct answer.

## Visual and interaction decisions

- **One focal object:** Xylos is the largest body and centre of the spiral; other
  worlds are deliberately smaller and sealed.
- **Game, not dashboard:** floating resource bar, emissive rings, a deck of
  teacher rows, a conquest meter, an impact layer and bold reward moments.
- **Trust stays visible:** the permanent testnet chip, scripted requester badge,
  fixed fee and operator-treasury disclosure are in the same frame as rewards.
- **Motion with cause:** planets react to hover, orbits turn, routes glow, XP fills
  on a pass, and the asteroid appears only at the threshold.
- **Labels as a projected layer:** world names are rendered in a DOM overlay using
  the known scene camera, keeping typography crisp and avoiding nested React roots.

## Trust and honesty guardrails

- The Agent reward is fixed at 500 Luna and comes from a **simulated** payout
  lifecycle. The label **SIMULATION** is visible.
- The real Phase 5 tx is marked **reference** and explained as a different
  1,000 Luna play-through. It is never equated with this run's 500 Luna.
- No fabricated transaction hash, no fake success, and no claim that the Agent is
  a live AI.
- Operator treasury copy states ordinary testnet custody, not HTLC/escrow.
- The 10s Agent auto-reveal can be replaced by the explicit CTA; it does not change
  any financial state.

## Verification

Local only, with the Vite dev server:

```text
npm run lint    → clean
npm run build   → success
npm run verify  → 23 PASS / 0 FAIL, 0 console/page errors
npm run capture → 8 screenshots, 0 console/page errors
                  payout CONFIRMED, real Phase 5 explorer href verified
```

Coverage includes: 12 planets, 11 sealed labels, permanent testnet badge, sealed
planet toast, Xylos entry, 18 teacher rows, wrong answer rejection, retry, correct
XP award, roster mastery, asteroid trigger, Agent reveal, evidence, fixed reward,
payout confirmation, Phase 5 href, Operator Treasury disclosure, conquered state,
reset, 390 px overflow and reduced motion.

## Screenshot inventory

- `screenshots/01-orbit-map.png`
- `screenshots/02-teacher-list.png`
- `screenshots/03-teacher-tiers.png`
- `screenshots/04-asteroid-strike.png`
- `screenshots/05-agent-consultation.png`
- `screenshots/06-agent-payout.png`
- `screenshots/07-galaxy-conquered.png`
- `screenshots/08-mobile-orbit.png`

## Open questions for the operator

1. Does the toon planet language now match the VISE reference closely enough —
   specifically the saturated palette, surface patches and ring silhouettes?
2. Is the 12-planet galaxy readable at first glance, or should the map use fewer
   labels and a dedicated side index?
3. Does the teacher tower feel like a game progression ladder rather than a list
   of settings? Are the four tiers visually distinct enough?
4. Is the asteroid → Agent reveal dramatic enough? Should it auto-open sooner,
   stay on the impact longer, or require an explicit click?
5. Should the next round connect read-only Phase 5 receipts to the Agent modal, or
   remain a self-contained visual prototype?

## Not included

- Backend integration, wallet signing, database records or real NIM transfers.
- Playable worlds 2–12.
- Persistence between reloads, a full teacher economy, leaderboard or badges.
- Audio, real DeFi execution, live prices, live LLM or live evidence.
- A final approved logo.
