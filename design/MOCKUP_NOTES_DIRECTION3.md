# Mockup notes — Gamified (reference-driven)

## Reference extraction (written before screen production)

**Reference files read:**
- `design/references/direction3-reference1.webp`
- `design/references/direction3-reference2.webp`
- `design/references/direction3-reference3.webp`

The reference is a dark cosmic staking game called “Discover Planets.” It presents a three-stop planetary journey rather than a dashboard: a bright current planet at the centre, a completed green stop behind it, a dashed route forward, and a future planet locked behind a padlock. A “STELLAR” mission card carries duration, reward and spaceship details, with a fuel bar and a single bright “CLAIM”/“GET REWARD” action. A second screen turns spacecraft into collectible cards in a centre-focused carousel: the selected ship is large, adjacent ships are dimmed, and a future ship shows “100 DAYS LEFT TO BE UNLOCKED” with a lock. A third screen shows a top-level “Progress” nav, “Challenges”, “Trophy Room” and “Earnings”, plus a bottom ledger of “Allocated / Claimed / Available” amounts.

### What makes it read as a game rather than a themed form

- **A world map, not a settings page.** The primary object is a route through glowing planets with a visibly locked future destination. Progress is spatial.
- **One dominant action per beat.** The current planet owns the screen; “CLAIM”/“GET REWARD” is the only bright button.
- **A progression system with more than one axis.** Fuel percentage, node completion, a countdown to unlock, collectible ships and a trophy room all reinforce “keep going.”
- **Collectible identity.** The spaceship cards are desirable objects, not list rows. The selected one is centre-stage; the others are visibly weaker/locked.
- **A reward moment.** Claim/reward buttons, a filled fuel bar and glowing planet edges imply a burst or reveal. The reference is static, but the hierarchy is built for a celebration.
- **A ledger with game currency framing.** “Allocated”, “Claimed” and “Available” are shown as a scoreboard beneath the world, not as an admin table.
- **Meta-progression cues.** “Challenges”, “Trophy Room” and “Earnings” imply a larger game beyond one action.

### Palette, typography and shape

- Near-black indigo/deep-space base with violet/magenta nebula bloom, lime-green and cyan accents, and gold star/planet highlights.
- White and pale-lavender text; small uppercase labels with wide tracking; large condensed/uppercase display headings with a slight glow.
- Vivid 3D-looking planets and rockets with strong rim light, soft shadows, star sparkles and dashed orbit paths.
- Bright rectangular CTAs, outlined secondary buttons, thin progress tracks, translucent dark cards and rounded-rectangle panels (roughly 10–16px).
- Layered composition: background nebula → distant stars → orbital path → planets → foreground mission card → bottom ledger.

### Motion implied by the reference

- Planets glow/pulse; the current node is the brightest object.
- Dashed paths read as directional movement toward the locked planet.
- Fuel bars fill; the claim button is the visual payoff.
- The ship carousel implies horizontal slide with a selected card growing and side cards dimming.
- Locked cards use a countdown and padlock, implying a future unlock animation.
- The reward claim is staged as a reveal, not a number update.

### What Direction 3 adopts

- **Three-node journey map** using the real three levels, with the current node glowing, completed nodes marked, and future nodes visibly locked with a padlock and an explicit unlock condition.
- **Persistent run HUD:** level badge, **Run XP** bar with a numeric count, **answer streak**, and a three-sector progress readout. XP and streak are game-layer metrics, clearly separate from Luna.
- **Mission/level card** with the real scenario title, a reward chip, and one dominant action.
- **Collectible-style badge shelf**: “Peg Navigator”, “Pool Diver”, “Yield Sentinel” earned on level completion. These are learning badges, not financial products.
- **Reward reveal moment** on answer: a flipping loot card with a coin, an XP chip, a streak increment, and a “not paid yet” note beside the +500 Luna.
- **Level-up burst** between levels: “SECTOR CLEARED”, XP bar movement, badge unlock, and the next planet unlocking with a glow.
- **Game-currency ledger** for payouts: a vault/treasure panel with a connected QUEUED → SUBMITTED → CONFIRMED progression, real chain facts on the confirmed stage.
- **Neon orbital visual language:** starfield, planet gradients, dashed path, glow, trophy/badge shapes, strong display type.

### What Direction 3 translates rather than copies

