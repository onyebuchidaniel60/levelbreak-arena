import { useEffect, useRef, useState } from "react";
import {
  demoUsdPerNim,
  formatDemoUsdFromLuna,
  formatLuna,
  formatNim,
} from "../lib/format";
import { CheckIcon, CloseIcon, ExternalLinkIcon } from "./Icons";
import { Badge, Button, Divider, KeyValue } from "./ui";

type OffRampState = "idle" | "sending" | "success";

export function FiatOffRampModal({
  open,
  onClose,
  amountLuna,
  txHash,
  explorerUrl,
}: {
  open: boolean;
  onClose: () => void;
  amountLuna: string;
  txHash: string | null;
  explorerUrl: string | null;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [state, setState] = useState<OffRampState>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setState("idle");
    setError(null);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.setTimeout(() => closeRef.current?.focus(), 0);

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSend() {
    setError(null);
    setState("sending");
    try {
      // Demo-only handoff. No exchange API or funds movement occurs.
      await new Promise((resolve) => window.setTimeout(resolve, 900));
      setState("success");
    } catch {
      setState("idle");
      setError("The demo off-ramp could not be completed. Try again.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/80 p-4 backdrop-blur-sm sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="off-ramp-title"
        aria-describedby="off-ramp-description"
        className="panel-raised max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[92vh] sm:p-6 sm:pb-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow">Nimiq Pay</p>
              <Badge tone="pending">Demo</Badge>
            </div>
            <h2 id="off-ramp-title" className="mt-2 text-xl font-semibold tracking-tight text-numeric">
              Fiat Off-Ramp
            </h2>
            <p id="off-ramp-description" className="mt-1 text-sm leading-6 text-muted">
              A preview of how a confirmed NIM payout could be handed to a
              Nimiq Pay off-ramp.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line text-muted transition-colors hover:border-line-soft hover:text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70"
            aria-label="Close off-ramp modal"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {state === "success" ? (
          <div className="mt-6" role="status" aria-live="polite">
            <div className="flex flex-col items-center rounded-lg border border-positive/25 bg-positive/[0.06] px-4 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-positive/30 bg-positive/10 text-positive">
                <CheckIcon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-numeric">
                Off-ramp request simulated
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                No fiat currency was transferred, no exchange account was
                created, and no real off-ramp was contacted. This is a product
                demonstration using the confirmed testnet payout.
              </p>
            </div>
            <div className="mt-4 rounded-lg border border-line bg-ink-2 p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">Simulated handoff</span>
                <span className="numeric text-sm text-numeric">
                  {formatNim(amountLuna)} NIM → {formatDemoUsdFromLuna(amountLuna)}
                </span>
              </div>
            </div>
            <Button
              className="mt-5 w-full"
              variant="secondary"
              size="lg"
              onClick={onClose}
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-lg border border-line bg-ink-2 p-4">
              <dl className="divide-y divide-line">
                <KeyValue label="Confirmed payout">
                  <span className="numeric">
                    {formatNim(amountLuna)} NIM
                  </span>
                  <span className="ml-1 text-xs text-dim">
                    ({formatLuna(amountLuna)} Luna)
                  </span>
                </KeyValue>
                <KeyValue label="Indicative demo rate">
                  <span className="numeric">1 NIM = ${demoUsdPerNim.toFixed(2)}</span>
                </KeyValue>
                <KeyValue label="Estimated fiat">
                  <span className="numeric text-base font-semibold text-gold">
                    {formatDemoUsdFromLuna(amountLuna)}
                  </span>
                </KeyValue>
                {txHash ? (
                  <KeyValue label="Settlement" mono>
                    {txHash.slice(0, 10)}…{txHash.slice(-8)}
                  </KeyValue>
                ) : null}
              </dl>
            </div>

            <div className="mt-4 rounded-lg border border-pending/25 bg-pending/[0.06] p-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-pending">
                Demo only — no fiat transfer
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                The rate is illustrative. No exchange API is called, no KYC
                flow starts, and no funds leave the treasury. A production
                off-ramp requires a licensed provider and separate approval.
              </p>
            </div>

            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                onClick={() => void handleSend()}
                disabled={state === "sending"}
              >
                {state === "sending" ? "Opening demo handoff…" : "Send to Nimiq Pay"}
              </Button>
              <Button variant="ghost" size="md" onClick={onClose}>
                Cancel
              </Button>
            </div>

            {txHash && explorerUrl ? (
              <>
                <Divider className="my-4" />
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-info hover:text-blue-300"
                >
                  View the confirmed payout on the explorer
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
