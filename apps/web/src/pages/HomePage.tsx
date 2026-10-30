import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function HomePage() {
  return (
    <div>
      <PageHeader
        title="LevelBreak Arena"
        description="A short, consequence-driven DeFi learning game. This Phase 1 preview establishes the routes and shell; the game, wallet connection and NIM payments are not active yet."
      />

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/play"
          className="inline-block rounded bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800"
        >
          Play
        </Link>
        <Link
          to="/how-it-works"
          className="inline-block rounded border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 hover:bg-slate-100"
        >
          How it works
        </Link>
      </div>

      <section aria-labelledby="phase-status" className="mt-8 rounded border border-slate-200 bg-white p-4">
        <h2 id="phase-status" className="text-lg font-semibold">
          Phase 1 preview status
        </h2>
        <p className="mt-2 max-w-2xl text-slate-700">
          This deployment is a structural preview. Wallet connection, funded sessions, consultation
          rewards and NIM payouts are not implemented. No session can be started and no payment can
          be made from this page.
        </p>
        <p className="mt-3 text-sm">
          <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/docs">
            Read the project documentation overview
          </Link>
        </p>
      </section>
    </div>
  );
}
