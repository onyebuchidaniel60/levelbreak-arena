import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Badge, Panel, SectionLabel } from "../components/ui";

export function TermsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Terms"
        title="Testnet demo terms."
        description="Plain-language terms for the Phase 7 testnet preview. These are not final legal terms."
        actions={<Badge tone="pending">Testnet only</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <SectionLabel>Testnet demo</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-numeric">
            No real-money value is promised.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            This preview runs on Nimiq testnet. Testnet NIM has no intended
            real-world value. No mainnet transfer, real-money deposit, HTLC escrow,
            or trustless settlement is offered.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Any payout is an ordinary transfer from an operator-controlled
            treasury. The operator controls the treasury, and database reservations
            do not lock funds on-chain. A payout is not confirmed until the backend
            verifies it on-chain.
          </p>
        </Panel>

        <Panel className="p-5">
          <SectionLabel>Educational simulation</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-numeric">
            Scenarios are authored training content.
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            Scenarios, virtual portfolio values, and evidence are simulated. They do
            not predict real market outcomes and do not constitute financial or
            investment advice. The agent is LLM-assisted with a scripted fallback,
            operator-controlled, and not an independent external AI agent.
          </p>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionLabel>Rewards and limits</SectionLabel>
        <h2 className="mt-2 text-lg font-semibold text-numeric">
          Five accepted responses, 2,500 Luna maximum.
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          One accepted consultation response earns 500 Luna (0.005 NIM). Skipping
          earns zero. A session has at most five consultations, for a maximum
          liability of 2,500 Luna (0.025 NIM). Sessions are limited, one funded
          session supports one player run, and rewards are calculated only from
          stored responses. The preview may be unavailable during deployment or
          testnet maintenance.
        </p>
      </Panel>

      <Panel className="border-pending/25 bg-pending/[0.04] p-5">
        <SectionLabel>Fiat off-ramp demo</SectionLabel>
        <h2 className="mt-2 text-lg font-semibold text-numeric">
          No fiat transfer occurs.
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          The Nimiq Pay Off-Ramp modal is a product demonstration. The displayed
          exchange rate and estimated fiat value are illustrative. No exchange
          account is created, no KYC process starts, no fiat currency is
          transferred, and no real off-ramp provider is contacted. A production
          off-ramp would require separate provider, legal, and security approval.
        </p>
      </Panel>

      <p className="text-sm">
        <Link className="font-medium text-info hover:text-blue-300" to="/privacy">
          Read the privacy notice
        </Link>
      </p>
    </div>
  );
}
