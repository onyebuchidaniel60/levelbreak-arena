export const CONQUEST_XP = 100;
export const AGENT_REWARD_LUNA = 500;

export type PlanetDef = {
  id: number;
  name: string;
  epithet: string;
  blurb: string;
  body: string;
  spot: string;
  ring: string;
  halo: string;
  moon: string;
  size: number;
  locked: boolean;
};

export const PLANETS: readonly PlanetDef[] = [
  {
    id: 1,
    name: "Xylos",
    epithet: "Toxic Bloom World",
    blurb:
      "A lime-lit greenhouse planet where eighteen teachers guard the Agent's sealed core.",
    body: "#b8ff3d",
    spot: "#f1ffd0",
    ring: "#ff4ecd",
    halo: "#d4ff5a",
    moon: "#62ffd1",
    size: 0.95,
    locked: false,
  },
  {
    id: 2,
    name: "Kepler-9",
    epithet: "Neon Relay",
    blurb: "A pink relay world humming with abandoned transmissions.",
    body: "#ff75c8",
    spot: "#ffe0f5",
    ring: "#4cf4ff",
    halo: "#ff4ecd",
    moon: "#ffe66d",
    size: 0.55,
    locked: true,
  },
  {
    id: 3,
    name: "Crimson Nebula",
    epithet: "Ember Expanse",
    blurb: "An orange furnace wrapped in a burning dust belt.",
    body: "#ff8a4c",
    spot: "#ffd166",
    ring: "#c6ff4a",
    halo: "#ff6b4a",
    moon: "#ffd166",
    size: 0.6,
    locked: true,
  },
  {
    id: 4,
    name: "Azure Reach",
    epithet: "Tidal Archive",
    blurb: "A cyan ocean world storing the galaxy's oldest ledgers.",
    body: "#55d7ff",
    spot: "#d8fcff",
    ring: "#8b5cf6",
    halo: "#4cf4ff",
    moon: "#ff75c8",
    size: 0.55,
    locked: true,
  },
  {
    id: 5,
    name: "Violet Forge",
    epithet: "Deep Foundry",
    blurb: "A violet pressure world where the teachers forge their tests.",
    body: "#9b6cff",
    spot: "#e8ddff",
    ring: "#ff4ecd",
    halo: "#8b5cf6",
    moon: "#ffd166",
    size: 0.5,
    locked: true,
  },
  {
    id: 6,
    name: "Solaris Drift",
    epithet: "Gilded Current",
    blurb: "A golden gas giant caught in a slow, bright orbit.",
    body: "#ffce4a",
    spot: "#fff2b0",
    ring: "#ff9f45",
    halo: "#ffd166",
    moon: "#62ffd1",
    size: 0.48,
    locked: true,
  },
  {
    id: 7,
    name: "Ghost Moon",
    epithet: "Pale Signal",
    blurb: "A mint-white moon that answers only in whispers.",
    body: "#d7ffef",
    spot: "#ffffff",
    ring: "#ff79c8",
    halo: "#b8ffb0",
    moon: "#ff4ecd",
    size: 0.46,
    locked: true,
  },
  {
    id: 8,
    name: "Emberfall",
    epithet: "Cinder Crown",
    blurb: "A red cinder world with a crown of glowing rock.",
    body: "#ff6b4a",
    spot: "#ffe0c2",
    ring: "#ffce4a",
    halo: "#ff4e6a",
    moon: "#c6ff4a",
    size: 0.44,
    locked: true,
  },
  {
    id: 9,
    name: "Nimbus Vale",
    epithet: "Lavender Hush",
    blurb: "A soft violet world where risk models learn to breathe.",
    body: "#c1b3ff",
    spot: "#f1edff",
    ring: "#4cf4ff",
    halo: "#b18cff",
    moon: "#ffd166",
    size: 0.45,
    locked: true,
  },
  {
    id: 10,
    name: "Onyx Spire",
    epithet: "Black Lantern",
    blurb: "A dark obsidian world lit by a single amber tower.",
    body: "#6d50b8",
    spot: "#a78bfa",
    ring: "#ff9f45",
    halo: "#8b5cf6",
    moon: "#ffe66d",
    size: 0.45,
    locked: true,
  },
  {
    id: 11,
    name: "Prismata",
    epithet: "Signal Prism",
    blurb: "A turquoise prism that splits one signal into eleven.",
    body: "#3df5d0",
    spot: "#d9fff8",
    ring: "#ff4ecd",
    halo: "#62ffd1",
    moon: "#ff75c8",
    size: 0.42,
    locked: true,
  },
  {
    id: 12,
    name: "Eventide",
    epithet: "Last Horizon",
    blurb: "The final pink horizon before the spiral goes dark.",
    body: "#ff5cb8",
    spot: "#ffe4ff",
    ring: "#ffd166",
    halo: "#ff4ecd",
    moon: "#8b5cf6",
    size: 0.45,
    locked: true,
  },
] as const;

