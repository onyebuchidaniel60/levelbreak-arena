import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AgentMessage } from "../components/AgentMessage";
import { EvidenceCard } from "../components/EvidenceCard";
import { FiatOffRampModal } from "../components/FiatOffRampModal";
import {
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../components/Feedback";
import {
  Badge,
  Button,
  Divider,
  KeyValue,
  Panel,
  ProgressRail,
  SectionLabel,
  StatTile,
  cn,
} from "../components/ui";
import {
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  LockIcon,
} from "../components/Icons";
import {
  useAgentPromptQuery,
  useDecisionMutation,
  useFinishMutation,
  usePayoutQuery,
  useRespondMutation,
  useRunQuery,
} from "../hooks/useApi";
import { isApiError } from "../lib/api";
import {
  formatLuna,
  formatNim,
  formatVirtualUnits,
  payoutStatusLabel,
  runStateLabel,
} from "../lib/format";
import type { FinishResponse } from "@levelbreak-arena/contracts";

function useTimedMessage() {
  const [message, setMessage] = useState<string | null>(null);
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(() => setMessage(null), 2_000);
    return () => window.clearTimeout(timer);
  }, [message]);
  return [message, setMessage] as const;
}

function pendingLuna(earned: string, paid: string): string {
  const earnedValue = BigInt(earned);
  const paidValue = BigInt(paid);
  return earnedValue > paidValue ? (earnedValue - paidValue).toString() : "0";
}

