# Design Decision Log

**Status:** PROPOSED direction — Trading Terminal. Awaiting operator review. **NOT APPROVED.** Do not implement final styling before explicit operator approval.

## Product/design decisions already locked

- Product name: LevelBreak Arena.
- Three levels: stablecoin peg risk, liquidity-pool impermanent loss, yield-farming sustainability.
- One consultation per level, with evidence displayed before the question.
- Answer classifications include `Can't tell`; skip is free.
- Static/bundled evidence and scripted requester in MVP.
- Temporary styling through functional verification.
- Operator selected the **Trading Terminal** direction for Phase 6 mockups. Final visual implementation remains blocked until explicit approval.

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

The operator selected the Trading Terminal direction by brief rather than supplying external reference URLs. No external imagery, trademarks or protected brand assets were copied. The design studies the density, hierarchy and typographic discipline of professional trading terminals and operations tools, with an original LevelBreak Arena treatment.

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

## Approval log

- Reference candidates: not applicable — the operator selected the Trading Terminal direction by brief; no external reference URLs were supplied.
- Mockup set: created 4 November 2026 at `design/mockups/` — 12 screens, desktop and mobile, plus 320px stress tests.
- Design decision record: PROPOSED — awaiting operator review.
- Operator approval: **NOT GIVEN**.
- Approved implementation may begin: **NO**.
