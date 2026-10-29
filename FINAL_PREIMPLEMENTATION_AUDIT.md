# Final Pre-Implementation Audit — LevelBreak Arena

**Audit date:** 29 October 2026  
**Status:** Blueprint review complete; implementation and testnet proof have not started.

## Resolved conflicts and assumptions

1. **HTLC removed from MVP.** The product previously described HTLC payout as locked; that is superseded. The MVP uses ordinary NIM funding into a treasury and ordinary treasury transfers to players.
2. **No claim of trustless escrow.** Incoming funds are held by the operator treasury. Database reservations do not constrain the blockchain. The UI, README, submission and demo must disclose the operator-controlled payout model.
3. **Scripted requester is not a real AI agent.** For MVP demonstration, the demo-agent wallet and treasury are separate but both controlled by the operator. Say the requester is scripted and the testnet funding transaction demonstrates the flow; do not claim independent agent payments.
4. **Funding gate is real.** No client-only flag can activate a session. The backend must verify the exact on-chain transaction, network, sender, treasury destination, amount, and fixed `LBA1:<publicRef>` data reference. If the selected Nimiq library cannot set or read the reference as required, stop and report rather than silently change matching semantics.
5. **Reward/session-count conflict resolved.** The accepted earlier example of ten questions conflicts with the locked three-level game. Preserve three levels and one consultation per level: 500 Luna per accepted response; skip zero; maximum 1,500 Luna per session. Do not add seven more consultations without a new product decision.
6. **Wallet identity is not device identity.** Use a Nimiq-signed nonce challenge. Device ID can be an optional anti-abuse signal later, never an auth key.
7. **Payout proof is an external dependency.** Current docs describe ordinary basic NIM transfers and a Web Client transaction path, but this repository has not proved key loading, transaction construction, signing, broadcast, and inclusion verification. Phase 2 is a hard gate before payment integration.
8. **No test evidence invented.** The package reports no application tests and no funding/payout transaction yet. `AI_HANDOFF.md` accurately records `NOT YET DEPLOYED` and `NONE` for URL/commit.
9. **Mainnet is not a preview option.** Preview and development use testnet-only keys; mainnet requires explicit operator approval and separate security/treasury review.
10. **Final visual design is pending.** The temporary shell must not be polished prematurely. The agent must wait for explicit approval after presenting reference-informed mockups.
11. **Docs and public-source requirements.** A public GitHub repository under MIT is required for this competition. The final footer can link to GitHub and Documentation only after actual URLs exist. No URL is fabricated in this package.

## Security and correctness checks

- [x] Server-authoritative game decisions and reward math defined.
- [x] Amounts represented as integer Luna; fixed reward and cap documented.
- [x] Unique funding hash and one-session association defined.
- [x] Single funded session assigned to one player run.
- [x] Unique response per question and reward ledger entry defined.
- [x] Unique payout per player run and outbox/reconciliation path defined.
- [x] Client-provided reward, recipient, transaction state and ownership IDs are not trusted.
- [x] Auth nonce is single-use, expires, and binds origin/address.
- [x] Device identifier explicitly excluded as authentication.
- [x] Treasury/demo-agent keys server-only and separated.
- [x] Preview testnet-only; mainnet sending disabled by default.
- [x] Loading/empty/error/success/pending/confirmed/denied/not-found states included in UI plan.
- [x] Early preview deploy, E2E gate, mockup phase, explicit approval gate, final docs/footer and release phases sequenced.
- [x] All core handoff docs contain stop/verify requirements.

## Known blockers that must be tested during implementation

- `@nimiq/core` client initialization and key format in the chosen Node 24 LTS/Render environment.
- Ordinary transfer signing/broadcast/verification from the backend on Nimiq testnet.
- Incoming transaction-data reference support and verified retrieval.
- Nimiq Pay wallet signature authentication in the actual WebView.
- Funding/session and payout reconciliation during network/database restarts.
- Current competition registration/submission portal and final category/description constraints before submission.

These are implementation integration checks, not unresolved product choices. Any blocker must be reported with evidence; it must not be hidden by mock “success.”

## Final decision

The blueprint is ready to hand to an implementation agent **for repository inspection and Phase 1 only**. It is not evidence that a deployed product, real agent integration, or payout path already works.
