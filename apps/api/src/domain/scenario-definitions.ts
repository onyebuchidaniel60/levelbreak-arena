import { applyBasisPoints, assertNonNegativeLuna, lunaString } from "./money";

export const PORTFOLIO_VERSION = "1";
export const STARTING_PORTFOLIO_UNITS = 100_000_000n;

export type ScenarioChoice = {
  key: string;
  label: string;
  description: string;
};

export type ScenarioOutcome = {
  basisPoints: bigint;
  explanation: string;
  lesson: string;
};

export type ScenarioDefinition = {
  id: string;
  version: string;
  levelIndex: 1 | 2 | 3 | 4 | 5;
  title: string;
  setting: string;
  situation: string;
  prompt: string;
  choices: readonly ScenarioChoice[];
  outcomes: Record<string, ScenarioOutcome>;
};

export type ScenarioEvaluation = {
  scenarioId: string;
  scenarioVersion: string;
  levelIndex: number;
  decisionKey: string;
  decisionLabel: string;
  portfolioBefore: string;
  portfolioAfter: string;
  delta: string;
  explanation: string;
  lesson: string;
};

export const SCENARIOS: readonly ScenarioDefinition[] = [
  {
    id: "level-1-stablecoin-peg",
    version: "1",
    levelIndex: 1,
    title: "Level 1 — Stablecoin peg risk",
    setting: "A simulated wallet holds 1,000 vUSDT.",
    situation:
      "A newly launched stablecoin advertises 12% APY. It is much less established than the stablecoin you already hold.",
    prompt: "Do you stay in the established stablecoin or move to the new one?",
    choices: [
      {
        key: "STAY",
        label: "Stay",
        description: "Keep the simulated balance in the established stablecoin.",
      },
      {
        key: "MOVE",
        label: "Move",
        description: "Move the simulated balance into the new 12% APY token.",
      },
    ],
    outcomes: {
      STAY: {
        basisPoints: 10_000n,
        explanation:
          "The simulated new token depegs. Staying in the established stablecoin avoids the loss in this scenario.",
        lesson:
          "Higher advertised yield can be compensation for risk you cannot yet see.",
      },
      MOVE: {
        basisPoints: 8_000n,
        explanation:
          "The simulated new token depegs by 20%. The virtual portfolio falls to 800 vUSDT.",
        lesson:
          "Chasing an advertised yield can expose a portfolio to a peg failure.",
      },
    },
  },
  {
    id: "level-2-impermanent-loss",
    version: "1",
    levelIndex: 2,
    title: "Level 2 — Liquidity pool and impermanent loss",
    setting: "The simulated portfolio is allocated to an ETH/USDT liquidity pool.",
    situation:
      "ETH's simulated price rises 30%. The pool rebalances as traders swap against it, so the position does not track a simple 50/50 hold.",
    prompt: "Do you stay in the liquidity pool or exit to hold the underlying assets?",
    choices: [
      {
        key: "STAY",
        label: "Stay in the pool",
        description: "Keep providing simulated liquidity and collect simulated fees.",
      },
      {
        key: "EXIT",
        label: "Exit the pool",
        description: "Withdraw simulated liquidity and hold the underlying assets.",
      },
    ],
    outcomes: {
      STAY: {
        basisPoints: 11_200n,
        explanation:
          "The pool grows about 12% after fees but underperforms a direct hold because of impermanent loss as the simulated ETH price moves.",
        lesson:
          "Fees can offset, but do not eliminate, divergence loss when pool prices move.",
      },
      EXIT: {
        basisPoints: 11_500n,
        explanation:
          "Exiting keeps direct exposure to the simulated assets and captures the 30% ETH move on half the portfolio, a 15% gain overall.",
        lesson:
          "Pool exposure is not the same as holding the underlying assets.",
      },
    },
  },
  {
    id: "level-3-yield-sustainability",
    version: "1",
    levelIndex: 3,
    title: "Level 3 — Yield-farming sustainability",
    setting: "A simulated farm advertises 400% APY.",
    situation:
      "The farm's documents are thin, its contract is unaudited, and the yield comes from a recently forked rewards token.",
    prompt: "Do you ape into the farm or read the risk disclosures first?",
    choices: [
      {
        key: "APE",
        label: "Ape in",
        description: "Deposit the simulated portfolio into the 400% APY farm.",
      },
      {
        key: "READ",
        label: "Read first",
        description: "Skip the farm and inspect sustainability before committing.",
      },
    ],
    outcomes: {
      APE: {
        basisPoints: 4_000n,
        explanation:
          "The simulated farm is a rug pull: the rewards token collapses and 60% of the virtual portfolio is lost.",
        lesson:
          "Unsustainable yield can be a transfer of your principal, not income.",
      },
      READ: {
        basisPoints: 10_000n,
        explanation:
          "Reading the disclosures reveals an unaudited fork and an unsustainable rewards source. The simulated portfolio is left unchanged.",
        lesson:
          "Inspect where yield comes from before committing capital.",
      },
    },
  },
  {
    id: "level-4-oracle-manipulation",
    version: "1",
    levelIndex: 4,
    title: "Level 4 — Oracle manipulation",
    setting:
      "A simulated lending market values collateral using a single spot price feed.",
    situation:
      "The feed draws from one thin market. A large simulated actor can move that market, and the protocol has no time-weighted average or circuit breaker.",
    prompt:
      "Do you trust the spot feed or verify the oracle design before borrowing?",
    choices: [
      {
        key: "TRUST",
        label: "Trust the feed",
        description:
          "Borrow against the collateral using the single spot price without further checks.",
      },
      {
        key: "VERIFY",
        label: "Verify the oracle",
        description:
          "Check the feed sources, averaging window, fallback and liquidation safeguards first.",
      },
    ],
    outcomes: {
      TRUST: {
        basisPoints: 7_000n,
        explanation:
          "The simulated spot price is pushed down, the position is liquidated at the manipulated price, and the virtual portfolio loses 30%.",
        lesson:
          "A single manipulable price source can turn a safe-looking loan into a forced sale.",
      },
      VERIFY: {
        basisPoints: 10_000n,
        explanation:
          "Verifying the design reveals the single-source feed and missing safeguards. The simulated position is not opened at that price.",
        lesson:
          "Check oracle sources, averaging, fallbacks and circuit breakers before relying on a price.",
      },
    },
  },
  {
    id: "level-5-liquidation-cascade",
    version: "1",
    levelIndex: 5,
    title: "Level 5 — Liquidation cascades",
    setting:
      "The simulated portfolio holds a leveraged ETH position with a thin collateral buffer.",
    situation:
      "ETH falls 15% in the simulation. Liquidations are automated, and the market's liquidity is thin enough that forced selling can push prices further down.",
    prompt:
      "Do you hold through the drawdown or deleverage before the liquidation threshold?",
    choices: [
      {
        key: "HOLD",
        label: "Hold",
        description:
          "Keep the leveraged position and wait for the simulated price to recover.",
      },
      {
        key: "DELEVERAGE",
        label: "Deleverage",
        description:
          "Repay part of the simulated debt or add collateral to restore a buffer.",
      },
    ],
    outcomes: {
      HOLD: {
        basisPoints: 6_500n,
        explanation:
          "The simulated drawdown triggers liquidations, thin liquidity amplifies the move, and the virtual portfolio loses 35%.",
        lesson:
          "Leverage plus thin liquidity can turn a normal drawdown into a reflexive cascade.",
      },
      DELEVERAGE: {
        basisPoints: 9_600n,
        explanation:
          "Deleveraging costs 4% in the simulation but restores a buffer and avoids the liquidation cascade.",
        lesson:
          "A deliberate, small cost to reduce leverage can prevent a much larger forced loss.",
      },
    },
  },
];

