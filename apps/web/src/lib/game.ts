export const GAME_LEVELS = [
  {
    index: 1,
    title: "Stablecoin peg",
    concept: "Peg risk",
    summary: "A new stablecoin advertises 12% APY. Stay or move?",
  },
  {
    index: 2,
    title: "Impermanent loss",
    concept: "Liquidity pools",
    summary: "ETH moves 30% while your capital sits in a pool.",
  },
  {
    index: 3,
    title: "Yield sustainability",
    concept: "Farm risk",
    summary: "A 400% APY farm has thin disclosures and an unaudited fork.",
  },
  {
    index: 4,
    title: "Oracle manipulation",
    concept: "Price feeds",
    summary: "A lending market trusts one spot feed with no circuit breaker.",
  },
  {
    index: 5,
    title: "Liquidation cascades",
    concept: "Leverage",
    summary: "A thin collateral buffer meets a 15% drawdown.",
  },
] as const;

export const TOTAL_LEVELS = GAME_LEVELS.length;