- “Fuel” becomes **Run XP**, because fuel implies a consumable and could be confused with money. XP is explicitly a game score.
- Planets become **sectors named by the actual risk topics** (“Stablecoin peg risk”, “Liquidity pool and impermanent loss”, “Yield-farming sustainability”), not invented lore that replaces the curriculum.
- The spaceship carousel becomes a **badge/medal shelf** earned by completing levels; we do not add collectible purchases or speculative assets.
- “Allocated / Claimed / Available” becomes **Earned / Pending / Paid**, with real Luna amounts and a real Phase 5 tx on the paid stage.
- “Trophy Room” becomes an in-run **badge shelf** and session-summary trophy strip; no extra route is invented.
- “Challenges” becomes the three level missions already in the product; no daily-streak economy or extra rewards are added.
- The reference’s “5% reward / 65d” style numbers are not copied; all monetary and chain values come from the existing product.

### What Direction 3 deliberately does not adopt

- **The exact space-staking theme or any reference artwork.** No spaceship/planet assets are copied; all visuals are original CSS/SVG geometry.
- **Investment-performance framing.** No APY, duration yield, allocated token amounts or “earn 5%” promises. The game layer must not make the simulation look like a financial product.
- **A countdown to a paid unlock.** Locked levels unlock by completing the previous level, not by waiting or paying.
- **Buried disclosures.** The reference has no trust layer; Direction 3 will put “Testnet · not real money”, “Scripted requester” and “Operator treasury” next to the gamified moment, at the same visual weight. A trophy is never more prominent than the fact that the money is play money.
- **Motion as the only signal.** Every reward, loss, lock and confirmation has a static icon, label and number. Animation is additive.
- **A separate “Earnings” or “Trophy Room” route.** The existing route inventory is preserved; badges appear in the run and summary.

### Honesty translation for a gamified product

- **XP is not money.** The HUD labels it “RUN XP” and never converts it to NIM.
- **Rewards are not loot drops.** The reveal says “+500 Luna earned” and “Not paid yet” on the same card.
- **Locked means “complete the previous level”, not “pay to unlock”.** The copy says so next to the padlock.
- **The confirmed stage is the only one with a chain receipt.** QUEUED and SUBMITTED show no block; CONFIRMED shows block `15839460` and the real `b693acd3…` tx, plus “Testnet · not real money”.
- **Operator treasury is part of the reward UI**, not footer fine print.

## Per-screen summary

**01 — Landing.** A full cosmic hero, “ENTER THE RISK ORBIT,” puts a glowing sector 01 planet on a dashed route with sectors 02 and 03 visibly locked. The mission map uses the real three level titles, and the trust chips sit directly under the launch CTA rather than in a footer. A trophy-bay preview states that badges are learning proof, not money.

**02 — Launch console.** Two states compare a detected Nimiq Pay pilot with the “open in Nimiq Pay” fallback. The launch checklist is micro-gamified (checks, a mission patch), while “Testnet · not real money”, “no transaction at sign-in” and operator-treasury language sit inside the cards. The phone mock is a typographic placeholder, not copied brand art.

**03 — Mission board.** A funded run is presented as “Mission LBA-01 · The tempting yield,” with the real session reference and a 500 / 1,500 / 300 XP reward strip. The sector route shows sector 01 ready and sectors 02/03 locked; the side rail has “no other missions,” a trophy bay and the treasury/testnet disclosure. Starting the run is the single gold action.

**04 — Empty mission board.** A radar scan and “No run to launch yet” make the empty state feel like part of the world rather than an error. The last scan, funding gate and testnet/treasury note are visible. There is no fake mission or invented countdown.

**05 — Sector 01 decision.** The HUD carries a level hex, a 0/300 XP bar, streak, answers, earned, and a live decision state. The sector route shows two locked future nodes; the scenario card uses the exact server text and STAY/MOVE choices with outcomes hidden. The portfolio and trust notes sit in the same view.

**06 — Sector 01 impact.** The portfolio number moves visibly from struck-through 1,000.00 to a large red 800.00, with a −20% delta chip and a red HUD state. The exact explanation and lesson are paired with a “what this teaches” panel and a next-step CTA. A trust block separates the pretend portfolio from the fixed reward.

**07 — Guide's intel.** Guide appears as a signal avatar with a “Scripted” badge, confidence, and the exact transmission. The three real evidence facts are a data card, then the question and three real options, skip link and “no hidden answer key” note. “Scripted requester”, “Testnet · not real money” and “operator treasury” sit in the same comms surface.

**08 — Reward reveal.** The answer reveal is a loot card: coin pop, +500 Luna, +100 XP, streak 1, and 500/1,500 progress. “Not paid yet”, testnet and operator-treasury notes are inside the reveal card, not after it. The next CTA is the level-clear beat, not an immediate payout.

