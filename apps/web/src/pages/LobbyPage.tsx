import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../components/Feedback";
import { Badge, Button, Panel, SectionLabel, StatTile } from "../components/ui";
import { ArrowRightIcon, CheckIcon, LockIcon } from "../components/Icons";
import { useAuth } from "../providers/AuthProvider";
import {
  queryKeys,
  useAvailableSessionsQuery,
  useClaimSessionMutation,
} from "../hooks/useApi";
import { api, isApiError } from "../lib/api";
import { formatNim } from "../lib/format";
import { useQueryClient } from "@tanstack/react-query";

function walletMessage(status: string, message?: string): string {
  if (status === "unavailable") return "Open this app in Nimiq Pay to connect your wallet.";
  if (status === "denied") return message ?? "Wallet signature was declined.";
  if (status === "no-account") return "Nimiq Pay did not return a wallet account.";
  if (status === "error") return message ?? "The wallet connection failed.";
  return "Open this app in Nimiq Pay to connect your wallet.";
}

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
      <div className="space-y-6">
        <PageHeader
          eyebrow="Lobby"
          title="Funded sessions"
          description="Choose a verified testnet session and start your run."
        />
        <LoadingState label="Checking your wallet session…" />
      </div>
    );
  }

  if (meError) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Lobby"
          title="Funded sessions"
          description="Choose a verified testnet session and start your run."
        />
        <ErrorState error={meError} title="Could not load your wallet session" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Lobby"
          title="Sign in to see funded sessions"
          description="Demo sessions are funded by an operator-controlled wallet; external agent questions are backed by a verified testnet deposit. Both are checked before listing."
        />
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <SectionLabel>Wallet connection required</SectionLabel>
              <h2 className="mt-2 text-xl font-semibold text-numeric">
                Open in Nimiq Pay, then sign the challenge.
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                {walletMessage(
                  wallet.status,
                  "message" in wallet ? wallet.message : undefined,
                )}
              </p>
              <p className="mt-2 text-xs leading-5 text-dim">
                The signature proves wallet ownership for a short-lived session.
                It cannot move funds.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {wallet.status === "ready" ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => void signIn()}
                  disabled={isSigningIn}
                >
                  {isSigningIn ? "Waiting for wallet…" : "Sign in with Nimiq Pay"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Link
                  to="/how-it-works"
                  className="inline-flex min-h-12 items-center justify-center rounded-md border border-line px-5 py-3 text-sm font-semibold text-body hover:bg-white/[0.04]"
                >
                  Read the funding rules
                </Link>
              )}
              {signInError ? (
                <p role="alert" className="max-w-xs text-sm text-danger">
                  {signInError}
                </p>
              ) : null}
            </div>
          </div>
        </Panel>
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Lobby"
        title="Funded sessions"
        description="Choose a funded session. Demo sessions support the five-level run; external agent questions are single-question consultations."
        actions={
          <Link
            to="/history"
            className="inline-flex min-h-9 items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-body"
          >
            View history
          </Link>
        }
      />

      <Panel className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-dim">
            Signed in
          </span>
          <span className="numeric break-all text-[11px] text-body">
            {me.player.address}
          </span>
        </div>
        <Badge tone="paid">Wallet verified</Badge>
      </Panel>

      {claimMessage ? (
        <p
          role="status"
          className="rounded-lg border border-pending/30 bg-pending/[0.06] p-3 text-sm text-pending"
        >
          {claimMessage}
        </p>
      ) : null}

      {sessionsQuery.isLoading ? (
        <LoadingState label="Loading funded sessions…" />
      ) : sessionsQuery.isError ? (
        <ErrorState
          error={sessionsQuery.error}
          onRetry={() => void sessionsQuery.refetch()}
          title="Could not load funded sessions"
        />
      ) : sessionsQuery.data && sessionsQuery.data.sessions.length > 0 ? (
        <ul className="grid gap-4 lg:grid-cols-2">
          {sessionsQuery.data.sessions.map((session) => (
            <li key={session.id}>
              <Panel className="relative overflow-hidden p-5">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-positive/50 to-transparent"
                />
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <SectionLabel>
                      {session.agentName
                        ? `Agent marketplace / ${session.publicRef}`
                        : `Session / ${session.publicRef}`}
                    </SectionLabel>
                    <h2 className="mt-2 text-lg font-semibold text-numeric">
                      {session.agentName
                        ? `Request from ${session.agentName}`
                        : "Funded arena run"}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {session.agentName ? (
                      <Badge tone="gold">External agent</Badge>
                    ) : null}
                    <StatusBadge
                      label={
                        session.agentName
                          ? "Agent funded"
                          : session.funded
                            ? "Funded"
                            : "Not funded"
                      }
                    />
                    <StatusBadge label={session.state} />
                  </div>
                </div>

                {session.questionPreview ? (
                  <div className="mt-3 rounded-lg border border-gold/20 bg-gold/[0.04] p-3">
                    <SectionLabel>Question preview</SectionLabel>
                    <p className="mt-1 text-sm leading-6 text-body">
                      {session.questionPreview}
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-2 sm:grid-cols-3">
                  <StatTile
                    label="Consultations"
                    value={session.maxConsultations}
                    sub={
                      session.agentName
                        ? "External agent question"
                        : "One per level"
                    }
                    tone="gold"
                  />
                  <StatTile
                    label="Per answer"
                    value={`${formatNim(session.rewardPerAnswerLuna)} NIM`}
                    sub="Fixed reward"
                    tone="positive"
                  />
                  <StatTile
                    label="Maximum"
                    value={`${formatNim(session.maxRewardLuna)} NIM`}
                    sub="Session liability"
                    tone="pending"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                  <p className="max-w-xs text-xs leading-5 text-dim">
                    {session.agentName
                      ? "The agent's balance is reserved for this question. Claiming locks it for one player and cannot be undone."
                      : "Funding is verified on-chain. Claiming reserves this session for one player and cannot be undone."}
                  </p>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => void handleClaim(session.id)}
                    disabled={claimMutation.isPending}
                  >
                    {claimMutation.isPending
                      ? "Starting…"
                      : session.agentName
                        ? "Answer question"
                        : "Start run"}
                    <ArrowRightIcon className="h-4 w-4" />
                  </Button>
                </div>
              </Panel>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No funded session available.">
          <div className="space-y-3">
            <p>
              No verified demo session is open and no external agent has posted
              a question yet. A session only appears after its funding is
              verified or its agent balance is reserved.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void sessionsQuery.refetch()}
              >
                Refresh
              </Button>
              <Link
                to="/how-it-works"
                className="inline-flex min-h-8 items-center rounded-md px-2 text-xs font-semibold text-info hover:text-blue-300"
              >
                How funding works
              </Link>
            </div>
          </div>
        </EmptyState>
      )}

      {claimMutation.isError &&
      !(isApiError(claimMutation.error) &&
        ["ACTIVE_RUN_EXISTS", "SESSION_UNAVAILABLE", "SESSION_NOT_FUNDED"].includes(
          claimMutation.error.code,
        )) ? (
        <ErrorState error={claimMutation.error} title="Could not start session" />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Panel className="p-4">
          <CheckIcon className="h-4 w-4 text-positive" />
          <p className="mt-2 text-xs font-semibold text-body">Verified funding gate</p>
          <p className="mt-1 text-xs leading-5 text-dim">
            Demo sessions require verified on-chain funding; external agent
            questions require a reserved agent balance.
          </p>
        </Panel>
        <Panel className="p-4">
          <LockIcon className="h-4 w-4 text-gold" />
          <p className="mt-2 text-xs font-semibold text-body">One run per session</p>
          <p className="mt-1 text-xs leading-5 text-dim">
            Claiming locks the reserve to one authenticated player.
          </p>
        </Panel>
        <Panel className="p-4">
          <ArrowRightIcon className="h-4 w-4 text-info" />
          <p className="mt-2 text-xs font-semibold text-body">Treasury payout</p>
          <p className="mt-1 text-xs leading-5 text-dim">
            The backend derives the amount from stored answers, not from the browser.
          </p>
        </Panel>
      </div>

      <p className="text-sm">
        <Link className="font-medium text-info hover:text-blue-300" to="/how-it-works">
          Read how funded sessions and payouts work
        </Link>
      </p>
    </div>
  );
}
