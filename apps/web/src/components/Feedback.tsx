import type { ReactNode } from "react";
import type { ApiError } from "../lib/api";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <p role="status" className="text-sm text-slate-600">
      {label}
    </p>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const apiError = error as Partial<ApiError> | null;
  const message =
    error instanceof Error ? error.message : "The request could not be completed.";
  const requestId =
    apiError && typeof apiError.requestId === "string" ? apiError.requestId : null;

  return (
    <div role="alert" className="rounded border border-red-300 bg-red-50 p-4">
      <h2 className="font-semibold text-red-950">{title}</h2>
      <p className="mt-1 text-sm text-red-900">{message}</p>
      {requestId ? (
        <p className="mt-2 break-all text-xs text-red-800">
          Request ID: <code>{requestId}</code>
        </p>
      ) : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded border border-red-400 bg-white px-3 py-1 text-sm font-medium text-red-900 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-700"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm text-slate-700">{children}</div>
    </section>
  );
}

export function StatusBadge({ label }: { label: string }) {
  return (
    <span className="inline-block rounded border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800">
      {label}
    </span>
  );
}
