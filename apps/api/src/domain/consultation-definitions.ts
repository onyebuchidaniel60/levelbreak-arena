export type EvidenceType =
  | "image"
  | "data_card"
  | "text_snippet"
  | "scenario_card";

export type ConsultationEvidence =
  | {
      type: "data_card";
      title: string;
      lines: readonly string[];
    }
  | {
      type: "text_snippet";
      title: string;
      text: string;
      sourceLabel: string;
    }
  | {
      type: "scenario_card";
      title: string;
      lines: readonly string[];
    }
  | {
      type: "image";
      title: string;
      src: string;
      alt: string;
    };

export type ConsultationOption = {
  key: "SAFE" | "RISKY" | "CANT_TELL";
  label: string;
  description: string;
};

export type ConsultationQuestion = {
  id: string;
  levelIndex: 1 | 2 | 3;
  version: string;
  evidenceVersion: string;
  agentContext: string;
  agentConfidence: "low" | "medium" | "high";
  agentMessage: string;
  /** Evidence is intentionally ordered before the question. */
  evidence: ConsultationEvidence;
  question: string;
  options: readonly ConsultationOption[];
  rewardLuna: bigint;
};

export const CONSULTATION_QUESTIONS: readonly ConsultationQuestion[] = [
  {
    id: "l1-stablecoin-peg",
    levelIndex: 1,
    version: "1",
    evidenceVersion: "evidence-2026-11-01",
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
    rewardLuna: 500n,
  },
  {
    id: "l2-impermanent-loss",
    levelIndex: 2,
    version: "1",
    evidenceVersion: "evidence-2026-11-01",
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
        description: "Divergence loss can reduce the value versus holding the assets.",
      },
      {
        key: "CANT_TELL",
        label: "Can't tell",
        description: "The evidence is not sufficient to classify it.",
      },
    ],
    rewardLuna: 500n,
  },
  {
    id: "l3-yield-sustainability",
    levelIndex: 3,
    version: "1",
    evidenceVersion: "evidence-2026-11-01",
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
        description: "The advertised yield is adequate evidence of sustainability.",
      },
      {
        key: "RISKY",
        label: "Risky",
        description: "The unaudited fork and thin rewards liquidity are material risks.",
      },
      {
        key: "CANT_TELL",
        label: "Can't tell",
        description: "The evidence is not sufficient to classify it.",
      },
    ],
    rewardLuna: 500n,
  },
];

export function getQuestionForLevel(levelIndex: number): ConsultationQuestion {
  const question = CONSULTATION_QUESTIONS.find(
    (item) => item.levelIndex === levelIndex,
  );
  if (!question) {
    throw new Error(`No consultation configured for level ${levelIndex}`);
  }
  return question;
}

export function getQuestionById(questionId: string): ConsultationQuestion | null {
  return (
    CONSULTATION_QUESTIONS.find((item) => item.id === questionId) ?? null
  );
}

export function isAllowedAnswer(
  question: ConsultationQuestion,
  answerKey: string,
): boolean {
  return question.options.some((option) => option.key === answerKey);
}
