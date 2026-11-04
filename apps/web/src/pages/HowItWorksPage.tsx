import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Badge, Panel, SectionHeading, SectionLabel } from "../components/ui";
import { CheckIcon, LockIcon, TerminalIcon } from "../components/Icons";

const flow = [
  {
    title: "Connect a Nimiq wallet",
    body: "Open the app in Nimiq Pay and sign a short-lived challenge. The signature proves wallet ownership; it cannot move funds.",
  },
  {
    title: "Claim a funded session",
    body: "A session appears only after the operator-controlled demo wallet's funding transfer is verified on the Nimiq testnet. One session supports one player run.",
  },
  {
    title: "Play five levels",
    body: "Each level presents a simulated DeFi scenario. Choose a decision and see the deterministic portfolio consequence. No real position is opened.",
  },
  {
    title: "Answer or skip the agent",
    body: "After each decision, the LLM-assisted agent presents one evidence-backed consultation. The evidence is bundled and static; the agent message may be LLM-drafted with a scripted fallback.",
  },
  {
    title: "Finish and reconcile the payout",
    body: "The backend derives the reward from stored responses, creates one payout record, and the serialized treasury worker sends an ordinary testnet NIM transfer.",
  },
];

export function HowItWorksPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="How it works"
        title="A five-level DeFi judgment game."
        description="LevelBreak Arena pairs simulated market consequences with evidence-backed agent consultations. The goal is to make risk legible, not to predict markets."
        actions={<Badge tone="gold">Nimiq testnet</Badge>}
      />

      <Panel className="p-5 sm:p-6">
        <SectionHeading
          eyebrow="The loop"
          title="Decide → see the consequence → brief the agent."
          description="Every step is server-authoritative. The browser renders state; it does not decide outcomes or reward amounts."
        />
        <ol className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {flow.map((step, index) => (
            <li key={step.title} className="rounded-lg border border-line bg-white/[0.02] p-4">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-gold">
                Step 0{index + 1}
              </span>
              <h3 className="mt-2 text-sm font-semibold text-numeric">{step.title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="p-5">
          <SectionLabel>Reward rules</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-numeric">Fixed, not variable.</h2>
          <ul className="mt-3 space-y-2.5 text-sm leading-6 text-muted">
            <li className="flex gap-2.5">
              <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-positive" />
              One accepted consultation response earns 0.005 NIM (500 Luna).
            </li>
            <li className="flex gap-2.5">
              <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-positive" />
              Skipping is free and earns zero.
            </li>
            <li className="flex gap-2.5">
              <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-positive" />
              Five consultations maximum, for a 0.025 NIM (2,500 Luna) session cap.
            </li>
            <li className="flex gap-2.5">
              <CheckIcon className="mt-1 h-4 w-4 shrink-0 text-positive" />
              The backend derives the payout from stored answers; the client cannot
              choose the amount or recipient.
            </li>
          </ul>
        </Panel>

        <Panel className="p-5">
          <SectionLabel>Agent disclosure</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-numeric">LLM-assisted, operator-controlled.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            The agent message can be drafted by an OpenAI-compatible LLM using the
            current scenario, question, bundled evidence summary, and the player's
            own earned amount. It never fetches live evidence, changes the question,
            scores answers, or triggers payments.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            If the LLM key is missing, the provider times out, or the output is
            invalid, the versioned scripted message is used. There is no hidden
            correct answer in either path.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="gold">LLM draft</Badge>
            <Badge tone="neutral">Scripted fallback</Badge>
          </div>
        </Panel>

        <Panel className="p-5">
          <SectionLabel>Funding and payout</SectionLabel>
          <h2 className="mt-2 text-lg font-semibold text-numeric">Funded first. Paid after.</h2>
          <p className="mt-3 text-sm leading-6 text-muted">
            The demo requester uses a separate, server-side testnet wallet to send
            an ordinary NIM transfer to the operator treasury. A session is not
            available until that transaction is verified for network, sender,
            recipient, amount, unique hash, and session reference.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            The treasury later sends the player an ordinary testnet NIM transfer.
            This is operator custody, not HTLC escrow or trustless settlement.
            Database reservations are accounting controls, not on-chain locks.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-dim">
            <LockIcon className="h-4 w-4 text-gold" />
            Treasury keys never reach the browser.
          </div>
        </Panel>
      </div>

      <Panel className="border-pending/25 bg-pending/[0.04] p-5 sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-pending/30 bg-pending/10 text-pending">
            <TerminalIcon className="h-5 w-5" />
          </span>
          <div>
            <SectionLabel>Fiat off-ramp demo</SectionLabel>
            <h2 className="mt-1 text-lg font-semibold text-numeric">
              The withdrawal modal is a demonstration.
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
              After a payout is confirmed, the game shows a <strong>Withdraw to Fiat</strong>{" "}
              action. It opens a Nimiq Pay Off-Ramp modal with the confirmed amount,
              an indicative demo rate (1 NIM = $0.85), and an estimated fiat value.
              The handoff is simulated: no exchange API is called, no KYC starts, no
              fiat currency moves, and no treasury endpoint is invoked. A real
              off-ramp requires a licensed provider and separate approval.
            </p>
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Simulation boundary</SectionLabel>
        <h2 className="mt-2 text-lg font-semibold text-numeric">
          Educational simulation, not investment advice.
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          Scenarios, virtual portfolio values, and evidence are authored training
          content. They do not predict real market outcomes. The app runs on Nimiq
          testnet; testnet NIM has no intended real-world value. Mainnet is not
          enabled.
        </p>
        <p className="mt-4 text-sm">
          <Link className="font-medium text-info hover:text-blue-300" to="/play">
            Go to the lobby
          </Link>
        </p>
      </Panel>
    </div>
  );
}
