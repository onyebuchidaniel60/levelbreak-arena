import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

export function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="How it works"
        description="LevelBreak Arena is a three-level simulated DeFi learning game on Nimiq testnet. The current Phase 4 preview is functional; final visual design comes later."
      />

      <section aria-labelledby="game-flow" className="space-y-3">
        <h2 id="game-flow" className="text-xl font-semibold">
          The game flow
        </h2>
        <ol className="list-decimal space-y-2 pl-5 text-slate-700">
          <li>Open the app in Nimiq Pay and sign a short-lived authentication challenge.</li>
          <li>Choose a session that has been funded and verified on the Nimiq testnet.</li>
          <li>Complete three simulated levels: stablecoin peg risk, liquidity-pool impermanent loss and yield-farming sustainability.</li>
          <li>At each level, answer or skip one evidence-backed consultation from a scripted requester.</li>
          <li>Finish the run. The backend calculates the reward from stored responses and queues one treasury payout.</li>
        </ol>
      </section>

      <section aria-labelledby="reward-rules" className="space-y-3">
        <h2 id="reward-rules" className="text-xl font-semibold">
          Reward rules
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          <li>One accepted consultation response earns 0.005 NIM (500 Luna).</li>
          <li>Skipping a consultation earns zero.</li>
          <li>At most three consultations are available in a session, for a maximum of 0.015 NIM (1,500 Luna).</li>
          <li>Reward amounts come from server-side rules, never from browser input.</li>
          <li>A queued or submitted payout is not a confirmed on-chain payment.</li>
        </ul>
      </section>

      <section aria-labelledby="funding-model" className="space-y-3">
        <h2 id="funding-model" className="text-xl font-semibold">
          Funding and payout disclosure
        </h2>
        <p className="max-w-3xl text-slate-700">
          The demo requester is scripted and controlled by the operator. Its separate
          testnet wallet sends an ordinary NIM transfer to an operator-controlled
          treasury. A session becomes available only after the incoming transaction is
          verified on-chain. Player payouts are ordinary transfers from that treasury.
        </p>
        <p className="max-w-3xl text-slate-700">
          This is a treasury-custody model, not HTLC escrow and not trustless settlement.
          Database reservations are accounting controls, not on-chain restrictions. The
          requester is not a live independent AI agent.
        </p>
      </section>

      <section aria-labelledby="preview-limits" className="space-y-3 rounded border border-amber-200 bg-amber-50 p-4">
        <h2 id="preview-limits" className="text-xl font-semibold">
          Preview limitations
        </h2>
        <p className="max-w-3xl text-slate-800">
          This is a testnet demo. Testnet NIM has no intended real-world value. The
          payout worker is disabled in this preview, so a payout may remain queued.
          Nimiq Pay device-level wallet verification is still a later Phase 5 checkpoint.
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
