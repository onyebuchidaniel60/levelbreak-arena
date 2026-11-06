import { createHash } from "node:crypto";
import cookie from "@fastify/cookie";
import { KeyPair } from "@nimiq/core";
import Fastify, { type FastifyInstance } from "fastify";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { registerAuthRoutes } from "./auth";
import { config } from "./config";
import { closeDatabase, query } from "./db";
import { AppError } from "./errors";

const integration = process.env.LBA_INTEGRATION_DATABASE_URL
  ? describe
  : describe.skip;

const origin = config.appOrigin;
const addresses = new Set<string>();
const nonceIds = new Set<string>();

function addressOf(keyPair: KeyPair): string {
  return keyPair.toAddress().toUserFriendlyAddress();
}

function nimiqDigest(message: string): Buffer {
  const framed = `\x16Nimiq Signed Message:\n${message.length}${message}`;
  return createHash("sha256").update(Buffer.from(framed, "utf8")).digest();
}

function signNimiqMessage(keyPair: KeyPair, message: string): string {
  return keyPair.sign(nimiqDigest(message)).toHex();
}

integration("Nimiq Pay signature verification", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = Fastify({ logger: false });
    await app.register(cookie);
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
      reply.code(500).send({
        error: {
          code: "INTERNAL_ERROR",
          message: "Internal server error.",
          requestId: request.id,
        },
      });
    });
    await registerAuthRoutes(app);
  });

  afterAll(async () => {
    const allAddresses = [...addresses];
    if (allAddresses.length > 0) {
      await query(
        `DELETE FROM auth_sessions
          WHERE player_id IN (SELECT id FROM players WHERE nimiq_address = ANY($1::text[]))`,
        [allAddresses],
      );
      await query(
        `DELETE FROM players WHERE nimiq_address = ANY($1::text[])`,
        [allAddresses],
      );
    }
    if (nonceIds.size > 0) {
      await query(`DELETE FROM auth_nonces WHERE id = ANY($1::uuid[])`, [
        [...nonceIds],
      ]);
    }
    if (app) await app.close();
    await closeDatabase();
  });

  async function requestNonce(address: string) {
    const response = await app.inject({
      method: "POST",
      url: "/api/auth/nonce",
      headers: { origin },
      payload: { address, origin },
    });
    expect(response.statusCode).toBe(200);
    const body = response.json<{
      nonceId: string;
      challenge: string;
    }>();
    addresses.add(address);
    nonceIds.add(body.nonceId);
    return body;
  }

  async function verify(input: {
    nonceId: string;
    address: string;
    publicKey: string;
    signature: string;
    challenge: string;
  }) {
    return app.inject({
      method: "POST",
      url: "/api/auth/verify",
      headers: { origin },
      payload: input,
    });
  }

  it("accepts a Nimiq signed-message signature and sets session cookies", async () => {
    const keyPair = KeyPair.generate();
    const address = addressOf(keyPair);
    const nonce = await requestNonce(address);
    const response = await verify({
      nonceId: nonce.nonceId,
      address,
      publicKey: keyPair.publicKey.toHex(),
      signature: signNimiqMessage(keyPair, nonce.challenge),
      challenge: nonce.challenge,
    });

    expect(response.statusCode).toBe(200);
    const rawSetCookie = response.headers["set-cookie"];
    const setCookie = Array.isArray(rawSetCookie)
      ? rawSetCookie.join(";")
      : String(rawSetCookie ?? "");
    expect(setCookie).toContain("lba_session=");
    expect(setCookie).toContain("lba_csrf=");

    const body = response.json<{ player: { address: string } }>();
    expect(body.player.address).toBe(address);

    const sessionCookie = setCookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith("lba_session="));
    expect(sessionCookie).toBeTruthy();
    const me = await app.inject({
      method: "GET",
      url: "/api/me",
      headers: { cookie: sessionCookie as string },
    });
    expect(me.statusCode).toBe(200);
    expect(me.json<{ player: { address: string } }>().player.address).toBe(
      address,
    );

    keyPair.free();
  });

  it("uses the public key's address when Nimiq Pay signs with another account", async () => {
    const requestedKey = KeyPair.generate();
    const signerKey = KeyPair.generate();
    const requestedAddress = addressOf(requestedKey);
    const signerAddress = addressOf(signerKey);
    const nonce = await requestNonce(requestedAddress);

    const response = await verify({
      nonceId: nonce.nonceId,
      address: requestedAddress,
      publicKey: signerKey.publicKey.toHex(),
      signature: signNimiqMessage(signerKey, nonce.challenge),
      challenge: nonce.challenge,
    });

    expect(response.statusCode).toBe(200);
    expect(
      response.json<{ player: { address: string } }>().player.address,
    ).toBe(signerAddress);
    addresses.add(signerAddress);

    requestedKey.free();
    signerKey.free();
  });

  it("rejects a raw, unframed signature", async () => {
    const keyPair = KeyPair.generate();
    const address = addressOf(keyPair);
    const nonce = await requestNonce(address);
    const response = await verify({
      nonceId: nonce.nonceId,
      address,
      publicKey: keyPair.publicKey.toHex(),
      signature: keyPair
        .sign(Buffer.from(nonce.challenge, "utf8"))
        .toHex(),
      challenge: nonce.challenge,
    });

    expect(response.statusCode).toBe(401);
    expect(
      response.json<{ error: { code: string } }>().error.code,
    ).toBe("INVALID_SIGNATURE");

    keyPair.free();
  });

  it("rejects a tampered challenge", async () => {
    const keyPair = KeyPair.generate();
    const address = addressOf(keyPair);
    const nonce = await requestNonce(address);
    const response = await verify({
      nonceId: nonce.nonceId,
      address,
      publicKey: keyPair.publicKey.toHex(),
      signature: signNimiqMessage(keyPair, nonce.challenge),
      challenge: `${nonce.challenge} `,
    });

    expect(response.statusCode).toBe(400);
    expect(
      response.json<{ error: { code: string } }>().error.code,
    ).toBe("CHALLENGE_MISMATCH");

    keyPair.free();
  });
});
