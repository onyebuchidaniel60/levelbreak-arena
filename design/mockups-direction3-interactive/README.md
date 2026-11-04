# LevelBreak Arena — Direction 4: The Conquest RPG

**Cartoonish, animated 12-planet conquest prototype.** React + TypeScript + Vite +
Three.js + `@react-three/fiber` + `@react-three/drei`.

This is a standalone design prototype in `design/mockups-direction3-interactive/`.
It is not wired into `apps/web`, `apps/api`, the database, Nimiq Pay, or the payout
worker. No wallet, API or funds are connected, and nothing here can move money.

## Run it

```bash
cd design/mockups-direction3-interactive
npm install
npm run dev
```

Open `http://localhost:5173`. Requires a WebGL-capable browser.

```bash
npm run build     # TypeScript + Vite production build
npm run lint      # oxlint
npm run verify    # 23 Playwright assertions, 0 console/page errors
npm run capture   # screenshots + screenshot evidence
```

For `npm run verify` / `npm run capture`, keep the dev server running on
`http://127.0.0.1:5173`. If Chromium is not installed:
`npx playwright install chromium`.

## The experience

**1. Galaxy map — 12 worlds.**
Xylos is the single unlocked world. Eleven sealed planets form a sprawling spiral:
Kepler-9, Crimson Nebula, Azure Reach, Violet Forge, Solaris Drift, Ghost Moon,
Emberfall, Nimbus Vale, Onyx Spire, Prismata and Eventide. Every world is a
procedural toon planet built from Three.js spheres, surface patches, glowing rings
and orbiting moons — **no planet image textures are used**. The testnet badge is
permanent.

**2. Enter Xylos.**
Click the central planet or **Descend to Xylos**. The camera flies into a local
orbital view. The teacher tower opens on the right with 18 teachers. Each row
visibly escalates through four tiers: INITIATE, ADEPT, MASTER, SOVEREIGN.

**3. Teacher tests.**
Clicking a teacher opens a DeFi risk question. A wrong answer gives no XP and can
be retried; a correct answer grants the teacher's XP reward, marks them mastered
and advances the conquest meter. The roster has more XP than the 100 XP
threshold, so a player can choose their route.

**4. Simulate XP Max.**
An explicitly labelled **OPERATOR TEST TOOL** button jumps straight to the
threshold. It is there so the operator can review the asteroid/Agent flow without
grinding all 18 tests.

**5. Asteroid strike.**
At 100 XP, a cinematic impact layer appears: a cartoon meteor and its trail hit
Xylos, the screen flashes, the planet cracks and the Agent signal rises. The
Agent transmission auto-opens after the cinematic hold (or via **Open Agent
Transmission** once the impact lands).

**6. Agent consultation.**
The modal shows the **SCRIPTED DEMO REQUESTER**, evidence first, then one risk
question. Any valid classification earns the fixed **+500 Luna** (there is no
hidden correct-answer rubric for consultation responses). The payout simulation
then runs **QUEUED → SUBMITTED → CONFIRMED** with a clear **SIMULATION** label.

**7. Completion.**
Return to the galaxy to see Xylos marked **CONQUERED**, the Agent chip read
**RECEIPT**, and the sealed worlds still locked. Reset the demo at any time.

## Screenshots

Committed in [`screenshots/`](./screenshots):

| File | State |
| --- | --- |
| `01-orbit-map.png` | 12-planet galaxy map, Xylos unlocked + 11 sealed worlds |
| `02-teacher-list.png` | Xylos teacher tower, first tiers |
| `03-teacher-tiers.png` | Scrolled tower showing master/sovereign teachers and boss |
| `04-asteroid-strike.png` | Asteroid impact, Agent signal rising |
| `05-agent-consultation.png` | Scripted Agent, evidence-first consultation |
| `06-agent-payout.png` | +500 Luna, QUEUED → SUBMITTED → CONFIRMED |
| `07-galaxy-conquered.png` | Xylos conquered, Agent receipt available |
| `08-mobile-orbit.png` | 390 × 844 mobile galaxy layout |

