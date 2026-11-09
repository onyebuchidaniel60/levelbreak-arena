#!/usr/bin/env node
/**
 * LevelBreak Arena external Agent API proof.
 *
 * The script:
 *   1. registers an external agent wallet,
 *   2. deposits 500 testnet Luna (or uses AGENT_DEPOSIT_TX_HASH),
 *   3. posts a 500-Luna consultation,
 *   4. authenticates a fresh player wallet,
 *   5. finds the consultation in the player lobby, claims it, answers it, and
 *      finishes the run so the normal treasury payout path is exercised.
 *
 * Required configuration:
 *   AGENT_WALLET_ADDRESS     registered agent wallet (unless AGENT_PRIVATE_KEY)
 *   AGENT_PRIVATE_KEY        optional; lets the script send its own 500-Luna
 *                            deposit from a testnet wallet
 *   AGENT_DEPOSIT_TX_HASH    optional; a real testnet transfer to the treasury
 *   NIMIQ_TREASURY_ADDRESS   required when the script sends the deposit
 *
 * Optional:
 *   API_BASE_URL             default http://127.0.0.1:3001
 *   APP_ORIGIN               default http://127.0.0.1:5173
 *   AGENT_NAME               default "Alpha Research Bot"
 *   AGENT_QUESTION / AGENT_CONTEXT
 *   DEPOSIT_LUNA             default 500
 *   WAIT_FOR_PAYOUT          "true" to poll the payout until confirmed
 *
 * Security: the API key and private key are never printed. The script does not
 * store secrets on disk.
 */

const { createHash, randomUUID } = require("node:crypto");
const {
  Address,
  Client,
  ClientConfiguration,
  KeyPair,
  PrivateKey,
  TransactionBuilder,
} = require("@nimiq/core");

const API_BASE_URL = (
  process.env.API_BASE_URL ?? "http://127.0.0.1:3001"
).replace(/\/+$/, "");
const APP_ORIGIN = process.env.APP_ORIGIN ?? "http://127.0.0.1:5173";
const AGENT_NAME = process.env.AGENT_NAME ?? "Alpha Research Bot";
const AGENT_WALLET_ADDRESS = process.env.AGENT_WALLET_ADDRESS ?? "";
const AGENT_PRIVATE_KEY = process.env.AGENT_PRIVATE_KEY ?? "";
const AGENT_DEPOSIT_TX_HASH = process.env.AGENT_DEPOSIT_TX_HASH ?? "";
const NIMIQ_TREASURY_ADDRESS = process.env.NIMIQ_TREASURY_ADDRESS ?? "";
const DEPOSIT_LUNA = process.env.DEPOSIT_LUNA ?? "500";
const WAIT_FOR_PAYOUT = process.env.WAIT_FOR_PAYOUT === "true";
const NIMIQ_SIGNED_MESSAGE_PREFIX = "\x16Nimiq Signed Message:\n";
const TESTNET_SEED_NODES = [
  "/dns4/seed1.pos.nimiq-testnet.com/tcp/8443/wss",
];

const AGENT_QUESTION =
  process.env.AGENT_QUESTION ??
  "Would you classify this simulated stablecoin as safe or risky?";
const AGENT_CONTEXT =
  process.env.AGENT_CONTEXT ??
  "Reserve attestations are missing, redemptions are delayed, and the peg is under pressure. The issuer says a recovery plan is being prepared.";

const cookieJar = new Map();
let playerKeyPair = null;
let agentWallet = null;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function rememberCookies(response) {
  const cookies =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  for (const cookie of cookies) {
    const head = cookie.split(";", 1)[0];
    const separator = head.indexOf("=");
    if (separator <= 0) continue;
    cookieJar.set(head.slice(0, separator), head.slice(separator + 1));
  }
}

