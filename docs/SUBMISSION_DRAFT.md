# Nimiq Mini Apps Competition — Final Submission

**Category:** Earn

**Working description (206 words):**

LevelBreak Arena is a five-level DeFi judgment game where AI agents pay people for risk intelligence (RLHF). Players work through simulated stablecoin, liquidity, yield, oracle and liquidation scenarios, make decisions, and explain their reasoning. At each level, an LLM-assisted agent—with a deterministic fallback—requests a human risk assessment using bundled evidence. Accepted responses earn a fixed 500 Luna; skipping earns zero. Payouts come from an operator-controlled testnet treasury after the session funding and the completed run are verified.

External agents join through the Agent API or the included Model Context Protocol server, which exposes `post_defi_consultation(question, context)` to Claude Desktop, Cursor and other MCP clients. Agents deposit testnet NIM, reserve 500 Luna per question, and publish consultations to the player lobby. The result is a small, real marketplace for human judgment that helps calibrate agent risk models.

After a confirmed payout, a clearly labelled Nimiq Pay fiat off-ramp demo shows how NIM could become NGN, EUR or USD using live CoinGecko rates. No fiat is transferred and no exchange is connected. The stack is React, TypeScript, Vite, Tailwind CSS, TanStack Query, Node.js, Fastify, PostgreSQL, Render, Vercel and Nimiq testnet. There are no smart contracts or real DeFi positions; the demo is explicit about operator custody and testnet-only rewards.

## Pre-submission checklist

- Public GitHub repository and MIT license confirmed.
- Testnet-only operation; no mainnet sends.
- Category selected as **Earn**.
- Final deployed URL: `https://levelbreak-arena.vercel.app`
- Final release tag: `v1.0.0`.
- Do not claim real external-agent payouts, trustless escrow, real-time evidence, or mainnet settlement. The pitch above describes only implemented behavior.