export function GamePage() {
  const { runId } = useParams<{ runId: string }>();
  const runQuery = useRunQuery(runId);
  const decisionMutation = useDecisionMutation(runId ?? "");
  const respondMutation = useRespondMutation(runId ?? "");
  const finishMutation = useFinishMutation(runId ?? "");
  const [finishResult, setFinishResult] = useState<FinishResponse | null>(null);
  const [payoutDeadline, setPayoutDeadline] = useState<number | null>(null);
  const [actionError, setActionError] = useState<unknown>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [rewardMessage, setRewardMessage] = useTimedMessage();
  const [consequenceMessage, setConsequenceMessage] = useTimedMessage();
  const [offRampOpen, setOffRampOpen] = useState(false);
  const [selectedAnswerKey, setSelectedAnswerKey] = useState<string | null>(
    null,
  );

  const run = runQuery.data;
  const consultation = run?.consultation;
  const agentPromptQuery = useAgentPromptQuery(
    runId,
    consultation?.id,
    Boolean(run && run.state === "CONSULTATION_PENDING" && consultation),
  );

  useEffect(() => {
    setSelectedAnswerKey(null);
  }, [consultation?.id]);

  const hasPayout = Boolean(
    finishResult?.payoutId ??
      (run && run.payoutStatus !== "NONE" ? run.payoutStatus : null),
  );
  const payoutQuery = usePayoutQuery(runId, {
    enabled: hasPayout,
    deadline: payoutDeadline,
  });

  useEffect(() => {
    if (hasPayout) {
      setPayoutDeadline((current) => current ?? Date.now() + 5 * 60_000);
    }
  }, [hasPayout]);

  if (!runId) {
    return <RunNotFound />;
  }

  if (runQuery.isLoading) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <SectionLabel>Run / syncing</SectionLabel>
          <h1 className="text-2xl font-bold text-ink">Game session</h1>
        </div>
        <LoadingState label="Loading your run…" />
      </div>
    );
  }

  if (runQuery.isError) {
    if (isApiError(runQuery.error) && runQuery.error.status === 404) {
      return <RunNotFound />;
    }
    if (isApiError(runQuery.error) && runQuery.error.status === 401) {
      return (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-ink">Sign-in required</h1>
          <p className="text-sm leading-6 text-muted">
            Your session expired. Return to the{" "}
            <Link className="font-semibold text-info underline" to="/?auth=required">
              sign-in page
            </Link>
            .
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-ink">Game session</h1>
        <ErrorState
          error={runQuery.error}
          onRetry={() => void runQuery.refetch()}
          title="Could not load your run"
        />
      </div>
    );
  }

  if (!run) return <RunNotFound />;

  const totalLevels = run.maxConsultations ?? 5;
  const payout = payoutQuery.data;
  const payoutStatus = payout?.status ?? run.payoutStatus;
  const payoutTimedOut =
    payoutDeadline !== null &&
    Date.now() > payoutDeadline &&
    payoutStatus !== "CONFIRMED" &&
    payoutStatus !== "FAILED";
  const paidLuna =
    payoutStatus === "CONFIRMED"
      ? payout?.amountLuna ?? run.earnedLuna
      : "0";
  const pending = pendingLuna(run.earnedLuna, paidLuna);
  const completedLevels = run.decisions.map((decision) => decision.levelIndex);
  const payoutConfirmed = payoutStatus === "CONFIRMED";
  const displayPayoutAmount =
    payout?.amountLuna ?? (paidLuna !== "0" ? paidLuna : run.earnedLuna);

  async function handleDecision(decisionKey: string) {
    if (!run) return;
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await decisionMutation.mutateAsync({
        levelIndex: run.levelIndex,
        decisionKey,
        expectedStateVersion: run.stateVersion,
        idempotencyKey: crypto.randomUUID(),
      });
      setConsequenceMessage(
        `Portfolio changed: ${formatVirtualUnits(
          result.result.portfolioAfter,
          run.portfolio.unit,
        )}. ${result.result.explanation}`,
      );
    } catch (error) {
      if (isApiError(error) && error.code === "STATE_CONFLICT") {
        await runQuery.refetch();
        setActionNotice("Game state was refreshed.");
        return;
      }
      setActionError(error);
    }
  }

  async function handleRespond(action: "ANSWER" | "SKIP", answerKey?: string) {
    if (!run || !consultation) return;
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await respondMutation.mutateAsync({
        questionId: consultation.id,
        action,
        answerKey,
        expectedStateVersion: run.stateVersion,
        idempotencyKey: crypto.randomUUID(),
      });
      setRewardMessage(
        result.result === "ANSWERED"
          ? `+${formatNim(result.rewardLuna)} NIM earned`
          : "Skipped — no reward",
      );
    } catch (error) {
      if (isApiError(error) && error.code === "QUESTION_ALREADY_RESOLVED") {
        await runQuery.refetch();
        setActionNotice("This question was already answered.");
        return;
      }
      if (isApiError(error) && error.code === "STATE_CONFLICT") {
        await runQuery.refetch();
        setActionNotice("Game state was refreshed.");
        return;
      }
      setActionError(error);
    }
  }

  async function handleFinish() {
    if (!run) return;
    setActionError(null);
    setActionNotice(null);
    try {
      const result = await finishMutation.mutateAsync(crypto.randomUUID());
      setFinishResult(result);
      if (result.payoutId) setPayoutDeadline(Date.now() + 5 * 60_000);
    } catch (error) {
      setActionError(error);
    }
  }

  const lastDecision = run.decisions[run.decisions.length - 1];
  const lastResponse = run.responses[run.responses.length - 1];
  const isComplete =
    run.state === "COMPLETED" ||
    run.state === "PAYOUT_QUEUED" ||
    run.state === "PAYOUT_SUBMITTED" ||
    run.state === "PAYOUT_CONFIRMED" ||
    run.state === "COMPLETED_NO_REWARD";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <SectionLabel>Run / {run.runId.slice(0, 8)}</SectionLabel>
            <StatusBadge label={runStateLabel(run.state)} />
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-[-0.045em] text-ink sm:text-4xl">
            Level {Math.min(run.levelIndex, totalLevels)} of {totalLevels}
          </h1>
          <p className="mt-1 text-sm leading-6 text-muted">
            {run.state === "CONSULTATION_PENDING"
              ? "Read the evidence, then answer or skip the agent's task."
              : run.state === "IN_PROGRESS"
                ? "Choose a scenario decision. The backend applies the consequence."
                : "Run complete. Review the reward and payout state."}
          </p>
        </div>
        <Link
          to="/play"
          className="inline-flex min-h-11 items-center rounded-full border border-ink/15 bg-paper px-4 py-1.5 text-xs font-semibold text-ink/70 hover:border-ink/30 hover:text-ink"
        >
          Back to lobby
        </Link>
      </div>

      <Panel tone="gold" className="rounded-[22px] p-4 sm:px-5">
        <ProgressRail
          total={totalLevels}
          current={run.levelIndex}
          completed={completedLevels}
        />
      </Panel>

      {consequenceMessage ? (
        <p
          role="status"
          aria-live="polite"
          className="fade-up rounded-[18px] border border-ink/12 bg-sky p-3.5 text-sm leading-6 text-ink"
        >
          {consequenceMessage}
        </p>
      ) : null}

      {rewardMessage ? (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "fade-up rounded-[18px] border p-3.5 text-sm font-semibold",
            rewardMessage.startsWith("+")
              ? "reward-flash border-positive/25 bg-positive/[0.09] text-positive"
              : "border-ink/15 bg-gold text-ink",
          )}
        >
          {rewardMessage}
        </p>
      ) : null}

      {actionNotice ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-[18px] border border-ink/15 bg-gold p-3.5 text-sm font-medium text-ink"
        >
          {actionNotice}
        </p>
      ) : null}

      {actionError ? (
        <ErrorState error={actionError} title="The action could not be completed" />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Earned"
          value={`${formatNim(run.earnedLuna)} NIM`}
          sub={`${formatLuna(run.earnedLuna)} Luna accrued`}
          tone="positive"
        />
        <StatTile
          label="Pending"
          value={`${formatNim(pending)} NIM`}
          sub={
            pending === "0"
              ? "Nothing waiting for settlement"
              : "Queued or awaiting confirmation"
          }
          tone="pending"
        />
        <StatTile
          label="Paid"
          value={`${formatNim(paidLuna)} NIM`}
          sub={
            paidLuna === "0"
              ? "No confirmed payout yet"
              : "Confirmed on Nimiq testnet"
          }
          tone="paid"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-5">
          {run.state === "IN_PROGRESS" && run.scenario ? (
            <Panel tone="sky" className="overflow-hidden rounded-[30px]">
              <div className="relative border-b border-ink/10 px-4 py-4 sm:px-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SectionLabel className="text-ink/55">
                    Level {String(run.levelIndex).padStart(2, "0")} / Decision
                  </SectionLabel>
                  <Badge tone="ink">Portfolio consequence</Badge>
                </div>
                <h2 className="mt-2 break-words text-balance text-2xl font-bold tracking-[-0.04em] text-ink sm:text-3xl">
                  {run.scenario.title}
                </h2>
              </div>
              <div className="space-y-4 px-4 py-5 sm:px-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50">
                  {run.scenario.setting}
                </p>
                <p className="text-[15px] leading-7 text-ink/80">
                  {run.scenario.situation}
                </p>
                <p className="break-words text-lg font-bold leading-7 text-ink">
                  {run.scenario.prompt}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {run.scenario.choices.map((choice) => (
                    <button
                      key={choice.decisionKey}
                      type="button"
                      onClick={() => void handleDecision(choice.decisionKey)}
                      disabled={decisionMutation.isPending}
                      className="group flex min-h-20 flex-col items-start justify-between rounded-[18px] border border-ink bg-ink p-4 text-left text-cream transition-colors hover:border-coral hover:bg-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-gold">
                        {choice.decisionKey}
                      </span>
                      <span className="mt-2 flex w-full items-center justify-between gap-2 text-sm font-semibold">
                        <span className="break-words">{choice.label}</span>
                        <ArrowRightIcon className="h-4 w-4 shrink-0 text-cream/40 transition-colors group-hover:text-gold" />
                      </span>
                    </button>
                  ))}
                </div>
                <p className="text-xs leading-5 text-ink/50">
                  The backend decides the consequence. The browser only displays
                  the returned result. No real DeFi position is opened.
                </p>
              </div>
            </Panel>
          ) : null}

          {run.state === "CONSULTATION_PENDING" && consultation ? (
            <div className="space-y-4">
              <AgentMessage
                context={consultation.agentContext}
                confidence={consultation.agentConfidence}
                fallback={consultation.agentMessage}
                prompt={agentPromptQuery.data?.prompt}
                source={agentPromptQuery.data?.source}
                verified={Boolean(consultation.agentName)}
                loading={agentPromptQuery.isLoading}
              />

              <EvidenceCard evidence={consultation.evidence} />

              <Panel
                tone="lilac"
                className="rounded-[30px] p-4 sm:p-6"
                data-testid="agent-request-card"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <SectionLabel className="text-ink/55">
                      Agent Request / Level{" "}
                      {String(run.levelIndex).padStart(2, "0")}
                    </SectionLabel>
                    <Badge tone={consultation.agentName ? "ink" : "neutral"}>
                      {consultation.agentName ? "Verified MCP" : "Simulated"}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge tone="ink">+{formatNim(consultation.rewardLuna)} NIM</Badge>
                    <Badge tone="neutral">No hidden answer key</Badge>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-3 rounded-[18px] bg-ink p-3.5 text-cream">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-sm font-bold text-ink">
                    A
                  </span>
                  <div className="min-w-0">
                    <p className="break-words text-sm font-bold text-cream">
                      {consultation.agentName ?? "Agent Zeta (Simulated)"}
                    </p>
                    <p className="mt-0.5 break-words text-xs leading-5 text-cream/55">
                      {consultation.agentName
                        ? `${consultation.agentName} (Verified MCP) needs your assessment on this scenario.`
                        : "Agent Zeta (Simulated) needs your assessment on this scenario."}
                    </p>
                  </div>
                </div>
                <h2 className="mt-4 break-words text-balance text-2xl font-bold tracking-[-0.04em] text-ink">
                  {consultation.question}
                </h2>
                <p className="mt-2 text-sm leading-6 text-ink/70">
                  Select the classification that best matches your read of the
                  evidence, then submit your judgment. The fixed reward is paid
                  for a valid submitted response; skip earns zero.
                </p>
                <div className="mt-4 grid gap-2">
                  {consultation.options.map((option) => {
                    const selected = selectedAnswerKey === option.key;
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => setSelectedAnswerKey(option.key)}
                        disabled={respondMutation.isPending}
                        aria-pressed={selected}
                        className={cn(
                          "flex min-h-11 flex-col gap-1 rounded-[16px] border px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink disabled:cursor-not-allowed disabled:opacity-50",
                          selected
                            ? "border-ink bg-gold"
                            : "border-ink/15 bg-paper hover:border-ink/35 hover:bg-cream",
                        )}
                      >
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-coral">
                            {option.key}
                          </span>
                          <span className="text-sm font-bold text-ink">
                            {option.label}
                          </span>
                        </span>
                        <span className="text-xs leading-5 text-ink/60">
                          {option.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto sm:self-end"
                    onClick={() => {
                      if (selectedAnswerKey) {
                        void handleRespond("ANSWER", selectedAnswerKey);
                      }
                    }}
                    disabled={!selectedAnswerKey || respondMutation.isPending}
                  >
                    Provide Assessment & Earn {formatLuna(consultation.rewardLuna)} Luna
                  </Button>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/15 pt-4">
                    <p className="max-w-sm text-xs leading-5 text-ink/55">
                      This is a judgment task, not a quiz. The backend records
                      one terminal action per consultation.
                    </p>
                    <Button
                      variant="ghost"
                      size="md"
                      className="min-h-11 text-ink/70 hover:bg-ink/10 hover:text-ink"
                      onClick={() => void handleRespond("SKIP")}
                      disabled={respondMutation.isPending}
                    >
                      Skip — no reward
                    </Button>
                  </div>
                </div>
              </Panel>
            </div>
          ) : null}

          {lastDecision && run.state === "CONSULTATION_PENDING" ? (
            <Panel className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>Previous consequence</SectionLabel>
                <Badge
                  tone={
                    BigInt(lastDecision.result.delta) >= 0n ? "paid" : "error"
                  }
                >
                  {BigInt(lastDecision.result.delta) >= 0n ? "+" : ""}
                  {formatVirtualUnits(lastDecision.result.delta, run.portfolio.unit)}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-ink/80">
                {lastDecision.result.explanation}
              </p>
              <p className="mt-2 text-sm leading-6 text-muted">
                <span className="font-bold text-ink">Lesson:</span>{" "}
                {lastDecision.result.lesson}
              </p>
            </Panel>
          ) : null}

          {isComplete ? (
            <Panel className="overflow-hidden rounded-[30px]">
              <div className="border-b border-ink/10 px-4 py-5 sm:px-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <SectionLabel>Session complete</SectionLabel>
                  <StatusBadge label={payoutStatusLabel(payoutStatus)} />
                </div>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-ink sm:text-3xl">
                  {payoutConfirmed
                    ? "Reward Confirmed."
                    : run.state === "COMPLETED_NO_REWARD"
                      ? "Complete — no reward."
                      : "Reward recorded. Payout pending."}
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  {payoutConfirmed
                    ? "Your testnet NIM is in your wallet. "
                    : ""}
                  {run.responses.length} of {totalLevels} consultation actions
                  recorded. {formatNim(run.earnedLuna)} NIM earned from accepted
                  responses.
                </p>
              </div>
              <div className="space-y-4 px-4 py-5 sm:px-6">
                {run.state === "COMPLETED" ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-md text-sm leading-6 text-muted">
                      Finishing creates exactly one payout record from the stored
                      responses. The amount is never taken from the browser.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => void handleFinish()}
                      disabled={finishMutation.isPending}
                    >
                      {finishMutation.isPending
                        ? "Finishing…"
                        : "Finish and claim payout"}
                      <ArrowRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}

                {finishResult && !finishResult.payoutId ? (
                  <p className="rounded-[18px] border border-ink/12 bg-cream p-3.5 text-sm text-muted">
                    Session complete — no reward earned. There is no payout row
                    and no transaction.
                  </p>
                ) : null}

                {payoutConfirmed && paidLuna !== "0" ? (
                  <div className="rounded-[22px] border border-positive/25 bg-positive/[0.08] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <SectionLabel>Payout confirmed</SectionLabel>
                        <p className="numeric mt-1 text-3xl font-semibold text-positive">
                          {formatNim(paidLuna)} NIM
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {formatLuna(paidLuna)} Luna · treasury → your wallet
                        </p>
                      </div>
                      <Button
                        variant="primary"
                        size="lg"
                        onClick={() => setOffRampOpen(true)}
                      >
                        Withdraw to Fiat
                        <ArrowRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : null}

                {lastResponse ? (
                  <p className="text-xs text-dim">
                    Last consultation:{" "}
                    {lastResponse.result === "ANSWERED" ? "answered" : "skipped"}.
                  </p>
                ) : null}
              </div>
            </Panel>
          ) : null}

          {isComplete ? (
            <Panel className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>Run summary</SectionLabel>
                <Badge tone="neutral">Server-recorded</Badge>
              </div>
              <div className="mt-3 divide-y divide-ink/10">
                {run.responses.length > 0 ? (
                  run.responses.map((response) => (
                    <div
                      key={response.responseId}
                      className="flex flex-wrap items-center justify-between gap-2 py-3"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                          Level {String(response.levelIndex).padStart(2, "0")}
                        </span>
                        <StatusBadge
                          label={
                            response.result === "ANSWERED" ? "Answered" : "Skipped"
                          }
                        />
                      </div>
                      <span
                        className={cn(
                          "numeric text-xs font-semibold",
                          response.result === "ANSWERED"
                            ? "text-positive"
                            : "text-dim",
                        )}
                      >
                        {response.result === "ANSWERED"
                          ? `+${formatNim(response.rewardLuna)} NIM`
                          : "0 NIM"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="py-3 text-sm text-dim">
                    No consultation responses recorded for this run.
                  </p>
                )}
              </div>
              <div className="mt-4 rounded-[22px] border border-ink bg-ink p-4 text-cream">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                    Payout receipt
                  </p>
                  <StatusBadge label={payoutStatusLabel(payoutStatus)} />
                </div>
                <dl className="mt-2 divide-y divide-white/10">
                  <KeyValue label="Amount" inverted>
                    {formatNim(displayPayoutAmount)} NIM (
                    {formatLuna(displayPayoutAmount)} Luna)
                  </KeyValue>
                  <KeyValue label="Recipient" inverted>
                    Your authenticated wallet
                  </KeyValue>
                  <KeyValue label="Network" inverted>
                    Nimiq testnet
                  </KeyValue>
                  {payout?.txHash ? (
                    <KeyValue label="Transaction" mono inverted>
                      {payout.txHash}
                    </KeyValue>
                  ) : null}
                </dl>
                {payout?.txHash && payout.explorerUrl ? (
                  <a
                    href={payout.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-gold hover:text-[#ffd45c]"
                  >
                    View on explorer
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </div>
              <p className="mt-3 text-xs leading-5 text-dim">
                The fiat off-ramp is a labelled demo. It does not move fiat or
                contact an exchange. A production off-ramp requires a licensed
                provider and separate approval.
              </p>
            </Panel>
          ) : null}
        </div>

        <aside className="space-y-4">
          <Panel tone="sky" className="p-4">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel className="text-ink/55">Virtual portfolio</SectionLabel>
              <Badge tone="neutral">Simulation</Badge>
            </div>
            <p className="numeric mt-3 text-3xl font-semibold tracking-tight text-ink">
              {formatVirtualUnits(run.portfolio.value, run.portfolio.unit)}
            </p>
            <p className="mt-1 text-xs text-ink/55">
              No real token or DeFi position is involved.
            </p>
            <Divider className="my-4 bg-ink/15" />
            <dl className="divide-y divide-ink/10">
              <KeyValue label="Session maximum">
                {formatNim(run.maxRewardLuna)} NIM
              </KeyValue>
              <KeyValue label="Consultations">
                {run.responses.length} / {totalLevels}
              </KeyValue>
              <KeyValue label="State version">{run.stateVersion}</KeyValue>
            </dl>
          </Panel>

          <Panel className="p-4">
            <div className="flex items-center justify-between gap-2">
              <SectionLabel>Payout</SectionLabel>
              <StatusBadge label={payoutStatusLabel(payoutStatus)} />
            </div>
            <p className="numeric mt-3 text-xl font-semibold text-ink">
              {formatNim(displayPayoutAmount)} NIM
            </p>
            {payout?.txHash ? (
              <div className="mt-3 space-y-2">
                <p className="break-all font-mono text-[10px] leading-5 text-dim">
                  {payout.txHash}
                </p>
                {payout.explorerUrl ? (
                  <a
                    href={payout.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-info hover:text-ink"
                  >
                    View on explorer
                    <ExternalLinkIcon className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <p className="text-xs text-dim">Explorer link not available.</p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs leading-5 text-dim">
                No payout transaction hash has been returned yet.
              </p>
            )}

            {payoutStatus === "QUEUED" ? (
              <p className="mt-3 rounded-[14px] border border-ink/15 bg-gold p-2.5 text-xs leading-5 text-ink">
                The payout is queued. A queued or submitted payout is not a
                confirmed payment.
              </p>
            ) : null}
            {payoutStatus === "SUBMITTED" ? (
              <p className="mt-3 rounded-[14px] border border-ink/15 bg-gold p-2.5 text-xs leading-5 text-ink">
                Submitted to the network. Waiting for independent on-chain
                confirmation.
              </p>
            ) : null}
            {payoutStatus === "FAILED" || payoutStatus === "RECONCILING" ? (
              <p className="mt-3 rounded-[14px] border border-danger/25 bg-danger/[0.07] p-2.5 text-xs leading-5 text-danger">
                The payout needs reconciliation. No new payment is sent from this
                screen.
              </p>
            ) : null}
            {payoutTimedOut ? (
              <p className="mt-3 text-xs text-pending">
                Still processing — refresh to check again.
              </p>
            ) : null}
            {payoutQuery.isError ? (
              <ErrorState
                error={payoutQuery.error}
                title="Could not load payout status"
              />
            ) : null}
          </Panel>

          <Panel tone="gold" className="p-4">
            <SectionLabel className="text-ink/55">Safety</SectionLabel>
            <ul className="mt-2 space-y-2 text-xs leading-5 text-ink/70">
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
                  <LockIcon className="h-3 w-3" />
                </span>
                Reward amounts come from stored answers, never from browser
                input.
              </li>
              <li className="flex gap-2">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
                  <CheckIcon className="h-3 w-3" />
                </span>
                Confirmed means the backend verified the on-chain recipient,
                amount and network.
              </li>
            </ul>
          </Panel>
        </aside>
      </div>

      {decisionMutation.isError && !actionError ? (
        <ErrorState error={decisionMutation.error} title="Could not submit decision" />
      ) : null}
      {respondMutation.isError && !actionError ? (
        <ErrorState
          error={respondMutation.error}
          title="Could not submit consultation"
        />
      ) : null}
      {finishMutation.isError ? (
        <ErrorState error={finishMutation.error} title="Could not finish the run" />
      ) : null}

      <FiatOffRampModal
        open={offRampOpen}
        onClose={() => setOffRampOpen(false)}
        amountLuna={paidLuna}
        txHash={payout?.txHash ?? null}
        explorerUrl={payout?.explorerUrl ?? null}
      />
    </div>
  );
}

function RunNotFound() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <SectionLabel>Run / not found</SectionLabel>
      </div>
      <h1 className="text-2xl font-bold text-ink">Run not found</h1>
      <p className="max-w-lg text-sm leading-6 text-muted">
        This run does not exist or does not belong to your signed-in wallet.
      </p>
      <Link
        className="inline-flex min-h-11 items-center rounded-full border border-ink/15 bg-paper px-4 py-1.5 text-xs font-semibold text-ink/70 hover:border-ink/30 hover:text-ink"
        to="/"
      >
        Return to home
      </Link>
    </div>
  );
}
