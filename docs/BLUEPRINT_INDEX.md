# LevelBreak Arena — Blueprint Index

Prepared 29 October 2026. This package contains the complete product/implementation blueprint and the core files intended for a coding agent. No application code has been generated.

## Requested final-output mapping

| Requested section | Source of truth |
|---|---|
| 1. Product definition | `PROJECT_SPEC.md` §1 |
| 2. MVP scope | `PROJECT_SPEC.md` §2 |
| 3. User roles | `PROJECT_SPEC.md` §3 |
| 4. User flows | `PROJECT_SPEC.md` §4 |
| 5. Functional requirements | `PROJECT_SPEC.md` §5 |
| 6. Business logic/state machines | `PROJECT_SPEC.md` §6 |
| 7. Data model and relationships | `PROJECT_SPEC.md` §7 |
| 8. System architecture | `ARCHITECTURE.md` §§1–4 |
| 9. Technology stack | `ARCHITECTURE.md` §2; `PROJECT_SPEC.md` §9 |
| 10. API specification | `ARCHITECTURE.md` §§5–7 |
| 11. Database operations | `ARCHITECTURE.md` §8; `PROJECT_SPEC.md` §11 |
| 12. Authentication/authorization | `ARCHITECTURE.md` §10; `PROJECT_SPEC.md` §12 |
| 13. Security architecture | `PROJECT_SPEC.md` §13; `docs/SECURITY.md` |
| 14. UI/UX structure | `PROJECT_SPEC.md` §14 |
| 15. Reference/mockup/approval gate | `PROJECT_SPEC.md` §15; `docs/DESIGN_DECISIONS.md` |
| 16. Third-party integrations | `PROJECT_SPEC.md` §16; `ARCHITECTURE.md` §§3, 11 |
| 17. AI architecture | `PROJECT_SPEC.md` §17 |
| 18. Payment architecture | `PROJECT_SPEC.md` §18; `ARCHITECTURE.md` §§3, 8 |
| 19. Admin/operations | `PROJECT_SPEC.md` §19; `docs/OPERATIONS.md` |
| 20. Error/edge-case matrix | `PROJECT_SPEC.md` §20 |
| 21. Test strategy | `PROJECT_SPEC.md` §21; `docs/TESTING.md` |
| 22. Repository structure | `PROJECT_SPEC.md` §22 |
| 23. Environment variables | `PROJECT_SPEC.md` §23; `ARCHITECTURE.md` §13 |
| 24. Phased implementation plan | `IMPLEMENTATION_PLAN.md` |
| 25. `PROJECT_SPEC.md` | Actual file included |
| 26. `ARCHITECTURE.md` | Actual file included |
| 27. `IMPLEMENTATION_PLAN.md` | Actual file included |
| 28. `AGENTS.md` | Actual file included |
| 29. `AI_HANDOFF.md` | Actual file included |
| 30. Final pre-implementation audit | `FINAL_PREIMPLEMENTATION_AUDIT.md` |

## Decisions locked for implementation

1. **No HTLC in the MVP.** The chosen flow is ordinary NIM funding into an operator-controlled treasury and ordinary treasury payout to the player.
2. **Funded before available.** A scripted requester session does not appear as playable until its incoming NIM transfer is verified on-chain.
3. **Scripted requester in MVP.** There is no live LLM or independent external agent; the demo-agent wallet is controlled by the operator and is separate from the treasury wallet.
4. **Treasury custody is disclosed.** The database reserve does not create on-chain escrow. Player payouts depend on operator treasury and backend.
5. **Three questions maximum.** Preserve the locked three-level game rather than quietly expand to ten questions. One consultation per level; answer reward 500 Luna; skip zero; max liability 1,500 Luna (0.015 NIM) per funded session.
6. **Auth is wallet signature-based, not device-ID-based.** Device identifier may not be treated as user identity.
7. **The backend ordinary-transfer adapter is an early hard gate.** The official Web Client documentation supports normal transaction construction/signing/broadcast, but the actual deployed testnet flow must be proven before payment functionality is accepted.
8. **Testnet only during development/preview.** Mainnet use requires separate explicit operator approval and security/treasury review.
9. **No final visual design has been approved.** The coding agent must complete functionality, pass E2E, create references/mockups, and stop for explicit operator approval.
10. **No fake URLs or evidence.** Repository, preview, transaction, Docs and GitHub links must be actual verified destinations; current URL fields explicitly say not yet deployed/not provided.

| Competition submission copy | `docs/SUBMISSION_DRAFT.md` (must be updated to match the shipped product) |

## Official references checked on 29 October 2026

- Nimiq Mini Apps: https://nimiq.dev/mini-apps
- Nimiq Provider API: https://nimiq.dev/mini-apps/api-reference/nimiq-provider
- Nimiq Web Client: https://nimiq.dev/web-client
- Nimiq Client reference: https://nimiq.dev/web-client/reference/classes/client
- Nimiq Transaction reference: https://nimiq.dev/web-client/reference/classes/transaction
- Nimiq accounts: https://nimiq.dev/protocol/accounts
- Device identifier docs: https://nimiq.dev/mini-apps/features/device-identifier
- Mini App FAQ: https://nimiq.dev/mini-apps/faq
- Competition rules: https://miniappscompetition.com/rules
- Competition scoring: https://miniappscompetition.com/scoring
- Cycle III: https://miniappscompetition.com/cycle3
- Node release schedule: https://nodejs.org/en/about/previous-releases

## Coding agent start point

Read `AGENTS.md` and `AI_HANDOFF.md`, then inspect the repository without modifying files. Report the actual repository structure, scripts, dependencies, existing configuration and deployment state. After operator review, implement **Phase 1 only** from `IMPLEMENTATION_PLAN.md`: produce a route-complete skeletal UI and deploy its safe preview. Report the exact URL and deployed commit. Do not implement NIM funding/payouts and do not apply final visual styling in Phase 1.
