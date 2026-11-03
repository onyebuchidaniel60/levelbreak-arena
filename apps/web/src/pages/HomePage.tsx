import { Link, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { ErrorState, LoadingState } from "../components/Feedback";
import { useAuth } from "../providers/AuthProvider";
import { useConfigQuery } from "../hooks/useApi";
import { formatNim } from "../lib/format";

export function HomePage() {
  const { me, meLoading, meError, wallet } = useAuth();
  const configQuery = useConfigQuery();
  const [searchParams] = useSearchParams();
  const authRequired = searchParams.get("auth") === "required";

  if (meLoading) {
    return (
      <div>
        <PageHeader
          title="LevelBreak Arena"
          description="A three-level simulated DeFi learning game on Nimiq testnet."
        />
        <LoadingState label="Checking your wallet session…" />
      </div>
    );
  }

  if (meError) {
    return (
      <div>
        <PageHeader
          title="LevelBreak Arena"
          description="A three-level simulated DeFi learning game on Nimiq testnet."
        />
        <ErrorState
          error={meError}
          title="Could not check your wallet session"
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="LevelBreak Arena"
        description="A three-level simulated DeFi learning game. Make decisions, review evidence-backed consultations, and earn small Nimiq testnet rewards for accepted responses."
      />

      {!me && authRequired ? (
        <p
          role="alert"
          className="mt-4 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950"
        >
          Your session is missing or expired. Sign in again to continue.
        </p>
      ) : null}

      {me ? (
        <section
          aria-labelledby="signed-in"
          className="mt-6 rounded border border-slate-300 bg-white p-4"
        >
          <h2 id="signed-in" className="text-lg font-semibold">
            Wallet connected
          </h2>
          <p className="mt-1 break-all text-sm text-slate-700">
            Signed in as <span className="font-mono">{me.player.address}</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={me.activeRunId ? `/play/${me.activeRunId}` : "/play"}
              className="rounded bg-sky-700 px-4 py-2 font-medium text-white hover:bg-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-900"
            >
              {me.activeRunId ? "Resume active run" : "Play"}
            </Link>
            <Link
              to="/history"
              className="rounded border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700"
            >
              History
            </Link>
            <Link
              to="/how-it-works"
              className="rounded border border-slate-300 bg-white px-4 py-2 font-medium text-slate-800 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-700"
            >
              How it works
            </Link>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="connect-wallet"
          className="mt-6 rounded border border-slate-300 bg-white p-4"
        >
          <h2 id="connect-wallet" className="text-lg font-semibold">
            Connect your wallet
          </h2>
          {wallet.status === "unavailable" ? (
            <p className="mt-2 text-sm text-slate-700" aria-live="polite">
              Open this app in Nimiq Pay to connect your wallet.
            </p>
          ) : wallet.status === "ready" ? (
            <p className="mt-2 break-all text-sm text-slate-700">
              Wallet detected: <span className="font-mono">{wallet.address}</span>.
              Use the sign-in control above to authenticate.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-700" aria-live="polite">
              {wallet.status === "detecting"
                ? "Checking for Nimiq Pay…"
                : wallet.status === "denied"
                  ? wallet.message
                  : wallet.status === "no-account"
                    ? "Nimiq Pay did not return a wallet account."
                    : wallet.status === "error"
                      ? wallet.message
                      : "Open this app in Nimiq Pay to connect your wallet."}
            </p>
          )}
          <p className="mt-3 text-sm text-slate-700">
            Wallet authentication uses a short-lived signed challenge. No private key
            ever reaches this app or the backend.
          </p>
        </section>
      )}

      <section
        aria-labelledby="reward-rules"
        className="mt-6 rounded border border-slate-200 bg-white p-4"
      >
        <h2 id="reward-rules" className="text-lg font-semibold">
          Testnet reward rules
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>One accepted consultation response earns 0.005 NIM (500 Luna).</li>
          <li>Skipping a consultation earns zero.</li>
          <li>Up to three consultations per funded session, maximum 0.015 NIM.</li>
          <li>
            Current public config:{" "}
            {configQuery.data ? (
              <>
                {formatNim(configQuery.data.rewardPerAnswerLuna)} NIM per answer,{" "}
                {configQuery.data.maxConsultations} consultations,{" "}
                {configQuery.data.networkLabel}
              </>
            ) : configQuery.isError ? (
              "Configuration unavailable"
            ) : (
              "Loading configuration…"
            )}
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate-700">
          This is a simulated learning game. Scenarios do not predict real market
          outcomes and are not financial advice. The requester is a scripted demo
          agent controlled by the operator, not a live AI agent.
        </p>
      </section>
    </div>
  );
}
