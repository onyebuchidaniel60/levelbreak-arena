# Mockup notes — Trading Terminal

## Direction rationale

This direction treats LevelBreak Arena as an operations terminal rather than a game lobby with a chat assistant. The page is near-black navy, dense and flat; Inter carries the interface, JetBrains Mono carries anything countable — Luna, vUSDT, blocks, hashes, timestamps. Color is semantic and scarce: gold for the primary action, emerald for accepted/confirmed value, amber for pending, red for loss, blue for informational links and submitted state. The consultation arrives as an ops request with a requester identity, confidence, bundled evidence and a fixed reward, not as a friendly chatbot popup. The virtual portfolio is the drama; the evidence and the settlement ledger are the learning.

## Screen-by-screen

**01 — Landing.** The hero states the promise in two lines and shows both entry states explicitly: provider ready (“Start session”) and no provider (“Open in Nimiq Pay”). The right-side session board previews the three levels, the 500 Luna per-response reward and the 1,500 Luna session maximum without inventing market data. The trust strip underneath is deliberately blunt about testnet, treasury custody and the scripted requester.

**02 — Wallet connect.** Two equal panels compare “provider detected” with “provider unavailable” instead of hiding the fallback in an error state. State A shows a detected account, a short auth-sequence log and a one-time challenge explanation with no challenge value; State B gives a three-step instruction, the real app URL and a typographic Nimiq Pay icon placeholder. Neither panel asks for a seed phrase or implies that a wallet signature is a transaction.

**03 — Lobby with funded session.** The funded card leads with the public session reference and a “funded” pill, then puts reward, maximum, consultation count and funding status on one dense strip. The CTA is the only gold element; the side rail shows the deliberately empty “No other sessions available.” panel, the session rules and the treasury disclosure. Funding is described as verified before listing, not as a returned hash.

**04 — Lobby empty.** The empty state is a single centered feed card with a factual message and a mono “last check” timestamp, not an encouraging illustration. The funding gate below explains why a session is not listed yet: incoming transfer, independent verification, DB ledger commit. “Refresh feed” and “View history” are the only actions.

**05 — Level 1 decision.** A persistent rail holds level progress, the 1,000.00 vUSDT portfolio, earned 0 NIM, the 1,500 Luna maximum and answer count. The main panel contains only the actual scenario text and the two neutral decisions, STAY and MOVE; no expected outcome, delta or hint is shown before the decision. The rail’s “pending payout” label separates earned reward from payment.

**06 — Level 1 consequence.** The same rail updates to 800.00 vUSDT with a red −200.00 / −20.00% delta, matching the actual server-owned outcome. The result panel pairs the exact explanation with the lesson, a before/after strip and a “Continue to consultation” CTA. A note states that portfolio performance is simulated and does not change the fixed consultation reward.

**07 — Consultation.** The hierarchy is agent context → evidence → question. The agent card carries the scripted-requester label, the actual context and a medium-confidence pill; the evidence is a data-card instrument with three neutral key/value rows and a bundled-source footer; only then does the question appear. Options are SAFE, RISKY and CAN’T TELL with their real descriptions, and “Skip — no reward” stays visually quiet below. The evidence deliberately has no red/green coding, so it informs rather than gives away a classification.

**08 — Answered.** The brief moment after a valid response is a single emerald flash: +500 Luna, 0.005 NIM, earned total 500 / 1,500, and a thin 1/3 progress bar. The copy says “recorded / no correctness grade” and “pending · not yet queued”, and the note states that no transaction hash exists at this point. The run resumes at Level 2.

**09 — Payout states.** Three cards show the same finished run in QUEUED, SUBMITTED and CONFIRMED. QUEUED has a spinner and no hash; SUBMITTED shows the real Phase 5 hash truncated with copy and explorer affordances; CONFIRMED adds block 15839460 and the chain-verification sentence. The confirmed amount is 1,500 Luna, from the real b693acd3… transaction, and the bottom strip repeats that earned is not paid.

**10 — Zero reward.** The zero state is intentionally quiet: a grey 0 Luna, “Session complete. No reward earned.”, three skipped rows, and “NOT APPLICABLE — no payout record, transaction hash or block”. There is no green, no celebration and no fabricated receipt. The CTA returns to the lobby.

**11 — History.** A compact summary strip leads into a dense table: session reference, completion date, accepted count, earned Luna/NIM, confirmed pill and a real explorer-linked hash. The two rows reproduce the two required Phase 5 payouts (1,000 Luna with 139bfc81… and 1,500 Luna with b693acd3…). An empty-state reference sits below the table for review, and a note states that “confirmed” requires recipient, amount, network and inclusion to match.

