import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Panel, SectionLabel } from "../components/ui";

export function PrivacyPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Privacy"
        title="A short privacy notice."
        description="What the testnet preview processes, why it processes it, and where it goes. This is not a final legal policy."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="p-5">
          <SectionLabel>Data this preview processes</SectionLabel>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted">
            <li>Your Nimiq wallet address and public key used for the signed login challenge.</li>
            <li>Short-lived authentication nonce metadata and verification timestamps.</li>
            <li>Game runs, scenario decisions, consultation responses, and reward totals.</li>
            <li>Payout status and public testnet transaction hashes.</li>
            <li>An HttpOnly session cookie and a CSRF cookie required for authenticated requests.</li>
          </ul>
          <p className="mt-3 text-sm leading-6 text-muted">
            Private keys, mnemonics, and wallet signing material never reach the app
            or backend. The backend stores only public wallet identity and the
            game/financial records needed to operate the demo.
          </p>
        </Panel>

        <Panel className="p-5">
          <SectionLabel>How the data is used</SectionLabel>
          <p className="mt-3 text-sm leading-6 text-muted">
            Data is used to authenticate your wallet session, enforce one run per
            funded session, calculate rewards from persisted responses, show your
            own history, and operate testnet payouts. Other players cannot access
            your session or history.
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">
            Funding and payout records are retained for the demo and may be removed
            during operator cleanup. Testnet transaction hashes are public by
            nature.
          </p>
        </Panel>
      </div>

      <Panel className="p-5">
        <SectionLabel>LLM-assisted agent message</SectionLabel>
        <h2 className="mt-2 text-lg font-semibold text-numeric">
          What may be sent to the LLM provider
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          When an LLM key is configured, the backend may send the current scenario,
          question, a summary of the bundled evidence, the current level, and your
          own earned Luna amount to an OpenAI-compatible provider. It does not send
          your wallet address, public key, signature, auth token, session cookie,
          private key, treasury or demo-agent key, or another player's data. The
          request is authenticated, rate-limited, time-limited, and cached per
          run/question. Raw prompts and completions are not logged.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          If the key is absent or the provider fails, the backend uses the
          versioned scripted agent message and no data leaves the service.
        </p>
      </Panel>

      <Panel className="p-5">
        <SectionLabel>Hosting and retention</SectionLabel>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
          The frontend is hosted on Vercel, the API on Render, and the database on
          managed PostgreSQL. Hosting and LLM providers may process standard
          technical request logs under their own terms. Testnet records are
          retained for the demo and may be removed during operator cleanup.
        </p>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          The fiat off-ramp modal is a local demonstration. It does not send data to
          an exchange and does not start a KYC process.
        </p>
      </Panel>

      <p className="text-sm">
        <Link className="font-medium text-info hover:text-blue-300" to="/terms">
          Read the risk disclosure
        </Link>
      </p>
    </div>
  );
}
