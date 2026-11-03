import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { PublicKey, Signature } from "@nimiq/core";
import { z } from "zod";
import { config } from "./config";
import { query, withTransaction } from "./db";
import { AppError, errors } from "./errors";
import { normalizeAddress } from "./nimiq/address";

const SESSION_COOKIE = "lba_session";
const CSRF_COOKIE = "lba_csrf";
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

const AddressSchema = z.string().min(1).max(100);
const NonceBodySchema = z.object({
  address: AddressSchema,
  origin: z.string().url(),
});
const VerifyBodySchema = z.object({
  nonceId: z.string().uuid(),
  address: AddressSchema,
  publicKey: z.string().min(2).max(200),
  signature: z.string().min(2).max(300),
  challenge: z.string().min(1).max(2000),
});

type PlayerSession = {
  sessionId: string;
  playerId: string;
  address: string;
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function tokenHash(token: string): string {
  return sha256(`${config.authSessionSecret}:${token}`);
}

function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

function challengeFor(input: {
  address: string;
  nonce: string;
  issuedAt: Date;
  expiresAt: Date;
}): string {
  return [
    "LevelBreak Arena login",
    `Origin: ${config.appOrigin}`,
    `Address: ${input.address}`,
    `Nonce: ${input.nonce}`,
    "Purpose: authenticate-player",
    `Issued At: ${input.issuedAt.toISOString()}`,
    `Expires At: ${input.expiresAt.toISOString()}`,
  ].join("\n");
}

function assertExactOrigin(request: FastifyRequest): void {
  if (request.headers.origin !== config.appOrigin) {
    throw errors.badRequest(
      "ORIGIN_MISMATCH",
      "Request origin does not match the configured application origin.",
    );
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function requireCsrf(request: FastifyRequest): void {
  assertExactOrigin(request);
  const cookieToken = request.cookies[CSRF_COOKIE];
  const headerToken = request.headers["x-csrf-token"];
  if (
    typeof cookieToken !== "string" ||
    typeof headerToken !== "string" ||
    !safeEqual(cookieToken, headerToken)
  ) {
    throw errors.forbidden("CSRF token is missing or invalid.");
  }
}

function sessionTokenFrom(request: FastifyRequest): string | null {
  const token = request.cookies[SESSION_COOKIE];
  return typeof token === "string" && token.length > 0 ? token : null;
}

export async function authenticate(request: FastifyRequest): Promise<PlayerSession> {
  const token = sessionTokenFrom(request);
  if (!token) throw errors.unauthorized();

  const result = await query<{
    session_id: string;
    player_id: string;
    nimiq_address: string;
  }>(
    `SELECT s.id AS session_id, p.id AS player_id, p.nimiq_address
       FROM auth_sessions s
       JOIN players p ON p.id = s.player_id
      WHERE s.token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > now()
      LIMIT 1`,
    [tokenHash(token)],
  );

  const row = result.rows[0];
  if (!row) throw errors.unauthorized("Session is invalid or expired.");

  return {
    sessionId: row.session_id,
    playerId: row.player_id,
    address: row.nimiq_address,
  };
}

function setSessionCookies(
  reply: FastifyReply,
  sessionToken: string,
  csrfToken: string,
): void {
  reply.setCookie(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  reply.setCookie(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    secure: config.secureCookies,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    "/api/auth/nonce",
    {
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (request) => {
      assertExactOrigin(request);
      const parsed = NonceBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw errors.badRequest("INVALID_REQUEST", "Invalid nonce request.");
      }

      if (parsed.data.origin !== config.appOrigin) {
        throw errors.badRequest(
          "ORIGIN_MISMATCH",
          "Request origin does not match the configured application origin.",
        );
      }

      let address: string;
      try {
        address = normalizeAddress(parsed.data.address);
      } catch {
        throw errors.badRequest("INVALID_ADDRESS", "Invalid Nimiq address.");
      }

      const nonce = randomToken(32);
      const issuedAt = new Date();
      const expiresAt = new Date(
        issuedAt.getTime() + config.authNonceTtlSeconds * 1000,
      );
      const challenge = challengeFor({ address, nonce, issuedAt, expiresAt });

      const result = await query<{ id: string }>(
        `INSERT INTO auth_nonces
           (nimiq_address, nonce_hash, challenge, challenge_origin, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [address, sha256(nonce), challenge, config.appOrigin, expiresAt],
      );

      return {
        nonceId: result.rows[0].id,
        challenge,
        expiresAt: expiresAt.toISOString(),
      };
    },
  );

  app.post(
    "/api/auth/verify",
    {
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
    },
    async (request, reply) => {
      assertExactOrigin(request);
      const parsed = VerifyBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw errors.badRequest("INVALID_REQUEST", "Invalid verification request.");
      }

      let address: string;
      try {
        address = normalizeAddress(parsed.data.address);
      } catch {
        throw errors.badRequest("INVALID_ADDRESS", "Invalid Nimiq address.");
      }

      const token = randomToken(32);
      const csrfToken = randomToken(24);
      const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

      const player = await withTransaction(async (client) => {
        const nonceResult = await client.query<{
          id: string;
          nimiq_address: string;
          challenge: string;
          challenge_origin: string;
          expires_at: Date;
          consumed_at: Date | null;
        }>(
          `SELECT id, nimiq_address, challenge, challenge_origin, expires_at, consumed_at
             FROM auth_nonces
            WHERE id = $1
            FOR UPDATE`,
          [parsed.data.nonceId],
        );

        const nonce = nonceResult.rows[0];
        if (!nonce) {
          throw errors.badRequest("NONCE_NOT_FOUND", "Login nonce was not found.");
        }
        if (nonce.consumed_at) {
          throw errors.conflict("NONCE_ALREADY_USED", "Login nonce was already used.");
        }
        if (nonce.expires_at.getTime() <= Date.now()) {
          throw new AppError(410, "NONCE_EXPIRED", "Login nonce has expired.");
        }
        if (
          nonce.challenge_origin !== config.appOrigin ||
          nonce.nimiq_address !== address
        ) {
          throw errors.badRequest("ORIGIN_MISMATCH", "Login challenge does not match.");
        }
        if (nonce.challenge !== parsed.data.challenge) {
          throw errors.badRequest("CHALLENGE_MISMATCH", "Login challenge does not match.");
        }

        let publicKey: PublicKey;
        let signature: Signature;
        try {
          publicKey = PublicKey.fromHex(parsed.data.publicKey);
          signature = Signature.fromHex(parsed.data.signature);
          if (normalizeAddress(publicKey.toAddress().toUserFriendlyAddress()) !== address) {
            throw new Error("Public key does not derive the claimed address");
          }
        } catch {
          throw new AppError(401, "INVALID_SIGNATURE", "Signature verification failed.");
        }

        const valid = publicKey.verify(
          signature,
          Buffer.from(parsed.data.challenge, "utf8"),
        );
        if (!valid) {
          throw new AppError(401, "INVALID_SIGNATURE", "Signature verification failed.");
        }

        await client.query(
          "UPDATE auth_nonces SET consumed_at = now() WHERE id = $1",
          [parsed.data.nonceId],
        );

        const playerResult = await client.query<{
          id: string;
          nimiq_address: string;
        }>(
          `INSERT INTO players (nimiq_address, public_key_hex, last_authenticated_at)
           VALUES ($1, $2, now())
           ON CONFLICT (nimiq_address) DO UPDATE
             SET public_key_hex = EXCLUDED.public_key_hex,
                 last_authenticated_at = now(),
                 status = 'ACTIVE'
           RETURNING id, nimiq_address`,
          [address, parsed.data.publicKey],
        );

        const player = playerResult.rows[0];
        await client.query(
          `INSERT INTO auth_sessions (player_id, token_hash, expires_at)
           VALUES ($1, $2, $3)`,
          [player.id, tokenHash(token), expiresAt],
        );

        return player;
      });

      setSessionCookies(reply, token, csrfToken);

      return {
        player: { address: player.nimiq_address },
        expiresAt: expiresAt.toISOString(),
      };
    },
  );

  app.post("/api/auth/logout", async (request, reply) => {
    requireCsrf(request);
    const token = sessionTokenFrom(request);
    if (token) {
      await query(
        "UPDATE auth_sessions SET revoked_at = now() WHERE token_hash = $1 AND revoked_at IS NULL",
        [tokenHash(token)],
      );
    }
    reply.clearCookie(SESSION_COOKIE, { path: "/" });
    reply.clearCookie(CSRF_COOKIE, { path: "/" });
    return reply.code(204).send();
  });

  app.get("/api/me", async (request) => {
    const session = await authenticate(request);
    const activeRun = await query<{ id: string }>(
      `SELECT id FROM player_runs
        WHERE player_id = $1
          AND state IN ('IN_PROGRESS', 'CONSULTATION_PENDING')
        ORDER BY created_at DESC
        LIMIT 1`,
      [session.playerId],
    );

    return {
      player: { address: session.address },
      activeRunId: activeRun.rows[0]?.id ?? null,
    };
  });
}
