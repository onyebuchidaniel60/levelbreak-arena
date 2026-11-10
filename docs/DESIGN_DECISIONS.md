# Design Decision Log

**Status:** Direction 1 — Trading Terminal is **APPROVED** by the operator on 4 November 2026. Directions 2, 3, and 4 are **REJECTED** and their artifacts have been removed. Phase 7 implementation may proceed.

## Approval record

- **Approved direction:** Direction 1 — Trading Terminal.
- **Approval date:** 4 November 2026.
- **Approval source:** explicit operator decision in the Phase 7 implementation request.
- **Rejected directions:**
  - Direction 2 — Playful Learning Game (`design/mockups-direction2/`) — rejected and removed.
  - Direction 3 — Gamified / reference-driven (`design/mockups-direction3/`) — rejected and removed.
  - Direction 4 — The Conquest RPG interactive prototype (`design/mockups-direction3-interactive/`) — rejected and removed.
- **Retained artifacts:** Direction 1 mockups and screenshots remain in `design/mockups/`.
- **Scope note:** the operator also approved a five-level ladder, 2,500 Luna maximum liability, an LLM-drafted agent message with scripted fallback, and a clearly labelled demo fiat off-ramp. These are recorded in `PROJECT_SPEC.md`, `ARCHITECTURE.md`, `AGENTS.md`, and `IMPLEMENTATION_PLAN.md`.

## Approved design system

### Direction

A dense, quiet DeFi operations terminal. The interface should feel like a real product used by a careful operator, not a generic SaaS dashboard or a speculative crypto game. Information hierarchy is explicit: status → action, evidence → question, earned → pending → paid.

### Color

- Page background: `#0A0E14`.
- Elevated surface: `#131820`.
- Secondary surface: `#0F141C`.
- Border: `#1F2937`.
- Primary text: `#E5E7EB`.
- Secondary text: `#9CA3AF`.
- Muted text: `#6B7280`.
- Numeric highlight: `#F3F4F6`.
- Earned / confirmed / positive: emerald `#10B981`.
- Pending / in progress: amber `#F59E0B`.
- Error / loss: red `#EF4444`.
- Primary CTA / Nimiq accent: gold `#FBBF24`.
- Informational links: soft blue `#60A5FA`.

### Typography

- UI text: **Inter** (400/500/600/700).
- Money, hashes, blocks, timestamps, levels, and technical labels: **JetBrains Mono** with tabular numerals.
- Display headings: Inter tight tracking; no decorative display face.
- Numbers are never rendered in a proportional font when they represent value, time, or chain data.

### Spacing and shape

- 4px spacing grid.
- 8px card radius (`rounded-lg`); 6px control radius (`rounded-md`).
- 1px borders; avoid shadows on cards. Depth comes from surface steps and one restrained backdrop blur in the sticky header.
- Dense but readable: 12–16px body text, 11–12px mono labels, 24–32px display numbers.

### Motion

- 150–200ms ease-out for state changes.
- One short emerald flash for an accepted reward.
- Typewriter reveal for the LLM agent message, disabled under `prefers-reduced-motion`.
- No bouncy, celebratory, or looping decorative motion.

## Screen treatment

- **Landing:** a terminal-style hero with a real "arena preview" panel, five-level ladder strip, reward rule cards, and trust disclosures. No fake transaction hashes or fake balances.
- **Lobby:** funded-session card with public reference, 5 consultations, 500 Luna per answer, 2,500 Luna cap, and one primary Start action.
- **Game:** bento layout with a 5-segment progress rail, virtual portfolio, scenario/consultation panel, and a persistent reward rail. `Earned` is emerald, `Pending` is amber, `Paid` is emerald with a check.
- **Consultation:** agent context and dynamically generated agent message first, then bundled static evidence, then options and Skip. The evidence remains authoritative; the LLM only drafts the message.
- **Payout confirmed:** transaction details, explorer link, and the **Withdraw to Fiat** demo action. The off-ramp modal offers NGN/EUR/USD rates fetched live from CoinGecko (NGN default, with a fallback), a live "You receive" fiat amount, and is explicitly labelled as a simulation that moves no fiat.
- **History:** compact session rows with earned, pending/paid status, payout amount, transaction hash, and explorer link.
- **Support pages:** same dark terminal shell, readable prose, no dead links or fake GitHub URLs.