**12 — Failure surfaces.** A composite sheet shows loading, 500, 404 and 401 states with the same terminal chrome. The loading state uses a skeleton of the run layout rather than a spinner-only page; the error state names a request ID and says no financial state changed; the 404 does not reveal whether the run is missing or owned by another wallet; the 401 offers a reconnect path. None of the four invents a payout or success state.

## Deliberately not in these mockups

- **Real evidence images.** Level 1 uses the real `data_card` evidence. The `image` evidence renderer is designed to use a labelled placeholder, but it is not shown because the supplied Level 1 question does not use an image.
- **Level 2 / 3 separate screens.** The 12-screen inventory mocks Level 1 as the representative run screen and consultation. Level 2/3 reuse the same layout with the real content in `consultation-definitions.ts`; they are not separate files in this set.
- **Live application data.** No fetch calls, cookies, API responses, wallet provider, signatures or challenge strings. Every screen is static HTML and CSS with zero `<script>` tags.
- **Animations beyond the described set.** The mockups include only CSS shimmer, spinner, pulse dots and the 200–600 ms reward flash. There is no page choreography, confetti or bounce.
- **The real Nimiq Pay icon or other protected brand assets.** The app icon is an explicit typographic placeholder (“NQ”) and says so.
- **Real footer links.** Documentation, GitHub and privacy/terms are Phase 8 placeholders, labelled “PHASE 8”. No URL was invented.
- **Payout failure / reconciling states.** The brief asks for queued, submitted and confirmed; the real app also has FAILED/RECONCILING copy, but those are not part of this review sheet.
- **A literal single-wallet history.** The two required Phase 5 rows came from different generated testnet player wallets. Recipient addresses are omitted; the header uses wallet A for illustration. This is a design composite, not a claim that one wallet earned both.
- **Final accessibility and production readiness.** Focus styles and reduced-motion support are present in the CSS, but this is not a completed keyboard/screen-reader audit, and the design has not been applied to the app.

## Deviations from the direction brief

1. **Level 1 consequence is 800 vUSDT, not 850.** The actual server-owned outcome is `8_000` basis points on 1,000 vUSDT, i.e. −20% and 800 vUSDT. The mockup uses the real value.
2. **Content path differs.** The requested `packages/contracts/src/content/` and `db/seed/content/` directories do not exist. Real content was sourced from `apps/api/src/domain/scenario-definitions.ts` and `consultation-definitions.ts`, with no invented scenario text.
3. **Both landing entry states are shown at once.** The brief says “Start session” or “Open in Nimiq Pay” depending on provider; showing both side by side on the review sheet makes the conditional state explicit. In production only one would render.
4. **The watermark is a vertical edge tab, not a corner pill.** A fixed corner pill covered evidence/option text in the full-page captures; the edge tab stays in the page margin at 1440, 375 and 320 without obscuring content.
5. **Screenshots include full-page companions.** Unsuffixed PNGs are the requested exact viewports (1440×900, 375×812, 320×568); `-full` variants are included because consultation, history and landing scroll. The 320px overflow check was run for every screen, but only screens 05 and 07 have 320px screenshots as requested.
6. **Completion times are date-only.** Phase 5 records the date but not a reliable per-run completion clock time in the handoff, so history shows `04 NOV 2026` rather than inventing a timestamp.
7. **No separate Level 2/3 files.** See above; the layout is reusable and the real content exists, but the 12-screen inventory is followed exactly.

## What I want feedback on

1. **Density vs. legibility.** The UI uses 12–14px text and 8–10px mono labels. Is that the right “Bloomberg terminal” density, or should the secondary labels move up a step for readability? Please name any screen where you have to squint.
2. **Mobile run rail.** On mobile the full status rail (progress, portfolio, earned, max) sits above the scenario before the decision. Is that hierarchy right, or should the rail collapse into a compact sticky strip so the decision is closer to the first screen?
3. **Consultation evidence prominence.** Does the evidence card read as the primary object before the question, or does the agent message still dominate? Would you give the evidence more visual weight or move the reward out of the question header?
4. **Settlement clarity.** Do the three payout cards make the lifecycle obvious, and is “Earned ≠ paid” unmissable enough without turning the finish screen into a disclosure wall?
5. **Tone and trim.** Is the vertical mockup tab, the gold primary CTA and the all-caps mono labelling the right amount of terminal character? Are screens 05, 06, 08 and 10 too sparse for a direction described as dense, or is the breathing room useful?
