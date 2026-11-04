# Design Decision Log

**Status:** PROPOSED directions — Trading Terminal, Playful Learning Game and Gamified (reference-driven). Awaiting operator comparison and selection. **NONE APPROVED.** Do not implement final styling before explicit operator approval.

## Product/design decisions already locked

- Product name: LevelBreak Arena.
- Three levels: stablecoin peg risk, liquidity-pool impermanent loss, yield-farming sustainability.
- One consultation per level, with evidence displayed before the question.
- Answer classifications include `Can't tell`; skip is free.
- Static/bundled evidence and scripted requester in MVP.
- Temporary styling through functional verification.
- Operator requested three proposed directions for comparison: **Trading Terminal**, **Playful Learning Game** and **Gamified (reference-driven)**. None is approved; final visual implementation remains blocked.

## Required late design process

1. After Phase 5 functional gate passes, collect operator-supplied references or propose three candidate references for operator selection.
2. Record source links and attributes to study (layout, hierarchy, density, typography, color, motion, mobile behavior). Do not copy trademarks or protected assets.
3. Create desktop and mobile mockups/prototypes for landing/lobby, scenario/decision, consequence animation, consultation/evidence card, completion/payout statuses, history, and key loading/error/empty states.
4. Present mockups and record feedback.
5. Revise until explicit operator approval is recorded. No approval = no final visual implementation.
6. After approval, record chosen design system, component rules, spacing, typography, colors, states, responsive adaptations, accessibility requirements and intentional deviations here.
7. Final UI implementation must preserve API contracts, architecture, game state, reward/payment business rules and auth.

## Proposed direction: Trading Terminal (Phase 6)

**Status: PROPOSED — awaiting operator review. Operator approval: NOT GIVEN.**
**Date proposed:** 4 November 2026.
**Scope:** mockups only. No application code, API, schema, auth, payment behavior or deployed environment was changed.

### Direction and references

The operator requested the Trading Terminal direction by brief rather than supplying external reference URLs; it is one of three proposed directions, not a selected one. No external imagery, trademarks or protected brand assets were copied. The design studies the density, hierarchy and typographic discipline of professional trading terminals and operations tools, with an original LevelBreak Arena treatment.

- Background `#0A0E14`; elevated surface `#131820`; border `#1F2937`.
- Primary text `#E5E7EB`; secondary `#9CA3AF`; muted `#6B7280`; numeric bright `#F3F4F6`.
- Semantic accents: emerald `#10B981` (earned/confirmed/positive), amber `#F59E0B` (pending), red `#EF4444` (loss/depeg), gold `#FBBF24` (primary CTA/Nimiq), soft blue `#60A5FA` (links/informational).
- Inter for UI text; JetBrains Mono with tabular numerals for money, prices, blocks, hashes and timestamps.
- 4px spacing grid; 8px card radius; 6px control radius; 1px borders; no shadows on cards.
- 150–200 ms ease-out motion; one crisp emerald reward flash; no bouncy or celebratory motion.
- Vertical information hierarchy: agent context → evidence → question; status → action; earned → queued → submitted → confirmed.

### Artifacts

- [Mockup notes and screen-by-screen rationale](../design/MOCKUP_NOTES.md)
- [Mockup set and viewing instructions](../design/mockups/README.md)
- [Desktop screenshots — 1440×900 viewport and full-page](../design/mockups/screenshots/desktop/)
- [Mobile screenshots — 375×812 viewport and full-page](../design/mockups/screenshots/mobile/)
- [Machine-readable validation results](../design/mockups/screenshots/validation.json)

Twelve screens are proposed: landing, wallet-connect states, lobby with funded session, empty lobby, Level 1 decision, Level 1 consequence, Level 1 consultation, reward flash, payout states, zero-reward state, history, and a loading/error/not-found/expired-session composite.

### Content and evidence sources

Scenario and consultation copy is taken verbatim from the server-owned implementation:

- `apps/api/src/domain/scenario-definitions.ts`
- `apps/api/src/domain/consultation-definitions.ts`

The expected `packages/contracts/src/content/` and `db/seed/content/` directories do not exist. The mockups use the actual Level 1 MOVE outcome of **800 vUSDT** (−20%), not the illustrative 850 vUSDT in the direction brief.

Confirmed payout examples use only real Phase 5 testnet evidence:

