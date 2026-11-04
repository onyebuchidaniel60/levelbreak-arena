# Mockup notes — Playful Learning Game

## Direction rationale

This direction treats LevelBreak Arena as a warm learning game first and a money surface second. The page is off-white and softly lit, the cards are white with gentle shadows, headings are rounded Nunito, and the body stays readable at 15–16px. Color is used to guide and encourage — gold for the main action, mint for progress and success, purple/pink as level markers — while the serious facts stay in plain language instead of terminal shorthand. Guide is a leaf-shaped scripted requester, not a fake person; the reward is celebrated, but “testnet play money”, “operator treasury” and “scripted requester” remain visible in the same friendly voice. The intended feeling is “I can try this” rather than “I need to know what I'm doing before I start.”

## Screen-by-screen

**01 — Landing.** The hero leads with “Learn DeFi risk. Grow your confidence.” and a soft illustrated path with three level stops. “Start playing” is the single primary action, with a phone fallback chip and clear 3-level / 500 / 1,500 reward facts. Three plain-language trust cards explain play money, the operator treasury and Guide's scripted nature before the how-it-works steps.

**02 — Wallet connect.** Two equal cards compare “Nimiq Pay is ready” with “Open this in Nimiq Pay”, so the fallback is a first-class state rather than an error. The available state shows the real detected account and three short assurances; the unavailable state uses a phone illustration, three taps and the real app URL. Neither shows a challenge value or asks for a seed phrase.

**03 — Lobby with funded session.** A warm banner announces the open run, with the real session reference `0f566d59…c30388`, a funded pill and a one-run-only pill. The 500 / 1,000 / 1,500 reward ladder makes the reward math visible at a glance, and the side rail has a friendly “nothing else open” panel plus a plain treasury disclosure. “Start my run” is the single gold action.

**04 — Lobby empty.** The empty state is gentle but factual: a sleepy plant, “No session open. We'll save your spot.”, a last-check time and a clear funding gate. It explains that a session appears only after the transfer is checked on-chain. “No session, no charge” and the testnet disclosure stay visible.

**05 — Level 1 decision.** A three-step level path sits above three friendly stat cards: 1,000.00 vUSDT, 0 NIM pending, 0/3 questions. The scenario card uses the exact server text and two equal STAY / MOVE choice cards, with a “no outcome shown” label on each. There is no peeking, no expected value and no colour hint about which choice is “correct”.

**06 — Level 1 consequence.** The portfolio updates to 800.00 vUSDT with a red −200.00 / −20.00% change, and a soft illustration of a drooping plant and cracked coin keeps the mood warm without hiding the loss. The exact explanation and lesson appear in full, followed by a before/after strip and “Talk it through with Guide”. A note separates the pretend portfolio from the fixed consultation reward.

**07 — Consultation.** Guide's card comes first with the scripted badge, the real agent context and medium confidence; the message is the exact prompt. Evidence is a pale-blue data card with the three real facts and bundled-source footer, then the question card with 500 Luna, the three real options and a quiet skip link. The “no hidden answer key” note is explicit, and the page repeats that Guide is not live AI.

**08 — Answered.** The reward moment is a warm gold stage with a coin pop, confetti specks and “+500 Luna” in mint. The card says “You earned 0.005 NIM” but also “Not paid yet”, explains that no transaction hash exists at this point, and shows the 500 / 1,500 progress. A three-card trust strip keeps no-hidden-grading, earned ≠ paid and testnet-only in view.

**09 — Payout states.** Three warm cards show the same finished run as queued, on its way and paid to your wallet. The confirmed card uses the real `b693acd3…` hash and block `15839460`, a big green check and a plain “Confirmed on Nimiq Testnet. This is play money, not cash.” line. The queued card has no tx; the submitted card has the real hash and a reconciliation note; the bottom disclosure explains operator treasury and what “paid” means.

**10 — Zero reward.** The zero state is soft but honest: a resting plant, grey 0 Luna, “No reward this time.” and three skipped rows. It states that skipping is valid, that no payout record or tx was created, and that the run will show zero in history. There is no green, no celebration and no invented receipt.

**11 — History.** A simple summary strip leads into a warm table with the real 1,000 and 1,500 Luna rows, answered counts, paid pills and explorer-linked hashes. The empty-state reference is visible below for review, along with “only you can see this” and the plain meaning of “paid”. Dates use the documented Phase 5 date only.

**12 — Failure surfaces.** Loading, 500, 404 and 401 share the same friendly chrome. The loading state is a skeleton with “Finding your run…” and bouncing dots; the 500 says “That didn't go through” with a request ID and a retry; the 404 protects privacy; the 401 offers a reconnect. No failure screen fabricates a payment or success state.

