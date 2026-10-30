import Fastify from "fastify";
import cors from "@fastify/cors";

const nodeEnv = process.env.NODE_ENV ?? "development";
const appOrigin = process.env.APP_ORIGIN;

if (nodeEnv === "production" && !appOrigin) {
  throw new Error("APP_ORIGIN is required when NODE_ENV=production");
}

const localhostOriginPattern = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) {
    return true;
  }

  if (appOrigin) {
    return origin === appOrigin;
  }

  return nodeEnv !== "production" && localhostOriginPattern.test(origin);
}

async function main() {
  const app = Fastify({ logger: true });

  await app.register(cors, {
    origin: (origin, callback) => {
      callback(null, isAllowedOrigin(origin));
    },
  });

  app.get("/health/live", async () => ({ status: "ok" }));

  const port = Number(process.env.API_PORT ?? 3001);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("API_PORT must be a valid TCP port");
  }

  await app.listen({ port, host: "0.0.0.0" });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