- 1,000 Luna: tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`, block `15838771`.
- 1,500 Luna: tx `b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf`, block `15839460`.
- Orphan recovery: tx `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29`, block `15838244`.

No transaction hash, block number, address, session reference or scenario value was fabricated. The history screen is a design composite of the two required Phase 5 rows, which came from different generated testnet player wallets; recipient addresses are omitted there.

### Deviations from the direction brief

1. Level 1 MOVE uses the real 800 vUSDT outcome, not 850.
2. Scenario content is sourced from `apps/api/src/domain/`, because the paths named in the brief do not exist.
3. Landing shows both provider entry states side by side for review; production would render one conditionally.
4. The mockup watermark is a vertical edge tab rather than a fixed corner pill, so it does not cover consultation or evidence content at 320–1440px.
5. Screenshot folders contain exact viewport captures and `-full` full-page companions. The 320px overflow check is run for every screen; only screens 05 and 07 have 320px captures, as specified.
6. History shows the documented Phase 5 date only, not an invented completion clock time.
7. Level 2 and Level 3 are represented by the reusable Level 1 screen and the real content definitions; they are not separate files in the 12-screen inventory.

### Verification

`node design/capture-mockups.mjs` produced 52 captures with:

- 0 console errors, 0 page errors;
- 0 horizontal overflow at 1440px, 375px and 320px across all 12 screens;
- 0 `<script>` tags in screen HTML;
- all screens carrying the mockup watermark;
- validation recorded in `design/mockups/screenshots/validation.json`.

This section records a **proposal**, not approval. The app remains on temporary styling and `apps/web/` / `apps/api/` are untouched.

## Proposed direction: Playful Learning Game (Phase 6, Direction 2)

**Status: PROPOSED — awaiting operator comparison and selection. Operator approval: NOT GIVEN.**
**Date proposed:** 4 November 2026.
**Scope:** mockups only. No application code, API, schema, auth, payment behavior or deployed environment was changed. Direction 1 mockups are untouched.

### Direction and references

The operator requested a second, parallel direction to compare against the Trading Terminal: a friendly, bright learning game that reduces intimidation while keeping every trust disclosure visible. No external reference URLs, imagery, trademarks or protected assets were supplied or copied. The treatment is original to LevelBreak Arena, with a leaf/plant growth motif for the scripted Guide.

- Page `#FEFCF7`; cards `#FFFFFF`; pale-gold section tint `#FFF9EC`.
- Text `#1F2937`; secondary `#6B7280`; muted `#9CA3AF`.
- Nimiq gold `#FBBF24` with deep gold `#D97706`; success `#10B981`; pending `#F59E0B`; loss `#EF4444`; info `#3B82F6`.
- Level markers: soft purple `#A78BFA`, pink `#F472B6`, mint `#34D399`.
- Nunito 800–900 for headings; Inter 400–500 for body and tabular numbers (no monospace in product numbers).
- 16px cards / 20px hero cards; pill primary CTAs; 8px rounded progress bars; soft elevation.
- Bounce easing for reward/CTA motion; one celebratory coin pop and +500 Luna float; warm status language.

### Artifacts

- [Direction 2 mockup notes and comparison](../design/MOCKUP_NOTES_DIRECTION2.md)
- [Direction 2 mockup set and viewing instructions](../design/mockups-direction2/README.md)
- [Direction 2 desktop screenshots](../design/mockups-direction2/screenshots/desktop/)
- [Direction 2 mobile screenshots](../design/mockups-direction2/screenshots/mobile/)
- [Direction 2 validation results](../design/mockups-direction2/screenshots/validation.json)
- Direction 1 remains at [design/mockups](../design/mockups/) and is frozen for comparison.

### Content and evidence sources

The same real server-owned content and Phase 5 evidence is used:

