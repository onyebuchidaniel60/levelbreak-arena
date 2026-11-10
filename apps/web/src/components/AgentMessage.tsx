import { useEffect, useMemo, useState } from "react";
import { Badge, cn } from "./ui";

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
  verified = false,
  loading,
  className,
}: {
  context: string;
  confidence: "low" | "medium" | "high";
  fallback: string;
  prompt?: string;
  source?: "llm" | "scripted" | "external";
  verified?: boolean;
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
      className={cn(
        "relative overflow-hidden rounded-[26px] border border-ink bg-ink p-4 text-cream sm:p-5",
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-lilac/20 blur-2xl"
      />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lilac text-sm font-bold text-ink">
            A
          </div>
          <div className="min-w-0">
            <h3
              id="agent-message-heading"
              className="text-sm font-bold tracking-[-0.01em] text-cream"
            >
              Agent message
            </h3>
            <p className="mt-0.5 break-words text-[11px] leading-4 text-cream/50">
              {context}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={source === "llm" || source === "external" ? "gold" : "dark"}>
            {sourceLabel}
          </Badge>
          {verified ? <Badge tone="gold">Verified MCP</Badge> : null}
          <Badge tone="dark">{confidenceLabel}</Badge>
        </div>
      </div>

      {loading ? (
        <div className="relative mt-5 space-y-2" role="status" aria-live="polite">
          <div className="h-4 w-11/12 animate-pulse rounded-xl bg-white/10" />
          <div className="h-4 w-8/12 animate-pulse rounded-xl bg-white/10" />
          <p className="pt-1 font-mono text-[11px] text-cream/45">
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
            className="relative mt-5 min-h-16 text-[15px] leading-7 text-cream/85"
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
