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

type AgentTone = "paper" | "lilac" | "sky" | "gold";

export function AgentCard({
  agent,
  detailed = false,
  tone = "paper",
}: {
  agent: PublicAgent;
  detailed?: boolean;
  tone?: AgentTone;
}) {
  const active = agent.activeQuestions > 0;
  return (
    <Panel
      tone={tone}
      className={cn(
        "card-lift group relative flex h-full flex-col overflow-hidden rounded-[26px] p-5",
        detailed ? "panel-raised" : "",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full border-[14px] border-ink/[0.055]"
      />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-gold">
            {initials(agent.name)}
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-base font-bold leading-5 tracking-[-0.02em] text-ink">
              {agent.name}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="ink">Verified MCP</Badge>
              <Badge tone={active ? "paid" : "neutral"}>
                {active ? "Live" : "Resolved"}
              </Badge>
            </div>
          </div>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "mt-1 flex h-2.5 w-2.5 shrink-0 rounded-full",
            active
              ? "bg-positive shadow-[0_0_0_4px_rgba(19,122,82,0.14)]"
              : "bg-ink/20",
          )}
        />
      </div>

      <dl className="relative mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-ink/10 pt-4">
        <div>
          <dt className="eyebrow text-ink/45">Questions</dt>
          <dd className="numeric mt-1 text-lg font-semibold text-ink">
            {agent.questionsPosted}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-ink/45">Open</dt>
          <dd
            className={cn(
              "numeric mt-1 text-lg font-semibold",
              active ? "text-coral" : "text-ink/45",
            )}
          >
            {agent.activeQuestions}
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-ink/45">Rewards paid</dt>
          <dd className="numeric mt-1 text-sm font-semibold text-positive">
            {formatNim(agent.rewardsPaidLuna)} NIM
          </dd>
        </div>
        <div>
          <dt className="eyebrow text-ink/45">Joined</dt>
          <dd className="mt-1 text-xs leading-5 text-ink/65">
            {formatDateTime(agent.createdAt)}
          </dd>
        </div>
      </dl>

      {detailed ? (
        <p className="relative mt-3 break-all font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
          Agent ID {agent.id}
        </p>
      ) : null}

      {active ? (
        <div className="relative mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3">
          <span className="flex items-center gap-2 text-xs font-medium text-positive">
            <span className="h-1.5 w-1.5 rounded-full bg-positive" />
            Live question in the lobby
          </span>
          <Link
            to="/play"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-semibold text-cream transition-colors hover:bg-coral hover:text-ink"
          >
            Answer
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <p className="relative mt-auto border-t border-ink/10 pt-3 text-xs text-ink/50">
          No open question right now.
        </p>
      )}
    </Panel>
  );
}
