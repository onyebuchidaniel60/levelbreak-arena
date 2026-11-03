import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { EvidenceCard } from "../components/EvidenceCard";
import {
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../components/Feedback";
import {
  useDecisionMutation,
  useFinishMutation,
  usePayoutQuery,
  useRespondMutation,
  useRunQuery,
} from "../hooks/useApi";
import { isApiError } from "../lib/api";
import { formatNim, formatVirtualUnits, payoutStatusLabel, runStateLabel } from "../lib/format";
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

  const run = runQuery.data;
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
      <div>
        <h1 className="text-2xl font-semibold">Game session</h1>
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
        <div>
          <h1 className="text-2xl font-semibold">Sign-in required</h1>
          <p className="mt-2 text-sm text-slate-700">
            Your session expired. Return to the{" "}
            <Link className="underline" to="/?auth=required">
              sign-in page
            </Link>
            .
          </p>
        </div>
      );
    }
    return (
      <div>
        <h1 className="text-2xl font-semibold">Game session</h1>
        <div className="mt-4">
          <ErrorState
            error={runQuery.error}
            onRetry={() => void runQuery.refetch()}
            title="Could not load your run"
          />
        </div>
      </div>
    );
  }

  if (!run) return <RunNotFound />;

  const consultation = run.consultation;
  const payout = payoutQuery.data;
  const payoutStatus = payout?.status ?? run.payoutStatus;
  const payoutTimedOut =
    payoutDeadline !== null &&
    Date.now() > payoutDeadline &&
    payoutStatus !== "CONFIRMED" &&
    payoutStatus !== "FAILED";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Level {run.levelIndex} of 3</h1>
          <p className="mt-1 text-sm text-slate-700">
            Status: <StatusBadge label={runStateLabel(run.state)} />
          </p>
        </div>
        <Link className="text-sm font-medium text-sky-800 underline" to="/play">
          Back to lobby
        </Link>
      </div>

      <ol aria-label="Level progress" className="flex flex-wrap gap-2 text-sm">
        {[1, 2, 3].map((level) => {
          const complete = run.decisions.some((d) => d.levelIndex === level);
          const current = run.levelIndex === level && run.state !== "COMPLETED";
          return (
            <li
              key={level}
              aria-current={current ? "step" : undefined}
              className={[
                "rounded border px-3 py-1",
                complete
                  ? "border-slate-400 bg-slate-100 font-medium"
                  : current
                    ? "border-sky-700 bg-sky-50 font-medium"
                    : "border-slate-200 bg-white text-slate-600",
              ].join(" ")}
            >
              Level {level}
              {complete ? " ✓" : ""}
            </li>
          );
        })}
      </ol>

      <section
        aria-labelledby="portfolio-heading"
        className="rounded border border-slate-300 bg-white p-4"
      >
        <h2 id="portfolio-heading" className="text-lg font-semibold">
          Virtual portfolio
        </h2>
        <p className="mt-1 text-2xl font-semibold">
          {formatVirtualUnits(run.portfolio.value, run.portfolio.unit)}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Simulation-only units. No real DeFi position or token is involved.
        </p>
        <p className="mt-3 text-sm font-medium" aria-live="polite">
          {payoutStatus === "CONFIRMED"
            ? `${formatNim(run.earnedLuna)} NIM paid (payout confirmed)`
            : run.state === "COMPLETED_NO_REWARD"
              ? `${formatNim(run.earnedLuna)} NIM earned (no payout)`
              : payoutStatus === "FAILED" || payoutStatus === "RECONCILING"
                ? `${formatNim(run.earnedLuna)} NIM earned (payout ${payoutStatusLabel(payoutStatus)})`
                : `${formatNim(run.earnedLuna)} NIM earned (pending payout)`}
        </p>
        <p className="text-xs text-slate-600">
          Maximum for this session: {formatNim(run.maxRewardLuna)} NIM. Reward is
          only final after the backend persists accepted responses.
        </p>
      </section>

      {consequenceMessage ? (
        <p role="status" aria-live="polite" className="rounded border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950">
          {consequenceMessage}
        </p>
      ) : null}

      {rewardMessage ? (
        <p role="status" aria-live="polite" className="rounded border border-green-300 bg-green-50 p-3 text-sm font-medium text-green-950">
          {rewardMessage}
        </p>
      ) : null}

      {actionNotice ? (
        <p role="status" aria-live="polite" className="rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
          {actionNotice}
        </p>
      ) : null}

      {actionError ? (
        <ErrorState error={actionError} title="The action could not be completed" />
      ) : null}

      {run.state === "IN_PROGRESS" && run.scenario ? (
        <section aria-labelledby="scenario-heading" className="rounded border border-slate-300 bg-white p-4">
          <h2 id="scenario-heading" className="text-xl font-semibold">
            {run.scenario.title}
          </h2>
          <p className="mt-2 text-sm text-slate-700">{run.scenario.setting}</p>
          <p className="mt-3 text-slate-800">{run.scenario.situation}</p>
          <p className="mt-4 font-medium">{run.scenario.prompt}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {run.scenario.choices.map((choice) => (
              <button
                key={choice.decisionKey}
                type="button"
                onClick={() => void handleDecision(choice.decisionKey)}
                disabled={decisionMutation.isPending}
                className="rounded bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {choice.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-600">
            The backend decides the consequence. The browser only displays the returned result.
          </p>
        </section>
      ) : null}

      {run.state === "CONSULTATION_PENDING" && consultation ? (
        <section aria-labelledby="consultation-heading" className="rounded border border-slate-300 bg-white p-4">
          <h2 id="consultation-heading" className="text-xl font-semibold">
            Consultation from the scripted requester
          </h2>
          <p className="mt-1 text-sm text-slate-700">{consultation.agentContext}</p>
          <p className="text-xs text-slate-600">
            Confidence: {consultation.agentConfidence}
          </p>
          <p className="mt-3 text-slate-800">{consultation.agentMessage}</p>

          <div className="mt-4">
            <EvidenceCard evidence={consultation.evidence} />
          </div>

          <h3 className="mt-5 text-lg font-semibold">{consultation.question}</h3>
          <p className="mt-1 text-xs text-slate-600">
            There is no hidden correct answer. A valid submitted response earns the
            fixed reward.
          </p>
          <div className="mt-3 flex flex-col gap-2">
            {consultation.options.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => void handleRespond("ANSWER", option.key)}
                disabled={respondMutation.isPending}
                className="rounded border border-slate-300 bg-white px-3 py-2 text-left hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-slate-700"
              >
                <span className="font-medium">{option.label}</span>
                <span className="mt-0.5 block text-xs text-slate-600">
                  {option.description}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void handleRespond("SKIP")}
            disabled={respondMutation.isPending}
            className="mt-3 text-sm font-medium text-slate-700 underline hover:text-slate-900 disabled:opacity-60"
          >
            Skip — no reward
          </button>
        </section>
      ) : null}

      {lastDecision && run.state === "CONSULTATION_PENDING" ? (
        <section aria-labelledby="consequence-heading" className="rounded border border-slate-200 bg-slate-50 p-4">
          <h2 id="consequence-heading" className="text-lg font-semibold">
            Previous consequence
          </h2>
          <p className="mt-1 text-sm text-slate-800">
            {lastDecision.result.explanation}
          </p>
          <p className="mt-2 text-sm text-slate-700">{lastDecision.result.lesson}</p>
        </section>
      ) : null}

      {(run.state === "COMPLETED" ||
        run.state === "PAYOUT_QUEUED" ||
        run.state === "PAYOUT_SUBMITTED" ||
        run.state === "PAYOUT_CONFIRMED" ||
        run.state === "COMPLETED_NO_REWARD") && (
        <section aria-labelledby="finish-heading" className="rounded border border-slate-300 bg-white p-4">
          <h2 id="finish-heading" className="text-xl font-semibold">
            Session complete
          </h2>
          <p className="mt-2 text-sm text-slate-700">
            {run.responses.length} of 3 consultation actions recorded.{" "}
            {formatNim(run.earnedLuna)} NIM earned from accepted responses.
          </p>

          {run.state === "COMPLETED" ? (
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={finishMutation.isPending}
              className="mt-4 rounded bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {finishMutation.isPending ? "Finishing…" : "Finish and claim payout"}
            </button>
          ) : null}

          {finishResult && !finishResult.payoutId ? (
            <p className="mt-3 rounded border border-slate-300 bg-slate-50 p-3 text-sm text-slate-800">
              Session complete — no reward earned.
            </p>
          ) : null}

          {hasPayout ? (
            <div className="mt-4 space-y-2 rounded border border-slate-300 bg-slate-50 p-3">
              <p className="text-sm">
                Payout status:{" "}
                <StatusBadge label={payoutStatusLabel(payoutStatus)} />
              </p>
              <p className="text-sm text-slate-700">
                Amount: {formatNim(payout?.amountLuna ?? run.earnedLuna)} NIM
              </p>
              {payout?.txHash ? (
                <p className="break-all text-sm text-slate-700">
                  Transaction: <code>{payout.txHash}</code>
                </p>
              ) : (
                <p className="text-sm text-slate-700">
                  No payout transaction hash has been returned yet.
                </p>
              )}
              {payout?.txHash && payout.explorerUrl ? (
                <a
                  className="text-sm font-medium text-sky-800 underline"
                  href={payout.explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  View on explorer
                </a>
              ) : payout?.txHash ? (
                <p className="text-sm text-slate-700">Explorer link not available.</p>
              ) : null}
              {payoutStatus === "QUEUED" ? (
                <p className="text-sm text-slate-700">
                  The payout is queued. The treasury worker is disabled in this
                  preview, so confirmation is owned by Phase 5.
                </p>
              ) : null}
              {payoutStatus === "SUBMITTED" ? (
                <p className="text-sm text-slate-700">
                  The payout was submitted and is awaiting chain confirmation.
                </p>
              ) : null}
              {payoutStatus === "FAILED" || payoutStatus === "RECONCILING" ? (
                <p className="text-sm text-red-800">
                  The payout needs reconciliation. No new payment is sent from this screen.
                </p>
              ) : null}
              {payoutTimedOut ? (
                <p className="text-sm text-amber-900">
                  Payout still processing — refresh to check again.
                </p>
              ) : null}
              {payoutQuery.isError ? (
                <ErrorState error={payoutQuery.error} title="Could not load payout status" />
              ) : null}
            </div>
          ) : null}

          {lastResponse ? (
            <p className="mt-3 text-xs text-slate-600">
              Last consultation: {lastResponse.result === "ANSWERED" ? "answered" : "skipped"}.
            </p>
          ) : null}
        </section>
      )}

      {decisionMutation.isError && !actionError ? (
        <ErrorState error={decisionMutation.error} title="Could not submit decision" />
      ) : null}
      {respondMutation.isError && !actionError ? (
        <ErrorState error={respondMutation.error} title="Could not submit consultation" />
      ) : null}
      {finishMutation.isError ? (
        <ErrorState error={finishMutation.error} title="Could not finish the run" />
      ) : null}
    </div>
  );
}

function RunNotFound() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">Run not found</h1>
      <p className="mt-2 text-sm text-slate-700">
        This run does not exist or does not belong to your signed-in wallet.
      </p>
      <p className="mt-4 text-sm">
        <Link className="font-medium text-sky-800 underline" to="/">
          Return to home
        </Link>
      </p>
    </div>
  );
}
