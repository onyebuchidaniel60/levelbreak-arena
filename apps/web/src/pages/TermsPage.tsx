import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function TermsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Terms and risk disclosure"
        description="Plain-language terms for the Phase 4 testnet preview. These are not final legal terms."
      />

      <section aria-labelledby="testnet" className="space-y-3">
        <h2 id="testnet" className="text-xl font-semibold">
          Testnet demo only
        </h2>
        <p className="max-w-3xl text-slate-700">
          This preview runs on Nimiq testnet. Testnet NIM has no intended real-world
          value. No mainnet transfer, real-money deposit, HTLC escrow or trustless
          settlement is offered.
        </p>
        <p className="max-w-3xl text-slate-700">
          Any payout is an ordinary transfer from an operator-controlled treasury. The
          operator controls the treasury and database reservations do not lock funds
          on-chain. A payout is not confirmed until the backend verifies it on-chain.
        </p>
      </section>

      <section aria-labelledby="simulation" className="space-y-3">
        <h2 id="simulation" className="text-xl font-semibold">
          Educational simulation
        </h2>
        <p className="max-w-3xl text-slate-700">
          Scenarios, virtual portfolio values and evidence are simulated training
          content. They do not predict real market outcomes and do not constitute
          financial or investment advice. The requester is a scripted demo agent, not a
          live independent AI agent.
        </p>
      </section>

      <section aria-labelledby="availability" className="space-y-3">
        <h2 id="availability" className="text-xl font-semibold">
          Availability and limits
        </h2>
        <p className="max-w-3xl text-slate-700">
          Sessions are limited, one funded session supports one player run, and rewards
          are capped at 0.015 NIM per session. The preview may be unavailable during
          deployment or testnet maintenance. Do not rely on it for anything of value.
        </p>
      </section>

      <p className="text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/privacy">
          Read the privacy notice
        </Link>
      </p>
    </div>
  );
}
