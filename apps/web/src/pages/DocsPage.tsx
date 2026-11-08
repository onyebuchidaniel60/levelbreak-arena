import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Badge, Panel, SectionLabel } from "../components/ui";

const documentNames = [
  "AGENTS.md — implementation rules and approval boundaries",
  "PROJECT_SPEC.md — product specification and Phase 7/8 amendments",
  "ARCHITECTURE.md — architecture, API contracts and environment variables",
  "IMPLEMENTATION_PLAN.md — phased plan and approval gates",
  "docs/DESIGN_DECISIONS.md — approved Direction 1 record and rejected directions",
  "docs/TESTING.md — unit, integration and deployed E2E coverage",
  "docs/OPERATIONS.md — operator runbook and payout safety",
  "docs/SECURITY.md — auth, payments, LLM data minimization and demo off-ramp",
];

export function DocsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Documentation"
        title="Build notes and operating rules."
        description="The repository is the source of truth. These are the documents a reviewer or operator should start with."
        actions={<Badge tone="neutral">Phase 8</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <SectionLabel>Repository documents</SectionLabel>
          <ul className="mt-3 space-y-2">
            {documentNames.map((name) => (
              <li key={name} className="flex gap-2.5 text-sm leading-6 text-muted">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" aria-hidden="true" />
                <span>{name}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-dim">
            The repository is public and MIT-licensed.{" "}
            <a
              className="text-info hover:text-blue-300"
              href="https://github.com/onyebuchidaniel60/levelbreak-arena"
              target="_blank"
              rel="noreferrer"
            >
              View the GitHub repository
            </a>
            . The global footer links to this page and to the repository.
          </p>
        </Panel>

        <Panel className="p-5">
          <SectionLabel>Current implementation</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-numeric">
            Phase 8 — Final functionality proof.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            The deployed preview uses the approved dark trading-terminal design
            across the landing page, lobby, five-level game, consultation, payout
            status, history, and support pages. It includes an LLM-assisted agent
            message with a scripted fallback and a clearly labelled demo fiat
            off-ramp.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            The five-level flow was proven end to end on Nimiq testnet with four
            accepted responses and one skip: a 2,000 Luna payout was confirmed
            on-chain. The underlying payment flow remains testnet-only: verified
            funding, server-derived rewards, one payout per run, and on-chain
            confirmation before a payout is shown as paid.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="paid">5 levels</Badge>
            <Badge tone="gold">LLM + fallback</Badge>
            <Badge tone="neutral">Demo off-ramp</Badge>
          </div>
        </Panel>
      </div>

      <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link className="font-medium text-info hover:text-blue-300" to="/how-it-works">
          How it works
        </Link>
        <Link className="font-medium text-info hover:text-blue-300" to="/play">
          Lobby
        </Link>
        <Link className="font-medium text-info hover:text-blue-300" to="/terms">
          Risk disclosure
        </Link>
      </p>
    </div>
  );
}