export type TeacherTier = 1 | 2 | 3 | 4;

export const TIER_META: Record<
  TeacherTier,
  { label: string; color: string; soft: string }
> = {
  1: { label: "INITIATE", color: "#b8ff3d", soft: "rgba(184, 255, 61, 0.14)" },
  2: { label: "ADEPT", color: "#b18cff", soft: "rgba(177, 140, 255, 0.16)" },
  3: { label: "MASTER", color: "#ff9f45", soft: "rgba(255, 159, 69, 0.16)" },
  4: { label: "SOVEREIGN", color: "#ff4ecd", soft: "rgba(255, 78, 205, 0.16)" },
};

export type TeacherQuestion = {
  prompt: string;
  options: readonly [string, string, string];
  correctIndex: number;
  explanation: string;
};

export type Teacher = {
  id: number;
  name: string;
  role: string;
  tier: TeacherTier;
  xp: number;
  question: TeacherQuestion;
};

export const TEACHERS: readonly Teacher[] = [
  {
    id: 1,
    name: "Initiate Zor",
    role: "Peg Watcher",
    tier: 1,
    xp: 4,
    question: {
      prompt:
        "A new stablecoin offers 14% APY and publishes no reserve attestations. What is the sound risk read?",
      options: [
        "Move in — 14% APY proves strong demand.",
        "Treat it as risky until reserves and peg history are verifiable.",
        "The APY removes peg risk entirely.",
      ],
      correctIndex: 1,
      explanation:
        "Advertised yield is not collateral. Missing attestations and an untested peg are material risks.",
    },
  },
  {
    id: 2,
    name: "Acolyte Mira",
    role: "Pool Reader",
    tier: 1,
    xp: 4,
    question: {
      prompt:
        "ETH rises 30% while your ETH/USDT pool rebalances through trades. What should you expect versus simply holding?",
      options: [
        "Fee income always beats a direct hold.",
        "Divergence loss can leave the pool below a direct hold.",
        "The pool always tracks a 50/50 hold.",
      ],
      correctIndex: 1,
      explanation:
        "Fees can offset, but do not eliminate, impermanent loss when pool composition changes.",
    },
  },
  {
    id: 3,
    name: "Scout Tarn",
    role: "Swap Runner",
    tier: 1,
    xp: 5,
    question: {
      prompt:
        "You swap $50k into a pool with only $120k of liquidity. What is the main execution risk?",
      options: [
        "The pool's price impact can worsen your execution price.",
        "Slippage disappears above $10k.",
        "Only network gas fees affect the result.",
      ],
      correctIndex: 0,
      explanation:
        "Large orders move the pool ratio. Thin liquidity means more price impact and worse execution.",
    },
  },
  {
    id: 4,
    name: "Adept Sable",
    role: "Bridge Warden",
    tier: 1,
    xp: 5,
    question: {
      prompt:
        "A wrapped asset is minted by an unaudited bridge controlled by a 3-of-5 multisig. Which risk dominates?",
      options: [
        "A wrapped asset inherits the bridge's custody and key risk.",
        "Wrapping removes counterparty risk.",
        "The multisig makes the bridge risk-free.",
      ],
      correctIndex: 0,
      explanation:
        "A wrapped token is only as safe as the bridge that can mint and redeem it.",
    },
  },
  {
    id: 5,
    name: "Sentinel Rook",
    role: "Oracle Guard",
    tier: 1,
    xp: 6,
    question: {
      prompt:
        "A lending market prices collateral from one low-liquidity spot pool. What attack becomes cheap?",
      options: [
        "A thin market can be pushed to trigger unfair liquidations.",
        "A spot price cannot be manipulated.",
        "Oracles only affect gas prices.",
      ],
      correctIndex: 0,
      explanation:
        "Low-liquidity spot prices are easy to push. That can turn a healthy position into a liquidation target.",
    },
  },
  {
    id: 6,
    name: "Warden Kael",
    role: "Leverage Breaker",
    tier: 2,
    xp: 6,
    question: {
      prompt:
        "A position uses 3x leverage. Ignoring fees, roughly how far can the collateral price fall before equity is wiped out?",
      options: ["About 33%.", "About 3%.", "About 90%."],
      correctIndex: 0,
      explanation:
        "At 3x leverage, roughly one third of the collateral value is your equity. A one-third drop erases it.",
    },
  },
  {
    id: 7,
    name: "Seer Lyra",
    role: "Yield Reader",
    tier: 2,
    xp: 7,
    question: {
      prompt:
        "A farm quotes 500% APY in a newly forked token with thin liquidity. What should you inspect first?",
      options: [
        "The emissions schedule and where the yield is funded from.",
        "The quality of the landing-page animation.",
        "Nothing — the highest APY is the safest.",
      ],
      correctIndex: 0,
      explanation:
        "Unsustainable emissions can transfer your principal rather than pay real income.",
    },
  },
  {
    id: 8,
    name: "Master Orin",
    role: "Vault Smith",
    tier: 2,
    xp: 8,
    question: {
      prompt:
        "A dapp asks for an unlimited token approval. What is the safe default?",
      options: [
        "Approve only what is needed and revoke unused allowances.",
        "Unlimited approvals reduce risk.",
        "An approval can never move tokens.",
      ],
      correctIndex: 0,
      explanation:
        "Allowances are standing permission. Limit them, and revoke them when the interaction is over.",
    },
  },
  {
    id: 9,
    name: "Huntress Vega",
    role: "Liquidity Hunter",
    tier: 2,
    xp: 9,
    question: {
      prompt:
        "A pool shows $20M TVL, but $18M belongs to a single wallet. What is the key risk?",
      options: [
        "One large exit can remove liquidity and spike slippage.",
        "High TVL always means deep liquidity.",
        "TVL and execution price are unrelated.",
      ],
      correctIndex: 0,
      explanation:
        "Concentrated TVL can vanish in one transaction. Depth matters more than the headline number.",
    },
  },
  {
    id: 10,
    name: "Overlord Nyx",
    role: "Governance Eye",
    tier: 2,
    xp: 10,
    question: {
      prompt:
        "A protocol can be upgraded by one admin key with no timelock. What risk should you flag?",
      options: [
        "A single admin can change or drain the contracts.",
        "An audit makes admin keys impossible.",
        "Only voter turnout matters.",
      ],
      correctIndex: 0,
      explanation:
        "Centralized upgrade power is a real counterparty risk, even when the bytecode was audited.",
    },
  },
  {
    id: 11,
    name: "Oracle Sera",
    role: "Rate Keeper",
    tier: 3,
    xp: 11,
    question: {
      prompt:
        "A vault advertises 12% APR compounded monthly. Which statement is correct?",
      options: [
        "Compounding makes APY higher than 12% APR.",
        "APR and APY are always identical.",
        "APY is always lower than APR.",
      ],
      correctIndex: 0,
      explanation:
        "Monthly compounding lifts a 12% APR to roughly 12.68% APY, before fees or risk.",
    },
  },
  {
    id: 12,
    name: "Sentinel Dax",
    role: "MEV Hunter",
    tier: 3,
    xp: 12,
    question: {
      prompt:
        "A large swap goes through the public mempool with a wide slippage tolerance. What is the main risk?",
      options: [
        "Sandwich and MEV extraction can worsen execution.",
        "The trade becomes private by default.",
        "Slippage settings cannot change execution.",
      ],
      correctIndex: 0,
      explanation:
        "Public intent plus loose slippage invites bots to trade around the transaction.",
    },
  },
  {
    id: 13,
    name: "Archon Pell",
    role: "Risk Binder",
    tier: 3,
    xp: 12,
    question: {
      prompt:
        "A 200% APY farm pays rewards by inflating its own token. What is the sustainability question?",
      options: [
        "Does demand persist after emissions stop?",
        "Is the APY number large enough?",
        "How fast does the page load?",
      ],
      correctIndex: 0,
      explanation:
        "Emissions can manufacture yield until the token inflates away. Ask where real demand comes from.",
    },
  },
  {
    id: 14,
    name: "Warden Echo",
    role: "Liquidation Wing",
    tier: 3,
    xp: 14,
    question: {
      prompt:
        "A position has a 75% loan-to-value ratio. Why is it exposed to liquidation?",
      options: [
        "A modest collateral drawdown can cross the liquidation threshold.",
        "LTV has no bearing on liquidation.",
        "Liquidation requires a missed monthly payment.",
      ],
      correctIndex: 0,
      explanation:
        "High LTV leaves a thin equity buffer. Small price moves can force a collateral sale.",
    },
  },
  {
    id: 15,
    name: "Master Vex",
    role: "Treasury Keeper",
    tier: 3,
    xp: 15,
    question: {
      prompt:
        "A reward pool sits in one operator wallet while a database says the funds are reserved. What does that mean?",
      options: [
        "You rely on operator custody and honest settlement.",
        "The database row locks funds on-chain.",
        "The pool is trustless HTLC escrow.",
      ],
      correctIndex: 0,
      explanation:
        "Database reservations are accounting. Custody remains with the operator unless a trustless mechanism exists.",
    },
  },
  {
    id: 16,
    name: "Oracle Vey",
    role: "Rebase Seer",
    tier: 4,
    xp: 16,
    question: {
      prompt:
        "A rebasing token changes supply to defend its peg. What risk should you check?",
      options: [
        "Reflexive supply changes can distort price and liquidity.",
        "Rebases guarantee a stable redemption value.",
        "Only gas fees are affected.",
      ],
      correctIndex: 0,
      explanation:
        "Rebases can create feedback loops in price and liquidity; the peg is not guaranteed by supply changes.",
    },
  },
  {
    id: 17,
    name: "Archmage Sol",
    role: "Market Shade",
    tier: 4,
    xp: 18,
    question: {
      prompt:
        "Your entire portfolio sits in one 400% APY farm. What is the first risk control?",
      options: [
        "Size and diversify the position before chasing yield.",
        "Borrow more to maximize the APY.",
        "Concentration increases safety.",
      ],
      correctIndex: 0,
      explanation:
        "Position sizing and diversification cap the damage if the farm, token or contract fails.",
    },
  },
  {
    id: 18,
    name: "Overseer Nova",
    role: "The Last Teacher",
    tier: 4,
    xp: 25,
    question: {
      prompt:
        "Which combination most clearly signals a risky DeFi opportunity?",
      options: [
        "Unaudited contracts, concentrated liquidity, emissions-funded yield.",
        "Long audit history, deep liquidity, transparent emissions.",
        "A high APY number by itself.",
      ],
      correctIndex: 0,
      explanation:
        "Risk stacks. Weak contracts, thin depth and artificial yield are stronger together than any single number.",
    },
  },
] as const;

