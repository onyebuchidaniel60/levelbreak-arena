import { Link } from "react-router-dom";
import { PageHeader } from "../components/PageHeader";
import { Badge, Panel } from "../components/ui";
import { ArrowRightIcon } from "../components/Icons";

export function NotFoundPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="404 / route missing"
        title="This route is not in the arena."
        description="The requested page does not exist. The ladder is still waiting."
        actions={<Badge tone="error">Not found</Badge>}
      />
      <Panel className="p-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
          Error code
        </p>
        <p className="numeric mt-2 text-3xl font-semibold text-numeric">404</p>
        <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
          Check the URL, or return to the landing page and open a funded session
          from the lobby.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/"
            className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-gold bg-gold px-3 py-1.5 text-xs font-semibold text-ink"
          >
            Return home
            <ArrowRightIcon className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/play"
            className="inline-flex min-h-9 items-center rounded-md border border-line px-3 py-1.5 text-xs font-semibold text-muted hover:text-body"
          >
            Open lobby
          </Link>
        </div>
      </Panel>
    </div>
  );
}
