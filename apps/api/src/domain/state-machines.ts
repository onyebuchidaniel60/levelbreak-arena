export const REQUESTER_SESSION_STATES = [
  "DRAFT",
  "AWAITING_FUNDING",
  "FUNDING_PENDING",
  "FUNDED",
  "AVAILABLE",
  "CLAIMED",
  "IN_PROGRESS",
  "COMPLETED",
  "SETTLED",
  "FUNDING_FAILED",
  "CANCELLED",
  "PAYOUT_PENDING",
  "PAYOUT_FAILED",
  "EXPIRED",
] as const;

export type RequesterSessionState = (typeof REQUESTER_SESSION_STATES)[number];

const REQUESTER_TRANSITIONS: Record<
  RequesterSessionState,
  readonly RequesterSessionState[]
> = {
  DRAFT: ["AWAITING_FUNDING", "CANCELLED"],
  AWAITING_FUNDING: ["FUNDING_PENDING", "FUNDING_FAILED", "CANCELLED", "EXPIRED"],
  FUNDING_PENDING: ["FUNDED", "FUNDING_FAILED", "CANCELLED"],
  FUNDED: ["AVAILABLE", "CANCELLED"],
  AVAILABLE: ["CLAIMED", "EXPIRED", "CANCELLED"],
  CLAIMED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
  COMPLETED: ["PAYOUT_PENDING", "SETTLED"],
  PAYOUT_PENDING: ["SETTLED", "PAYOUT_FAILED"],
  PAYOUT_FAILED: ["PAYOUT_PENDING", "SETTLED"],
  SETTLED: [],
  FUNDING_FAILED: ["CANCELLED"],
  CANCELLED: [],
  EXPIRED: [],
};

export const PLAYER_RUN_STATES = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "CONSULTATION_PENDING",
  "COMPLETED",
  "PAYOUT_QUEUED",
  "PAYOUT_SUBMITTED",
  "PAYOUT_CONFIRMED",
  "COMPLETED_NO_REWARD",
] as const;

export type PlayerRunState = (typeof PLAYER_RUN_STATES)[number];

const PLAYER_RUN_TRANSITIONS: Record<
  PlayerRunState,
  readonly PlayerRunState[]
> = {
  NOT_STARTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["CONSULTATION_PENDING", "COMPLETED"],
  CONSULTATION_PENDING: ["IN_PROGRESS", "COMPLETED"],
  COMPLETED: ["PAYOUT_QUEUED", "COMPLETED_NO_REWARD"],
  PAYOUT_QUEUED: ["PAYOUT_SUBMITTED", "PAYOUT_CONFIRMED"],
  PAYOUT_SUBMITTED: ["PAYOUT_CONFIRMED"],
  PAYOUT_CONFIRMED: [],
  COMPLETED_NO_REWARD: [],
};

export const PAYOUT_STATES = [
  "QUEUED",
  "BUILDING",
  "SUBMITTED",
  "CONFIRMED",
  "FAILED",
  "RECONCILING",
  "CANCELLED",
] as const;

export type PayoutState = (typeof PAYOUT_STATES)[number];

const PAYOUT_TRANSITIONS: Record<PayoutState, readonly PayoutState[]> = {
  QUEUED: ["BUILDING", "FAILED", "CANCELLED"],
  BUILDING: ["SUBMITTED", "FAILED", "RECONCILING"],
  SUBMITTED: ["CONFIRMED", "FAILED", "RECONCILING"],
  CONFIRMED: [],
  FAILED: ["QUEUED", "RECONCILING"],
  RECONCILING: ["CONFIRMED", "FAILED"],
  CANCELLED: [],
};

export const CONSULTATION_RESULTS = ["ANSWERED", "SKIPPED"] as const;
export type ConsultationResult = (typeof CONSULTATION_RESULTS)[number];

export type TransitionKind = "requester_session" | "player_run" | "payout";

const TABLES: Record<
  TransitionKind,
  {
    states: readonly string[];
    transitions: Record<string, readonly string[]>;
  }
> = {
  requester_session: {
    states: REQUESTER_SESSION_STATES,
    transitions: REQUESTER_TRANSITIONS,
  },
  player_run: {
    states: PLAYER_RUN_STATES,
    transitions: PLAYER_RUN_TRANSITIONS,
  },
  payout: {
    states: PAYOUT_STATES,
    transitions: PAYOUT_TRANSITIONS,
  },
};

export function canTransition(
  kind: TransitionKind,
  from: string,
  to: string,
): boolean {
  const table = TABLES[kind];
  if (!table.states.includes(from) || !table.states.includes(to)) {
    return false;
  }
  return table.transitions[from]?.includes(to) ?? false;
}

export function assertTransition(
  kind: TransitionKind,
  from: string,
  to: string,
): void {
  if (!canTransition(kind, from, to)) {
    throw new Error(`Invalid ${kind} transition: ${from} -> ${to}`);
  }
}

export function assertConsultationResult(value: string): ConsultationResult {
  if (value !== "ANSWERED" && value !== "SKIPPED") {
    throw new Error(`Invalid consultation result: ${value}`);
  }
  return value;
}
