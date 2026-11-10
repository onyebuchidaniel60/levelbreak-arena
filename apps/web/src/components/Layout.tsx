import { Link, NavLink, Outlet } from "react-router-dom";
import { primaryNav } from "../routes";
import { useAuth } from "../providers/AuthProvider";
import { Button, cn } from "./ui";
import { WalletIcon } from "./Icons";

function navLinkClass({ isActive }: { isActive: boolean }) {
  return cn(
    "inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
    isActive
      ? "bg-gold text-ink"
      : "text-cream/65 hover:bg-white/[0.08] hover:text-cream",
  );
}

function shortAddress(address: string): string {
  const compact = address.replace(/\s+/g, "");
  if (compact.length <= 14) return address;
  return `${compact.slice(0, 6)}…${compact.slice(-5)}`;
}

function BrandMark() {
  return (
    <span
      className="flex h-10 w-10 items-end justify-center gap-[3px] rounded-[14px] bg-gold p-2.5"
      aria-hidden="true"
    >
      <span className="h-2 w-[3px] rounded-sm bg-ink/50" />
      <span className="h-3.5 w-[3px] rounded-sm bg-ink/70" />
      <span className="h-5 w-[3px] rounded-sm bg-ink" />
      <span className="h-3 w-[3px] rounded-sm bg-coral" />
      <span className="h-1.5 w-[3px] rounded-sm bg-coral/60" />
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
      <p
        className="flex items-center gap-2 text-xs text-cream/60"
        role="status"
      >
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
        Checking wallet session…
      </p>
    );
  }

  if (me) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-cream/70">
          <span className="h-1.5 w-1.5 rounded-full bg-[#4ade80]" />
          <span className="numeric break-all text-[11px] text-cream/90">
            {shortAddress(me.player.address)}
          </span>
        </span>
        <Button
          variant="inverse"
          size="sm"
          className="min-h-11"
          onClick={() => void logout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Signing out…" : "Sign out"}
        </Button>
        {logoutError ? (
          <p role="alert" className="text-xs text-[#ffb4a2]">
            {logoutError}
          </p>
        ) : null}
      </div>
    );
  }

  if (wallet.status === "detecting") {
    return <p className="text-xs text-cream/60">Checking for Nimiq Pay…</p>;
  }

  if (wallet.status === "ready") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="hidden items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-xs text-cream/70 sm:inline-flex">
          <WalletIcon className="h-3.5 w-3.5 text-gold" />
          <span className="numeric text-[11px] text-cream/90">
            {shortAddress(wallet.address)}
          </span>
        </span>
        <Button
          variant="primary"
          size="sm"
          className="min-h-11"
          onClick={() => void signIn()}
          disabled={isSigningIn}
        >
          {isSigningIn ? "Waiting for wallet…" : "Sign in with Nimiq Pay"}
        </Button>
        {signInError ? (
          <p role="alert" className="max-w-64 text-xs text-[#ffb4a2]">
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
      <p className="max-w-64 text-xs leading-5 text-cream/60" aria-live="polite">
        {message}
      </p>
      {wallet.status !== "unavailable" ? (
        <Button
          variant="inverse"
          size="sm"
          className="min-h-11"
          onClick={retryWallet}
        >
          Retry wallet
        </Button>
      ) : null}
    </div>
  );
}

export function Layout() {
  return (
    <div className="min-h-screen px-0 py-0 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
      <div className="mx-auto flex min-h-screen w-full max-w-[1560px] flex-col bg-cream shadow-[0_40px_120px_-60px_rgba(21,19,19,0.7)] sm:min-h-[calc(100dvh-1.5rem)] sm:rounded-[30px] lg:min-h-[calc(100dvh-2rem)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 rounded-none bg-charcoal text-cream sm:rounded-t-[30px]">
          <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
              <Link
                to="/"
                className="group flex min-h-11 items-center gap-2.5 rounded-full"
              >
                <BrandMark />
                <span className="leading-tight">
                  <span className="block text-[15px] font-bold tracking-[-0.02em] text-cream">
                    LevelBreak
                  </span>
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-gold">
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
                <span className="hidden items-center gap-1.5 rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-cream/70 md:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-positive" />
                  Testnet
                </span>
                <WalletPanel />
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="relative min-w-0 flex-1 bg-cream px-4 py-6 sm:px-6 sm:py-8 lg:px-9 lg:py-10"
        >
          <div className="mx-auto w-full min-w-0 max-w-[1320px]">
            <Outlet />
          </div>
        </main>

        <footer className="bg-charcoal text-cream/60 sm:rounded-b-[30px]">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-7 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
              <div className="max-w-md space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-gold" />
                  <p className="text-sm font-semibold text-cream">
                    LevelBreak Arena
                  </p>
                </div>
                <p className="text-xs leading-5 text-cream/55">
                  Simulated DeFi scenarios on Nimiq testnet. Rewards are
                  treasury-funded testnet transfers.
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/35">
                  Educational simulation · not investment advice
                </p>
              </div>
              <nav
                aria-label="Footer"
                className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-medium text-cream/60"
              >
                <Link className="inline-flex min-h-11 items-center transition-colors hover:text-gold" to="/agents">
                  Agents
                </Link>
                <Link
                  className="inline-flex min-h-11 items-center transition-colors hover:text-gold"
                  to="/how-it-works"
                >
                  How it works
                </Link>
                <Link className="inline-flex min-h-11 items-center transition-colors hover:text-gold" to="/privacy">
                  Privacy
                </Link>
                <Link className="inline-flex min-h-11 items-center transition-colors hover:text-gold" to="/terms">
                  Terms
                </Link>
                <Link className="inline-flex min-h-11 items-center transition-colors hover:text-gold" to="/docs">
                  Documentation
                </Link>
                <a
                  className="inline-flex min-h-11 items-center transition-colors hover:text-gold"
                  href="https://github.com/onyebuchidaniel60/levelbreak-arena"
                  target="_blank"
                  rel="noreferrer"
                >
                  GitHub
                </a>
              </nav>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
