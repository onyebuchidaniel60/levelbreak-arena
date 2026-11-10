import type { ReactNode } from "react";
import type { ApiError } from "../lib/api";
import { AlertIcon } from "./Icons";
import { Badge, Button, Panel, cn } from "./ui";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[18px] border border-ink/10 bg-paper p-4"
      role="status"
    >
      <span className="flex gap-1" aria-hidden="true">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral [animation-delay:120ms]" />
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold [animation-delay:240ms]" />
      </span>
      <p className="font-mono text-xs text-ink/60">{label}</p>
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
    <div
      role="alert"
      className="rounded-[20px] border border-danger/25 bg-danger/[0.07] p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger text-paper">
          <AlertIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="font-bold text-danger">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-ink/75">{message}</p>
          {requestId ? (
            <p className="mt-2 break-all font-mono text-[11px] text-ink/45">
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
    <Panel className={cn("relative overflow-hidden p-5 sm:p-6", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full border-[12px] border-ink/[0.045]"
      />
      <h2 className="relative text-xl font-bold tracking-[-0.03em] text-ink">
        {title}
      </h2>
      <div className="relative mt-2 max-w-2xl text-sm leading-6 text-muted">
        {children}
      </div>
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
