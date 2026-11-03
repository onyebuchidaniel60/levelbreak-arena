import { describe, expect, it } from "vitest";
import {
  assertConsultationResult,
  assertTransition,
  canTransition,
} from "./state-machines";

describe("requester session state machine", () => {
  it("allows the funded happy-path chain", () => {
    const path = [
      "DRAFT",
      "AWAITING_FUNDING",
      "FUNDING_PENDING",
      "FUNDED",
      "AVAILABLE",
      "CLAIMED",
      "IN_PROGRESS",
      "COMPLETED",
      "PAYOUT_PENDING",
      "SETTLED",
    ] as const;
    for (let index = 0; index < path.length - 1; index += 1) {
      expect(canTransition("requester_session", path[index], path[index + 1])).toBe(
        true,
      );
    }
  });

  it("rejects skipping the funding gate", () => {
    expect(canTransition("requester_session", "AWAITING_FUNDING", "AVAILABLE")).toBe(
      false,
    );
    expect(() =>
      assertTransition("requester_session", "AWAITING_FUNDING", "AVAILABLE"),
    ).toThrow();
  });

  it("rejects reusing a settled or failed session", () => {
    expect(canTransition("requester_session", "SETTLED", "AVAILABLE")).toBe(false);
    expect(canTransition("requester_session", "FUNDING_FAILED", "AVAILABLE")).toBe(
      false,
    );
  });
});

describe("player run state machine", () => {
  it("allows decisions and consultations to advance", () => {
    expect(canTransition("player_run", "IN_PROGRESS", "CONSULTATION_PENDING")).toBe(
      true,
    );
    expect(canTransition("player_run", "CONSULTATION_PENDING", "IN_PROGRESS")).toBe(
      true,
    );
    expect(canTransition("player_run", "CONSULTATION_PENDING", "COMPLETED")).toBe(
      true,
    );
  });

  it("only allows one payout path after completion", () => {
    expect(canTransition("player_run", "COMPLETED", "PAYOUT_QUEUED")).toBe(true);
    expect(canTransition("player_run", "COMPLETED", "COMPLETED_NO_REWARD")).toBe(
      true,
    );
    expect(canTransition("player_run", "PAYOUT_CONFIRMED", "PAYOUT_QUEUED")).toBe(
      false,
    );
  });
});

describe("payout state machine", () => {
  it("serializes builder, submission and confirmation", () => {
    expect(canTransition("payout", "QUEUED", "BUILDING")).toBe(true);
    expect(canTransition("payout", "BUILDING", "SUBMITTED")).toBe(true);
    expect(canTransition("payout", "SUBMITTED", "CONFIRMED")).toBe(true);
  });

  it("requires failed reconciliation before requeue", () => {
    expect(canTransition("payout", "FAILED", "QUEUED")).toBe(true);
    expect(canTransition("payout", "SUBMITTED", "QUEUED")).toBe(false);
    expect(canTransition("payout", "CONFIRMED", "QUEUED")).toBe(false);
  });
});

describe("consultation results", () => {
  it("accepts only ANSWERED or SKIPPED", () => {
    expect(assertConsultationResult("ANSWERED")).toBe("ANSWERED");
    expect(assertConsultationResult("SKIPPED")).toBe("SKIPPED");
    expect(() => assertConsultationResult("MAYBE")).toThrow();
  });
});
