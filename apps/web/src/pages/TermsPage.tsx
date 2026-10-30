import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function TermsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Terms and risk disclosure"
        description="Plain-language terms for the Phase 1 preview. These are not final legal terms."
      />

      <section aria-labelledby="preview-terms" className="space-y-3">
        <h2 id="preview-terms" className="text-xl font-semibold">
          Phase 1 preview
        </h2>
        <p className="max-w-3xl text-slate-700">
          This site is an early structural preview. It does not provide a financial service, a real
          DeFi position, investment advice, a wallet connection, a funded game session or a payment.
          No button or page can move funds.
        </p>
        <p className="max-w-3xl text-slate-700">
          The planned MVP is testnet-only. Testnet NIM has no intended real-world value. Any future
          payout would be an ordinary transfer from an operator-controlled treasury, not HTLC escrow
          or trustless settlement.
        </p>
      </section>

      <section aria-labelledby="educational" className="space-y-3">
        <h2 id="educational" className="text-xl font-semibold">
          Educational simulation
        </h2>
        <p className="max-w-3xl text-slate-700">
          Scenarios and virtual portfolio values are simulations. They do not predict real market
          outcomes and do not constitute financial advice. The scripted requester is not a live
          independent AI agent.
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