## Accessibility and honesty rules

- Focus rings use the gold accent; all controls remain keyboard reachable.
- Status is expressed in text as well as color.
- The typewriter is visual only; a screen-reader copy of the full agent message is always present.
- The agent is labelled as LLM-assisted with a scripted fallback. It is not described as an independent external agent.
- The off-ramp modal states that no fiat currency is transferred, that the NGN/EUR/USD rates are mocked, and that no exchange is connected.
- No fabricated transaction hashes, addresses, balances, or paid states.

## Implementation record

- Design tokens and base styles live in `apps/web/src/index.css`.
- Shared UI primitives live in `apps/web/src/components/ui.tsx`.
- The approved Direction 1 layout is applied across all routes.
- The five-level ladder, LLM agent prompt, and demo off-ramp are implemented in Phase 7 under the operator's explicit approval.
- Design deviations: the existing functional copy and disclosures were preserved and restyled rather than rewritten into marketing claims. The Direction 1 mockups were produced for three levels; the implementation extends the same system to five levels and the new agent/off-ramp surfaces.


## Phase 12 — marketplace polish and mobile readiness

- Direction 1 — Trading Terminal remains the approved design. Phase 12 does not
  introduce a new visual direction.
- Added a public `/agents` directory using the same tokens: bento stat blocks,
  `panel-glass` and `panel-glow` surfaces, JetBrains Mono for counts and values,
  Inter for headings, gold for open questions and emerald for live/resolved
  states.
- Added `AgentCard` as the shared marketplace card on the landing page and the
  directory. It shows the real agent name, `Verified MCP` status, question
  counts, open questions, rewards paid, join date and agent ID.
- Added `Verified MCP` to external-agent Agent Request and Agent Message
  surfaces. Demo sessions retain the scripted/simulated disclosure.
- Mobile rules: 16px page gutters at 320-430px; full-width modals with at least
  16px outer gutters; 44px minimum decisions/options and header actions;
  safe-area bottom padding in the off-ramp sheet; no horizontal overflow at
  320px, 375px, 390px or 1280px.
- Screenshots at 390px are generated by the Phase 12 Playwright suite under
  `test-results/phase12/`.
- No fabricated balances, hashes, agent counts or paid states were added.


## Phase 13.5 — multi-currency off-ramp

- The Fiat Off-Ramp modal now defaults to **NGN** and offers a segmented control
  for **NGN, EUR and USD**.
- Mocked rates: 1 NIM = 1,350.00 NGN / 0.82 EUR / 0.89 USD.
- The "You receive" amount updates live using the confirmed NIM payout and the
  selected mocked rate, with thousands separators and the correct symbol.
- The disclosure explicitly says the rates are mocked and no fiat currency is
  transferred. No new colors, backend routes, auth, payment logic or payout
  worker changes were introduced.


## Phase 13.6 — live exchange rates

- Added a public `GET /api/config/exchange-rates` endpoint backed by CoinGecko
  (`ids=nimiq&vs_currencies=usd,eur,ngn`), with a five-minute in-memory cache
  and realistic fallback rates if the provider fails.
- The off-ramp modal fetches the rates with TanStack Query when it opens. It
  renders the selector and confirmed-payout context immediately and uses
  skeletons while the live rate loads, so the API never blocks the modal.
- The selected-currency rate is shown as `1 NIM = <symbol><rate>` and the
  "You receive" amount is calculated from the confirmed NIM payout. Sub-cent
  amounts display “Less than 0.01” rather than a misleading zero.
- The small disclosure "Live rate from CoinGecko. Demo only." is shown when the
  rate is available; a fallback message is shown if the fetch fails.
