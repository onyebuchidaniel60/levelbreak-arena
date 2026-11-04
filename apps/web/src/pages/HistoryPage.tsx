import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../components/Feedback";
import {
  Badge,
  Panel,
  SectionLabel,
  StatTile,
} from "../components/ui";
import { ExternalLinkIcon } from "../components/Icons";
import { useAuth } from "../providers/AuthProvider";
import { useHistoryQuery } from "../hooks/useApi";
import { api } from "../lib/api";
import {
  formatDateTime,
  formatLuna,
  formatNim,
  payoutStatusLabel,
} from "../lib/format";
import type { HistoryItem } from "@levelbreak-arena/contracts";
import { useQuery } from "@tanstack/react-query";

function HistoryPayout({ item }: { item: HistoryItem }) {
  const payoutQuery = useQuery({
    queryKey: ["history-payout", item.runId],
    queryFn: () => api.payout(item.runId),
    enabled: Boolean(item.txHash),
    staleTime: 30_000,
    retry: false,
  });
  const explorerUrl = payoutQuery.data?.explorerUrl ?? null;

  if (!item.txHash) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
        No payout transaction hash returned
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      <p className="break-all font-mono text-[10px] leading-5 text-dim">
        {item.txHash}
      </p>
      {explorerUrl ? (
        <a
          className="inline-flex items-center gap-1.5 text-xs font-medium text-info hover:text-blue-300"
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          View on explorer
          <ExternalLinkIcon className="h-3.5 w-3.5" />
        </a>
      ) : (
        <p className="text-xs text-dim">Explorer link not available.</p>
      )}
    </div>
  );
}

function paidAmount(item: HistoryItem): string {
  return item.payoutStatus === "CONFIRMED" ? item.payoutAmountLuna : "0";
}

function pendingAmount(item: HistoryItem): string {
  const earned = BigInt(item.earnedLuna);
  const paid = BigInt(paidAmount(item));
  return earned > paid ? (earned - paid).toString() : "0";
}

export function HistoryPage() {
  const { me, meLoading, meError } = useAuth();
  const historyQuery = useHistoryQuery(Boolean(me));

  if (meLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="History"
          title="Your runs"
          description="Your own completed sessions and payout receipts."
        />
        <LoadingState label="Checking your wallet session…" />
      </div>
    );
  }
  if (meError) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="History"
          title="Your runs"
          description="Your own completed sessions and payout receipts."
        />
        <ErrorState error={meError} title="Could not load your session" />
      </div>
    );
  }

  if (!me) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="History"
          title="Your runs"
          description="Your own completed sessions and payout receipts."
        />
        <EmptyState title="Sign-in required">
          <p>
            Open this app in Nimiq Pay and sign in to see your own session
            history.
          </p>
          <p className="mt-3">
            <Link className="text-info underline" to="/">
              Return to home
            </Link>
          </p>
        </EmptyState>
      </div>
    );
  }

  if (historyQuery.isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="History"
          title="Your runs"
          description="Your own completed sessions, earned rewards and payout status."
        />
        <LoadingState label="Loading your history…" />
      </div>
    );
  }
  if (historyQuery.isError) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="History"
          title="Your runs"
          description="Your own completed sessions, earned rewards and payout status."
        />
        <ErrorState
          error={historyQuery.error}
          onRetry={() => void historyQuery.refetch()}
          title="Could not load your history"
        />
      </div>
    );
  }

  const completed = (historyQuery.data?.items ?? []).filter(
    (item) => item.completedAt !== null,
  );
  const totals = completed.reduce(
    (acc, item) => {
      acc.earned += BigInt(item.earnedLuna);
      const paid = BigInt(paidAmount(item));
      acc.paid += paid;
      acc.pending += BigInt(pendingAmount(item));
      return acc;
    },
    { earned: 0n, paid: 0n, pending: 0n },
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="History"
        title="Your runs"
        description="Your own completed sessions, earned rewards and payout status."
        actions={
          <Link
            to="/play"
            className="inline-flex min-h-9 items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-body"
          >
            Go to lobby
          </Link>
        }
      />

      {completed.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Earned"
            value={`${formatNim(totals.earned.toString())} NIM`}
            sub="Across all completed runs"
            tone="positive"
          />
          <StatTile
            label="Pending"
            value={`${formatNim(totals.pending.toString())} NIM`}
            sub="Not yet confirmed on-chain"
            tone="pending"
          />
          <StatTile
            label="Paid"
            value={`${formatNim(totals.paid.toString())} NIM`}
            sub="Confirmed testnet payouts"
            tone="positive"
          />
        </div>
      ) : null}

      {completed.length === 0 ? (
        <EmptyState title="No completed sessions yet.">
          <p>
            Finish a funded run to create a payout record and see it here.
          </p>
          <p className="mt-3">
            <Link className="text-info underline" to="/play">
              Go to the lobby
            </Link>
          </p>
        </EmptyState>
      ) : (
        <div className="space-y-3">
          <div className="hidden grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)] gap-3 px-4 font-mono text-[10px] uppercase tracking-[0.12em] text-dim md:grid">
            <span>Session</span>
            <span>Earned</span>
            <span>Pending</span>
            <span>Paid</span>
            <span>Payout</span>
          </div>
          <ul className="space-y-3">
            {completed.map((item) => {
              const paid = paidAmount(item);
              const pending = pendingAmount(item);
              return (
                <li key={item.runId}>
                  <Panel className="p-4">
                    <div className="grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,1fr)] md:items-start md:gap-3">
                      <div className="min-w-0">
                        <SectionLabel>Session</SectionLabel>
                        <h2 className="mt-1 break-all text-sm font-semibold text-numeric">
                          {item.publicRef}
                        </h2>
                        <p className="mt-1 text-xs text-dim">
                          Completed {formatDateTime(item.completedAt)}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <StatusBadge label={payoutStatusLabel(item.payoutStatus)} />
                          <Badge tone="neutral">Level {item.levelIndex}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="eyebrow md:hidden">Earned</p>
                        <p className="numeric mt-1 text-sm font-semibold text-positive">
                          {formatNim(item.earnedLuna)} NIM
                        </p>
                        <p className="mt-1 text-[10px] text-dim">
                          {formatLuna(item.earnedLuna)} Luna
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow md:hidden">Pending</p>
                        <p className="numeric mt-1 text-sm font-semibold text-pending">
                          {formatNim(pending)} NIM
                        </p>
                        <p className="mt-1 text-[10px] text-dim">
                          {pending === "0" ? "Settled" : "Awaiting confirmation"}
                        </p>
                      </div>
                      <div>
                        <p className="eyebrow md:hidden">Paid</p>
                        <p className="numeric mt-1 text-sm font-semibold text-positive">
                          {formatNim(paid)} NIM
                        </p>
                        <p className="mt-1 text-[10px] text-dim">
                          {paid === "0" ? "No confirmed payout" : "On-chain"}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="eyebrow md:hidden">Payout</p>
                        <div className="mt-1">
                          <HistoryPayout item={item} />
                        </div>
                      </div>
                    </div>
                  </Panel>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-sm">
        <Link className="font-medium text-info hover:text-blue-300" to="/play">
          Go to the lobby
        </Link>
      </p>
    </div>
  );
}
