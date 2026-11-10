import { useEffect, useRef, useState } from "react";
import type { ExchangeRates } from "@levelbreak-arena/contracts";
import { useExchangeRatesQuery } from "../hooks/useApi";
import { formatLuna, formatNim } from "../lib/format";
import { CheckIcon, CloseIcon, ExternalLinkIcon } from "./Icons";
import {
  Badge,
  Button,
  Divider,
  KeyValue,
  SectionLabel,
  Skeleton,
  cn,
} from "./ui";

type OffRampState = "idle" | "sending" | "success";
type FiatCurrency = "NGN" | "EUR" | "USD";

const CURRENCY_META = {
  NGN: { name: "Naira", symbol: "₦" },
  EUR: { name: "Euro", symbol: "€" },
  USD: { name: "Dollar", symbol: "$" },
} as const satisfies Record<FiatCurrency, { name: string; symbol: string }>;

const RATE_KEYS: Record<FiatCurrency, keyof ExchangeRates> = {
  NGN: "ngn",
  EUR: "eur",
  USD: "usd",
};

const CURRENCY_CODES = Object.keys(CURRENCY_META) as FiatCurrency[];
const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  usd: 0.0282,
  eur: 0.0251,
  ngn: 37.97,
};
const FIAT_AMOUNT_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const RATE_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 6,
});

function rateFor(currency: FiatCurrency, rates: ExchangeRates): number {
  return rates[RATE_KEYS[currency]];
}

function formatRate(currency: FiatCurrency, rate: number): string {
  return `${CURRENCY_META[currency].symbol}${RATE_FORMAT.format(rate)}`;
}

