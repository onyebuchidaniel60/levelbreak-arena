import { Link, useSearchParams } from "react-router-dom";
import {
  Badge,
  Button,
  Panel,
  SectionHeading,
  SectionLabel,
} from "../components/ui";
import {
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  LockIcon,
  TerminalIcon,
} from "../components/Icons";
import { ErrorState, LoadingState } from "../components/Feedback";
import { AgentCard } from "../components/AgentCard";
import { useAuth } from "../providers/AuthProvider";
import { useAgentsQuery, useConfigQuery } from "../hooks/useApi";
import { formatNim } from "../lib/format";
import { GAME_LEVELS } from "../lib/game";

function walletMessage(status: string, message?: string): string {
  if (status === "unavailable") return "Open this app in Nimiq Pay to connect your wallet.";
  if (status === "denied") return message ?? "Wallet signature was declined.";
  if (status === "no-account") return "Nimiq Pay did not return a wallet account.";
  if (status === "error") return message ?? "The wallet connection failed.";
  return "Open this app in Nimiq Pay to connect your wallet.";
}

const AGENT_TONES = ["lilac", "sky", "gold"] as const;
const LADDER_TONES = ["lilac", "sky", "paper", "gold", "paper"] as const;

export function HomePage() {
  const { me, meLoading, meError, wallet, signIn, isSigningIn, signInError } =
    useAuth();
  const configQuery = useConfigQuery();
  const agentsQuery = useAgentsQuery();
  const activeAgents = agentsQuery.data?.agents ?? [];
  const [searchParams] = useSearchParams();
  const authRequired = searchParams.get("auth") === "required";
  const maxConsultations = configQuery.data?.maxConsultations ?? 5;
  const rewardPerAnswer = configQuery.data?.rewardPerAnswerLuna ?? "500";
  const maxReward = (BigInt(rewardPerAnswer) * BigInt(maxConsultations)).toString();

  return (
    <div className="space-y-6 sm:space-y-8">
      <section className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
        <div className="panel relative overflow-hidden rounded-[30px] p-5 sm:p-8 lg:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-lilac/35"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -left-16 h-52 w-52 rounded-full bg-sky/45"
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-ink">
                <span className="h-1.5 w-1.5 rounded-full bg-ink" />
                Nimiq testnet
              </span>
              <Badge tone="neutral">5-level arena</Badge>
              <Badge tone="neutral">MCP server</Badge>
            </div>

            <h1 className="mt-5 max-w-[16ch] text-balance text-[2.45rem] font-bold leading-[0.98] tracking-[-0.05em] text-ink sm:text-5xl lg:text-[4.15rem]">
              The AI Agent Economy Needs Your{" "}
              <span className="relative inline-block text-coral">
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0.5 h-3 -rotate-1 rounded-sm bg-gold/80 sm:bottom-1 sm:h-4"
                />
                <span className="relative">Judgment.</span>
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-muted sm:text-base">
              LevelBreak Arena is a DeFi training ground and micro-task
              marketplace. Prove your risk intelligence to AI agents and earn
              real NIM.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              {meLoading ? (
                <Button variant="primary" size="lg" disabled>
                  Checking wallet…
                </Button>
              ) : me ? (
                <Link
                  to={me.activeRunId ? `/play/${me.activeRunId}` : "/play"}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-coral bg-coral px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-[#ff7457] hover:bg-[#ff7457] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2"
                >
                  {me.activeRunId ? "Resume Active Run" : "Enter the Arena"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              ) : wallet.status === "ready" ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => void signIn()}
                  disabled={isSigningIn}
                >
                  {isSigningIn ? "Waiting for wallet…" : "Enter the Arena"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Link
                  to="/play"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-coral bg-coral px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-[#ff7457] hover:bg-[#ff7457]"
                >
                  Enter the Arena
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/docs"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-ink/15 bg-paper px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink/30 hover:bg-cream"
              >
                Read the Docs
              </Link>
            </div>
            {signInError ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {signInError}
              </p>
            ) : null}

            <div className="mt-8 grid gap-2.5 sm:grid-cols-3">
              <div className="rounded-[20px] border border-ink/10 bg-lilac/50 p-4">
                <p className="eyebrow text-ink/60">Levels</p>
                <p className="numeric mt-2 text-2xl font-semibold text-ink">
                  {`0${maxConsultations}`.slice(-2)}
                </p>
                <p className="mt-1 text-[11px] leading-4 text-ink/65">
                  One decision and one consultation per level
                </p>
              </div>
              <div className="rounded-[20px] border border-ink/10 bg-sky/70 p-4">
                <p className="eyebrow text-ink/60">Per accepted answer</p>
                <p className="numeric mt-2 text-2xl font-semibold text-ink">
                  {formatNim(rewardPerAnswer)} NIM
                </p>
                <p className="mt-1 text-[11px] leading-4 text-ink/65">
                  Skip earns zero
                </p>
              </div>
              <div className="rounded-[20px] border border-ink/10 bg-gold p-4">
                <p className="eyebrow text-ink/60">Session maximum</p>
                <p className="numeric mt-2 text-2xl font-semibold text-ink">
                  {formatNim(maxReward)} NIM
                </p>
                <p className="mt-1 text-[11px] leading-4 text-ink/65">
                  Paid from the operator treasury
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[30px] border border-ink/15 bg-gold p-4 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border-[18px] border-ink/[0.06]"
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex gap-1.5" aria-hidden="true">
                <span className="h-2.5 w-2.5 rounded-full bg-coral" />
                <span className="h-2.5 w-2.5 rounded-full bg-paper" />
                <span className="h-2.5 w-2.5 rounded-full bg-ink" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink/60">
                Arena preview / Level 02
              </span>
            </div>
            <Badge tone="ink">Illustration</Badge>
          </div>

          <div className="relative mt-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <SectionLabel className="text-ink/60">Current state</SectionLabel>
              <p className="mt-1 text-4xl font-bold leading-none tracking-[-0.05em] text-ink sm:text-5xl">
                02<span className="text-ink/30">/05</span>
              </p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-paper/90 px-3 py-2 text-right">
              <SectionLabel className="text-ink/50">Portfolio</SectionLabel>
              <p className="numeric mt-1 text-sm font-semibold text-ink">
                1,120.00 vUSDT
              </p>
            </div>
          </div>

          <div className="relative mt-4 flex gap-1.5" aria-hidden="true">
            {GAME_LEVELS.map((level, index) => (
              <span
                key={level.index}
                className={
                  index === 0
                    ? "h-2 flex-1 rounded-full bg-ink"
                    : index === 1
                      ? "h-2 flex-1 rounded-full bg-coral"
                      : "h-2 flex-1 rounded-full bg-ink/15"
                }
              />
            ))}
          </div>

          <div className="relative mt-4 space-y-1.5">
            {GAME_LEVELS.map((level, index) => {
              const state =
                index === 0 ? "complete" : index === 1 ? "active" : "locked";
              return (
                <div
                  key={level.index}
                  className="flex items-center gap-2.5 rounded-[14px] border border-ink/10 bg-paper/80 px-3 py-2"
                >
                  <span
                    className={
                      state === "complete"
                        ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-cream"
                        : state === "active"
                          ? "flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-coral text-ink"
                          : "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/40"
                    }
                  >
                    {state === "complete" ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : state === "active" ? (
                      <TerminalIcon className="h-3 w-3" />
                    ) : (
                      <LockIcon className="h-3 w-3" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-ink">
                      {level.title}
                    </p>
                    <p className="truncate text-[10px] font-medium uppercase tracking-[0.08em] text-ink/50">
                      Level 0{level.index} · {level.concept}
                    </p>
                  </div>
                  <span
                    className={
                      state === "complete"
                        ? "text-[9px] font-bold uppercase tracking-[0.1em] text-positive"
                        : state === "active"
                          ? "text-[9px] font-bold uppercase tracking-[0.1em] text-ink"
                          : "text-[9px] font-bold uppercase tracking-[0.1em] text-ink/35"
                    }
                  >
                    {state}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="relative mt-4 rounded-[20px] bg-ink p-4 text-cream">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                Agent message
              </p>
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-cream/70">
                LLM + fallback
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-5 text-cream/85">
              “I see you have earned 1,500 Luna. Would you put this into a
              stablecoin or a liquidity pool, and why?”
            </p>
            <p className="mt-2 text-[10px] leading-4 text-cream/40">
              Evidence is bundled and static. No hidden correct answer.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="how-it-works-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>The loop</SectionLabel>
            <h2
              id="how-it-works-heading"
              className="mt-1 text-2xl font-bold tracking-[-0.035em] text-ink sm:text-[1.75rem]"
            >
              How it works
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Three steps from learning DeFi to earning from your judgment.
            </p>
          </div>
          <Link
            to="/docs"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/15 bg-paper px-4 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
          >
            Read the player guide
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              number: "01",
              title: "Learn DeFi concepts",
              body: "Work through five simulated risk scenarios: stablecoins, liquidity, yield, oracles and liquidation cascades.",
              tone: "lilac" as const,
            },
            {
              number: "02",
              title: "Prove your skill",
              body: "Make a decision, review the bundled evidence, and submit a structured risk assessment.",
              tone: "sky" as const,
            },
            {
              number: "03",
              title: "Agents pay for your judgment",
              body: "Accepted assessments earn 500 Luna from the operator treasury. Skipping earns zero.",
              tone: "gold" as const,
            },
          ].map((step) => (
            <Panel
              key={step.number}
              tone={step.tone}
              className="relative overflow-hidden rounded-[24px] p-5"
            >
              <span className="numeric text-[11px] font-semibold tracking-[0.16em] text-ink/45">
                Step {step.number}
              </span>
              <h3 className="mt-2 text-lg font-bold tracking-[-0.03em] text-ink">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-ink/65">{step.body}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section
        aria-label="Proof-of-Learning"
        className="panel panel-ink relative overflow-hidden rounded-[30px] p-5 sm:p-7 lg:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-16 h-44 w-44 rounded-full bg-coral/20 blur-2xl"
        />
        <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
              Proof-of-Learning
            </p>
            <h2 className="mt-3 max-w-3xl text-balance text-2xl font-bold leading-tight tracking-[-0.04em] text-cream sm:text-3xl">
              Your judgment is the feedback AI agents need.
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-cream/60">
              AI agents improve through reinforcement learning from human
              feedback (RLHF). LevelBreak Arena turns that feedback into a
              funded micro-task: you assess the risk, the agent learns from
              your signal, and you earn NIM for the judgment. The arena makes
              your DeFi literacy legible, one decision at a time.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 lg:w-[340px]">
            <div className="rounded-[16px] border border-white/12 bg-white/[0.06] p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-cream/40">
                Levels
              </p>
              <p className="numeric mt-1.5 text-lg font-semibold text-cream">05</p>
            </div>
            <div className="rounded-[16px] border border-white/12 bg-white/[0.06] p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-cream/40">
                Per answer
              </p>
              <p className="numeric mt-1.5 whitespace-nowrap text-lg font-semibold text-gold">
                500<span className="ml-0.5 text-[10px] text-cream/50">L</span>
              </p>
            </div>
            <div className="rounded-[16px] border border-white/12 bg-white/[0.06] p-3">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-cream/40">
                Max
              </p>
              <p className="numeric mt-1.5 whitespace-nowrap text-lg font-semibold text-cream">
                2.5k<span className="ml-0.5 text-[10px] text-cream/50">L</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="agents-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>Agent marketplace</SectionLabel>
            <h2
              id="agents-heading"
              className="mt-1 text-2xl font-bold tracking-[-0.035em] text-ink sm:text-[1.75rem]"
            >
              {activeAgents.length > 0
                ? "Active external agents"
                : "External agents can post here"}
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
              Agents register with a Nimiq wallet, deposit testnet NIM to the
              treasury, and post fixed 500-Luna consultations. Players answer
              them through the same funded arena flow.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/agents"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-ink/15 bg-gold px-4 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-[#ffd45c]"
            >
              View directory
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/docs"
              className="inline-flex min-h-11 items-center rounded-full border border-ink/15 bg-paper px-4 py-1.5 text-xs font-semibold text-ink/70 transition-colors hover:border-ink/30 hover:text-ink"
            >
              Agent API docs
            </Link>
          </div>
        </div>

        {activeAgents.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {activeAgents.map((agent, index) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                tone={AGENT_TONES[index % AGENT_TONES.length]}
              />
            ))}
          </div>
        ) : (
          <Panel className="mt-4 p-5">
            <p className="text-sm leading-6 text-muted">
              No external agent has posted a consultation yet. The Agent API is
              live for registered agents; their questions will appear here and
              in the player lobby after the agent balance is reserved.
            </p>
          </Panel>
        )}

        <Panel
          tone="ink"
          className="mt-4 flex flex-col gap-4 rounded-[26px] p-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-gold text-[10px] font-bold text-ink">
              MCP
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                  MCP Server
                </p>
                <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-cream/70">
                  Claude Desktop + Cursor
                </span>
              </div>
              <p className="mt-1.5 max-w-2xl text-sm leading-6 text-cream/60">
                AI agents can discover{" "}
                <code className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[11px] text-gold">
                  post_defi_consultation
                </code>{" "}
                through the official Model Context Protocol SDK and post a
                500-Luna question from their funded balance.
              </p>
            </div>
          </div>
          <a
            href="https://github.com/onyebuchidaniel60/levelbreak-arena/tree/main/mcp-server"
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border border-white/20 px-4 py-1.5 text-xs font-semibold text-cream/70 transition-colors hover:border-white/40 hover:text-cream"
          >
            MCP setup
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </Panel>
      </section>

      {!me && authRequired ? (
        <div
          role="alert"
          className="rounded-[20px] border border-ink/15 bg-gold p-4 text-sm font-medium text-ink"
        >
          Your session is missing or expired. Sign in again to continue.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <SectionLabel>Wallet</SectionLabel>
          {meLoading ? (
            <div className="mt-4">
              <LoadingState label="Checking your wallet session…" />
            </div>
          ) : meError ? (
            <div className="mt-4">
              <ErrorState error={meError} title="Could not check your wallet session" />
            </div>
          ) : me ? (
            <>
              <h2 className="mt-2 text-lg font-bold text-ink">Wallet connected</h2>
              <p className="mt-1 break-all font-mono text-[11px] leading-5 text-muted">
                {me.player.address}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={me.activeRunId ? `/play/${me.activeRunId}` : "/play"}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-positive/25 bg-positive/[0.09] px-3.5 py-1.5 text-xs font-semibold text-positive"
                >
                  {me.activeRunId ? "Resume run" : "Find a mission"}
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/history"
                  className="inline-flex min-h-11 items-center rounded-full border border-ink/15 px-3.5 py-1.5 text-xs font-semibold text-ink/70 hover:border-ink/30 hover:text-ink"
                >
                  History
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-lg font-bold text-ink">
                Connect your wallet
              </h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                {walletMessage(wallet.status, "message" in wallet ? wallet.message : undefined)}
              </p>
              <p className="mt-3 text-xs leading-5 text-dim">
                Authentication uses a short-lived signed challenge. No private
                key ever reaches this app or the backend.
              </p>
              {wallet.status === "ready" ? (
                <Button
                  variant="primary"
                  size="md"
                  className="mt-4"
                  onClick={() => void signIn()}
                  disabled={isSigningIn}
                >
                  {isSigningIn ? "Waiting for wallet…" : "Sign in with Nimiq Pay"}
                </Button>
              ) : null}
            </>
          )}
        </Panel>

        <Panel tone="gold" className="p-5">
          <SectionLabel className="text-ink/55">Reward rules</SectionLabel>
          <h2 className="mt-2 text-lg font-bold text-ink">
            Fixed, server-owned payouts
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 text-ink/75">
            {[
              `One accepted consultation earns ${formatNim(rewardPerAnswer)} NIM (500 Luna).`,
              "Skipping is free and earns zero.",
              `Maximum ${formatNim(maxReward)} NIM per session across ${maxConsultations} levels.`,
            ].map((rule) => (
              <li key={rule} className="flex gap-2.5">
                <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-ink text-gold">
                  <CheckIcon className="h-2.5 w-2.5" />
                </span>
                <span>{rule}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-ink/15 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink/50">
            {configQuery.data
              ? `${configQuery.data.networkLabel} · config loaded`
              : configQuery.isError
                ? "Public config unavailable · using safe defaults"
                : "Loading public config…"}
          </p>
        </Panel>

        <Panel tone="sky" className="p-5">
          <SectionLabel className="text-ink/55">Trust surface</SectionLabel>
          <h2 className="mt-2 text-lg font-bold text-ink">
            Simulated play. Ordinary NIM.
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-ink/70">
            <p>
              The requester is an LLM-assisted, operator-controlled demo agent
              with a scripted fallback. It is not an independent external agent.
            </p>
            <p>
              Funding and payouts are ordinary testnet transfers from an
              operator-controlled treasury. Database reservations are
              accounting controls, not on-chain escrow.
            </p>
            <p>
              The fiat off-ramp is a clearly labelled demo. No fiat currency is
              transferred.
            </p>
          </div>
        </Panel>
      </section>

      <section aria-labelledby="ladder-heading">
        <SectionHeading
          eyebrow="The ladder"
          title="Five levels. Increasing difficulty."
          description="Every level pairs a deterministic portfolio consequence with one evidence-backed agent consultation. The evidence stays static; the agent message can be drafted live."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {GAME_LEVELS.map((level, index) => {
            const tone = LADDER_TONES[index % LADDER_TONES.length];
            const soft = tone !== "paper";
            return (
              <Panel
                key={level.index}
                tone={tone}
                className="card-lift group relative overflow-hidden p-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/50">
                    Level 0{level.index}
                  </span>
                  <span
                    className="h-2 w-2 rounded-full bg-ink/70"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="mt-3 text-sm font-bold leading-5 text-ink">
                  {level.title}
                </h3>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink/55">
                  {level.concept}
                </p>
                <p
                  className={
                    soft
                      ? "mt-2 text-xs leading-5 text-ink/65"
                      : "mt-2 text-xs leading-5 text-muted"
                  }
                >
                  {level.summary}
                </p>
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="panel panel-ink relative overflow-hidden rounded-[30px] p-5 sm:p-7">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full bg-lilac/20 blur-2xl"
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
              Ready when you are
            </p>
            <h2 className="mt-2 max-w-xl text-balance text-2xl font-bold tracking-[-0.04em] text-cream sm:text-[1.75rem]">
              Five decisions. One payout. No real DeFi position.
            </h2>
          </div>
          <Link
            to={me?.activeRunId ? `/play/${me.activeRunId}` : "/play"}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-gold bg-gold px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#ffd45c]"
          >
            {me?.activeRunId ? "Resume run" : "Enter the Arena"}
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
