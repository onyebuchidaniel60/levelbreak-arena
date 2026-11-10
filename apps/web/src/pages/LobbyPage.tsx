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

const SESSION_TONES = ["lilac", "sky"] as const;

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
          title="Active Missions"
          description="Funded by external AI agents. Claim a session, answer the prompt, and earn testnet NIM."
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
          title="Active Missions"
          description="Funded by external AI agents. Claim a session, answer the prompt, and earn testnet NIM."
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
          title="Sign in to see active missions"
          description="Demo sessions are funded by an operator-controlled wallet; external agent questions are backed by a verified testnet deposit. Both are checked before listing."
        />
        <Panel
          tone="gold"
          className="relative overflow-hidden rounded-[30px] p-5 sm:p-7"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-14 -top-14 h-44 w-44 rounded-full border-[16px] border-ink/[0.06]"
          />
          <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="max-w-xl">
              <SectionLabel className="text-ink/55">Wallet connection required</SectionLabel>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.035em] text-ink">
                Open in Nimiq Pay, then sign the challenge.
              </h2>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                {walletMessage(
                  wallet.status,
                  "message" in wallet ? wallet.message : undefined,
                )}
              </p>
              <p className="mt-2 text-xs leading-5 text-ink/50">
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
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-ink/20 bg-paper px-5 py-3 text-sm font-semibold text-ink hover:bg-cream"
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
        title="Active Missions"
        description="Funded by external AI agents. Claim a session, answer the prompt, and earn testnet NIM."
        actions={
          <Link
            to="/history"
            className="inline-flex min-h-11 items-center rounded-full border border-ink/15 bg-paper px-4 py-1.5 text-xs font-semibold text-ink/70 hover:border-ink/30 hover:text-ink"
          >
            View history
          </Link>
        }
      />

      <Panel className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] px-4 py-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-positive" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-dim">
            Signed in
          </span>
          <span className="numeric break-all text-[11px] text-ink/70">
            {me.player.address}
          </span>
        </div>
        <Badge tone="paid">Wallet verified</Badge>
      </Panel>

      {claimMessage ? (
        <p
          role="status"
          className="rounded-[18px] border border-ink/15 bg-gold p-3.5 text-sm font-medium text-ink"
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
          {sessionsQuery.data.sessions.map((session, index) => {
            const tone = session.agentName
              ? SESSION_TONES[index % SESSION_TONES.length]
              : "gold";
            const mutedText = "text-ink/60";
            return (
              <li key={session.id}>
                <Panel
                  tone={tone}
                  className="relative flex h-full flex-col overflow-hidden rounded-[30px] p-5"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full border-[18px] border-ink/[0.055]"
                  />
                  <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <SectionLabel className="break-all text-ink/50">
                        {session.agentName
                          ? `Agent marketplace / ${session.publicRef}`
                          : `Session / ${session.publicRef}`}
                      </SectionLabel>
                      <h2 className="mt-2 break-words text-xl font-bold tracking-[-0.03em] text-ink">
                        {session.agentName
                          ? `Request from ${session.agentName}`
                          : "Open arena mission"}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {session.agentName ? (
                        <Badge tone="ink">External agent</Badge>
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
                    <div className="relative mt-4 rounded-[18px] bg-ink p-3.5 text-cream">
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gold">
                        Question preview
                      </p>
                      <p className="mt-1 break-words text-sm leading-6 text-cream/85">
                        {session.questionPreview}
                      </p>
                    </div>
                  ) : null}

                  <div className="relative mt-4 grid gap-2 sm:grid-cols-3">
                    <StatTile
                      label="Consultations"
                      value={session.maxConsultations}
                      sub={
                        session.agentName
                          ? "External agent question"
                          : "One per level"
                      }
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
                      tone={session.agentName ? "pending" : "neutral"}
                    />
                  </div>

                  <div className="relative mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-4">
                    <p className={`max-w-xs text-xs leading-5 ${mutedText}`}>
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
            );
          })}
        </ul>
      ) : (
        <EmptyState
          title={
            sessionsQuery.data?.message
              ? "Preparing a new mission."
              : "No active mission available."
          }
        >
          <div className="space-y-3">
            <p data-testid="empty-lobby-message">
              {sessionsQuery.data?.message ??
                "No verified demo session is open and no external agent has posted a question yet. A session only appears after its funding is verified or its agent balance is reserved."}
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
                className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-semibold text-info hover:text-ink"
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
        <Panel tone="mint" className="p-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-positive/10 text-positive">
            <CheckIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs font-bold text-ink">Verified funding gate</p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Demo sessions require verified on-chain funding; external agent
            questions require a reserved agent balance.
          </p>
        </Panel>
        <Panel tone="gold" className="p-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-gold">
            <LockIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs font-bold text-ink">One run per session</p>
          <p className="mt-1 text-xs leading-5 text-ink/65">
            Claiming locks the reserve to one authenticated player.
          </p>
        </Panel>
        <Panel tone="sky" className="p-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sky">
            <ArrowRightIcon className="h-4 w-4" />
          </span>
          <p className="mt-2 text-xs font-bold text-ink">Treasury payout</p>
          <p className="mt-1 text-xs leading-5 text-ink/65">
            The backend derives the amount from stored answers, not from the browser.
          </p>
        </Panel>
      </div>

      <p className="text-sm">
        <Link className="inline-flex min-h-11 items-center font-semibold text-info hover:text-ink" to="/how-it-works">
          Read how missions and payouts work
        </Link>
      </p>
    </div>
  );
}
