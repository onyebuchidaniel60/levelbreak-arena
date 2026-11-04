import { Lock, Radio, ShieldCheck, Star, Users, Zap } from "lucide-react";
import { BrandMark } from "./BrandMark";
import {
  CONQUEST_XP,
  formatLuna,
  TEACHERS,
} from "../game/conquest";

export type AgentStatus = "sealed" | "awake" | "confirmed";

type GalaxyHudProps = {
  xp: number;
  earnedLuna: number;
  clearedTeachers: number;
  agentStatus: AgentStatus;
  onOpenAgent: () => void;
  onReset: () => void;
};

function AgentChip({
  status,
  onOpen,
}: {
  status: AgentStatus;
  onOpen: () => void;
}) {
  if (status === "sealed") {
    return (
      <div className="resource-chip resource-chip--agent is-sealed" data-testid="agent-chip">
        <Lock size={13} />
        <span>
          <small>AGENT</small>
          <strong>SEALED</strong>
        </span>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`resource-chip resource-chip--agent is-${status}`}
      onClick={onOpen}
      data-testid="agent-chip"
    >
      {status === "confirmed" ? <ShieldCheck size={13} /> : <Radio size={13} />}
      <span>
        <small>AGENT</small>
        <strong>{status === "confirmed" ? "RECEIPT" : "AWAKE"}</strong>
      </span>
    </button>
  );
}

export function GalaxyHud({
  xp,
  earnedLuna,
  clearedTeachers,
  agentStatus,
  onOpenAgent,
  onReset,
}: GalaxyHudProps) {
  const xpPercent = Math.min(100, (xp / CONQUEST_XP) * 100);

  return (
    <>
      <header className="galaxy-hud">
        <div className="brand-lockup">
          <BrandMark />
          <div className="brand-copy">
            <span className="brand-name">LEVELBREAK</span>
            <span className="brand-sub">CONQUEST PROTOCOL</span>
          </div>
        </div>

        <div className="resource-row">
          <div className="resource-chip resource-chip--xp">
            <Star size={13} />
            <span>
              <small>STAR XP</small>
              <strong className="mono">
                {xp} <em>/ {CONQUEST_XP}</em>
              </strong>
            </span>
            <span className="mini-meter" aria-hidden="true">
              <span style={{ width: `${xpPercent}%` }} />
            </span>
          </div>

          <div className="resource-chip">
            <span className="luna-glyph" aria-hidden="true">
              ◈
            </span>
            <span>
              <small>LUNA</small>
              <strong className="mono">{formatLuna(earnedLuna)}</strong>
            </span>
          </div>

          <div className="resource-chip resource-chip--teachers">
            <Users size={13} />
            <span>
              <small>TEACHERS</small>
              <strong className="mono">
                {clearedTeachers} <em>/ {TEACHERS.length}</em>
              </strong>
            </span>
          </div>

          <AgentChip status={agentStatus} onOpen={onOpenAgent} />
        </div>

        <div className="trust-badge" data-testid="trust-badge">
          <span className="trust-dot" aria-hidden="true" />
          TESTNET
          <span className="trust-divider" aria-hidden="true" />
          <strong>NOT REAL MONEY</strong>
        </div>
      </header>

      <footer className="galaxy-footer">
        <div className="footer-system">
          <span className="signal-pulse" aria-hidden="true" />
          <span className="mono">GALAXY 01 / XYLOS SYSTEM</span>
        </div>
        <div className="footer-note">
          <Zap size={11} />
          PROTOTYPE — NO WALLET, API OR FUNDS CONNECTED
        </div>
        <button
          type="button"
          className="reset-button"
          onClick={onReset}
          data-testid="reset-demo"
        >
          RESET DEMO
        </button>
      </footer>
    </>
  );
}
