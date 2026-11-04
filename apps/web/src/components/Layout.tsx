import { Link, NavLink, Outlet } from "react-router-dom";
import { primaryNav } from "../routes";
import { useAuth } from "../providers/AuthProvider";
import { Badge, Button, cn } from "./ui";
import { WalletIcon } from "./Icons";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-white/[0.06] text-numeric"
      : "text-muted hover:bg-white/[0.04] hover:text-body",
  );
}

function shortAddress(address: string): string {
  const compact = address.replace(/\s+/g, "");
  if (compact.length <= 14) return address;
  return `${compact.slice(0, 6)}…${compact.slice(-5)}`;
}

function BrandMark() {
  return (
    <span className="flex h-8 w-8 items-end justify-center gap-[3px] rounded-md border border-gold/25 bg-gold/[0.08] p-1.5" aria-hidden="true">
      <span className="h-2 w-[3px] rounded-sm bg-gold/50" />
      <span className="h-3.5 w-[3px] rounded-sm bg-gold/70" />
      <span className="h-5 w-[3px] rounded-sm bg-gold" />
      <span className="h-3 w-[3px] rounded-sm bg-positive/80" />
      <span className="h-1.5 w-[3px] rounded-sm bg-positive/50" />
    </span>
  );
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
    return (
      <p className="flex items-center gap-2 text-xs text-muted" role="status">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-pending" />
        Checking wallet session…
      </p>
    );
  }

  if (me) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-md border border-line bg-white/[0.025] px-2.5 py-1.5 text-xs text-muted">
          <span className="h-1.5 w-1.5 rounded-full bg-positive" />
          <span className="numeric break-all text-[11px] text-body">
            {shortAddress(me.player.address)}
          </span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void logout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </Button>
        {logoutError ? (
          <p role="alert" className="text-xs text-danger">
            {logoutError}
          </p>
        ) : null}
      </div>
    );
  }

  if (wallet.status === "detecting") {
    return <p className="text-xs text-muted">Checking for Nimiq Pay…</p>;
  }

  if (wallet.status === "ready") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden items-center gap-2 rounded-md border border-line bg-white/[0.025] px-2.5 py-1.5 text-xs text-muted sm:inline-flex">
          <WalletIcon className="h-3.5 w-3.5 text-gold" />
          <span className="numeric text-[11px] text-body">
            {shortAddress(wallet.address)}
          </span>
        </span>
        <Button
          variant="primary"
          size="sm"
          onClick={() => void signIn()}
          disabled={isSigningIn}
        >
          {isSigningIn ? "Waiting for wallet…" : "Sign in with Nimiq Pay"}
        </Button>
        {signInError ? (
          <p role="alert" className="max-w-64 text-xs text-danger">
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
    <div className="flex flex-wrap items-center gap-2">
      <p className="max-w-64 text-xs leading-5 text-muted" aria-live="polite">
        {message}
      </p>
      {wallet.status !== "unavailable" ? (
        <Button variant="secondary" size="sm" onClick={retryWallet}>
          Retry wallet
        </Button>
      ) : null}
    </div>
  );
}

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
      >
        Skip to content
      </a>

      <header className="sticky top-0 z-40 border-b border-line glass">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 py-3">
            <Link to="/" className="group flex items-center gap-2.5">
              <BrandMark />
              <span className="leading-tight">
                <span className="block text-sm font-semibold tracking-tight text-numeric">
                  LevelBreak
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.2em] text-dim">
                  Arena
                </span>
              </span>
            </Link>

            <nav
              aria-label="Primary"
              className="order-3 flex w-full items-center gap-1 overflow-x-auto pb-1 sm:order-none sm:w-auto sm:pb-0"
            >
              {primaryNav.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass}>
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <Badge tone="info" className="hidden md:inline-flex">
                Testnet
              </Badge>
              <WalletPanel />
            </div>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="relative mx-auto w-full max-w-7xl min-w-0 flex-1 px-4 py-8 sm:px-6 sm:py-10"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-64 grid-bg opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />
        <Outlet />
      </main>

      <footer className="border-t border-line bg-ink-2/60">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted">
              Simulated DeFi scenarios on Nimiq testnet. Rewards are
              treasury-funded testnet transfers.
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">
              Educational simulation · not investment advice
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted">
            <Link className="transition-colors hover:text-numeric" to="/how-it-works">
              How it works
            </Link>
            <Link className="transition-colors hover:text-numeric" to="/privacy">
              Privacy
            </Link>
            <Link className="transition-colors hover:text-numeric" to="/terms">
              Terms
            </Link>
            <Link className="transition-colors hover:text-numeric" to="/docs">
              Docs
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
