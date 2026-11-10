import { config } from "../config";
import type { NimiqService } from "../nimiq/types";
import {
  createDemoSession,
  listAvailableSessions,
  type LoggerLike,
  type SessionDTO,
} from "./sessions";

export const REPLENISH_TARGET = 3;
export const REPLENISH_INTERVAL_MS = 5 * 60_000;
export const REPLENISH_INITIAL_DELAY_MS = 10_000;
export const EMPTY_LOBBY_MESSAGE =
  "We are preparing a new funded session for you. Please refresh in 30 seconds.";

type ReplenishSession = Pick<SessionDTO, "sessionId" | "state">;

type CreateSession = (input: {
  idempotencyKey: string;
  nimiq: NimiqService;
  logger: LoggerLike;
  source: "auto-replenisher";
}) => Promise<ReplenishSession>;

export type ReplenishOutcome = {
  skipped: boolean;
  availableBefore: number;
  created: number;
  pending: number;
  failed: number;
  target: number;
};

/**
 * Creates demo-funded sessions until the visible lobby reaches the target.
 * The idempotency key includes the five-minute bucket, the observed count and
 * the slot index, so restarting within a bucket resumes the same session while
 * a later bucket can create a replacement after a claim or expiry.
 */
export async function replenishSessionsOnce(input: {
  nimiq: NimiqService;
  logger: LoggerLike;
  enabled?: boolean;
  target?: number;
  now?: number;
  intervalMs?: number;
  listAvailable?: () => Promise<Array<unknown>>;
  createSession?: CreateSession;
}): Promise<ReplenishOutcome> {
  const target = input.target ?? REPLENISH_TARGET;
  const enabled = input.enabled ?? config.autoReplenishSessions;
  if (!enabled) {
    return {
      skipped: true,
      availableBefore: 0,
      created: 0,
      pending: 0,
      failed: 0,
      target,
    };
  }

  const listAvailable = input.listAvailable ?? (() => listAvailableSessions());
  const createSession: CreateSession =
    input.createSession ??
    ((sessionInput) =>
      createDemoSession({
        ...sessionInput,
        source: "auto-replenisher",
      }));

  const availableBefore = (await listAvailable()).length;
  if (availableBefore >= target) {
    return {
      skipped: false,
      availableBefore,
      created: 0,
      pending: 0,
      failed: 0,
      target,
    };
  }

  const intervalMs = input.intervalMs ?? REPLENISH_INTERVAL_MS;
  const bucket = Math.floor((input.now ?? Date.now()) / intervalMs);
  const missing = target - availableBefore;
  let created = 0;
  let pending = 0;
  let failed = 0;

  for (let index = 0; index < missing; index += 1) {
    const idempotencyKey = `auto-replenish:${bucket}:${availableBefore}:${index}`;
    try {
      const result = await createSession({
        idempotencyKey,
        nimiq: input.nimiq,
        logger: input.logger,
        source: "auto-replenisher",
      });
      if (result.state === "AVAILABLE") {
        created += 1;
        input.logger.info(
          {
            event: "session_replenisher_created",
            sessionId: result.sessionId,
            state: result.state,
            bucket,
            slot: index,
          },
          "Session replenisher created a funded session",
        );
      } else {
        pending += 1;
        input.logger.warn(
          {
            event: "session_replenisher_pending",
            sessionId: result.sessionId,
            state: result.state,
            bucket,
            slot: index,
          },
          "Session replenisher created a session that is not available yet",
        );
        // Do not stack more transfers while this one is still confirming.
        break;
      }
    } catch (error) {
      failed += 1;
      input.logger.error(
        {
          event: "session_replenisher_create_failed",
          bucket,
          slot: index,
          message: error instanceof Error ? error.message : "unknown",
        },
        "Session replenisher could not create a session",
      );
      // A network or nonce failure should not cause three retries in a row.
      break;
    }
  }

  return {
    skipped: false,
    availableBefore,
    created,
    pending,
    failed,
    target,
  };
}

export function startSessionReplenisher(input: {
  nimiq: NimiqService;
  logger: LoggerLike;
  enabled?: boolean;
  intervalMs?: number;
  initialDelayMs?: number;
  target?: number;
  now?: () => number;
  listAvailable?: () => Promise<Array<unknown>>;
  createSession?: CreateSession;
}): () => void {
  const enabled = input.enabled ?? config.autoReplenishSessions;
  if (!enabled) {
    input.logger.info(
      { event: "session_replenisher_disabled" },
      "Session replenisher is disabled",
    );
    return () => undefined;
  }

  const intervalMs = input.intervalMs ?? REPLENISH_INTERVAL_MS;
  const initialDelayMs = input.initialDelayMs ?? REPLENISH_INITIAL_DELAY_MS;
  let stopped = false;
  let timer: NodeJS.Timeout | null = null;

  const run = async (): Promise<void> => {
    if (stopped) return;
    try {
      const outcome = await replenishSessionsOnce({
        nimiq: input.nimiq,
        logger: input.logger,
        enabled: true,
        target: input.target,
        now: input.now?.() ?? Date.now(),
        intervalMs,
        listAvailable: input.listAvailable,
        createSession: input.createSession,
      });
      input.logger.info(
        {
          event: "session_replenisher_run",
          ...outcome,
        },
        "Session replenisher run complete",
      );
    } catch (error) {
      input.logger.error(
        {
          event: "session_replenisher_error",
          message: error instanceof Error ? error.message : "unknown",
        },
        "Session replenisher run failed",
      );
    } finally {
      if (!stopped) {
        timer = setTimeout(run, intervalMs);
      }
    }
  };

  timer = setTimeout(run, initialDelayMs);
  input.logger.info(
    {
      event: "session_replenisher_started",
      intervalMs,
      initialDelayMs,
      target: input.target ?? REPLENISH_TARGET,
    },
    "Session replenisher started",
  );

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