**09 — Reward vault.** The three payout states are a connected ledger rather than three cards: queued, submitted and confirmed stages show what existed at each point. The confirmed stage carries the real `b693acd3…` hash and block `15839460`; the vault hero holds the total and the trust disclosure. Operator treasury and “confirmed on-chain” sit at the same visual weight as the amount.

**10 — Empty vault.** The zero state is an empty reward orb, 0 Luna and three skipped rows. It says no payout record, hash or block was created, and explicitly keeps “testnet · not real money” and “no operator treasury transfer” visible. There is no confetti, no green and no fictional receipt.

**11 — Mission log.** Two real completed runs show answers, earned Luna/NIM, paid pills and explorer-linked hashes. The empty-state reference, wallet-scope note and testnet/treasury disclosure are below the table. “Paid” means the recipient, amount, network and inclusion matched on-chain.

**12 — Signal states.** Loading, 500, 404 and 401 are presented as orbit diagnostics with friendly copy and precise state. The error screen names a request ID and says no financial state changed; the 404 protects pilot privacy; the 401 reconnects. None presents a payout or success.

**13 — Sector 01 complete.** A dedicated level-up beat: “SECTOR 01 CLEARED,” Peg Navigator badge, +100 XP with the bar moving to 100/300, streak 1, and a clear “sector 02 unlocked” line. The trust panel states 500 Luna is pending, not paid, and the next level unlocks by playing rather than paying.

**14 — Session summary.** The earned-feeling finish: 1,500 Luna total, 3/3 answers, 300/300 XP, streak 3 and three badge tiles. The verified payout receipt carries the real b693acd3… hash, block 15839460, payer “Operator treasury” and “Nimiq Testnet / 5”. One primary next action returns to the mission board.

## Gamified patterns adopted from the reference

| Reference pattern | Direction 3 use | Translation / constraint |
|---|---|---|
| Planetary route with a glowing current node and locked future nodes | Orbit route on landing, mission board and every run HUD | The three nodes are the real levels; a padlock says “clear the previous sector,” never “pay to unlock” |
| “Fuel Available” progress bar | Run XP bar with numeric 0/300, 100/300, 300/300 | XP is explicitly a game score, never converted to money |
| Ship collectible carousel | Badge / trophy bay with Peg Navigator, Pool Diver, Yield Sentinel | Badges are learning proof only; no purchases, no speculative assets |
| “CLAIM / GET REWARD” bright action | “Launch run,” “Open Guide's intel,” “Claim XP & clear sector” | The reward reveal is followed by a payout explanation, not an immediate cash promise |
| Trophy Room / Challenges / Earnings nav | Trophy bay and mission log inside the existing routes | No extra route or reward economy was invented; existing routes are preserved |
| Allocated / Claimed / Available ledger | Earned / Pending / Paid and the reward-vault stage ledger | Amounts are real Luna; confirmed stage carries the real Phase 5 tx and block |
| Dashed path, starfield, rim-lit planets | Original CSS/SVG orbit path, planet gradients, star specks | No reference artwork or trademarks are copied |
| Neon cyan/purple/magenta palette | Deep indigo space with Nimiq gold as the primary action, mint for confirmed value, cyan for links/info | Gold remains the brand/primary action; color is always paired with text or icons |

## Trust disclosure placement

| Screen | Disclosure | Placement | Visual weight |
|---|---|---|---|
| 01 Landing | Testnet · not real money | Hero chips under CTA + “Before you launch” trust tile | Same chip weight; tile beside mission map |
| 01 Landing | Operator treasury | Hero chip + trust tile | Same chip/tile, not footer |
| 01 Landing | Scripted Guide | Hero chip + trust tile | Same chip/tile, not footer |
| 02 Wallet | Testnet · not real money | Inside state A launch card | Gold trust panel below checklist |
| 02 Wallet | Operator treasury | Full-width trust line under both states | Same bordered panel |
| 02 Wallet | Not a transaction | Strip + checklist row | Visible above the fold |
| 03 Mission board | Testnet / operator treasury / scripted | Trust line in side rail + mission body | Same panel as trophy bay |
| 04 Empty board | Testnet / operator treasury | Trust line under funding gate | Same bordered panel |
| 05 Sector 01 | Testnet · not real money | Portfolio card + footer | Gold trust panel inside the card |
| 06 Impact | Testnet · not real money | Portfolio card trust + footer | Gold trust panel next to the loss |
| 06 Impact | Operator treasury | Comms queue row | Text row in the same side panel |
| 07 Consultation | Scripted requester | Guide header badge + comms trust line | Badge beside Guide's name |
| 07 Consultation | Testnet / operator treasury | Comms trust line + reward chip area | Same mint/cyan trust panel |
| 08 Reward reveal | Testnet / not paid yet / operator treasury | Inside the loot card + three trust tiles below | Same card as +500 Luna; no disclosure appears only after the celebration |
| 09 Reward vault | Testnet / operator treasury / confirmed block | Vault hero trust + ledger footer + trust tiles | Same panel as the total; block chip in verified stage |
| 10 Zero reward | Testnet / no payout / operator treasury | Trust line under zero card | Same bordered panel |
| 11 Mission log | Testnet / operator treasury / paid meaning | Trust line under log + paid pills | Same panel; “paid” definition beside the log |
| 12 Signal states | Testnet / no financial change | Trust line under the four state cards | Same bordered panel |
| 13 Sector clear | Testnet / not paid yet / scripted / operator treasury | Trust line in the level-up panel + three trust tiles | Same panel as +100 XP and 500 Luna |
| 14 Session summary | Testnet / operator treasury / confirmed block / scripted | Summary trust under total + receipt payer + bottom disclosure | Same hero and receipt as the money |

