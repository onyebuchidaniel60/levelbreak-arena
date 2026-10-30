import { Link, useParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function GamePage() {
  const { runId } = useParams();

  return (
    <div>
      <PageHeader
        title="Game session"
        description="This is the structural game shell. The three-level scenario engine is not connected in Phase 1."
      />

      <section aria-labelledby="game-status" className="mt-6 rounded border border-slate-200 bg-white p-4">
        <h2 id="game-status" className="text-lg font-semibold">
          Session not connected yet
        </h2>
        <p className="mt-2 text-slate-700">
          No game state, scenario decisions, consultations, rewards or payouts are active.
        </p>
        <p className="mt-3 break-all text-sm text-slate-600">
          Run reference from the URL: <code>{runId ?? "none"}</code>
        </p>
      </section>

      <p className="mt-6 text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/play">
          Back to lobby
        </Link>
      </p>
    </div>
  );
}
