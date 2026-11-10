# LevelBreak Arena — Hackathon Demo Script

**Format:** Problem → Solution → Product demo → Close
**Target duration:** 60–75 seconds
**Voice:** `en-US-ChristopherNeural`
**Music:** “Backed Vibes” by Kevin MacLeod (incompetech.com), CC BY 4.0, mixed at 8% under the voice.

## Narration

### 0:00–0:15 — The problem

> AI agents are getting smarter, but they still lack human intuition. To calibrate their risk models in DeFi, they desperately need human judgment. But how do they pay thousands of people for micro-tasks without getting crushed by gas fees or bots?

### 0:15–0:25 — The solution

> Enter LevelBreak Arena. A DeFi judgment game built on Nimiq, where AI agents pay humans for risk intelligence. Active Missions are funded by external agents, and every session is backed by a verified testnet deposit. Your wallet is authenticated with a signature, not a password.

### 0:25–1:00 — The demo

> Inside a mission, you make a DeFi decision. Then the agent asks for your assessment of the evidence. The question is generated live, with a deterministic fallback. Submit your judgment and earn five hundred Luna, or skip and earn zero.
>
> At the end, the treasury sends testnet NIM directly to your wallet. The fiat off-ramp demo shows how that NIM could become naira, euros or dollars through Nimiq Pay. No real DeFi position, no gas fee on every micro-task, and no bots. Just human judgment, priced and paid on-chain.

### 1:00–1:10 — The close

> LevelBreak Arena. The agent economy needs your judgment.

## Visual sequence

Measured against the 72.144-second voiceover.

| Time | Screen | Action |
|---|---|---|
| 0:00 | Landing | Hold on the Agent Economy headline and problem framing. |
| 0:15 | Landing → Lobby | Click **Enter the Arena** as the voiceover names the product. |
| 0:22 | Lobby | Hold on the external-agent mission and its 500-Luna reward. |
| 0:33 | Game | Claim the mission and show the DeFi scenario. |
| 0:35 | Game | Choose **Hold the established stablecoin** and reveal the consultation. |
| 0:37 | Agent request | Let the AI-generated question finish typing. |
| 0:44 | Agent request | Select **Risky**. |
| 0:45 | Agent request | Click **Provide Assessment & Earn 500 Luna**. |
| 0:48 | Payout | Finish the mission; show **Reward Confirmed** and the confirmed transaction. |
| 0:53 | Fiat modal | Open the off-ramp on NGN. |
| 0:55 | Fiat modal | Switch to EUR, then USD, then back to NGN. |
| 1:04 | Payout → Landing | Close the modal and return to the landing hero. |
| 1:12 | Landing | End on the hero as the closing line finishes. |

## Production notes

- The script contains no personal introduction, name, or “Hi, I’m…” segment.
- The recording uses deterministic mocked API responses at 390×844 so the UI flow is repeatable.
- The final MP4 is assembled with FFmpeg: voiceover input 0, music input 1, Playwright WebM input 2.
- The music is trimmed to the measured voiceover duration and mixed at `volume=0.08` with `normalize=0`.
- The VP9 WebM is transcoded to H.264 (CRF 18, yuv420p) for universal player compatibility; the audio mix is unchanged.
- Voiceover and music assets are local production files and are not committed.
- Music attribution: “Backed Vibes” by Kevin MacLeod (incompetech.com), licensed under Creative Commons Attribution 4.0 (CC BY 4.0).
