import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { api, isApiError } from "../lib/api";
import type {
  AgentPromptResponse,
  AgentsResponse,
  AvailableSession,
  ClaimResponse,
  ExchangeRates,
  FinishResponse,
  HistoryResponse,
  MeResponse,
  PayoutResponse,
  RespondResponse,
  RunDetail,
} from "@levelbreak-arena/contracts";

export const queryKeys = {
  me: ["me"] as const,
  config: ["config"] as const,
  exchangeRates: ["config", "exchange-rates"] as const,
  agents: ["agents"] as const,
  availableSessions: ["sessions", "available"] as const,
  run: (runId: string) => ["runs", runId] as const,
  payout: (runId: string) => ["runs", runId, "payout"] as const,
  agentPrompt: (runId: string, questionId: string) =>
    ["runs", runId, "agent-prompt", questionId] as const,
  history: ["history"] as const,
};

export function retryQuery(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) {
    if (error.status === 401 || error.status === 404) return false;
    if (error.status === 503) return failureCount < 1;
    if (error.status >= 400 && error.status < 500) return false;
  }
  return failureCount < 1;
}

export function retryDelay(_failureCount: number, error: unknown): number {
  if (isApiError(error) && error.status === 503) return 2_000;
  return 1_000;
}

export function useConfigQuery() {
  return useQuery({
    queryKey: queryKeys.config,
    queryFn: api.config,
    staleTime: 5 * 60_000,
    retry: retryQuery,
    retryDelay,
  });
}

export function useExchangeRatesQuery(enabled = true) {
  return useQuery<ExchangeRates>({
    queryKey: queryKeys.exchangeRates,
    queryFn: api.exchangeRates,
    enabled,
    staleTime: 5 * 60_000,
    retry: retryQuery,
    retryDelay,
  });
}

export function useMeQuery() {
  return useQuery<MeResponse | null>({
    queryKey: queryKeys.me,
    queryFn: async () => {
      try {
        return await api.me();
      } catch (error) {
        if (isApiError(error) && error.status === 401) return null;
        throw error;
      }
    },
    retry: retryQuery,
    retryDelay,
    staleTime: 10_000,
  });
}

export function useAgentsQuery() {
  return useQuery<AgentsResponse>({
    queryKey: queryKeys.agents,
    queryFn: api.agents,
    retry: retryQuery,
    retryDelay,
    staleTime: 60_000,
  });
}

export function useAvailableSessionsQuery(enabled = true) {
  return useQuery<{ sessions: AvailableSession[] }>({
    queryKey: queryKeys.availableSessions,
    queryFn: api.availableSessions,
    enabled,
    retry: retryQuery,
    retryDelay,
    staleTime: 5_000,
  });
}

export function useRunQuery(runId: string | undefined) {
  return useQuery<RunDetail>({
    queryKey: runId ? queryKeys.run(runId) : ["runs", "missing"],
    queryFn: () => api.run(runId as string),
    enabled: Boolean(runId),
    retry: retryQuery,
    retryDelay,
    staleTime: 0,
  });
}

export function usePayoutQuery(
  runId: string | undefined,
  options: { enabled: boolean; deadline: number | null },
) {
  return useQuery<PayoutResponse>({
    queryKey: runId ? queryKeys.payout(runId) : ["runs", "missing", "payout"],
    queryFn: () => api.payout(runId as string),
    enabled: Boolean(runId) && options.enabled,
    retry: retryQuery,
    retryDelay,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status || status === "CONFIRMED" || status === "FAILED") {
        return false;
      }
      if (options.deadline !== null && Date.now() > options.deadline) {
        return false;
      }
      return 5_000;
    },
  });
}

export function useAgentPromptQuery(
  runId: string | undefined,
  questionId: string | undefined,
  enabled: boolean,
) {
  return useQuery<AgentPromptResponse>({
    queryKey:
      runId && questionId
        ? queryKeys.agentPrompt(runId, questionId)
        : ["runs", "missing", "agent-prompt"],
    queryFn: () => api.agentPrompt(runId as string, questionId as string),
    enabled: Boolean(runId && questionId && enabled),
    staleTime: 10 * 60_000,
    retry: false,
  });
}

export function useHistoryQuery(enabled = true) {
  return useQuery<HistoryResponse>({
    queryKey: queryKeys.history,
    queryFn: () => api.history(),
    enabled,
    retry: retryQuery,
    retryDelay,
    staleTime: 0,
  });
}

export function useClaimSessionMutation() {
  const queryClient = useQueryClient();
  return useMutation<
    ClaimResponse,
    Error,
    { sessionId: string; idempotencyKey: string }
  >({
    mutationFn: ({ sessionId, idempotencyKey }) =>
      api.claim(sessionId, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.availableSessions,
      });
      void queryClient.invalidateQueries({ queryKey: queryKeys.agents });
      void queryClient.invalidateQueries({ queryKey: queryKeys.me });
    },
  });
}

export function useDecisionMutation(runId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      levelIndex: number;
      decisionKey: string;
      expectedStateVersion: number;
      idempotencyKey: string;
    }) => api.decision(runId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.run(runId) });
    },
  });
}

export function useRespondMutation(runId: string) {
  const queryClient = useQueryClient();
  return useMutation<
    RespondResponse,
    Error,
    {
      questionId: string;
      action: "ANSWER" | "SKIP";
      answerKey?: string;
      expectedStateVersion: number;
      idempotencyKey: string;
    }
  >({
    mutationFn: ({ questionId, ...input }) =>
      input.action === "ANSWER"
        ? api.respond(runId, questionId, {
            action: "ANSWER",
            answerKey: input.answerKey as string,
            expectedStateVersion: input.expectedStateVersion,
            idempotencyKey: input.idempotencyKey,
          })
        : api.respond(runId, questionId, {
            action: "SKIP",
            expectedStateVersion: input.expectedStateVersion,
            idempotencyKey: input.idempotencyKey,
          }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.run(runId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}

export function useFinishMutation(runId: string) {
  const queryClient = useQueryClient();
  return useMutation<FinishResponse, Error, string>({
    mutationFn: (idempotencyKey) => api.finish(runId, idempotencyKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.run(runId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.payout(runId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.history });
      void queryClient.invalidateQueries({ queryKey: queryKeys.agents });
    },
  });
}
