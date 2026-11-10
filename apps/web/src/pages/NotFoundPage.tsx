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
      <Panel
        tone="gold"
        className="relative overflow-hidden rounded-[30px] p-5 sm:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[20px] border-ink/[0.06]"
        />
        <div className="relative">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink/50">
            Error code
          </p>
          <p className="numeric mt-1 text-6xl font-semibold leading-none tracking-[-0.06em] text-ink sm:text-7xl">
            404
          </p>
          <p className="mt-4 max-w-lg text-sm leading-6 text-ink/70">
            Check the URL, or return to the landing page and open a funded
            session from the lobby.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-xs font-semibold text-cream transition-colors hover:bg-coral hover:text-ink"
            >
              Return home
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
            <Link
              to="/play"
              className="inline-flex min-h-11 items-center rounded-full border border-ink/20 bg-paper px-4 py-2 text-xs font-semibold text-ink/70 hover:border-ink/40 hover:text-ink"
            >
              Open lobby
            </Link>
          </div>
        </div>
      </Panel>
    </div>
  );
}
