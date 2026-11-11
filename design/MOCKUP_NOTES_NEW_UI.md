# New UI — Reference Extraction

Source references: `design/references/new-reference1.webp`,
`new-reference2.webp`, `new-reference3.webp`.

## Color palette

| Token | Hex | Use |
|---|---|---|
| Ink | `#151313` | Primary text, dark frame, dark chips, progress bars |
| Coral | `#ff5734` | Primary CTAs, play/action accents, focus rings |
| Lilac | `#be94f5` | Bento cards, agent/education accents |
| Yellow | `#fccc42` | Bento cards, active nav, highlight chips |
| Cream | `#f7f7f5` | App workspace surface |
| Paper | `#fffdf8` | Elevated cards and panels |
| Canvas blue | `#bfd4dc` | Page ground outside the app frame |
| Sky | `#bde6f5` | Third bento card color from the dashboard reference |
| Charcoal | `#2b2b2b` | Dark app frame, footer, dark CTA cards |
| Soft line | `#d9d5cc` | Warm dividers and secondary card borders |
| Muted | `#66635d` | Secondary copy |
| Faint | `#8c877f` | Micro-labels and metadata |
| Positive | `#137a52` | Paid / confirmed / successful states |
| Pending | `#a86a00` | Pending / queued / waiting states |
| Error | `#d94327` | Errors and failed states |

The explicit reference palette is `#151313`, `#ff5734`, `#be94f5`,
`#fccc42`, `#f7f7f5`. The canvas blue and sky card are taken from the
dashboard composition; charcoal is the app frame.

## Typography

- **Kodchasan** — the reference font, loaded from Google Fonts at weights
  400, 500, 600 and 700. Used for headings, UI labels, body copy and buttons.
- **JetBrains Mono** — retained for all financial/technical data: Luna
  amounts, NIM values, exchange rates, hashes, block heights, state versions
  and numeric counters.
- Hierarchy:
  - Display: 40–64px, weight 700, tight tracking (`-0.04em`).
  - Page title: 28–36px, weight 700.
  - Card title: 18–24px, weight 600–700.
  - Body: 14–16px, weight 400–500, 1.5–1.7 line height.
  - Micro-label: 10–11px, uppercase, 0.12em tracking, weight 600.
- No decorative display face beyond Kodchasan. Numbers never use a
  proportional font.

## Shape language

- Large, friendly radii: **24–32px** on cards, **12–16px** on inner
  controls, and **pill** treatment for filters, badges and primary actions.
- Thin dark outlines (`#151313` at low opacity) around key cards; soft warm
  lines for secondary dividers.
- Flat pastel fills with black type, not heavy gradients. Depth comes from
  surface steps and dark/cream contrast.
- The dark app frame is a defining shape: a charcoal shell containing a cream
  workspace, with the top navigation and footer in the dark frame.
- Shadows are restrained; the off-ramp/modal overlay uses a soft blurred
  dark scrim with a cream dialogue panel. No neon glows, no purple AI
  gradients.
- Progress bars are dark ink on a pale track; chips are solid yellow, lilac,
  sky or ink.

## Layout patterns

- Bento grids: a dominant hero card, two or three pastel feature cards, then
  a wide content card and a dark side CTA.
- A dark left rail in the reference maps to a dark top navigation bar with
  pill links and a yellow active state, preserving the framed-app feel without
  disrupting the existing responsive shell.
- Generous 20–28px card padding, 16–24px gaps, strong section spacing and a
  clear first focal point.
- Content is asymmetric: a large narrative card beside a smaller preview or
  dark callout. Lists use generous row height and simple dark rules.
- Mobile: one column, full-width cards, 16px page gutters, 44px minimum
  controls; the dark frame becomes a compact top bar.

## Translation to LevelBreak Arena

The Landing page becomes the reference dashboard: a cream workspace inside a
charcoal frame, a large Kodchasan headline with a coral accent, three pastel
stat cards, and a yellow “arena preview” card carrying level progress and a
dark Agent Zeta mini-card. The Lobby maps the course-card grid to colored
funded-session cards, using yellow for demo runs and lilac/sky for external
agent questions. The Game screen maps the course-detail composition to a large
yellow/sky scenario card with dark decision rows and a right-hand progress
rail; the Agent Request uses a lilac agent identity card, dark verified chips
and coral submit action. Payout and History use cream cards with dark receipt
blocks and distinct green/amber/coral state chips; the Fiat Off-Ramp is a
cream modal with a yellow currency selector and coral confirmation. The Agents
directory extends the bento language into pastel agent cards with dark
`Verified MCP` pills. Loading, empty, error and 404 states reuse the same
cream-card, dark-outline and coral/yellow accent system rather than falling
back to generic dark panels.

## Implementation status (10 November 2026)

Applied across `apps/web/` in Phase 14. The Tailwind v4 theme lives in
`apps/web/src/index.css`; shared primitives are in
`apps/web/src/components/ui.tsx`. All routes, states and modals were restyled
without changing backend, API, schema, auth, payment/treasury, MCP/agent API or
LLM behavior. Verification and screenshots are recorded in `../docs/AI_HANDOFF.md`,
`docs/TESTING.md` and `test-results/phase14/`.
