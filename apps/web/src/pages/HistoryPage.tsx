import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function HistoryPage() {
  return (
    <div>
      <PageHeader
        title="History"
        description="Your own completed sessions and payout receipts will appear here after wallet authentication and the backend are implemented."
      />

      <section aria-labelledby="history-empty" className="mt-6 rounded border border-slate-200 bg-white p-4">
        <h2 id="history-empty" className="text-lg font-semibold">
          No sessions yet
        </h2>
        <p className="mt-2 max-w-2xl text-slate-700">
          Phase 1 does not collect wallet identity, session history or payout data. There is no
          history to show and no transaction reference exists.
        </p>
      </section>

      <p className="mt-6 text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/play">
          Go to lobby
        </Link>
      </p>
    </div>
  );
}
