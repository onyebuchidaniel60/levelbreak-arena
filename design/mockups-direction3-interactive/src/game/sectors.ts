import type { Sector } from "./types";

export const REWARD_LUNA = 500;
export const XP_PER_SECTOR = 100;
export const MAX_XP = 300;
export const MAX_REWARD_LUNA = 1_500;
export const STARTING_PORTFOLIO_UNITS = 1_000_000;
export const PORTFOLIO_UNITS_PER_VUSDT = 1_000;

export const PHASE5_REFERENCE = {
  payoutId: "dcab12c0-b19c-4eeb-951b-7918e5a459a6",
  txHash:
    "139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4",
  amountLuna: 1_000,
  block: 15_838_771,
  recipient: "NQ98 54S9 LBJR JUH9 MKL3 YACQ TD3T JBXJ PHEQ",
  explorerUrl:
    "https://test.nimiq.watch/#139bfc81643ffb410c1f2a179d0d152ab7346f5205f31d99642a1e0e577421e4",
  network: "Nimiq Testnet · network 5",
} as const;

export const SECTORS: readonly Sector[] = [
  {
    index: 1,
    codename: "Peg Frontier",
    title: "Stablecoin peg risk",
    shortTitle: "Peg risk",
    texture: "/assets/planet-active.jpg",
    accent: "#66f5d0",
    atmosphere: "#53ffe0",
    textureTint: "#c9fff4",
    badge: "Peg Navigator",
    scenario: {
      setting: "A simulated wallet holds 1,000 vUSDT.",
      situation:
        "A newly launched stablecoin advertises 12% APY. It is much less established than the stablecoin you already hold.",
      prompt:
        "Do you stay in the established stablecoin or move to the new one?",
    },
    decisions: [
      {
        key: "STAY",
        label: "Stay",
        description: "Keep the simulated balance in the established stablecoin.",
        basisPoints: 10_000,
        explanation:
          "The simulated new token depegs. Staying in the established stablecoin avoids the loss in this scenario.",
        lesson:
          "Higher advertised yield can be compensation for risk you cannot yet see.",
      },
      {
        key: "MOVE",
        label: "Move",
        description: "Move the simulated balance into the new 12% APY token.",
        basisPoints: 8_000,
        explanation:
          "The simulated new token depegs by 20%. The virtual portfolio falls to 800 vUSDT.",
        lesson:
          "Chasing an advertised yield can expose a portfolio to a peg failure.",
      },
    ],
    consultation: {
      agentContext: "Scripted demo requester · simulated stablecoin review",
      agentConfidence: "medium",
      agentMessage:
        "I am reviewing a simulated stablecoin opportunity. Use the evidence, then give me your risk read. There is no hidden correct answer.",
      evidence: {
        type: "data_card",
        title: "Simulated stablecoin facts",
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
    },
  },
  {
    index: 2,
    codename: "Liquidity Belt",
    title: "Liquidity pool & impermanent loss",
    shortTitle: "Impermanent loss",
    texture: "/assets/planet-locked1.jpg",
    accent: "#ffbd6b",
    atmosphere: "#ff9f52",
    textureTint: "#ffd8b0",
    badge: "Pool Diver",
    scenario: {
      setting:
        "The simulated portfolio is allocated to an ETH/USDT liquidity pool.",
      situation:
        "ETH's simulated price rises 30%. The pool rebalances as traders swap against it, so the position does not track a simple 50/50 hold.",
      prompt:
        "Do you stay in the liquidity pool or exit to hold the underlying assets?",
    },
    decisions: [
      {
        key: "STAY",
        label: "Stay in the pool",
        description:
          "Keep providing simulated liquidity and collect simulated fees.",
        basisPoints: 11_200,
        explanation:
          "The pool grows about 12% after fees but underperforms a direct hold because of impermanent loss as the simulated ETH price moves.",
        lesson:
          "Fees can offset, but do not eliminate, divergence loss when pool prices move.",
      },
      {
        key: "EXIT",
        label: "Exit the pool",
        description:
          "Withdraw simulated liquidity and hold the underlying assets.",
        basisPoints: 11_500,
        explanation:
          "Exiting keeps direct exposure to the simulated assets and captures the 30% ETH move on half the portfolio, a 15% gain overall.",
        lesson: "Pool exposure is not the same as holding the underlying assets.",
      },
    ],
    consultation: {
      agentContext: "Scripted demo requester · simulated liquidity review",
      agentConfidence: "medium",
      agentMessage:
        "I am comparing simulated pool exposure with holding the assets directly. Read the evidence before answering.",
      evidence: {
        type: "text_snippet",
        title: "Simulated pool note",
        text: "ETH rises 30% in the simulation. The ETH/USDT pool rebalances through trades. Fees are positive, but the pool's composition changes as the price moves.",
        sourceLabel: "Bundled training scenario · not live market data",
      },
      question:
        "What is the main risk of staying in the pool while the simulated ETH price rises?",
      options: [
        {
          key: "SAFE",
          label: "No material risk",
          description: "Fees always make the pool outperform holding.",
        },
        {
          key: "RISKY",
          label: "Impermanent loss",
          description:
            "Divergence loss can reduce the value versus holding the assets.",
        },
        {
          key: "CANT_TELL",
          label: "Can't tell",
          description: "The evidence is not sufficient to classify it.",
        },
      ],
    },
  },
  {
    index: 3,
    codename: "Yield Reach",
    title: "Yield-farming sustainability",
    shortTitle: "Yield risk",
    texture: "/assets/planet-locked2.jpg",
    accent: "#b8a6ff",
    atmosphere: "#9c86ff",
    textureTint: "#ded8ff",
    badge: "Yield Sentinel",
    scenario: {
      setting: "A simulated farm advertises 400% APY.",
      situation:
        "The farm's documents are thin, its contract is unaudited, and the yield comes from a recently forked rewards token.",
      prompt: "Do you ape into the farm or read the risk disclosures first?",
    },
    decisions: [
      {
        key: "APE",
        label: "Ape in",
        description: "Deposit the simulated portfolio into the 400% APY farm.",
        basisPoints: 4_000,
        explanation:
          "The simulated farm is a rug pull: the rewards token collapses and 60% of the virtual portfolio is lost.",
        lesson:
          "Unsustainable yield can be a transfer of your principal, not income.",
      },
      {
        key: "READ",
        label: "Read first",
        description:
          "Skip the farm and inspect sustainability before committing.",
        basisPoints: 10_000,
        explanation:
          "Reading the disclosures reveals an unaudited fork and an unsustainable rewards source. The simulated portfolio is left unchanged.",
        lesson: "Inspect where yield comes from before committing capital.",
      },
    ],
    consultation: {
      agentContext: "Scripted demo requester · simulated yield review",
      agentConfidence: "medium",
      agentMessage:
        "This simulated farm promises a very high yield. Review the evidence and classify the opportunity.",
      evidence: {
        type: "scenario_card",
        title: "Simulated farm disclosure",
        lines: [
          "Advertised yield: 400% APY",
          "Contract: unaudited fork deployed recently",
          "Rewards: emitted by a new token with thin liquidity",
        ],
      },
      question: "How would you classify the 400% APY farm?",
      options: [
        {
          key: "SAFE",
          label: "Safe enough",
          description:
            "The advertised yield is adequate evidence of sustainability.",
        },
        {
          key: "RISKY",
          label: "Risky",
          description:
            "The unaudited fork and thin rewards liquidity are material risks.",
        },
        {
          key: "CANT_TELL",
          label: "Can't tell",
          description: "The evidence is not sufficient to classify it.",
        },
      ],
    },
  },
];

export function getSector(index: number): Sector {
  const sector = SECTORS.find((item) => item.index === index);
  if (!sector) throw new Error(`Missing sector ${index}`);
  return sector;
}

export function applyBasisPoints(units: number, basisPoints: number): number {
  return Math.round((units * basisPoints) / 10_000);
}

export function formatPortfolio(units: number): string {
  return (
    units / PORTFOLIO_UNITS_PER_VUSDT
  ).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatLuna(luna: number): string {
  return luna.toLocaleString("en-US");
}

export function lunaToNim(luna: number): string {
  return (luna / 100_000).toFixed(3);
}