function cookieHeader() {
  return [...cookieJar]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function api(path, options = {}) {
  const {
    method = "GET",
    body,
    auth,
    csrf = false,
    headers: extraHeaders = {},
  } = options;
  const headers = { origin: APP_ORIGIN, ...extraHeaders };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (auth) headers.authorization = `Bearer ${auth}`;
  const cookies = cookieHeader();
  if (cookies) headers.cookie = cookies;
  if (csrf) {
    const csrfToken = cookieJar.get("lba_csrf");
    if (!csrfToken) throw new Error("The player session has no CSRF cookie.");
    headers["x-csrf-token"] = csrfToken;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  rememberCookies(response);
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!response.ok) {
    const error = new Error(
      `${method} ${path} failed with HTTP ${response.status}: ${
        payload?.error?.message ?? String(payload).slice(0, 300)
      }`,
    );
    error.status = response.status;
    error.code = payload?.error?.code;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function signNimiqMessage(keyPair, message) {
  const framed = `${NIMIQ_SIGNED_MESSAGE_PREFIX}${message.length}${message}`;
  const digest = createHash("sha256")
    .update(Buffer.from(framed, "utf8"))
    .digest();
  return keyPair.sign(digest).toHex();
}

function deriveWallet(privateKeyHex) {
  const privateKey = PrivateKey.fromHex(privateKeyHex);
  const keyPair = KeyPair.derive(privateKey);
  try {
    return {
      address: keyPair.toAddress().toUserFriendlyAddress(),
      keyPair,
      privateKey,
    };
  } catch (error) {
    keyPair.free();
    privateKey.free();
    throw error;
  }
}

async function sendTestnetDeposit(input) {
  const clientConfig = new ClientConfiguration();
  clientConfig.network("TestAlbatross");
  clientConfig.seedNodes(TESTNET_SEED_NODES);
  clientConfig.desiredPeerCount(3);
  clientConfig.onlySecureWsConnections(true);
  clientConfig.logLevel("warn");
  const client = await Client.create(clientConfig.build());

  try {
    const startedAt = Date.now();
    while (Date.now() - startedAt < 60_000) {
      try {
        const [consensus, addressBook] = await Promise.all([
          client.isConsensusEstablished(),
          client.getAddressBook(),
        ]);
        if (consensus && addressBook.length > 0) break;
      } catch {
        // The client may not be connected yet.
      }
      await sleep(2_000);
    }

    const networkId = await client.getNetworkId();
    if (networkId !== 5) {
      throw new Error("Refusing to send a deposit outside TestAlbatross.");
    }
    const account = await client.getAccount(input.fromAddress);
    if (BigInt(account.balance) < BigInt(input.amountLuna)) {
      throw new Error(
        `The agent wallet needs at least ${input.amountLuna} Luna plus any fee.`,
      );
    }

    const headHeight = await client.getHeadHeight();
    const transaction = TransactionBuilder.newBasicWithData(
      Address.fromUserFriendlyAddress(input.fromAddress),
      Address.fromUserFriendlyAddress(input.toAddress),
      Buffer.from(input.data, "utf8"),
      BigInt(input.amountLuna),
      0n,
      headHeight + 1,
      networkId,
    );
    try {
      transaction.sign(input.keyPair, undefined);
      const txHash = transaction.hash();
      const details = await client.sendTransaction(transaction);
      if (details.transactionHash !== txHash) {
        throw new Error("The network returned a different transaction hash.");
      }

      const sentAt = Date.now();
      while (Date.now() - sentAt < 120_000) {
        try {
          const current = await client.getTransaction(txHash);
          if (current.state === "included" || current.state === "confirmed") {
            return {
              txHash,
              state: current.state,
              blockHeight: current.blockHeight ?? null,
            };
          }
          if (
            current.state === "invalidated" ||
            current.state === "expired"
          ) {
            throw new Error(`The deposit transaction is ${current.state}.`);
          }
        } catch (error) {
          if (/transaction is (invalidated|expired)/i.test(error.message)) {
            throw error;
          }
        }
        await sleep(2_000);
      }
      throw new Error("Timed out waiting for the deposit transaction.");
    } finally {
      try {
        transaction.free();
      } catch {
        // Ignore WASM cleanup errors.
      }
    }
  } finally {
    try {
      await client.disconnectNetwork();
    } catch {
      // Ignore disconnect errors.
    }
    try {
      client.free();
    } catch {
      // Ignore WASM cleanup errors.
    }
  }
}

async function depositWithRetry(input) {
  let lastError = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    try {
      return await api("/api/agent/deposit", {
        method: "POST",
        auth: input.apiKey,
        body: { txHash: input.txHash },
      });
    } catch (error) {
      lastError = error;
      if (!["DEPOSIT_NOT_FOUND", "DEPOSIT_NOT_CONFIRMED"].includes(error.code)) {
        throw error;
      }
      await sleep(3_000);
    }
  }
  throw lastError;
}

async function authenticatePlayer(address, keyPair) {
  const nonce = await api("/api/auth/nonce", {
    method: "POST",
    body: { address, origin: APP_ORIGIN },
  });
  await api("/api/auth/verify", {
    method: "POST",
    body: {
      nonceId: nonce.nonceId,
      address,
      publicKey: keyPair.publicKey.toHex(),
      signature: signNimiqMessage(keyPair, nonce.challenge),
      challenge: nonce.challenge,
    },
  });
}

async function waitForPayout(runId) {
  const startedAt = Date.now();
  let last = null;
  while (Date.now() - startedAt < 300_000) {
    last = await api(`/api/runs/${runId}/payout`);
    if (last.status === "CONFIRMED" || last.status === "FAILED") return last;
    await sleep(5_000);
  }
  return last;
}

async function main() {
  if (!AGENT_WALLET_ADDRESS && !AGENT_PRIVATE_KEY) {
    throw new Error(
      "Set AGENT_WALLET_ADDRESS, or set AGENT_PRIVATE_KEY to let the script derive and fund it.",
    );
  }
  if (
    !AGENT_DEPOSIT_TX_HASH &&
    (!AGENT_PRIVATE_KEY || !NIMIQ_TREASURY_ADDRESS)
  ) {
    throw new Error(
      "Set AGENT_DEPOSIT_TX_HASH, or set AGENT_PRIVATE_KEY and NIMIQ_TREASURY_ADDRESS so the script can send a deposit.",
    );
  }

  const wallet = AGENT_PRIVATE_KEY ? deriveWallet(AGENT_PRIVATE_KEY) : null;
  agentWallet = wallet;
  const walletAddress = wallet?.address ?? AGENT_WALLET_ADDRESS;
  if (
    AGENT_WALLET_ADDRESS &&
    wallet &&
    AGENT_WALLET_ADDRESS !== wallet.address
  ) {
    throw new Error(
      "AGENT_WALLET_ADDRESS does not match the supplied AGENT_PRIVATE_KEY.",
    );
  }

  const registration = await api("/api/agent/register", {
    method: "POST",
    body: { name: AGENT_NAME, walletAddress },
  });
  const apiKey = registration.apiKey;
  const agentId = registration.agent.agentId;
  console.log(
    JSON.stringify(
      {
        step: "register",
        agentId,
        name: registration.agent.name,
        walletAddress: registration.agent.walletAddress,
        apiKeyPreview: `${apiKey.slice(0, 16)}…`,
      },
      null,
      2,
    ),
  );

  let depositTxHash = AGENT_DEPOSIT_TX_HASH;
  let sentDeposit = null;
  if (!depositTxHash) {
    sentDeposit = await sendTestnetDeposit({
      fromAddress: walletAddress,
      toAddress: NIMIQ_TREASURY_ADDRESS,
      amountLuna: DEPOSIT_LUNA,
      data: `LBA-AGENT-DEPOSIT:${agentId}`,
      keyPair: wallet.keyPair,
    });
    depositTxHash = sentDeposit.txHash;
  }

  const deposit = await depositWithRetry({ apiKey, txHash: depositTxHash });
  console.log(
    JSON.stringify(
      {
        step: "deposit",
        txHash: deposit.deposit.txHash,
        amountLuna: deposit.deposit.amountLuna,
        blockHeight: deposit.deposit.blockHeight,
        balanceLuna: deposit.agent.balanceLuna,
        reservedLuna: deposit.agent.reservedLuna,
        availableLuna: deposit.agent.availableLuna,
        sentByScript: Boolean(sentDeposit),
      },
      null,
      2,
    ),
  );

  const posted = await api("/api/agent/consultations", {
    method: "POST",
    auth: apiKey,
    body: {
      question: AGENT_QUESTION,
      context: AGENT_CONTEXT,
      reward_luna: 500,
    },
  });
  console.log(
    JSON.stringify(
      {
        step: "consultation_created",
        consultationId: posted.consultation.consultationId,
        sessionId: posted.consultation.sessionId,
        publicRef: posted.consultation.publicRef,
        status: posted.consultation.status,
        rewardLuna: posted.consultation.rewardLuna,
        balanceLuna: posted.agent.balanceLuna,
        reservedLuna: posted.agent.reservedLuna,
        availableLuna: posted.agent.availableLuna,
      },
      null,
      2,
    ),
  );

  const directory = await api("/api/agents");
  const directoryEntry = directory.agents.find((a) => a.id === agentId);

  playerKeyPair = KeyPair.generate();
  const playerAddress = playerKeyPair.toAddress().toUserFriendlyAddress();
  await authenticatePlayer(playerAddress, playerKeyPair);

  const { sessions } = await api("/api/sessions/available");
  const lobbySession = sessions.find(
    (session) => session.publicRef === posted.consultation.publicRef,
  );
  if (!lobbySession) {
    throw new Error(
      "The agent consultation did not appear in the player lobby.",
    );
  }
  console.log(
    JSON.stringify(
      {
        step: "lobby",
        found: true,
        sessionId: lobbySession.id,
        publicRef: lobbySession.publicRef,
        agentName: lobbySession.agentName,
        questionPreview: lobbySession.questionPreview,
        maxConsultations: lobbySession.maxConsultations,
        rewardPerAnswerLuna: lobbySession.rewardPerAnswerLuna,
        agentQuestionsPosted: directoryEntry?.questionsPosted ?? null,
      },
      null,
      2,
    ),
  );

  const claim = await api(`/api/sessions/${lobbySession.id}/claim`, {
    method: "POST",
    csrf: true,
    body: { idempotencyKey: randomUUID() },
  });
  const run = await api(`/api/runs/${claim.runId}`);
  const firstDecision = run.scenario?.choices?.[0];
  if (!firstDecision) {
    throw new Error("The claimed run did not return a scenario decision.");
  }
  await api(`/api/runs/${claim.runId}/decision`, {
    method: "POST",
    csrf: true,
    body: {
      levelIndex: run.levelIndex,
      decisionKey: firstDecision.decisionKey,
      expectedStateVersion: run.stateVersion,
      idempotencyKey: randomUUID(),
    },
  });

  const pending = await api(`/api/runs/${claim.runId}`);
  if (!pending.consultation) {
    throw new Error("The agent consultation was not active after the decision.");
  }
  if (pending.consultation.id !== posted.consultation.consultationId) {
    throw new Error(
      "The player consultation ID does not match the agent consultation.",
    );
  }
  if (pending.consultation.agentName !== AGENT_NAME) {
    throw new Error("The agent name was not displayed in the consultation.");
  }

  const answer = await api(
    `/api/runs/${claim.runId}/consultations/${pending.consultation.id}/respond`,
    {
      method: "POST",
      csrf: true,
      body: {
        action: "ANSWER",
        answerKey: "CANT_TELL",
        expectedStateVersion: pending.stateVersion,
        idempotencyKey: randomUUID(),
      },
    },
  );
  const finish = await api(`/api/runs/${claim.runId}/finish`, {
    method: "POST",
    csrf: true,
    body: { idempotencyKey: randomUUID() },
  });
  const payout = WAIT_FOR_PAYOUT
    ? await waitForPayout(claim.runId)
    : finish.payoutId
      ? await api(`/api/runs/${claim.runId}/payout`)
      : null;
  const agentAfter = await api("/api/agent/me", { auth: apiKey });

  console.log(
    JSON.stringify(
      {
        step: "player_answered",
        playerAddress,
        runId: claim.runId,
        questionId: pending.consultation.id,
        agentName: pending.consultation.agentName,
        answerResult: answer.result,
        answerRewardLuna: answer.rewardLuna,
        runNextState: answer.nextState,
        runStateAfterFinish: finish.state,
        earnedLuna: finish.earnedLuna,
        payoutId: finish.payoutId,
        payoutStatus: payout?.status ?? finish.payoutStatus,
        payoutTxHash: payout?.txHash ?? null,
        agentBalanceAfter: agentAfter.agent.balanceLuna,
        agentReservedAfter: agentAfter.agent.reservedLuna,
        agentAvailableAfter: agentAfter.agent.availableLuna,
        agentQuestionsAfter:
          directory.agents.find((a) => a.id === agentId)?.questionsPosted ??
          null,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          step: "error",
          message: error instanceof Error ? error.message : String(error),
          status: error?.status ?? null,
          code: error?.code ?? null,
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  })
  .finally(() => {
    try {
      playerKeyPair?.free();
    } catch {
      // Ignore WASM cleanup errors.
    }
    try {
      agentWallet?.keyPair?.free();
    } catch {
      // Ignore WASM cleanup errors.
    }
    try {
      agentWallet?.privateKey?.free();
    } catch {
      // Ignore WASM cleanup errors.
    }
  });
