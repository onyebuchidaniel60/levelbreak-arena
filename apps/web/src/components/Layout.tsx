import { Link, NavLink, Outlet } from "react-router-dom";
import { primaryNav } from "../routes";
import { useAuth } from "../providers/AuthProvider";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return [
    "rounded px-2 py-1",
    isActive
      ? "bg-slate-200 font-semibold text-slate-900"
      : "text-slate-700 hover:bg-slate-100",
  ].join(" ");
}

function WalletPanel() {
  const {
    me,
    meLoading,
    wallet,
    signIn,
    isSigningIn,
    signInError,
    logout,
    isLoggingOut,
    logoutError,
    retryWallet,
  } = useAuth();

  if (meLoading) {
    return <p className="text-xs text-slate-600">Checking wallet session…</p>;
  }

  if (me) {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="break-all text-xs text-slate-700" aria-live="polite">
          Signed in: <span className="font-mono">{me.player.address}</span>
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          disabled={isLoggingOut}
          className="w-fit rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
        >
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </button>
        {logoutError ? (
          <p role="alert" className="text-xs text-red-800">
            {logoutError}
          </p>
        ) : null}
      </div>
    );
  }

  if (wallet.status === "detecting") {
    return <p className="text-xs text-slate-600">Checking for Nimiq Pay…</p>;
  }

  if (wallet.status === "ready") {
    return (
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <p className="break-all text-xs text-slate-700">
          Wallet: <span className="font-mono">{wallet.address}</span>
        </p>
        <button
          type="button"
          onClick={() => void signIn()}
          disabled={isSigningIn}
          className="w-fit rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-60"
        >
          {isSigningIn ? "Waiting for wallet…" : "Sign in with Nimiq Pay"}
        </button>
        {signInError ? (
          <p role="alert" className="text-xs text-red-800">
            {signInError}
          </p>
        ) : null}
      </div>
    );
  }

  const message =
    wallet.status === "unavailable"
      ? "Open this app in Nimiq Pay to connect your wallet."
      : wallet.status === "denied"
        ? wallet.message
        : wallet.status === "no-account"
          ? "Nimiq Pay did not return a wallet account."
          : wallet.status === "error"
            ? wallet.message
            : "Open this app in Nimiq Pay to connect your wallet.";

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-slate-700" aria-live="polite">
        {message}
      </p>
      {wallet.status !== "unavailable" ? (
        <button
          type="button"
          onClick={retryWallet}
          className="w-fit rounded border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-800 hover:bg-slate-100"
        >
          Retry wallet
        </button>
      ) : null}
    </div>
  );
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

          <div className="mt-3">
            <WalletPanel />
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
          <p>
            Phase 4 functional preview. Simulated DeFi scenarios on Nimiq testnet.
            Rewards are treasury-funded testnet transfers; this is not investment advice.
          </p>
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
