import {
  agentPromptResponseSchema,
  agentsResponseSchema,
  availableSessionsResponseSchema,
  claimResponseSchema,
  decisionResponseSchema,
  errorEnvelopeSchema,
  exchangeRatesSchema,
  finishResponseSchema,
  historyResponseSchema,
  meResponseSchema,
  nonceResponseSchema,
  payoutResponseSchema,
  publicConfigSchema,
  respondResponseSchema,
  runDetailSchema,
  verifyResponseSchema,
  type AgentPromptResponse,
  type AgentsResponse,
  type AvailableSession,
  type ClaimResponse,
  type DecisionResponse,
  type ExchangeRates,
  type FinishResponse,
  type HistoryResponse,
  type MeResponse,
  type NonceResponse,
  type PayoutResponse,
  type PublicConfig,
  type RespondResponse,
  type RunDetail,
  type VerifyResponse,
} from "@levelbreak-arena/contracts";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly requestId: string | null;

  constructor(
    status: number,
    code: string,
    message: string,
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
  }
}

type ResponseSchema<T> = {
  parse: (value: unknown) => T;
};

type RequestOptions<T> = Omit<RequestInit, "body"> & {
  body?: unknown;
  schema: ResponseSchema<T>;
  redirectOn401?: boolean;
};

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
const CSRF_COOKIE = "lba_csrf";
const CSRF_HEADER = "x-csrf-token";

export function resolveApiBaseUrl(
  value: string | undefined = configuredBaseUrl,
): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  return trimmed.replace(/\/+$/, "");
}

export function apiUrl(
  path: string,
  baseUrl: string = resolveApiBaseUrl(),
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function redirectToSignIn(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/") return;
  window.location.assign("/?auth=required");
}

function methodIsMutation(method: string): boolean {
  return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

async function readError(
  response: Response,
): Promise<{ code: string; message: string; requestId: string | null }> {
  const headerRequestId = response.headers.get("x-request-id");
  try {
    const parsed = errorEnvelopeSchema.safeParse(await response.json());
    if (parsed.success) {
      return {
        code: parsed.data.error.code,
        message: parsed.data.error.message,
        requestId: parsed.data.error.requestId ?? headerRequestId,
      };
    }
  } catch {
    // The response did not contain JSON.
  }
  return {
    code: `HTTP_${response.status}`,
    message: "The service returned an unexpected response.",
    requestId: headerRequestId,
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions<T>,
): Promise<T> {
  const method = options.method ?? (options.body === undefined ? "GET" : "POST");
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;

  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }
  if (methodIsMutation(method)) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) headers.set(CSRF_HEADER, csrfToken);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      method,
      headers,
      body,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "The network request failed. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    const error = await readError(response);
    if (
      response.status === 401 &&
      options.redirectOn401 !== false &&
      !path.startsWith("/api/auth/") &&
      path !== "/api/me"
    ) {
      redirectToSignIn();
    }
    throw new ApiError(
      response.status,
      error.code,
      error.message,
      error.requestId,
    );
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The service returned an unreadable response.",
      response.headers.get("x-request-id"),
    );
  }

  try {
    return options.schema.parse(json);
  } catch {
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "The service returned data in an unexpected shape.",
      response.headers.get("x-request-id"),
    );
  }
}

export async function apiRequestVoid(
  path: string,
  options: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<void> {
  const method = options.method ?? (options.body === undefined ? "POST" : "POST");
  const headers = new Headers(options.headers);
  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }
  if (methodIsMutation(method)) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) headers.set(CSRF_HEADER, csrfToken);
  }

  let response: Response;
  try {
    response = await fetch(apiUrl(path), {
      ...options,
      method,
      headers,
      body,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      0,
      "NETWORK_ERROR",
      "The network request failed. Check your connection and try again.",
    );
  }

  if (!response.ok) {
    const error = await readError(response);
    if (response.status === 401) redirectToSignIn();
    throw new ApiError(
      response.status,
      error.code,
      error.message,
      error.requestId,
    );
  }
}