export function getScenario(levelIndex: number): ScenarioDefinition {
  const scenario = SCENARIOS.find((item) => item.levelIndex === levelIndex);
  if (!scenario) {
    throw new Error(`No scenario configured for level ${levelIndex}`);
  }
  return scenario;
}

export function evaluateScenario(
  levelIndex: number,
  decisionKey: string,
  portfolioUnits: bigint,
): ScenarioEvaluation {
  const scenario = getScenario(levelIndex);
  const choice = scenario.choices.find((item) => item.key === decisionKey);
  if (!choice) {
    throw new Error(`Decision ${decisionKey} is not allowed at level ${levelIndex}`);
  }
  const outcome = scenario.outcomes[decisionKey];
  if (!outcome) {
    throw new Error(`No outcome configured for ${scenario.id}/${decisionKey}`);
  }
  const before = assertNonNegativeLuna(portfolioUnits, "portfolio");
  const after = applyBasisPoints(before, outcome.basisPoints);
  return {
    scenarioId: scenario.id,
    scenarioVersion: scenario.version,
    levelIndex,
    decisionKey,
    decisionLabel: choice.label,
    portfolioBefore: lunaString(before),
    portfolioAfter: lunaString(after),
    delta: lunaString(after - before),
    explanation: outcome.explanation,
    lesson: outcome.lesson,
  };
}