function calculateFiatAmount(
  amountLuna: string,
  currency: FiatCurrency,
  rates: ExchangeRates,
): {
  belowMinimum: boolean;
  display: string;
  rate: number;
} {
  const earnedNim = Number(amountLuna) / 100_000;
  const rate = rateFor(currency, rates);
  const rounded = Math.round((earnedNim * rate + Number.EPSILON) * 100) / 100;
  const belowMinimum = rounded < 0.01;

  return {
    rate,
    belowMinimum,
    display: belowMinimum
      ? "Less than 0.01"
      : `${CURRENCY_META[currency].symbol}${FIAT_AMOUNT_FORMAT.format(rounded)}`,
  };
}

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
  const [currency, setCurrency] = useState<FiatCurrency>("NGN");
  const [error, setError] = useState<string | null>(null);
  const exchangeRatesQuery = useExchangeRatesQuery(open);

  useEffect(() => {
    if (!open) return;
    setState("idle");
    setCurrency("NGN");
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

  const rates = exchangeRatesQuery.data ?? DEFAULT_EXCHANGE_RATES;
  const ratesLoading = exchangeRatesQuery.isLoading;
  const ratesError = exchangeRatesQuery.isError;
  const fiat = calculateFiatAmount(amountLuna, currency, rates);

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
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/75 p-4 backdrop-blur-sm sm:items-center sm:p-6"
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
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-lg flex-col overflow-hidden rounded-[28px] border border-ink/15 bg-paper p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl sm:max-h-[92vh] sm:p-6 sm:pb-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="eyebrow text-amber">Nimiq Pay</p>
              <Badge tone="gold">Demo</Badge>
            </div>
            <h2
              id="off-ramp-title"
              className="mt-2 text-2xl font-bold tracking-[-0.04em] text-ink"
            >
              Fiat Off-Ramp
            </h2>
            <p id="off-ramp-description" className="mt-1 text-sm leading-6 text-muted">
              Preview the Nimiq Pay fiat handoff.
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-cream text-ink/60 transition-colors hover:border-ink/30 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral"
            aria-label="Close off-ramp modal"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {state === "success" ? (
          <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1" role="status" aria-live="polite">
            <div className="flex flex-col items-center rounded-[24px] border border-positive/25 bg-positive/[0.08] px-4 py-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-positive text-paper">
                <CheckIcon className="h-7 w-7" />
              </span>
              <h3 className="mt-4 text-xl font-bold text-ink">
                Off-ramp request simulated
              </h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                No fiat currency was transferred, no exchange account was
                created, and no real off-ramp was contacted. This is a product
                demonstration using the confirmed testnet payout.
              </p>
            </div>
            <div className="mt-4 rounded-[18px] bg-ink p-4 text-cream">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                <span className="text-xs text-cream/50">
                  Simulated {currency} handoff
                </span>
                <span className="numeric whitespace-nowrap text-sm font-semibold text-gold">
                  {formatNim(amountLuna)} NIM → {fiat.display}
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
            <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionLabel>Receive currency</SectionLabel>
                <Badge tone={ratesError ? "pending" : "paid"}>
                  {ratesLoading ? "Loading rate" : ratesError ? "Fallback" : "Live rate"}
                </Badge>
              </div>
              <div
                role="group"
                aria-label="Fiat currency"
                className="mt-2 grid grid-cols-3 gap-1 rounded-full border border-ink/10 bg-cream p-1"
              >
                {CURRENCY_CODES.map((code) => {
                  const selected = code === currency;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setCurrency(code)}
                      aria-pressed={selected}
                      className={cn(
                        "flex min-h-12 flex-col items-center justify-center rounded-full px-2 py-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral",
                        selected
                          ? "bg-gold text-ink shadow-[0_2px_0_0_rgba(21,19,19,0.18)]"
                          : "text-ink/55 hover:bg-paper hover:text-ink",
                      )}
                    >
                      <span className="font-mono text-[11px] font-semibold tracking-[0.08em]">
                        {code}
                      </span>
                      <span
                        className={cn(
                          "mt-0.5 text-[10px] leading-4",
                          selected ? "text-ink/60" : "text-ink/40",
                        )}
                      >
                        {CURRENCY_META[code].name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-dim">Live rate</span>
                {ratesLoading ? (
                  <span className="flex items-center gap-1.5 text-ink/50">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral" />
                    Fetching live rate…
                  </span>
                ) : (
                  <span className="numeric whitespace-nowrap rounded-full bg-gold px-2.5 py-1 font-semibold text-ink">
                    1 NIM = {formatRate(currency, fiat.rate)}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[10px] leading-4 text-dim">
                {ratesLoading
                  ? "Fetching live rate from CoinGecko…"
                  : ratesError
                    ? "Live rate unavailable — using demo fallback. Demo only."
                    : "Live rate from CoinGecko. Demo only."}
              </p>
            </div>

            <div className="mt-3 rounded-[22px] border border-ink/15 bg-gold p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <SectionLabel className="text-ink/55">You receive</SectionLabel>
                <Badge tone="ink">{currency}</Badge>
              </div>
              {ratesLoading ? (
                <>
                  <Skeleton className="mt-2 h-10 w-40 bg-ink/10" />
                  <Skeleton className="mt-2 h-3 w-52 bg-ink/10" />
                </>
              ) : (
                <>
                  {fiat.belowMinimum ? (
                    <p className="mt-2 text-3xl font-bold leading-tight text-ink">
                      Less than <span className="numeric">0.01</span>
                    </p>
                  ) : (
                    <p className="numeric mt-2 whitespace-nowrap text-4xl font-semibold leading-tight text-ink">
                      {fiat.display}
                    </p>
                  )}
                  <p className="mt-1 break-words text-xs leading-5 text-ink/60">
                    {formatNim(amountLuna)} NIM ×{" "}
                    {formatRate(currency, fiat.rate)} per NIM
                  </p>
                </>
              )}
            </div>

            <div className="mt-3 rounded-[20px] border border-ink/10 bg-cream p-4">
              <dl className="divide-y divide-ink/10">
                <KeyValue label="Confirmed payout">
                  <span className="numeric">
                    {formatNim(amountLuna)} NIM
                  </span>
                  <span className="ml-1 text-xs text-dim">
                    ({formatLuna(amountLuna)} Luna)
                  </span>
                </KeyValue>
              </dl>
            </div>

            <div className="mt-3 rounded-[20px] border border-ink/15 bg-lilac/40 p-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink">
                Demo only — no fiat transfer
              </p>
              <p className="mt-1 text-xs leading-5 text-ink/65">
                Display-only CoinGecko rate. No fiat transfer and no exchange
                API is called for settlement. No KYC or treasury movement.
                Production off-ramp requires separate approval.
              </p>
            </div>

            {error ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {error}
              </p>
            ) : null}
            </div>

            <div className="mt-3 shrink-0 border-t border-ink/10 pt-3">
            <div className="flex flex-col gap-2 min-[360px]:flex-row">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                onClick={() => void handleSend()}
                disabled={state === "sending"}
              >
                {state === "sending" ? "Opening demo handoff…" : "Send to Nimiq Pay"}
              </Button>
              <Button
                variant="ghost"
                size="md"
                className="shrink-0 px-5"
                onClick={onClose}
              >
                Cancel
              </Button>
            </div>

            {txHash && explorerUrl ? (
              <>
                <Divider className="my-3" />
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-info hover:text-ink"
                >
                  View the confirmed payout on the explorer
                  <ExternalLinkIcon className="h-3.5 w-3.5" />
                </a>
              </>
            ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
