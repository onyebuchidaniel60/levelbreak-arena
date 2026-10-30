import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="How it works"
        description="The planned MVP is a three-level simulated DeFi learning game with a scripted consultation task at each level. The game and payment flow are not active in Phase 1."
      />

      <section aria-labelledby="planned-game" className="space-y-3">
        <h2 id="planned-game" className="text-xl font-semibold">
          The planned game
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-slate-700">
          <li>Authenticate with a Nimiq wallet using a short-lived signed challenge.</li>
          <li>Choose a session that has been funded and verified on the Nimiq testnet.</li>
          <li>Work through three simulated levels: stablecoin peg risk, liquidity-pool impermanent loss and yield-farming sustainability.</li>
          <li>At each level, answer or skip one evidence-backed consultation from a scripted requester.</li>
          <li>At the end, the backend calculates the reward from stored responses and the operator treasury sends an ordinary NIM transfer.</li>
        </ol>
      </section>

      <section aria-labelledby="planned-rewards" className="space-y-3">
        <h2 id="planned-rewards" className="text-xl font-semibold">
          Planned reward rules
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>One accepted consultation response earns 0.005 NIM (500 Luna).</li>
          <li>Skipping a consultation earns zero.</li>
          <li>At most three consultations are available in a session, for a maximum of 0.015 NIM (1,500 Luna).</li>
          <li>Reward amounts come from server-side rules, never from browser input.</li>
          <li>A pending payout is not the same as a confirmed on-chain payment.</li>
        </ul>
      </section>

      <section aria-labelledby="funding-model" className="space-y-3">
        <h2 id="funding-model" className="text-xl font-semibold">
          Funding and payout disclosure
        </h2>
        <p className="max-w-3xl text-slate-700">
          The planned MVP uses a scripted demo requester controlled by the operator. Its separate
          testnet wallet sends an ordinary NIM transfer to an operator-controlled treasury. A session
          becomes available only after the incoming transaction is verified on-chain. Player payouts
          are ordinary transfers from that treasury.
        </p>
        <p className="max-w-3xl text-slate-700">
          This is a treasury-custody model, not HTLC escrow and not trustless settlement. Database
          reservations are accounting controls, not on-chain restrictions. The requester is not a
          live independent AI agent.
        </p>
      </section>

      <section aria-labelledby="phase-one-limits" className="space-y-3 rounded border border-amber-200 bg-amber-50 p-4">
        <h2 id="phase-one-limits" className="text-xl font-semibold">
          What is not implemented in Phase 1
        </h2>
        <p className="max-w-3xl text-slate-800">
          There is no wallet authentication, Nimiq SDK integration, funded-session verification,
          database, reward ledger or payout worker. Nothing on this preview can move funds or start a
          real game run.
        </p>
      </section>

      <p className="text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/play">
          Go to the lobby
        </Link>
      </p>
    </div>
  );
}
