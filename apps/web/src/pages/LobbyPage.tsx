import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../components/Feedback";
import { useAuth } from "../providers/AuthProvider";
import {
  queryKeys,
  useAvailableSessionsQuery,
  useClaimSessionMutation,
} from "../hooks/useApi";
import { api, isApiError } from "../lib/api";
import { formatNim } from "../lib/format";
import { useQueryClient } from "@tanstack/react-query";

export function LobbyPage() {
  const {
    me,
    meLoading,
    meError,
    wallet,
    signIn,
    isSigningIn,
    signInError,
  } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionsQuery = useAvailableSessionsQuery(Boolean(me));
  const claimMutation = useClaimSessionMutation();
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  if (meLoading) {
    return (
      <div>
        <PageHeader
          title="Lobby"
          description="Choose a funded testnet session."
        />
        <LoadingState label="Checking your wallet session…" />
      </div>
    );
  }

  if (meError) {
    return (
      <div>
        <PageHeader
          title="Lobby"
          description="Choose a funded testnet session."
        />
        <ErrorState error={meError} title="Could not load your wallet session" />
      </div>
    );
  }

  if (!me) {
    return (
      <div>
        <PageHeader
          title="Lobby"
          description="Sign in with your Nimiq wallet to see funded sessions."
        />
        <section className="mt-6 rounded border border-slate-300 bg-white p-4">
          <h2 className="text-lg font-semibold">Wallet connection required</h2>
          {wallet.status === "unavailable" ? (
            <p className="mt-2 text-sm text-slate-700">
              Open this app in Nimiq Pay to connect your wallet.
            </p>
          ) : wallet.status === "ready" ? (
            <>
              <p className="mt-2 break-all text-sm text-slate-700">
                Wallet detected: <span className="font-mono">{wallet.address}</span>
              </p>
              <button
                type="button"
                onClick={() => void signIn()}
                disabled={isSigningIn}
                className="mt-3 rounded bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 disabled:opacity-60"
              >
                {isSigningIn ? "Waiting for wallet…" : "Sign in with Nimiq Pay"}
              </button>
              {signInError ? (
                <p role="alert" className="mt-2 text-sm text-red-800">
                  {signInError}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-700">
              {wallet.status === "detecting"
                ? "Checking for Nimiq Pay…"
                : wallet.status === "denied"
                  ? wallet.message
                  : wallet.status === "no-account"
                    ? "Nimiq Pay did not return a wallet account."
                    : wallet.status === "error"
                      ? wallet.message
                      : "Open this app in Nimiq Pay to connect your wallet."}
            </p>
          )}
        </section>
      </div>
    );
  }

  async function handleClaim(sessionId: string) {
    setClaimMessage(null);
    try {
      const result = await claimMutation.mutateAsync({
        sessionId,
        idempotencyKey: crypto.randomUUID(),
      });
      navigate(`/play/${result.runId}`);
    } catch (error) {
      if (isApiError(error) && error.code === "ACTIVE_RUN_EXISTS") {
        try {
          const current = await queryClient.fetchQuery({
            queryKey: queryKeys.me,
            queryFn: api.me,
            staleTime: 0,
          });
          if (current.activeRunId) {
            navigate(`/play/${current.activeRunId}`);
            return;
          }
        } catch {
          // Fall through to the refresh message below.
        }
        await sessionsQuery.refetch();
        setClaimMessage("A session state changed — refreshing.");
        return;
      }

      if (isApiError(error) && error.code === "SESSION_UNAVAILABLE") {
        await sessionsQuery.refetch();
        setClaimMessage("This session was taken.");
        return;
      }

      if (isApiError(error) && error.code === "SESSION_NOT_FUNDED") {
        await sessionsQuery.refetch();
        setClaimMessage("This session is no longer funded.");
        return;
      }

      setClaimMessage(
        error instanceof Error
          ? error.message
          : "The session could not be claimed.",
      );
    }
  }

  return (
    <div>
      <PageHeader
        title="Lobby"
        description="Choose a funded testnet session. One funded session can be claimed by one player exactly once."
      />

      <p className="mt-2 break-all text-sm text-slate-700">
        Signed in as <span className="font-mono">{me.player.address}</span>
      </p>

      {claimMessage ? (
        <p role="status" className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          {claimMessage}
        </p>
      ) : null}

      {sessionsQuery.isLoading ? (
        <div className="mt-6">
          <LoadingState label="Loading funded sessions…" />
        </div>
      ) : sessionsQuery.isError ? (
        <div className="mt-6">
          <ErrorState
            error={sessionsQuery.error}
            onRetry={() => void sessionsQuery.refetch()}
            title="Could not load funded sessions"
          />
        </div>
      ) : sessionsQuery.data && sessionsQuery.data.sessions.length > 0 ? (
        <ul className="mt-6 space-y-4">
          {sessionsQuery.data.sessions.map((session) => (
            <li
              key={session.id}
              className="rounded border border-slate-300 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Funded session {session.publicRef}
                  </h2>
                  <p className="mt-1 text-sm text-slate-700">
                    {session.maxConsultations} consultations ·{" "}
                    {formatNim(session.rewardPerAnswerLuna)} NIM per answer · up to{" "}
                    {formatNim(session.maxRewardLuna)} NIM
                  </p>
                  <p className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                    <StatusBadge label={session.funded ? "Funded" : "Not funded"} />
                    <StatusBadge label={session.state} />
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleClaim(session.id)}
                  disabled={claimMutation.isPending}
                  className="rounded bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {claimMutation.isPending ? "Starting…" : "Start"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-6">
          <EmptyState title="No funded session available.">
            <p>No funded session available. Check back soon.</p>
          </EmptyState>
        </div>
      )}

      {claimMutation.isError &&
      !(isApiError(claimMutation.error) &&
        ["ACTIVE_RUN_EXISTS", "SESSION_UNAVAILABLE", "SESSION_NOT_FUNDED"].includes(
          claimMutation.error.code,
        )) ? (
        <div className="mt-4">
          <ErrorState error={claimMutation.error} title="Could not start session" />
        </div>
      ) : null}

      <p className="mt-6 text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/how-it-works">
          Read how funded sessions and payouts work
        </Link>
      </p>
    </div>
  );
}
