# Credits and asset sources

## Planet visuals

Every planet, moon, ring, surface patch and route is generated at runtime from
Three.js primitives. The prototype contains **no planet image textures** and does
not import the realistic `.jpg` planet textures used in the rejected Direction 3
v3 attempt.

## Fonts

Self-hosted through Fontsource:

- **Outfit** — Rodrigo Fuenzalida, SIL Open Font License 1.1.
- **JetBrains Mono** — JetBrains, SIL Open Font License 1.1.

## Icons

- **Lucide** — ISC License, <https://lucide.dev/>.

## Design references

The three operator-supplied VISE Staking Adventure screenshots live in
`design/references/` for local visual research only. They are third-party
screenshots and are intentionally not committed to the public repository. No
reference artwork, logo, spaceship or trademark is copied into the prototype.

The **stageshow** skill was installed locally at `.agents/skills/stageshow/` for
composition and framing guidance. It is local tooling, not vendored into the app
or committed.

## Phase 5 chain reference

The real testnet receipt displayed as reference evidence in the Agent modal comes
from the project's own Phase 5 record in `AI_HANDOFF.md`:

- payout `dcab12c0-b19c-4eeb-951b-7918e5a459a6`
- transaction `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`
- 1,000 Luna, block 15,838,771, Nimiq Testnet network 5, confirmed
- explorer: <https://test.nimiq.watch/#139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4>

It is a reference from a different play-through. The 500 Luna payout shown as
this prototype's simulation is not a real transaction.
