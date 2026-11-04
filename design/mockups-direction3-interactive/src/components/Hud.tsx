import { RotateCcw, ScrollText } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { formatLuna, MAX_XP, lunaToNim } from "../game/sectors";

type HudProps = {
  xp: number;
  earnedLuna: number;
  clearedCount: number;
  activeSectorLabel: string;
  summaryAvailable: boolean;
  onReset: () => void;
  onOpenSummary: () => void;
};

export function Hud({
  xp,
  earnedLuna,
  clearedCount,
  activeSectorLabel,
  summaryAvailable,
  onReset,
  onOpenSummary,
}: HudProps) {
  const xpPercent = Math.min(100, (xp / MAX_XP) * 100);

  return (
    <>
      <header className="hud-top">
        <div className="brand-lockup">
          <BrandMark />
          <div className="brand-text">
            <span className="brand-name">LEVELBREAK</span>
            <span className="brand-sub">ARENA / ORBIT</span>
          </div>
        </div>

        <div className="hud-meters">
          <div className="xp-meter">
            <div className="xp-meter-head">
              <span className="hud-label">RUN XP</span>
              <span className="mono hud-value">
                {xp.toString().padStart(3, "0")} / {MAX_XP}
              </span>
            </div>
            <div
              className="xp-track"
              role="progressbar"
              aria-label="Run XP"
              aria-valuemin={0}
              aria-valuemax={MAX_XP}
              aria-valuenow={xp}
            >
              <span className="xp-fill" style={{ width: `${xpPercent}%` }} />
              <span className="xp-ticks" aria-hidden="true" />
            </div>
          </div>

          <div className="hud-stat">
            <span className="hud-label">REWARD</span>
            <span className="hud-value mono">
              {formatLuna(earnedLuna)} <em>LUNA</em>
            </span>
          </div>

          <div className="hud-stat hud-stat--sectors">
            <span className="hud-label">SECTORS</span>
            <span className="hud-value mono">{clearedCount} / 3</span>
          </div>
        </div>

        <div className="hud-right">
          <div className="trust-badge" data-testid="trust-badge">
            <span className="trust-dot" aria-hidden="true" />
            <span>TESTNET</span>
            <span className="trust-divider" aria-hidden="true" />
            <strong>NOT REAL MONEY</strong>
          </div>
          <span className="hud-run-id mono">RUN 001 / DEMO PILOT</span>
        </div>
      </header>

      <footer className="hud-bottom">
        <div className="hud-signal">
          <span className="signal-pulse" aria-hidden="true" />
          <span className="hud-label">SIGNAL</span>
          <span className="hud-signal-text">{activeSectorLabel}</span>
        </div>

        <div className="prototype-disclaimer">
          PROTOTYPE BUILD // NO WALLET, API OR FUNDS CONNECTED //{" "}
          <span className="mono">{lunaToNim(earnedLuna)} NIM SIMULATED</span>
        </div>

        <div className="hud-actions">
          {summaryAvailable ? (
            <button
              type="button"
              className="hud-button"
              onClick={onOpenSummary}
              data-testid="open-summary"
            >
              <ScrollText size={14} />
              RUN SUMMARY
            </button>
          ) : null}
          <button
            type="button"
            className="hud-button hud-button--muted"
            onClick={onReset}
            data-testid="reset-demo"
          >
            <RotateCcw size={14} />
            RESET
          </button>
        </div>
      </footer>
    </>
  );
}
