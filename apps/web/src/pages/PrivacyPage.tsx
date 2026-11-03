import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Privacy"
        description="A short privacy notice for the Phase 4 testnet preview. This is not a final legal policy."
      />

      <section aria-labelledby="data-collected" className="space-y-3">
        <h2 id="data-collected" className="text-xl font-semibold">
          Data this preview processes
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>Your Nimiq wallet address and public key used for the signed login challenge.</li>
          <li>Short-lived authentication nonce metadata and verification timestamps.</li>
          <li>Game runs, scenario decisions, consultation responses and reward totals.</li>
          <li>Payout status and public testnet transaction hashes.</li>
          <li>An HttpOnly session cookie and a CSRF cookie required for authenticated requests.</li>
        </ul>
        <p className="max-w-3xl text-slate-700">
          Private keys, mnemonics and wallet signing material never reach the app or
          backend. The backend stores only public wallet identity and game/financial
          records needed to operate the demo.
        </p>
      </section>

      <section aria-labelledby="usage" className="space-y-3">
        <h2 id="usage" className="text-xl font-semibold">
          How the data is used
        </h2>
        <p className="max-w-3xl text-slate-700">
          Data is used to authenticate your wallet session, enforce one run per funded
          session, calculate rewards from persisted responses, show your own history and
          operate testnet payouts. Other players cannot access your session or history.
        </p>
      </section>

      <section aria-labelledby="hosting" className="space-y-3">
        <h2 id="hosting" className="text-xl font-semibold">
          Hosting and retention
        </h2>
        <p className="max-w-3xl text-slate-700">
          The frontend is hosted on Vercel, the API on Render and the database on
          managed PostgreSQL. Hosting providers may process standard technical request
          logs. Testnet records are retained for the demo and may be removed during
          operator cleanup.
        </p>
      </section>

      <p className="text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/terms">
          Read the risk disclosure
        </Link>
      </p>
    </div>
  );
}
