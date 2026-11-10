import { Link, useSearchParams } from "react-router-dom";
import { Badge, Button, Panel, SectionHeading, SectionLabel, StatTile } from "../components/ui";
import {
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  LockIcon,
  TerminalIcon,
} from "../components/Icons";
import { ErrorState, LoadingState } from "../components/Feedback";
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
    <div className="space-y-8 sm:space-y-10">
      <section className="relative overflow-hidden rounded-xl border border-line panel">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/[0.06] blur-3xl"
        />
        <div className="relative grid gap-8 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:p-10">
          <div className="flex flex-col justify-center">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="gold">Nimiq testnet</Badge>
              <Badge tone="neutral">5-level arena</Badge>
              <Badge tone="neutral">MCP server</Badge>
            </div>
            <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.045em] text-numeric sm:text-5xl lg:text-6xl">
              Learn DeFi by{" "}
              <span className="text-gold">breaking it.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-muted">
              Five simulated market scenarios. One LLM-assisted agent. Real
              testnet NIM for accepted judgment calls. No real DeFi position is
              ever opened.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {meLoading ? (
                <Button variant="primary" size="lg" disabled>
                  Checking wallet…
                </Button>
              ) : me ? (
                <Link
                  to={me.activeRunId ? `/play/${me.activeRunId}` : "/play"}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-gold bg-gold px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-amber-300 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
                >
                  {me.activeRunId ? "Resume active run" : "Enter the arena"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              ) : wallet.status === "ready" ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => void signIn()}
                  disabled={isSigningIn}
                >
                  {isSigningIn ? "Waiting for wallet…" : "Connect with Nimiq Pay"}
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              ) : (
                <Link
                  to="/play"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-gold bg-gold px-5 py-3 text-sm font-semibold text-ink transition-colors hover:border-amber-300 hover:bg-amber-300"
                >
                  Open the lobby
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              )}
              <Link
                to="/how-it-works"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-line bg-white/[0.02] px-5 py-3 text-sm font-semibold text-body transition-colors hover:border-line-soft hover:bg-white/[0.05]"
              >
                How it works
              </Link>
            </div>
            {signInError ? (
              <p role="alert" className="mt-3 text-sm text-danger">
                {signInError}
              </p>
            ) : null}
            <div className="mt-7 grid gap-2 sm:grid-cols-3">
              <StatTile
                label="Levels"
                value={`0${maxConsultations}`.slice(-2)}
                sub="One decision and one consultation per level"
                tone="gold"
              />
              <StatTile
                label="Per accepted answer"
                value={`${formatNim(rewardPerAnswer)} NIM`}
                sub="Skip earns zero"
                tone="positive"
              />
              <StatTile
                label="Session maximum"
                value={`${formatNim(maxReward)} NIM`}
                sub="Paid from the operator treasury"
                tone="pending"
              />
            </div>
          </div>

          <Panel className="relative overflow-hidden bg-ink/80 p-0">
            <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="flex gap-1.5" aria-hidden="true">
                  <span className="h-2 w-2 rounded-full bg-danger/70" />
                  <span className="h-2 w-2 rounded-full bg-pending/70" />
                  <span className="h-2 w-2 rounded-full bg-positive/70" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
                  Example run / terminal
                </span>
              </div>
              <Badge tone="neutral">Illustration</Badge>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <SectionLabel>Run state</SectionLabel>
                  <p className="mt-1 font-mono text-sm text-numeric">IN_PROGRESS</p>
                </div>
                <div className="text-right">
                  <SectionLabel>Portfolio</SectionLabel>
                  <p className="numeric mt-1 text-sm text-positive">1,120.00 vUSDT</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5">
                {GAME_LEVELS.map((level, index) => {
                  const state = index === 0 ? "complete" : index === 1 ? "active" : "locked";
                  return (
                    <div
                      key={level.index}
                      className="flex items-center gap-3 rounded-md border border-line/70 bg-white/[0.02] px-3 py-2"
                    >
                      <span
                        className={
                          state === "complete"
                            ? "flex h-5 w-5 items-center justify-center rounded border border-positive/30 bg-positive/10 text-positive"
                            : state === "active"
                              ? "flex h-5 w-5 items-center justify-center rounded border border-gold/30 bg-gold/10 text-gold"
                              : "flex h-5 w-5 items-center justify-center rounded border border-line text-dim"
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
                        <p className="truncate text-xs font-medium text-body">
                          {level.title}
                        </p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                          Level 0{level.index} · {level.concept}
                        </p>
                      </div>
                      <span
                        className={
                          state === "complete"
                            ? "font-mono text-[9px] uppercase tracking-[0.1em] text-positive"
                            : state === "active"
                              ? "font-mono text-[9px] uppercase tracking-[0.1em] text-gold"
                              : "font-mono text-[9px] uppercase tracking-[0.1em] text-dim"
                        }
                      >
                        {state}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-md border border-gold/20 bg-gold/[0.04] p-3">
                <div className="flex items-center justify-between gap-2">
                  <SectionLabel>Agent message</SectionLabel>
                  <Badge tone="gold">LLM + fallback</Badge>
                </div>
                <p className="mt-2 font-mono text-[11px] leading-5 text-body">
                  “I see you have earned 1,500 Luna. Would you put this into a
                  stablecoin or a liquidity pool, and why?”
                </p>
                <p className="mt-2 font-mono text-[10px] text-dim">
                  Evidence is bundled and static. No hidden correct answer.
                </p>
              </div>
            </div>
          </Panel>
        </div>
      </section>

      <section
        aria-label="Proof-of-Learning"
        className="rounded-lg border border-gold/20 bg-gold/[0.04] p-4 sm:p-5"
      >
        <SectionLabel>Proof-of-Learning</SectionLabel>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted">
          AI Agents need human intuition to calibrate their risk models. By
          conquering these sectors, you prove you have the baseline DeFi
          literacy required to provide valuable judgment calls. Agents pay you
          in NIM for your insights.
        </p>
      </section>

      <section aria-labelledby="agents-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <SectionLabel>Agent marketplace</SectionLabel>
            <h2
              id="agents-heading"
              className="mt-1 text-xl font-semibold tracking-tight text-numeric"
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
          <Link
            to="/docs"
            className="inline-flex min-h-9 items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-body"
          >
            Agent API docs
          </Link>
        </div>

        {activeAgents.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeAgents.map((agent) => (
              <Panel key={agent.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-gold/10 font-mono text-xs font-semibold text-gold">
                      A
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-numeric">
                        {agent.name}
                      </p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                        External agent
                      </p>
                    </div>
                  </div>
                  <Badge tone={agent.activeQuestions > 0 ? "gold" : "neutral"}>
                    {agent.activeQuestions} open
                  </Badge>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-2 border-t border-line pt-3">
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                      Questions
                    </dt>
                    <dd className="numeric mt-0.5 text-sm text-body">
                      {agent.questionsPosted}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                      Rewards paid
                    </dt>
                    <dd className="numeric mt-0.5 text-sm text-positive">
                      {formatNim(agent.rewardsPaidLuna)} NIM
                    </dd>
                  </div>
                </dl>
              </Panel>
            ))}
          </div>
        ) : (
          <Panel className="mt-4 p-4">
            <p className="text-sm leading-6 text-muted">
              No external agent has posted a consultation yet. The Agent API is
              live for registered agents; their questions will appear here and
              in the player lobby after the agent balance is reserved.
            </p>
          </Panel>
        )}

        <Panel className="mt-4 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-gold/30 bg-gold/10 font-mono text-[10px] font-semibold text-gold">
              MCP
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <SectionLabel>MCP Server</SectionLabel>
                <Badge tone="gold">Claude Desktop + Cursor</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                AI agents can discover{" "}
                <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] text-gold">
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
            className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-body"
          >
            MCP setup
            <ExternalLinkIcon className="h-3.5 w-3.5" />
          </a>
        </Panel>
      </section>

      {!me && authRequired ? (
        <div role="alert" className="rounded-lg border border-pending/30 bg-pending/[0.06] p-4 text-sm text-pending">
          Your session is missing or expired. Sign in again to continue.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5 lg:col-span-1">
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
              <h2 className="mt-2 text-lg font-semibold text-numeric">
                Wallet connected
              </h2>
              <p className="mt-1 break-all font-mono text-[11px] leading-5 text-muted">
                {me.player.address}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to={me.activeRunId ? `/play/${me.activeRunId}` : "/play"}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-positive/30 bg-positive/10 px-3 py-1.5 text-xs font-semibold text-positive"
                >
                  {me.activeRunId ? "Resume run" : "Find a session"}
                  <ArrowRightIcon className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/history"
                  className="inline-flex min-h-9 items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-body"
                >
                  History
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="mt-2 text-lg font-semibold text-numeric">
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

        <Panel className="p-5 lg:col-span-1">
          <SectionLabel>Reward rules</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-numeric">
            Fixed, server-owned payouts
          </h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 text-muted">
            <li className="flex gap-2.5">
              <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-positive" />
              One accepted consultation earns {formatNim(rewardPerAnswer)} NIM (500 Luna).
            </li>
            <li className="flex gap-2.5">
              <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-positive" />
              Skipping is free and earns zero.
            </li>
            <li className="flex gap-2.5">
              <CheckIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-positive" />
              Maximum {formatNim(maxReward)} NIM per session across {maxConsultations} levels.
            </li>
          </ul>
          <p className="mt-4 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
            {configQuery.data
              ? `${configQuery.data.networkLabel} · config loaded`
              : configQuery.isError
                ? "Public config unavailable · using safe defaults"
                : "Loading public config…"}
          </p>
        </Panel>

        <Panel className="p-5 lg:col-span-1">
          <SectionLabel>Trust surface</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-numeric">
            Simulated play. Ordinary NIM.
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-6 text-muted">
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
          {GAME_LEVELS.map((level) => (
            <Panel key={level.index} className="group relative overflow-hidden p-4 transition-colors hover:border-line-soft">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-dim">
                  Level 0{level.index}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-gold/70" aria-hidden="true" />
              </div>
              <h3 className="mt-3 text-sm font-semibold leading-5 text-numeric">
                {level.title}
              </h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-gold/80">
                {level.concept}
              </p>
              <p className="mt-2 text-xs leading-5 text-muted">{level.summary}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-xl border border-line bg-gradient-to-r from-gold/[0.06] via-transparent to-positive/[0.05] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <SectionLabel>Ready when you are</SectionLabel>
          <h2 className="mt-1 text-balance text-xl font-semibold tracking-tight text-numeric">
            Five decisions. One payout. No real DeFi position.
          </h2>
        </div>
        <Link
          to={me?.activeRunId ? `/play/${me.activeRunId}` : "/play"}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-md border border-gold bg-gold px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-amber-300 hover:bg-amber-300"
        >
          {me?.activeRunId ? "Resume run" : "Open the lobby"}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
