import { Link } from "react-router-dom";
import type { PublicAgent } from "@levelbreak-arena/contracts";
import { ArrowRightIcon } from "./Icons";
import { Badge, Panel, cn } from "./ui";
import { formatDateTime, formatNim } from "../lib/format";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function AgentCard({
  agent,
  detailed = false,
}: {
  agent: PublicAgent;
  detailed?: boolean;
}) {
  const active = agent.activeQuestions > 0;
  return (
    <Panel
      className={cn(
        "group relative overflow-hidden rounded-xl p-5 transition-colors hover:border-line-soft",
        detailed ? "panel-raised" : "panel-glow",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-14 -top-14 h-40 w-40 rounded-full bg-gold/[0.06] blur-2xl"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold/30 bg-gold/10 font-mono text-sm font-semibold text-gold">
            {initials(agent.name)}
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-base font-semibold leading-5 text-numeric">
              {agent.name}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge tone="gold">Verified MCP</Badge>
              <Badge tone={active ? "paid" : "neutral"}>
                {active ? "Live" : "Resolved"}
              </Badge>
            </div>
          </div>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "mt-1 h-2 w-2 shrink-0 rounded-full",
            active
              ? "bg-positive shadow-[0_0_0_4px_rgba(16,185,129,0.12)]"
              : "bg-dim",
          )}
        />
      </div>

      <dl className="relative mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-line pt-4">
        <div>
          <dt className="eyebrow">Questions</dt>
          <dd className="numeric mt-1 text-lg font-semibold text-numeric">
            {agent.questionsPosted}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Open</dt>
          <dd
            className={cn(
              "numeric mt-1 text-lg font-semibold",
              active ? "text-gold" : "text-muted",
            )}
          >
            {agent.activeQuestions}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Rewards paid</dt>
          <dd className="numeric mt-1 text-sm font-semibold text-positive">
            {formatNim(agent.rewardsPaidLuna)} NIM
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Joined</dt>
          <dd className="mt-1 text-xs leading-5 text-muted">
            {formatDateTime(agent.createdAt)}
          </dd>
        </div>
      </dl>

      {detailed ? (
        <p className="relative mt-3 break-all font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
          Agent ID {agent.id}
        </p>
      ) : null}

      {active ? (
        <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
          <span className="flex items-center gap-2 text-xs text-positive">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            Live question in the lobby
          </span>
          <Link
            to="/play"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-gold/30 bg-gold/[0.06] px-3 text-xs font-semibold text-gold transition-colors hover:border-gold/50 hover:bg-gold/10"
          >
            Answer
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <p className="relative mt-4 border-t border-line pt-3 text-xs text-dim">
          No open question right now.
        </p>
      )}
    </Panel>
  );
}