- `apps/api/src/domain/scenario-definitions.ts`
- `apps/api/src/domain/consultation-definitions.ts`
- Level 1 MOVE: **800 vUSDT / −20%**.
- 1,000 Luna: tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`, block `15838771`.
- 1,500 Luna: tx `b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf`, block `15839460`.
- Orphan recovery: tx `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29`, block `15838244`.

No transaction hash, block, address, session reference or scenario value was fabricated. The history sheet is a composite of the two required Phase 5 rows, which came from different generated testnet wallets; recipient addresses are omitted and this is disclosed in the notes.

### Deviations from the Direction 2 brief

1. The content path differs: `apps/api/src/domain/` holds the real content because the brief’s paths do not exist.
2. The Level 1 MOVE result is 800 vUSDT, not 850.
3. The 320px stress test covers screens 05, 07 and 09 as requested; overflow was checked at 320px for every screen.
4. Screenshots include exact viewport captures plus `-full` companions for scrolled pages.
5. History shows the documented date only, not an invented completion clock time.
6. The mockup marker is a ribbon chip plus a page-bottom pill, so it stays visible without covering game content.
7. Level 2/3 are represented by the reusable Level 1 template; the 12-screen inventory is followed exactly.

### Verification

`node design/mockups-direction2/capture.mjs` produced 54 captures with:

- 0 console errors, 0 page errors;
- 0 horizontal overflow at 1440px, 375px and 320px across all 12 screens;
- 0 off-screen elements at those widths;
- 0 `<script>` tags in screen HTML;
- all screens carrying the mockup marker;
- validation recorded in `design/mockups-direction2/screenshots/validation.json`.

### Comparison with Direction 1

- **Learning framing:** Direction 2 lowers the confidence barrier with a game metaphor, friendlier copy and a visible reward ladder; Direction 1 projects competence and seriousness but asks more of a first-time player.
- **Density and scan:** Direction 1 keeps portfolio and payout comparison dense and at-a-glance; Direction 2 trades compactness for larger type and more whitespace, which makes consultation and payout screens significantly longer on mobile.
- **Trust expression:** Direction 1 keeps disclosures in terse operational labels; Direction 2 translates them into plain-language cards. Direction 2 is easier for non-crypto players to understand, but the warm tone makes it easier for those disclosures to blend into marketing if repeated carelessly.
- **Reward emotion:** Direction 2 celebrates the +500 and the payout, making the loop clearer and more motivating; Direction 1 minimises celebration, which may undersell the reward but avoids implying real money. Direction 2 must keep “play money” adjacent to every celebration.
- **Product signature:** Direction 1 is distinctive as a DeFi operations tool but risks being mistaken for a real trading product; Direction 2 is immediately legible as a learning game but fits a more familiar friendly-app category.

This section records a **proposal and comparison**, not a selection or approval. The app remains on temporary styling; `apps/web/` and `apps/api/` are untouched.

## Proposed direction: Gamified (reference-driven) — v2 (Phase 6, Direction 3)

**Status: PROPOSED v2 — awaiting operator comparison and selection. Operator approval: NOT GIVEN.**
**Date proposed:** 4 November 2026. **v2 rebuilt:** 4 November 2026 after operator feedback.
**Scope:** mockups only. No application code, API, schema, auth, payment behavior or deployed environment was changed. Direction 1 and Direction 2 are untouched; Direction 3 v1 was replaced in place.

### Direction and reference

The operator supplied three cosmic staking-game screenshots in `design/references/` and asked for a genuinely gamified direction, not another skin. The reference extraction was written before screen production in [Direction 3 mockup notes](../design/MOCKUP_NOTES_DIRECTION3.md). The reference is used as a structural anchor — planet route, locked future destinations, fuel/progress bar, collectible vehicle cards, trophy room, claim action, allocated/claimed ledger — not as artwork to copy.

The operator rejected v1 as a flat, boxy dashboard with a space palette. **V2 replaces the flat presentation** with:

- A full-bleed orbital stage: massive 3D CSS spheres built from layered radial gradients, inset/outset shadows and rim light; distant locked planets with padlocks; animated dashed SVG routes; orbit rings and an original CSS/SVG ship.
- Glass panels: translucent indigo, `backdrop-filter: blur(20px)`, subtle 1px white-alpha borders, deep 0 30px 70px shadows and top light catches. No heavy gray borders.
- Cinematic type: very large uppercase Space Grotesk display, gradient text fills and colored drop shadows.
- Glowing pill CTAs with layered gold/cyan box-shadow glows.
- A floating loot-card reward reveal with an oversized 3D coin, layered burst rings and gradient +500 Luna.
- A level-up burst with rotating conic rays, floating 3D badge and a visibly advancing XP bar.
- A reference-style bottom ledger with Earned / Pending / Paid glass tiles carrying red / amber / green top accent borders.
- Mobile-specific compositions for the orbit scene, HUD and glass console at 375 and 320px.

The v2 palette remains deep space `#03040C` with Nimiq gold, mint, cyan, violet and magenta. Space Grotesk carries display type; Inter carries body and tabular figures. No reference image or trademark is reproduced. Run XP, streak, badges and levels remain game-layer metrics, never money. Motion is CSS-only; `prefers-reduced-motion` freezes the route, planets, loot card, coin, badge and conic rays in their final readable state.

### Artifacts

- [Direction 3 notes, reference extraction, trust table and accessibility decisions](../design/MOCKUP_NOTES_DIRECTION3.md)
- [Direction 3 mockup set and viewing instructions](../design/mockups-direction3/README.md)
- [Direction 3 desktop screenshots](../design/mockups-direction3/screenshots/desktop/)
- [Direction 3 mobile screenshots](../design/mockups-direction3/screenshots/mobile/)
- [Direction 3 validation results](../design/mockups-direction3/screenshots/validation.json)
- Reference files: `design/references/direction3-reference1.webp`, `direction3-reference2.webp`, `direction3-reference3.webp`.