export type AgentEvidenceLine = string;

export const AGENT = {
  context: "Scripted demo requester · Xylos core breach",
  confidence: "medium",
  message:
    "You cracked the seal. Before the core settles, give me one last risk read on this simulated stablecoin. There is no hidden correct answer.",
  evidence: {
    type: "data_card" as const,
    title: "Unsealed stablecoin telemetry",
    lines: [
      "New token: 12% advertised APY",
      "Established token: long operating history in the simulation",
      "Reserve attestations for the new token: none shown",
    ],
  },
  question: "How would you classify the new 12% APY stablecoin?",
  options: [
    {
      key: "SAFE",
      label: "Safe enough",
      description: "The advertised yield justifies moving the balance.",
    },
    {
      key: "RISKY",
      label: "Risky",
      description: "The untested peg and missing attestations are material risks.",
    },
    {
      key: "CANT_TELL",
      label: "Can't tell",
      description: "The evidence is not sufficient to classify it.",
    },
  ],
} as const;

export const PHASE5_REFERENCE = {
  txHash:
    "139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4",
  amountLuna: 1_000,
  block: 15_838_771,
  network: "Nimiq Testnet · network 5",
  explorerUrl:
    "https://test.nimiq.watch/#139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4",
} as const;

export function teacherAccent(tier: TeacherTier): string {
  return TIER_META[tier].color;
}

export function formatLuna(luna: number): string {
  return luna.toLocaleString("en-US");
}

export function lunaToNim(luna: number): string {
  return (luna / 100_000).toFixed(3);
}
