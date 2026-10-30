import { Link, NavLink, Outlet } from "react-router-dom";
import { primaryNav } from "../routes";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded px-2 py-1",
    isActive ? "bg-slate-200 font-semibold text-slate-900" : "text-slate-700 hover:bg-slate-100",
  ].join(" ");
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-5xl px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/" className="text-lg font-semibold tracking-tight">
              LevelBreak Arena
            </Link>
            <nav aria-label="Primary" className="flex flex-wrap items-center gap-1 text-sm">
              {primaryNav.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <span id="wallet-status" className="text-xs text-slate-600">
              Wallet not connected
            </span>
            <button
              type="button"
              disabled
              aria-describedby="wallet-status"
              className="w-fit max-w-full cursor-not-allowed rounded border border-slate-300 bg-slate-100 px-2 py-1 text-left text-xs text-slate-600 sm:text-sm"
            >
              Wallet connection coming in Phase 2
            </button>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="mx-auto w-full max-w-5xl min-w-0 flex-1 px-4 py-8 sm:px-6"
      >
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-6 text-sm text-slate-600 sm:px-6">
          <p>Phase 1 skeletal preview. Wallet, funding and payouts are not implemented.</p>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2">
            <Link className="hover:text-slate-900 hover:underline" to="/how-it-works">
              How it works
            </Link>
            <Link className="hover:text-slate-900 hover:underline" to="/privacy">
              Privacy
            </Link>
            <Link className="hover:text-slate-900 hover:underline" to="/terms">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
