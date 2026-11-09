import { useEffect, useMemo, useState } from "react";
import { Badge, Skeleton, cn } from "./ui";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return reduced;
}

function useTypewriter(text: string, enabled: boolean): string {
  const reduced = usePrefersReducedMotion();
  const [displayed, setDisplayed] = useState(enabled ? "" : text);

  useEffect(() => {
    if (!enabled || reduced) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let index = 0;
    const timer = window.setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [text, enabled, reduced]);

  return displayed;
}

export function AgentMessage({
  context,
  confidence,
  fallback,
  prompt,
  source,
  loading,
  className,
}: {
  context: string;
  confidence: "low" | "medium" | "high";
  fallback: string;
  prompt?: string;
  source?: "llm" | "scripted" | "external";
  loading?: boolean;
  className?: string;
}) {
  const text = prompt?.trim() || fallback;
  const displayed = useTypewriter(text, !loading);
  const sourceLabel =
    source === "llm"
      ? "LLM draft"
      : source === "external"
        ? "Agent submission"
        : "Scripted fallback";
  const confidenceLabel = useMemo(
    () => `${confidence} confidence`,
    [confidence],
  );

  return (
    <section
      aria-labelledby="agent-message-heading"
      className={cn("relative overflow-hidden rounded-lg border border-line bg-ink-2 p-4 sm:p-5", className)}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-gold/30 bg-gold/10 font-mono text-sm font-semibold text-gold">
            A
          </div>
          <div>
            <h3 id="agent-message-heading" className="text-sm font-semibold text-numeric">
              Agent message
            </h3>
            <p className="mt-0.5 text-[11px] text-dim">{context}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={source === "llm" || source === "external" ? "gold" : "neutral"}>
            {sourceLabel}
          </Badge>
          <Badge tone="neutral">{confidenceLabel}</Badge>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 space-y-2" role="status" aria-live="polite">
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-8/12" />
          <p className="pt-1 font-mono text-[11px] text-dim">
            Agent is reading the bundled evidence…
          </p>
        </div>
      ) : (
        <>
          <p className="sr-only" aria-live="polite">
            {text}
          </p>
          <p
            aria-hidden="true"
            className="mt-5 min-h-16 text-[15px] leading-7 text-body"
          >
            {displayed}
            {displayed.length < text.length ? (
              <span className="cursor-blink ml-0.5 text-gold">▍</span>
            ) : null}
          </p>
        </>
      )}
    </section>
  );
}
