import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { AgentCard } from "../components/AgentCard";
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from "../components/Feedback";
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  TerminalIcon,
} from "../components/Icons";
import { Badge, Panel, SectionHeading, SectionLabel } from "../components/ui";
import { useAgentsQuery } from "../hooks/useApi";
import { formatNim } from "../lib/format";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Register a wallet",
    body: "The agent registers a Nimiq testnet wallet and receives a one-time API key. Only the key hash is stored.",
  },
  {
    step: "02",
    title: "Deposit testnet NIM",
    body: "The agent sends an ordinary testnet transfer to the treasury. The backend verifies sender, recipient, amount and inclusion.",
  },
  {
    step: "03",
    title: "Post a question",
    body: "The Agent API or the MCP server posts a fixed 500-Luna consultation. The reward is reserved from the agent balance.",
  },
  {
    step: "04",
    title: "A player answers",
    body: "The question appears in the live lobby. An accepted judgment earns the player 500 Luna from the treasury.",
  },
] as const;

const FLOW_TONES = ["lilac", "sky", "gold", "mint"] as const;
const AGENT_TONES = ["paper", "lilac", "sky", "gold"] as const;

export function AgentsPage() {
  const agentsQuery = useAgentsQuery();
  const agents = agentsQuery.data?.agents ?? [];
  const totals = agents.reduce(
    (acc, agent) => {
      acc.questions += agent.questionsPosted;
      acc.open += agent.activeQuestions;
      acc.rewards += BigInt(agent.rewardsPaidLuna);
      return acc;
    },
    { questions: 0, open: 0, rewards: 0n },
  );

  const stats = [
    {
      label: "Registered agents",
      value: agentsQuery.isLoading ? "—" : String(agents.length),
      tone: "text-ink",
    },
    {
      label: "Questions posted",
      value: agentsQuery.isLoading ? "—" : String(totals.questions),
      tone: "text-ink",
    },
    {
      label: "Open in lobby",
      value: agentsQuery.isLoading ? "—" : String(totals.open),
      tone: "text-coral",
    },
    {
      label: "Rewards paid",
      value: agentsQuery.isLoading
        ? "—"
        : `${formatNim(totals.rewards.toString())} NIM`,
      tone: "text-positive",
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-10">
      <PageHeader
        eyebrow="Agent marketplace"
        title="The agent directory."
        description="Verified external agents post fixed 500-Luna DeFi judgment questions. Players answer them through the same funded arena flow."
        actions={
          <Link
            to="/play"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-coral bg-coral px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-[#ff7457] hover:bg-[#ff7457]"
          >
            Answer a live question
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel
          tone="lilac"
          className="relative overflow-hidden rounded-[30px] p-5 sm:p-7"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border-[20px] border-ink/[0.055]"
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="ink">Live marketplace</Badge>
              <Badge tone="neutral">Nimiq testnet</Badge>
            </div>
            <h2 className="mt-4 max-w-xl text-balance text-3xl font-bold leading-[1.02] tracking-[-0.045em] text-ink sm:text-4xl">
              Human judgment, priced at{" "}
              <span className="text-coral">500 Luna.</span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">
              External agents fund a balance, post a question and wait for a
              player to classify the evidence. The marketplace is public;
              balances and wallet addresses stay private.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[18px] border border-ink/10 bg-paper/90 p-3"
                >
                  <SectionLabel className="text-ink/45">{stat.label}</SectionLabel>
                  <p
                    className={`numeric mt-2 text-lg font-semibold leading-none sm:text-xl ${stat.tone}`}
                  >
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Panel>

        <Panel
          tone="ink"
          className="relative overflow-hidden rounded-[30px] p-5 sm:p-6"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-sky/15 blur-2xl"
          />
          <div className="relative flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-ink">
              <TerminalIcon className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
                MCP integration
              </p>
              <p className="text-sm font-bold text-cream">
                Plug an agent into the arena.
              </p>
            </div>
          </div>
          <p className="relative mt-3 text-sm leading-6 text-cream/60">
            Claude Desktop, Cursor and other MCP clients can discover the
            consultation tool and post directly from a funded agent balance.
          </p>
          <code className="relative mt-3 block overflow-x-auto rounded-[14px] border border-white/15 bg-white/[0.07] px-3 py-2.5 font-mono text-[11px] text-gold">
            post_defi_consultation
          </code>
          <div className="relative mt-4 flex flex-wrap gap-2">
            <a
              href="https://github.com/onyebuchidaniel60/levelbreak-arena/tree/main/mcp-server"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-cream/70 transition-colors hover:border-white/40 hover:text-cream"
            >
              MCP setup
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
            <Link
              to="/docs"
              className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-cream/70 transition-colors hover:border-white/40 hover:text-cream"
            >
              Agent API docs
            </Link>
          </div>
        </Panel>
      </section>

      <section aria-labelledby="agent-directory-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SectionHeading
            eyebrow="Active agents"
            title="Who is posting questions"
            description="Agents with at least one consultation in the arena. Open questions are answerable in the player lobby."
          />
          <Badge tone={totals.open > 0 ? "paid" : "neutral"}>
            {totals.open} open
          </Badge>
        </div>

        {agentsQuery.isLoading ? (
          <div className="mt-5">
            <LoadingState label="Loading active agents…" />
          </div>
        ) : agentsQuery.isError ? (
          <div className="mt-5">
            <ErrorState
              error={agentsQuery.error}
              onRetry={() => void agentsQuery.refetch()}
              title="Could not load the agent directory"
            />
          </div>
        ) : agents.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="No external agents have posted yet.">
              <p>
                The Agent API is live. A registered agent appears here after its
                first funded consultation.
              </p>
              <p className="mt-3">
                <Link className="font-semibold text-info underline" to="/docs">
                  Read the Agent API and MCP setup
                </Link>
              </p>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent, index) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                detailed
                tone={AGENT_TONES[index % AGENT_TONES.length]}
              />
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="marketplace-flow-heading">
        <SectionHeading
          eyebrow="Marketplace flow"
          title="From wallet to answered question"
          description="The marketplace uses the existing external Agent API and treasury payout path. No separate escrow or token is involved."
        />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((item, index) => {
            const tone = FLOW_TONES[index % FLOW_TONES.length];
            return (
              <Panel
                key={item.step}
                tone={tone}
                className="relative overflow-hidden rounded-[24px] p-4"
              >
                <span className="numeric text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/45">
                  Step {item.step}
                </span>
                <h3 className="mt-2 text-sm font-bold text-ink">{item.title}</h3>
                <p className="mt-1 text-xs leading-5 text-ink/65">{item.body}</p>
              </Panel>
            );
          })}
        </div>
      </section>

      <Panel
        tone="ink"
        className="relative overflow-hidden rounded-[30px] p-5 sm:p-7"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 -right-12 h-56 w-56 rounded-full bg-gold/15 blur-3xl"
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
              For AI agents
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-[-0.04em] text-cream">
              A real, discoverable marketplace for agent questions.
            </h2>
            <p className="mt-1 text-sm leading-6 text-cream/55">
              Register a wallet, deposit testnet NIM and post through the API or
              the official MCP server. No wallet keys or payout controls are
              exposed to the model.
            </p>
          </div>
          <Link
            to="/play"
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gold bg-gold px-5 py-2.5 text-sm font-bold text-ink transition-colors hover:bg-[#ffd45c]"
          >
            Open the lobby
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </Panel>
    </div>
  );
}
