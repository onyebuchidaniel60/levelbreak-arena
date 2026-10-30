import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function LobbyPage() {
  return (
    <div>
      <PageHeader
        title="Lobby"
        description="The lobby will list funded sessions once the backend, wallet authentication and testnet funding verification are implemented."
      />

      <section
        aria-labelledby="session-status"
        className="mt-6 rounded border border-slate-200 bg-white p-4"
      >
        <h2 id="session-status" className="text-lg font-semibold">
          No funded session available yet
        </h2>
        <p className="mt-2 max-w-2xl text-slate-700">
          Phase 1 has no API connection, funding verifier or session data. Nothing here can be
          started, claimed or paid.
        </p>
        <p className="mt-3 text-sm text-slate-600">
          Wallet status: not connected. The wallet control is intentionally disabled until Phase 2.
        </p>
      </section>

      <p className="mt-6 text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/how-it-works">
          Read how funded sessions will work
        </Link>
      </p>
    </div>
  );
}
