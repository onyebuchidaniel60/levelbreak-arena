import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import {
  EmptyState,
  ErrorState,
  LoadingState,
  StatusBadge,
} from "../components/Feedback";
import { useAuth } from "../providers/AuthProvider";
import { useHistoryQuery } from "../hooks/useApi";
import { api } from "../lib/api";
import { formatDateTime, formatLuna, formatNim, payoutStatusLabel } from "../lib/format";
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
    return <p className="text-xs text-slate-600">No payout transaction hash returned.</p>;
  }

  return (
    <div className="text-xs text-slate-700">
      <p className="break-all">
        Transaction: <code>{item.txHash}</code>
      </p>
      {explorerUrl ? (
        <a
          className="font-medium text-sky-800 underline"
          href={explorerUrl}
          target="_blank"
          rel="noreferrer"
        >
          View on explorer
        </a>
      ) : (
        <p>Explorer link not available.</p>
      )}
    </div>
  );
}

export function HistoryPage() {
  const { me, meLoading, meError } = useAuth();
  const historyQuery = useHistoryQuery(Boolean(me));

  if (meLoading) {
    return (
      <div>
        <PageHeader
          title="History"
          description="Your own completed sessions and payout receipts."
        />
        <LoadingState label="Checking your wallet session…" />
      </div>
    );
  }
  if (meError) {
    return (
      <div>
        <PageHeader
          title="History"
          description="Your own completed sessions and payout receipts."
        />
        <ErrorState error={meError} title="Could not load your session" />
      </div>
    );
  }

  if (!me) {
    return (
      <div>
        <PageHeader
          title="History"
          description="Your own completed sessions and payout receipts."
        />
        <EmptyState title="Sign-in required">
          <p>
            Open this app in Nimiq Pay and sign in to see your own session history.
          </p>
          <p className="mt-3">
            <Link className="underline" to="/">
              Return to home
            </Link>
          </p>
        </EmptyState>
      </div>
    );
  }

  if (historyQuery.isLoading) {
    return (
      <div>
        <PageHeader
          title="History"
          description="Your own completed sessions, earned rewards and payout status."
        />
        <LoadingState label="Loading your history…" />
      </div>
    );
  }
  if (historyQuery.isError) {
    return (
      <div>
        <PageHeader
          title="History"
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

  return (
    <div>
      <PageHeader
        title="History"
        description="Your own completed sessions, earned rewards and payout status."
      />

      {completed.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No completed sessions yet.">
            <p>No completed sessions yet.</p>
            <p className="mt-3">
              <Link className="underline" to="/play">
                Go to the lobby
              </Link>
            </p>
          </EmptyState>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {completed.map((item) => (
            <li key={item.runId} className="rounded border border-slate-300 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">
                    Session {item.publicRef}
                  </h2>
                  <p className="mt-1 text-sm text-slate-700">
                    Completed {formatDateTime(item.completedAt)}
                  </p>
                </div>
                <p className="text-sm font-medium">
                  {formatNim(item.earnedLuna)} NIM earned ({formatLuna(item.earnedLuna)} Luna)
                </p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <StatusBadge label={payoutStatusLabel(item.payoutStatus)} />
                <span className="text-slate-700">
                  Payout amount: {formatNim(item.payoutAmountLuna)} NIM
                </span>
              </div>
              <div className="mt-3">
                <HistoryPayout item={item} />
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-6 text-sm">
        <Link className="font-medium text-sky-800 underline" to="/play">
          Go to the lobby
        </Link>
      </p>
    </div>
  );
}
