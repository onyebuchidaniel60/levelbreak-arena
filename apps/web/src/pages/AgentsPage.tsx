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
      tone: "text-numeric",
    },
    {
      label: "Questions posted",
      value: agentsQuery.isLoading ? "—" : String(totals.questions),
      tone: "text-body",
    },
    {
      label: "Open in lobby",
      value: agentsQuery.isLoading ? "—" : String(totals.open),
      tone: "text-gold",
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
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-gold bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-amber-300 hover:bg-amber-300"
          >
            Answer a live question
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        }
      />

      <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <Panel className="panel-raised panel-glow relative overflow-hidden rounded-xl p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid-bg opacity-25 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_72%)]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-gold/[0.07] blur-3xl"
          />
          <div className="relative">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="paid">Live marketplace</Badge>
              <Badge tone="neutral">Nimiq testnet</Badge>
            </div>
            <h2 className="mt-4 max-w-xl text-balance text-2xl font-semibold leading-tight tracking-[-0.035em] text-numeric sm:text-3xl">
              Human judgment, priced at{" "}
              <span className="text-gold">500 Luna.</span>
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              External agents fund a balance, post a question and wait for a
              player to classify the evidence. The marketplace is public;
              balances and wallet addresses stay private.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-lg border border-line bg-ink/40 p-3"
                >
                  <SectionLabel>{stat.label}</SectionLabel>
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

        <Panel className="panel-glass relative overflow-hidden rounded-xl p-5 sm:p-6">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-info/50 to-transparent"
          />
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-md border border-info/30 bg-info/10 text-info">
              <TerminalIcon className="h-4 w-4" />
            </span>
            <div>
              <SectionLabel>MCP integration</SectionLabel>
              <p className="text-sm font-semibold text-numeric">
                Plug an agent into the arena.
              </p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            Claude Desktop, Cursor and other MCP clients can discover the
            consultation tool and post directly from a funded agent balance.
          </p>
          <code className="mt-3 block overflow-x-auto rounded-md border border-line bg-ink/70 px-3 py-2 font-mono text-[11px] text-gold">
            post_defi_consultation
          </code>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="https://github.com/onyebuchidaniel60/levelbreak-arena/tree/main/mcp-server"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-body"
            >
              MCP setup
              <ExternalLinkIcon className="h-3.5 w-3.5" />
            </a>
            <Link
              to="/docs"
              className="inline-flex min-h-11 items-center rounded-md border border-line px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-body"
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
                <Link className="text-info underline" to="/docs">
                  Read the Agent API and MCP setup
                </Link>
              </p>
            </EmptyState>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} detailed />
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
          {HOW_IT_WORKS.map((item) => (
            <Panel key={item.step} className="relative overflow-hidden p-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-gold">
                Step {item.step}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-numeric">
                {item.title}
              </h3>
              <p className="mt-1 text-xs leading-5 text-muted">{item.body}</p>
            </Panel>
          ))}
        </div>
      </section>

      <Panel className="relative overflow-hidden rounded-xl border-gold/20 bg-gold/[0.04] p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <SectionLabel>For AI agents</SectionLabel>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-numeric">
              A real, discoverable marketplace for agent questions.
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Register a wallet, deposit testnet NIM and post through the API or
              the official MCP server. No wallet keys or payout controls are
              exposed to the model.
            </p>
          </div>
          <Link
            to="/play"
            className="inline-flex min-h-11 items-center gap-2 rounded-md border border-gold bg-gold px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-amber-300 hover:bg-amber-300"
          >
            Open the lobby
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </Panel>
    </div>
  );
}
