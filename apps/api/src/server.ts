import { randomUUID } from "node:crypto";
import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { registerAuthRoutes } from "./auth";
import { config } from "./config";
import { checkDatabase, closeDatabase } from "./db";
import { AppError } from "./errors";
import { NimiqWebClientService } from "./nimiq/web-client";

async function main(): Promise<void> {
  const app = Fastify({
    logger: {
      level: config.logLevel,
      redact: {
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "res.headers.set-cookie",
          "req.body.signature",
          "req.body.publicKey",
          "req.body.challenge",
          "*.privateKey",
          "*.privateKeyHex",
          "*.token",
          "*.nonce",
        ],
        censor: "[REDACTED]",
      },
    },
    genReqId: (request) => {
      const supplied = request.headers["x-request-id"];
      if (
        typeof supplied === "string" &&
        /^[A-Za-z0-9._-]{8,100}$/.test(supplied)
      ) {
        return supplied;
      }
      return randomUUID();
    },
  });

  const nimiq = new NimiqWebClientService();

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin || origin === config.appOrigin) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  });

  await app.register(cookie);
  await app.register(rateLimit, {
    global: true,
    max: 120,
    timeWindow: "1 minute",
  });

  app.addHook("onSend", async (request, reply, payload) => {
    reply.header("x-request-id", request.id);
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-frame-options", "DENY");
    reply.header("referrer-policy", "no-referrer");
    reply.header("permissions-policy", "camera=(), microphone=(), geolocation=()");
    reply.header(
      "content-security-policy",
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    );
    if (config.isProduction || config.appEnv === "preview") {
      reply.header(
        "strict-transport-security",
        "max-age=31536000; includeSubDomains",
      );
    }
    return payload;
  });

  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      reply.code(error.statusCode).send({
        error: {
          code: error.code,
          message: error.message,
          requestId: request.id,
        },
      });
      return;
    }

    const statusCode =
      typeof (error as { statusCode?: number }).statusCode === "number"
        ? (error as { statusCode: number }).statusCode
        : 500;

    if (statusCode === 429) {
      reply.code(429).send({
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests.",
          requestId: request.id,
        },
      });
      return;
    }

    request.log.error({ err: error }, "unhandled request error");
    reply.code(500).send({
      error: {
        code: "INTERNAL_ERROR",
        message: "Internal server error.",
        requestId: request.id,
      },
    });
  });

  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      error: {
        code: "NOT_FOUND",
        message: "Resource not found.",
        requestId: request.id,
      },
    });
  });

  app.get("/health/live", async () => ({ status: "ok" }));

  app.get("/health/ready", async (_request, reply) => {
    const [databaseReady, chain] = await Promise.all([
      checkDatabase(),
      nimiq.health(),
    ]);

    if (databaseReady && chain.ready) {
      return { status: "ready" };
    }

    return reply.code(503).send({ status: "not_ready" });
  });

  app.get("/api/config/public", async () => ({
    productName: "LevelBreak Arena",
    networkLabel: "Nimiq Testnet",
    rewardPerAnswerLuna: String(config.rewardPerAnswerLuna),
    maxConsultations: config.maxConsultations,
    demoMode: true,
  }));

  await registerAuthRoutes(app);

  async function shutdown(signal: string): Promise<void> {
    app.log.info({ signal }, "shutting down");
    await app.close();
    await nimiq.close();
    await closeDatabase();
    process.exit(0);
  }

  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    process.once(signal, () => {
      void shutdown(signal);
    });
  }

  void nimiq
    .start()
    .then(() => nimiq.waitForConsensus(60_000))
    .catch((error: unknown) => {
      app.log.warn({ err: error }, "Nimiq client did not become ready");
    });

  await app.listen({ port: config.port, host: "0.0.0.0" });
}

main().catch((error: unknown) => {
  console.error(
    JSON.stringify({
      event: "startup_error",
      message: error instanceof Error ? error.message : "unknown",
    }),
  );
  process.exit(1);
});