export const api = {
  config: (): Promise<PublicConfig> =>
    apiRequest("/api/config/public", { schema: publicConfigSchema }),

  exchangeRates: (): Promise<ExchangeRates> =>
    apiRequest("/api/config/exchange-rates", {
      schema: exchangeRatesSchema,
      redirectOn401: false,
    }),

  me: (): Promise<MeResponse> =>
    apiRequest("/api/me", {
      schema: meResponseSchema,
      redirectOn401: false,
    }),

  nonce: (address: string, origin: string): Promise<NonceResponse> =>
    apiRequest("/api/auth/nonce", {
      method: "POST",
      body: { address, origin },
      schema: nonceResponseSchema,
      redirectOn401: false,
    }),

  verify: (input: {
    nonceId: string;
    address: string;
    publicKey: string;
    signature: string;
    challenge: string;
  }): Promise<VerifyResponse> =>
    apiRequest("/api/auth/verify", {
      method: "POST",
      body: input,
      schema: verifyResponseSchema,
      redirectOn401: false,
    }),

  logout: (): Promise<void> =>
    apiRequestVoid("/api/auth/logout", { method: "POST" }),

  availableSessions: (): Promise<{ sessions: AvailableSession[] }> =>
    apiRequest("/api/sessions/available", {
      schema: availableSessionsResponseSchema,
    }),

  agents: (): Promise<AgentsResponse> =>
    apiRequest("/api/agents", {
      schema: agentsResponseSchema,
      redirectOn401: false,
    }),

  claim: (sessionId: string, idempotencyKey: string): Promise<ClaimResponse> =>
    apiRequest(`/api/sessions/${sessionId}/claim`, {
      method: "POST",
      body: { idempotencyKey },
      schema: claimResponseSchema,
    }),

  run: (runId: string): Promise<RunDetail> =>
    apiRequest(`/api/runs/${runId}`, { schema: runDetailSchema }),

  decision: (
    runId: string,
    input: {
      levelIndex: number;
      decisionKey: string;
      expectedStateVersion: number;
      idempotencyKey: string;
    },
  ): Promise<DecisionResponse> =>
    apiRequest(`/api/runs/${runId}/decision`, {
      method: "POST",
      body: input,
      schema: decisionResponseSchema,
    }),

  respond: (
    runId: string,
    questionId: string,
    input:
      | {
          action: "ANSWER";
          answerKey: string;
          expectedStateVersion: number;
          idempotencyKey: string;
        }
      | {
          action: "SKIP";
          expectedStateVersion: number;
          idempotencyKey: string;
        },
  ): Promise<RespondResponse> =>
    apiRequest(`/api/runs/${runId}/consultations/${questionId}/respond`, {
      method: "POST",
      body: input,
      schema: respondResponseSchema,
    }),

  finish: (runId: string, idempotencyKey: string): Promise<FinishResponse> =>
    apiRequest(`/api/runs/${runId}/finish`, {
      method: "POST",
      body: { idempotencyKey },
      schema: finishResponseSchema,
    }),

  payout: (runId: string): Promise<PayoutResponse> =>
    apiRequest(`/api/runs/${runId}/payout`, { schema: payoutResponseSchema }),

  agentPrompt: (
    runId: string,
    questionId: string,
  ): Promise<AgentPromptResponse> =>
    apiRequest(
      `/api/consultations/${encodeURIComponent(questionId)}/generate-agent-prompt?runId=${encodeURIComponent(runId)}`,
      { schema: agentPromptResponseSchema },
    ),

  history: (cursor?: string): Promise<HistoryResponse> => {
    const query = cursor
      ? `?limit=50&cursor=${encodeURIComponent(cursor)}`
      : "?limit=50";
    return apiRequest(`/api/history${query}`, {
      schema: historyResponseSchema,
    });
  },
};

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
