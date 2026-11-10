import { afterEach, describe, expect, it, vi } from "vitest";
import type { NimiqService } from "../nimiq/types";
import { AUTO_REPLENISH_KEY_PREFIX, isAutoReplenisherOverride } from "./sessions";
import {
  EMPTY_LOBBY_MESSAGE,
  REPLENISH_DAILY_CAP,
  REPLENISH_INTERVAL_MS,
  REPLENISH_TARGET,
  replenishSessionsOnce,
  startSessionReplenisher,
} from "./session-replenisher";

const nimiq = {} as NimiqService;

function makeLogger() {
  return {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("session replenisher", () => {
  it("does nothing when disabled", async () => {
    const listAvailable = vi.fn();
    const createSession = vi.fn();

    const outcome = await replenishSessionsOnce({
      nimiq,
      logger: makeLogger(),
      enabled: false,
      listAvailable,
      createSession,
    });

    expect(outcome).toEqual({
      skipped: true,
      availableBefore: 0,
      created: 0,
      pending: 0,
      failed: 0,
      target: REPLENISH_TARGET,
    });
    expect(listAvailable).not.toHaveBeenCalled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("does nothing when the lobby already has the target", async () => {
    const createSession = vi.fn();
    const outcome = await replenishSessionsOnce({
      nimiq,
      logger: makeLogger(),
      enabled: true,
      listAvailable: async () => [{}, {}, {}],
      createSession,
    });

    expect(outcome.availableBefore).toBe(3);
    expect(outcome.created).toBe(0);
    expect(outcome.skipped).toBe(false);
    expect(createSession).not.toHaveBeenCalled();
  });

  it("creates sessions up to the target with deterministic bucket keys", async () => {
    const logger = makeLogger();
    const createSession = vi.fn(async (input: { idempotencyKey: string; source?: string }) => ({
      sessionId: `session-${input.idempotencyKey}`,
      state: "AVAILABLE",
    }));

    const outcome = await replenishSessionsOnce({
      nimiq,
      logger,
      enabled: true,
      now: 1_000_000,
      listAvailable: async () => [],
      createSession,
    });

    const bucket = Math.floor(1_000_000 / REPLENISH_INTERVAL_MS);
    expect(outcome).toEqual({
      skipped: false,
      availableBefore: 0,
      created: 3,
      pending: 0,
      failed: 0,
      target: 3,
    });
    expect(createSession).toHaveBeenCalledTimes(3);
    expect(createSession.mock.calls.map((call) => call[0].idempotencyKey)).toEqual([
      `${AUTO_REPLENISH_KEY_PREFIX}${bucket}:0:0`,
      `${AUTO_REPLENISH_KEY_PREFIX}${bucket}:0:1`,
      `${AUTO_REPLENISH_KEY_PREFIX}${bucket}:0:2`,
    ]);
    expect(
      createSession.mock.calls.every(
        (call) => call[0].source === "auto-replenisher",
      ),
    ).toBe(true);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "session_replenisher_created",
        state: "AVAILABLE",
      }),
      expect.any(String),
    );
  });

  it("caps mints at the rolling daily limit", async () => {
    const logger = makeLogger();
    const createSession = vi.fn(async () => ({
      sessionId: "session-new",
      state: "AVAILABLE",
    }));

    const outcome = await replenishSessionsOnce({
      nimiq,
      logger,
      enabled: true,
      now: 1_750_000,
      listAvailable: async () => [],
      createSession,
      countAutoReplenished: async () => REPLENISH_DAILY_CAP - 1,
    });

    expect(outcome.created).toBe(1);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "session_replenisher_budget",
        dailyMinted: REPLENISH_DAILY_CAP - 1,
        dailyRemaining: 1,
      }),
      expect.any(String),
    );
  });

  it("does not mint when the rolling daily cap is exhausted", async () => {
    const logger = makeLogger();
    const createSession = vi.fn();

    const outcome = await replenishSessionsOnce({
      nimiq,
      logger,
      enabled: true,
      now: 1_800_000,
      listAvailable: async () => [],
      createSession,
      countAutoReplenished: async () => REPLENISH_DAILY_CAP,
    });

    expect(outcome.created).toBe(0);
    expect(createSession).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "session_replenisher_daily_cap",
        dailyMinted: REPLENISH_DAILY_CAP,
      }),
      expect.any(String),
    );
  });

  it("expires stale demo sessions before counting", async () => {
    const logger = makeLogger();
    const expireStale = vi.fn(async () => 3);
    const createSession = vi.fn(async () => ({
      sessionId: "session-new",
      state: "AVAILABLE",
    }));

    const outcome = await replenishSessionsOnce({
      nimiq,
      logger,
      enabled: true,
      now: 1_500_000,
      listAvailable: async () => [],
      createSession,
      expireStale,
    });

    expect(expireStale).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "session_replenisher_expired",
        count: 3,
      }),
      expect.any(String),
    );
    expect(outcome.created).toBe(3);
  });

  it("only fills the missing slots", async () => {
    const createSession = vi.fn(
      async (_input: { idempotencyKey: string }) => {
        void _input;
        return {
          sessionId: "session-1",
          state: "AVAILABLE",
        };
      },
    );

    const outcome = await replenishSessionsOnce({
      nimiq,
      logger: makeLogger(),
      enabled: true,
      now: 2_000_000,
      listAvailable: async () => [{}, {}],
      createSession,
    });

    expect(outcome.availableBefore).toBe(2);
    expect(outcome.created).toBe(1);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(createSession.mock.calls[0]?.[0]?.idempotencyKey).toContain(
      ":2:0",
    );
  });

  it("stops after a pending funding session instead of stacking transfers", async () => {
    const createSession = vi.fn(async () => ({
      sessionId: "session-pending",
      state: "FUNDING_PENDING",
    }));
    const logger = makeLogger();

    const outcome = await replenishSessionsOnce({
      nimiq,
      logger,
      enabled: true,
      now: 3_000_000,
      listAvailable: async () => [],
      createSession,
    });

    expect(outcome.created).toBe(0);
    expect(outcome.pending).toBe(1);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "session_replenisher_pending",
        state: "FUNDING_PENDING",
      }),
      expect.any(String),
    );
  });

  it("records a failure and does not crash the caller", async () => {
    const createSession = vi.fn(async () => {
      throw new Error("chain timeout");
    });
    const logger = makeLogger();

    const outcome = await replenishSessionsOnce({
      nimiq,
      logger,
      enabled: true,
      now: 4_000_000,
      listAvailable: async () => [],
      createSession,
    });

    expect(outcome.failed).toBe(1);
    expect(outcome.created).toBe(0);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "session_replenisher_create_failed",
        message: "chain timeout",
      }),
      expect.any(String),
    );
  });

  it("runs once after the initial delay and stops cleanly", async () => {
    vi.useFakeTimers();
    const listAvailable = vi.fn(async () => []);
    const createSession = vi.fn(async () => ({
      sessionId: "session-1",
      state: "AVAILABLE",
    }));
    const logger = makeLogger();

    const stop = startSessionReplenisher({
      nimiq,
      logger,
      enabled: true,
      initialDelayMs: 100,
      intervalMs: 1_000,
      now: () => 1_000_000,
      target: 1,
      listAvailable,
      createSession,
    });

    expect(listAvailable).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(100);
    expect(listAvailable).toHaveBeenCalledTimes(1);
    expect(createSession).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ event: "session_replenisher_run" }),
      expect.any(String),
    );

    stop();
    await vi.advanceTimersByTimeAsync(5_000);
    expect(listAvailable).toHaveBeenCalledTimes(1);
    expect(createSession).toHaveBeenCalledTimes(1);
  });

  it("returns a no-op scheduler when disabled", async () => {
    vi.useFakeTimers();
    const listAvailable = vi.fn();
    const logger = makeLogger();
    const stop = startSessionReplenisher({
      nimiq,
      logger,
      enabled: false,
      listAvailable,
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(listAvailable).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ event: "session_replenisher_disabled" }),
      expect.any(String),
    );
    stop();
  });

  it("only lets the internal auto-replenisher bypass the funding gates when enabled", () => {
    expect(isAutoReplenisherOverride("auto-replenisher", true)).toBe(true);
    expect(isAutoReplenisherOverride("auto-replenisher", false)).toBe(false);
    expect(isAutoReplenisherOverride("operator", true)).toBe(false);
    expect(isAutoReplenisherOverride(undefined, true)).toBe(false);
  });

  it("exposes the exact empty-lobby message", () => {
    expect(EMPTY_LOBBY_MESSAGE).toBe(
      "We are preparing a new funded session for you. Please refresh in 30 seconds.",
    );
  });
});
