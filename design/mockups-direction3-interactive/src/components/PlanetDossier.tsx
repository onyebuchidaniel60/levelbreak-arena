import {
  ArrowRight,
  Bot,
  Crown,
  Lock,
  Sparkles,
  Users,
} from "lucide-react";
import type { AgentStatus } from "./GalaxyHud";
import {
  CONQUEST_XP,
  formatLuna,
  TEACHERS,
  type PlanetDef,
} from "../game/conquest";

type PlanetDossierProps = {
  planet: PlanetDef;
  xp: number;
  clearedTeachers: number;
  agentStatus: AgentStatus;
  earnedLuna: number;
  conquered: boolean;
  onEnter: () => void;
  onOpenAgent: () => void;
};

export function PlanetDossier({
  planet,
  xp,
  clearedTeachers,
  agentStatus,
  earnedLuna,
  conquered,
  onEnter,
  onOpenAgent,
}: PlanetDossierProps) {
  return (
    <aside className="planet-dossier" data-testid="planet-dossier">
      <div className="dossier-orbit" aria-hidden="true" />
      <div className="dossier-kicker">
        <span className="live-dot" />
        {conquered ? "CONQUERED WORLD" : "UNLOCKED WORLD"} / PLANET 01
        <span className="dossier-rule" aria-hidden="true" />
      </div>

      <div className="dossier-title-wrap">
        <h1 className="dossier-title">{planet.name}</h1>
        <span className="dossier-title-glow" aria-hidden="true">
          {planet.name}
        </span>
      </div>
      <p className="dossier-epithet">{planet.epithet}</p>
      <p className="dossier-blurb">{planet.blurb}</p>

      <div className="dossier-stats">
        <div>
          <Users size={14} />
          <span className="mono">{TEACHERS.length}</span>
          <small>TEACHERS</small>
        </div>
        <div>
          <Sparkles size={14} />
          <span className="mono">{CONQUEST_XP}</span>
          <small>XP TO CONQUER</small>
        </div>
        <div>
          <Crown size={14} />
          <span className="mono">{clearedTeachers}</span>
          <small>MASTERED</small>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary dossier-cta"
        onClick={onEnter}
        data-testid="open-planet-1"
      >
        {conquered ? "Revisit the tower" : "Descend to Xylos"}
        <ArrowRight size={18} />
      </button>

      <button
        type="button"
        className={`agent-teaser is-${agentStatus}`}
        onClick={agentStatus === "sealed" ? undefined : onOpenAgent}
        disabled={agentStatus === "sealed"}
        data-testid="dossier-agent"
      >
        <span className="agent-teaser-icon">
          {agentStatus === "sealed" ? <Lock size={17} /> : <Bot size={18} />}
        </span>
        <span className="agent-teaser-copy">
          <small>AGENT CONSULTATION</small>
          <strong>
            {agentStatus === "sealed"
              ? "SEALED — REACH 100 XP"
              : agentStatus === "awake"
                ? "AWAKE — READY TO SPEAK"
                : `CONFIRMED — ${formatLuna(earnedLuna)} LUNA`}
          </strong>
        </span>
        {agentStatus !== "sealed" ? (
          <ArrowRight size={15} className="agent-teaser-arrow" />
        ) : (
          <span className="agent-teaser-progress mono">
            {xp}/{CONQUEST_XP}
          </span>
        )}
      </button>
    </aside>
  );
}
