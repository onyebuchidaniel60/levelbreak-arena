# Nimiq Mini Apps Competition — Submission Draft

**Category:** Earn  
**Working description (under 250 words):**

LevelBreak Arena turns DeFi learning into a short, consequence-driven game. Players make choices in five simulated scenarios—stablecoin peg risk, impermanent loss, high-yield sustainability, oracle manipulation, and liquidation cascades—and see how each decision affects a virtual portfolio. At each level-up, an LLM-assisted agent (with a scripted fallback) presents a judgment task with evidence attached. Players can answer or skip; each accepted response earns a small fixed NIM reward.

A session is made available only after its NIM funding transaction has been verified on-chain. When the player finishes, the backend calculates rewards from the recorded responses and sends an ordinary NIM transfer from the operator treasury to the player's Nimiq wallet. The MVP uses an LLM-assisted, operator-controlled requester and an operator-controlled treasury, not an independent external AI agent or trustless escrow, and discloses that limitation. A fiat off-ramp modal demonstrates the flow but moves no fiat. Learning scenarios are simulated and never place real DeFi trades.

LevelBreak Arena uses Nimiq Pay wallet integration and NIM transactions as part of the core experience. It is designed for short, repeatable sessions that make DeFi risk concepts easier to understand through consequences rather than passive reading.

## Before submission

- Verify actual public deployment and Nimiq Pay open flow.
- Replace this draft with final facts if implementation changes.
- Do not claim real external agent payments, trustless escrow, real-time evidence, or mainnet payout unless demonstrated and true.
- Confirm category selection, 250-word limit, public GitHub repository and MIT license in the live submission portal.