## Comparison with Direction 1 (Trading Terminal)

### What Direction 2 gains

- **Lower entry intimidation.** The game metaphor, large friendly type and plain “start playing” path ask less domain confidence from a first-time player than the terminal does.
- **A more legible reward loop.** 500 / 1,000 / 1,500 is visible as a reward ladder, and the +500 flash makes the answer-to-earned connection obvious.
- **Trust in plain language.** “The NIM you see isn't real money”, “operator-controlled treasury” and “scripted requester, not a live AI” are easier for a non-crypto player to absorb than terminal-style labels.
- **Warmer mobile ergonomics.** 15–16px body text, larger tap targets and single-column cards reduce the amount of precision required on a phone.
- **A coherent money surface.** Payout confirmation is still celebratory rather than switching into a dark, grown-up admin panel, so the product feels like one thing.

### What Direction 2 loses

- **At-a-glance density.** The larger type, generous spacing and card stacking make the consultation and payout screens much longer; comparing queued/submitted/confirmed requires more scrolling on mobile.
- **Serious-market credibility.** A DeFi-literate audience may read the playful shapes as less financially serious, even though the underlying disclosures and numbers are identical.
- **Risk of trust signals blending in.** When every surface is warm and encouraging, the testnet/treasury warnings can start to look like marketing instead of hard boundaries; they need disciplined repetition.
- **Celebration can over-signal money.** The +500 and “Paid to your wallet” moments are emotionally stronger, so the “play money” qualifier has to stay adjacent rather than buried.
- **Less visual distinctiveness.** Friendly rounded card UI is a familiar category; the terminal direction has a sharper, more memorable product signature.

## Deliberately not in these mockups

- **Real evidence images.** Level 1 uses the real `data_card`. The image evidence renderer is not shown because the supplied question does not use one.
- **Level 2 / 3 separate screens.** Level 1 is the representative run screen; Levels 2/3 reuse the layout and existing real content.
- **Live application data.** No fetch calls, cookies, API responses, wallet provider, signatures or challenge strings. Zero `<script>` tags in screen HTML.
- **Provider integration.** Both wallet states are static; no real Nimiq Pay handshake is performed.
- **Animations beyond CSS.** Shimmer, spinner, bouncing dots, coin pop and reward pop are CSS only; no choreography or JS.
- **Real brand assets.** The Nimiq Pay icon is a typographic “NQ” placeholder, and the leaf mark is original geometry.
- **Real footer links.** Documentation, GitHub and privacy/terms are Phase 8 placeholders.
- **Payout failure/reconciling states.** Queued, submitted and confirmed are the requested review states; FAILED/RECONCILING copy exists in the app but is not mocked here.
- **A literal single-wallet history.** The two Phase 5 rows came from different test wallets; recipient addresses are omitted and the header uses wallet A for illustration.

## Deviations from the direction brief

1. **Level 1 MOVE is 800 vUSDT (−20%)**, the real server outcome, not the earlier illustrative 850.
2. **Scenario content path differs.** `packages/contracts/src/content/` and `db/seed/content/` do not exist; the real content lives in `apps/api/src/domain/` and is used verbatim.
3. **Screenshots include `-full` companions.** Unsuffixed files are the exact 1440×900 / 375×812 / 320×568 viewports; full-page captures are included for review because consultation and payout scroll.
4. **The 320px stress test covers 05, 07 and 09.** The brief requested those three; overflow was also checked at 320px for every other screen.
5. **History shows the date only.** Phase 5 did not record a reliable per-run completion clock time, so no time is invented.
6. **The watermark has two forms.** A “MOCKUP” chip in the status ribbon keeps the artifact visible above the fold, and a fuller “Mockup — not implemented” pill sits at the page bottom so it never covers game content.
7. **Level 2/3 are not separate files.** The 12-screen inventory is followed exactly; the real content is available for the reusable template.

## What I want feedback on

1. **Tone calibration.** Does the warm, encouraging voice reduce intimidation without feeling childish or making 500 Luna feel like a toy reward? Is “That's in. Nice one.” the right level?
2. **Mobile length.** Screens 07 and 09 become long on a phone because the cards stack. Is that a worthwhile trade for readability, or should the question/evidence and payout states compress into tabs or an accordion?
3. **Trust prominence.** Are “play money”, “operator treasury” and “scripted requester” visible enough while the page is celebrating a payout? Which screen feels closest to hiding the truth?
4. **Guide's character.** Does the leaf avatar plus “Guide · Scripted” clearly read as a scripted requester without feeling cold or anthropomorphic? Should the label be even more explicit?
5. **Direction choice.** Compared with the Trading Terminal, which direction better fits the audience you want for the competition demo — and which specific elements from the other direction should be carried over if this one is selected?
