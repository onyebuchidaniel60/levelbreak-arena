import type { ReactNode } from "react";
import type { ApiError } from "../lib/api";
import { AlertIcon } from "./Icons";
import { Badge, Button, Panel, cn } from "./ui";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="panel flex items-center gap-3 rounded-lg p-4" role="status">
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:240ms]" />
      </span>
      <p className="font-mono text-xs text-muted">{label}</p>
    </div>
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
    <div role="alert" className="rounded-lg border border-danger/30 bg-danger/[0.06] p-4">
      <div className="flex items-start gap-3">
        <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
        <div className="min-w-0">
          <h2 className="font-semibold text-danger">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-body">{message}</p>
          {requestId ? (
            <p className="mt-2 break-all font-mono text-[11px] text-dim">
              Request ID: {requestId}
            </p>
          ) : null}
          {onRetry ? (
            <Button
              variant="danger"
              size="sm"
              className="mt-3"
              onClick={onRetry}
            >
              Try again
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Panel className={cn("p-5", className)}>
      <h2 className="text-lg font-semibold tracking-tight text-numeric">{title}</h2>
      <div className="mt-2 text-sm leading-6 text-muted">{children}</div>
    </Panel>
  );
}

export function StatusBadge({
  label,
  tone,
}: {
  label: string;
  tone?: "neutral" | "paid" | "pending" | "error" | "info" | "gold";
}) {
  const inferred =
    tone ??
    (/(confirmed|paid|complete|earned|funded|available)/i.test(label)
      ? "paid"
      : /(queued|pending|submitted|building|reconciling|in progress|consultation)/i.test(
            label,
          )
        ? "pending"
        : /(failed|error|cancelled|expired|rejected)/i.test(label)
          ? "error"
          : "neutral");
  return <Badge tone={inferred}>{label}</Badge>;
}