The required review shots are the first, second and fourth files.

## Trust and honesty

- **Testnet only.** The permanent badge says **TESTNET / NOT REAL MONEY**. No
  production wallet, API or treasury is connected to this prototype.
- **Fixed reward.** The Agent consultation pays a simulated 500 Luna for any
  valid classification; the teacher tests are separately scored and award XP.
- **Scripted requester.** The Agent is operator-authored scripted content, not a
  live AI or an independent external agent.
- **Operator custody.** The production model is an ordinary testnet NIM transfer
  from an operator-controlled treasury. It is not HTLC or trustless escrow.
- **Payout labels.** The UI says **SIMULATED** throughout. The real Phase 5
  testnet receipt (`139bfc81…`, 1,000 Luna, block 15,838,771) is linked as a
  **reference from a different play-through**, never presented as this 500 Luna
  simulation’s transaction.
- **No fake success.** The Agent modal cannot show CONFIRMED until the local
  simulation timers complete; no transaction is fabricated.

## Visual system

- **Toon planets:** `MeshToonMaterial` with a stepped gradient map, dark back-face
  outlines, saturated body colors, procedural surface patches and additive
  atmosphere rims.
- **Continuous motion:** planet spin, ring tilt/pulse, orbiting moons, a travelling
  route comet, star sparkles and a gently floating camera.
- **Fonts:** **Outfit** for bold display and UI headings, **JetBrains Mono** for
  all numbers, identifiers and statuses.
- **HUD:** floating glass bar, resource chips, chunky XP meter, trust badge; the
  left dossier is the only large card on the galaxy screen, keeping the planets
  as the focal object.
- **Neon palette:** toxic lime, hot pink, cyan, violet, orange and gold over a
  deep purple starfield.
- **Motion has a cause:** planets react to hover, routes pulse toward the sealed
  worlds, XP fills only when earned, the asteroid triggers at the threshold and
  the Agent modal opens from the impact.

## Verification evidence

Run locally on 4 November 2026:

```text
npm run lint      → clean (oxlint)
npm run build     → success (tsc + Vite)
npm run verify    → 23 PASS / 0 FAIL, 0 console/page errors
npm run capture   → 8 screenshots, 0 console/page errors
                    payout status: CONFIRMED
                    Phase 5 reference href: test.nimiq.watch/#139bfc81…
```

The verify suite checks: 12-planet map, 11 sealed labels, permanent trust badge,
sealed-planet refusal, Xylos opening, 18 teachers, wrong-answer rejection and
retry, XP award, mastery state, asteroid trigger, auto/manual Agent reveal,
evidence-first consultation, fixed +500 reward, payout confirmation, real Phase 5
reference link, Operator Treasury disclosure, conquered return state, reset,
390 px overflow, and reduced-motion controls.

## Assets and credits

All planet imagery is **procedurally generated** from Three.js primitives; there
are no downloaded planet `.jpg` textures in the app. The old realistic textures
from the rejected Direction 3 v3 prototype were removed. See
[CREDITS.md](./CREDITS.md) for fonts, icons and the local-only reference images.

## Known limitations

- Only Xylos is playable. The other 11 named worlds are visible map furniture and
  deliberately sealed.
- Teacher test content is static local data; there is no API, persistence, wallet,
  database or backend integration.
- The Agent modal auto-reveals after the impact cinematic; the CTA is available
  earlier so the operator can move quickly.
- No audio.
- The 390 px layout hides the 11 locked-world labels to keep the map legible. The
  names remain in the desktop evidence and the toast copy.
- The floating planet labels are a projected DOM layer; during the camera flight
  into Xylos the labels are hidden.
- No official LevelBreak Arena logo exists in this prototype; the orbit glyph is a
  placemarker for the direction.
- The Phase 5 chain receipt is real testnet evidence; every other payout state on
  this screen is simulated.

## Next step

**STOP — operator review.** Do not begin Phase 7, wire the main app to this
direction, or add backend integration until the operator explicitly approves
Direction 4.
