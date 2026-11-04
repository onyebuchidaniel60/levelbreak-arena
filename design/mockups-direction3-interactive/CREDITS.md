# Credits and asset sources

## Planet textures

- `public/assets/planet-active.jpg` — `earth_atmos_2048.jpg` from the public
  three.js examples repository (`examples/textures/planets`). Earth imagery is
  NASA-derived; retrieved from the exact URL supplied by the operator.
- `public/assets/planet-locked2.jpg` — `moon_1024.jpg` from the same three.js
  examples directory.
- `public/assets/planet-locked1.jpg` — the operator-supplied three.js URL for
  `mars_1k_color.jpg` returned HTTP 404 and a 14-byte text body on every tested
  branch/tag. The replacement is a real Mars equirectangular map from
  **Solar System Scope**, downloaded from
  <https://www.solarsystemscope.com/textures/download/2k_mars.jpg>.
  - Source: Solar System Scope / INOVE, <https://www.solarsystemscope.com/textures/>
  - License: Creative Commons Attribution 4.0 International (CC BY 4.0),
    <https://creativecommons.org/licenses/by/4.0/>
  - The texture is used unmodified except for runtime tinting and lighting in the
    Three.js material.

The other operator-supplied reference images in `design/references/` are
third-party screenshots for local design review and are intentionally not
committed to the public repository.

## Fonts

Self-hosted through Fontsource:

- **Space Grotesk** — Florian Karsten, SIL Open Font License 1.1.
- **JetBrains Mono** — JetBrains, SIL Open Font License 1.1.

## Icons

- **Lucide** — ISC License, <https://lucide.dev/>.

## Design guidance

- **stageshow** skill by benjitaylor, installed locally at
  `.agents/skills/stageshow/` for framing, hierarchy and composition guidance.
  It is not copied into the prototype or committed.

## Software

- React, TypeScript, Vite, Three.js, `@react-three/fiber`,
  `@react-three/drei`, Playwright.
- Phase 5 payout reference data comes from the project's own
  `AI_HANDOFF.md`: payout `dcab12c0-b19c-4eeb-951b-7918e5a459a6`,
  tx `139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4`,
  block `15,838,771`, 1,000 Luna, confirmed on testnet.
