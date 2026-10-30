import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";

const documentNames = [
  "AGENTS.md — implementation rules",
  "PROJECT_SPEC.md — product specification",
  "ARCHITECTURE.md — architecture and API contracts",
  "IMPLEMENTATION_PLAN.md — phased plan and approval gates",
  "docs/ — deployment, operations, security, testing, design and user documentation",
];

export function DocsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Documentation"
        description="An overview of the project documentation available in the repository."
      />

      <section aria-labelledby="repo-docs" className="space-y-3">
        <h2 id="repo-docs" className="text-xl font-semibold">
          Repository documents
        </h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-700">
          {documentNames.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <p className="max-w-3xl text-slate-700">
          The final public documentation link and GitHub repository link are deferred to Phase 8.
          No local filesystem path is presented as a working web link.
        </p>
      </section>

      <section aria-labelledby="current-docs" className="space-y-3">
        <h2 id="current-docs" className="text-xl font-semibold">
          Current implementation status
        </h2>
        <p className="max-w-3xl text-slate-700">
          Phase 1 is a route-complete skeletal frontend. Wallet authentication, the Nimiq adapter,
          funding verification, the database, reward accounting and payouts are not implemented.
        </p>
      </section>

      <p className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/how-it-works">
          How it works
        </Link>
        <Link className="font-medium text-sky-800 underline hover:text-sky-900" to="/play">
          Lobby
        </Link>
      </p>
    </div>
  );
}
