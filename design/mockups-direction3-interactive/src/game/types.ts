export type SectorStatus = "locked" | "active" | "cleared";

export type Evidence =
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
    };

export type Decision = {
  key: string;
  label: string;
  description: string;
  basisPoints: number;
  explanation: string;
  lesson: string;
};

export type ConsultationOption = {
  key: "SAFE" | "RISKY" | "CANT_TELL";
  label: string;
  description: string;
};

export type Consultation = {
  agentContext: string;
  agentConfidence: "low" | "medium" | "high";
  agentMessage: string;
  evidence: Evidence;
  question: string;
  options: readonly ConsultationOption[];
};

export type Sector = {
  index: 1 | 2 | 3;
  codename: string;
  title: string;
  shortTitle: string;
  texture: string;
  accent: string;
  atmosphere: string;
  textureTint: string;
  badge: string;
  scenario: {
    setting: string;
    situation: string;
    prompt: string;
  };
  decisions: readonly Decision[];
  consultation: Consultation;
};

export type SectorProgress = {
  status: "open" | "cleared";
  decisionKey: string;
  portfolioBeforeUnits: number;
  portfolioAfterUnits: number;
  consultationStatus: "answered" | "skipped" | null;
  answerKey: string | null;
  rewardLuna: number;
  xp: number;
};

export type OrbitLayoutItem = {
  position: [number, number, number];
  radius: number;
};
