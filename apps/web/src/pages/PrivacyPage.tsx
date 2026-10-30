import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy"
        description="A short, Phase 1 privacy notice. This is a structural preview, not a final legal policy."
      />

      <section aria-labelledby="phase-one-data" className="space-y-3">
        <h2 id="phase-one-data" className="text-xl font-semibold">
          Data in this Phase 1 preview
        </h2>
        <p className="max-w-3xl text-slate-700">
          This preview does not ask for a wallet address, signature, wallet connection, session
          record, reward data or payment information. It does not set an authentication cookie and
          does not call a backend API.
        </p>
        <p className="max-w-3xl text-slate-700">
          The hosting provider may process standard technical request logs needed to serve the site.
          Those logs are controlled by the operator and hosting configuration.
        </p>
      </section>

      <section aria-labelledby="future-data" className="space-y-3">
        <h2 id="future-data" className="text-xl font-semibold">
          Planned future data
        </h2>
        <p className="max-w-3xl text-slate-700">
          Later phases are expected to process a Nimiq wallet address, authentication nonce and
          signature verification metadata, game session records and payout transaction references.
          The final privacy notice must be updated before those features are enabled.
        </p>
      </section>

      <p className="text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/how-it-works">
          Read how the planned game works
        </Link>
      </p>
    </div>
  );
}