## Accessibility decisions

- **Reduced motion:** all celebration effects are additive. With `prefers-reduced-motion: reduce`, the loot card appears in its final state, the coin is still, the XP fill is already at its value, the badge is static, and the orbit rings do not pulse. No critical number or state depends on animation.
- **Color-independent meaning:** locked sectors include a padlock and “Locked”; confirmed stages include a check, “Confirmed” and the block number; losses include a downward arrow, a minus sign and the numeric delta; earned/paid states include text labels. Color is never the only carrier.
- **Touch targets:** primary/secondary buttons are at least 46px high; option cards at least 56px; choice cards have generous padding; the skip link has a 44px target. Nav links are at least 34px at mobile with large horizontal padding.
- **Focus:** buttons, choices, options and stage steps use a visible 2px cyan focus ring with 3px offset.
- **Contrast:** white/near-white text on deep indigo; gold CTA has near-black text; mint and gold semantic text are paired with icons and text labels. Trust text is 12px in bordered panels rather than tiny footer copy.
- **Critical information:** the reward amount, earned/paid state, tx hash, block, locked state and “testnet” text are all static content; motion is supplemental.
- **Responsive:** 14 screens checked at 1440, 375 and 320; stress screenshots at 320 for 05, 07, 09, 13 and 14.

## What's not included

- **Real 3D artwork.** The reference planets/rockets are approximated with original CSS gradients, SVG path art and glow; no reference assets are copied.
- **A full game economy.** No purchasable ships, loot boxes, daily streak rewards, tokens, marketplace or “earn while waiting” system. XP and badges are learning-only.
- **Extra routes.** No `/trophies`, `/challenges` or `/earnings` route is invented. The existing route inventory is preserved.
- **Live API/provider data.** No fetch, cookies, wallet provider, account detection, signatures or challenge strings. Provider states are static mockups.
- **Real motion beyond CSS.** The loot reveal, coin drop, badge pop, XP fill and orbit rings are CSS. No video, sound or JavaScript choreography is included.
- **Real Nimiq Pay branding.** The app icon is an “NQ” placeholder.
- **Level 2/3 full screens.** They reuse the same template and real content; the 14-screen inventory is followed. The “Enter sector 02” CTA on screen 13 links to the full-run summary as a review shortcut, because Level 2/3 screens are not part of this 14-screen set.
- **Payout failure/reconciling states.** The requested ledger shows queued/submitted/confirmed; failure copy exists in the app but is not part of this review sheet.
- **Final legal/docs/footer links.** Those remain Phase 8 placeholders.
- **A literal single-wallet history.** The two required Phase 5 rows came from different test wallets; recipient addresses are omitted and the header uses wallet A for illustration.

## Questions for the operator

1. **Reference recognition:** does the orbit route, locked nodes, XP HUD, badge shelf and vault ledger read as the same gamified category as the reference — or does it still feel like a themed dashboard?
2. **Trust weight:** are “Testnet · not real money,” “Operator treasury” and “Scripted requester” visible enough beside the celebrations? Which screen gets closest to burying them, and should that one be revised first?
3. **Celebration calibration:** are the loot reveal (08), level-up (13) and run summary (14) distinct enough beats, or should one of them be more theatrical? Is the reward reveal too much or too little?
4. **Game loop completeness:** is anything essential missing from the loop — for example a visible streak-break state, a badge shelf before the first run, or a per-sector counter on the HUD?
5. **Direction comparison:** for the competition audience, does this gamified direction beat the terminal and playful directions, or would a hybrid (for example, Direction 3's HUD and rewards on Direction 1's density) be stronger?