Fourteen screens are proposed: the same twelve as the other directions plus **13 — Sector 01 complete** and **14 — Session summary**.

### Content and evidence sources

The same real server-owned content and Phase 5 evidence is used:

- `apps/api/src/domain/scenario-definitions.ts`
- `apps/api/src/domain/consultation-definitions.ts`
- Level 1 MOVE: **800 vUSDT / −20%**.
- 1,000 Luna: tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`, block `15838771`.
- 1,500 Luna: tx `b693acd38fdac38008b7faabe921056e5b3ebbae02b36207031faee4435250bf`, block `15839460`.
- Orphan recovery: tx `6456c17f557257fc39fb64277c853aa094ca0ccb4fcb8a7a040f15164e05cf29`, block `15838244`.

No hash, block, address, session reference or scenario value was fabricated. The mission log is a composite of the two required Phase 5 rows, which came from different generated testnet wallets; recipient addresses are omitted and this is disclosed in the notes.

### Deviations from the Direction 3 brief

1. The content path is `apps/api/src/domain/`; the named contract/seed content directories do not exist. No scenario text was invented.
2. The Level 1 MOVE result is the real 800 vUSDT, not 850.
3. The 14-screen inventory includes the two requested extras (13 level complete, 14 session summary); 320px captures cover 05, 07, 09, 13 and 14, while overflow is checked at 320px for every screen.
4. Screenshots include exact viewport captures plus `-full` companions.
5. History shows the documented date only, not an invented completion clock time.
6. The mockup marker is a “MOCKUP” chip in the status strip plus a page-bottom pill, so it remains visible without covering a reward or trust panel.
7. Level 2/3 reuse the Level 1 template and the real content; they are not separate full screens. The screen 13 “Enter sector 02” CTA links to the full-run summary as a review shortcut.
8. XP and badges are invented game-layer metrics. They are explicitly labelled as score/learning proof, never money.

### Verification

`node design/mockups-direction3/capture.mjs` produced 66 v2 captures with:

- 0 console errors, 0 page errors;
- 0 horizontal overflow and 0 off-screen content at 1440px, 375px and 320px across all 14 screens (decorative planet edges clipped inside an overflow-safe stage are not counted as content);
- 0 `<script>` tags in screen HTML;
- mockup marker present on every screen;
- required trust copy present per screen (case-insensitive, tag-stripped text check);
- validation recorded in `design/mockups-direction3/screenshots/validation.json`.

### Three-way comparison

- **Time to understanding:** Direction 1 communicates the numbers fastest for a DeFi-literate user; Direction 2 is fastest for a non-crypto newcomer; Direction 3 is fastest at communicating *what to do next* through the route and level HUD, but the added game chrome makes the underlying numbers slower to scan.
- **Trust legibility:** Direction 2 states the truth in the plainest language; Direction 3 keeps disclosures visually adjacent to every celebration but the celebration itself is the biggest attention competitor; Direction 1 is precise and technical but easy for a non-crypto player to skim as jargon.
- **Reward motivation:** Direction 3 has the strongest loop — XP, streak, badge, level-up, loot reveal and vault — and makes the reward feel earned; Direction 2 is warm and encouraging but less systemic; Direction 1 deliberately under-sells the reward and may fail to excite.
- **Density and mobile length:** Direction 1 is the densest and shortest to scan; Direction 3 is medium-high density with 14 screens and more surface area; Direction 2 is the roomiest and longest on mobile. Direction 3's 320px game screens are the heaviest of the three.
- **Implementation and brand risk:** Direction 3 has the highest implementation cost and the greatest risk of game chrome obscuring product truth or looking like a speculative crypto game; Direction 2 has the lowest intimidation barrier but the most generic “friendly app” signature; Direction 1 has the most distinctive serious-tool signature but may feel cold to the target learner.

This section records a **proposal and comparison**, not a selection or approval. The app remains on temporary styling; `apps/web/` and `apps/api/` are untouched.

## Approval log

- Reference candidates: Direction 3 is anchored on the three operator-supplied files in `design/references/`; Directions 1 and 2 used operator briefs with no external URLs.
- Mockup sets: Direction 1 at `design/mockups/` (12 screens), Direction 2 at `design/mockups-direction2/` (12 screens), Direction 3 **v2** at `design/mockups-direction3/` (14 screens). All have desktop/mobile captures and 320px stress tests as specified.
- Design decision record: all three directions **PROPOSED** — awaiting operator comparison and selection.
- Operator approval: **NOT GIVEN** for any direction.
- Selected direction: **NONE**.
- Approved implementation may begin: **NO**.
