import {
  ArrowLeft,
  ArrowRight,
  Bolt,
  Check,
  Crown,
  Radio,
  Sparkles,
  Swords,
} from "lucide-react";
import type { AgentStatus } from "./GalaxyHud";
import {
  CONQUEST_XP,
  TEACHERS,
  TIER_META,
  type Teacher,
} from "../game/conquest";

type ConquestPanelProps = {
  xp: number;
  clearedTeachers: ReadonlySet<number>;
  agentStatus: AgentStatus;
  skyfallPending: boolean;
  onBack: () => void;
  onOpenTeacher: (teacher: Teacher) => void;
  onSimulateXp: () => void;
  onOpenAgent: () => void;
};

function initials(name: string): string {
  const parts = name.split(" ");
  const last = parts[parts.length - 1] ?? name;
  return last.slice(0, 2).toUpperCase();
}

export function ConquestPanel({
  xp,
  clearedTeachers,
  agentStatus,
  skyfallPending,
  onBack,
  onOpenTeacher,
  onSimulateXp,
  onOpenAgent,
}: ConquestPanelProps) {
  const xpPercent = Math.min(100, (xp / CONQUEST_XP) * 100);
  const clearedCount = clearedTeachers.size;

  return (
    <section className="conquest-panel" data-testid="conquest-panel">
      <header className="tower-header">
        <div className="tower-topline">
          <button type="button" className="back-button" onClick={onBack} data-testid="back-to-galaxy">
            <ArrowLeft size={14} />
            GALAXY MAP
          </button>
          <span className="tower-planet mono">PLANET 01 / XYLOS</span>
        </div>

        <div className="tower-title-row">
          <div>
            <span className="eyebrow">
              <Swords size={12} /> TEACHER TOWER
            </span>
            <h2 className="tower-title">Guardians of Xylos</h2>
          </div>
          <span className="tower-crest" aria-hidden="true">
            <Crown size={24} />
            <span className="crest-ring" />
          </span>
        </div>

        <p className="tower-subtitle">
          Eighteen risk teachers stand between the surface and the Agent.
          Answer one test per teacher. High tiers award more XP.
        </p>

        <div className="conquest-progress">
          <div className="progress-topline">
            <span className="progress-label">
              <Sparkles size={13} />
              CONQUEST XP
            </span>
            <span className="progress-value mono">
              {xp} <em>/ {CONQUEST_XP}</em>
            </span>
          </div>
          <div
            className="conquest-meter"
            role="progressbar"
            aria-label="XP toward conquering Xylos"
            aria-valuemin={0}
            aria-valuemax={CONQUEST_XP}
            aria-valuenow={xp}
          >
            <span className="conquest-meter-fill" style={{ width: `${xpPercent}%` }} />
            <span className="conquest-meter-shine" aria-hidden="true" />
            <span className="conquest-meter-mark" aria-hidden="true" />
          </div>
          <div className="progress-footline">
            <span>THE AGENT STIRS AT {CONQUEST_XP} XP</span>
            <span className="mono">{clearedCount} / 18 MASTERED</span>
          </div>
        </div>

        <div className="tower-tools">
          <div className="agent-mini-status">
            <span className={`agent-orb is-${agentStatus}`} aria-hidden="true">
              {agentStatus === "sealed" ? <Swords size={13} /> : <Radio size={13} />}
            </span>
            <div>
              <span className="mono tower-tool-label">AGENT</span>
              <strong>
                {agentStatus === "sealed"
                  ? "SEALED"
                  : agentStatus === "awake"
                    ? "AWAKE"
                    : "CONFIRMED"}
              </strong>
            </div>
          </div>

          {agentStatus === "sealed" ? (
            <div className="operator-tool">
              <span className="operator-label mono">OPERATOR TEST TOOL</span>
              <button
                type="button"
                className="simulate-button"
                onClick={onSimulateXp}
                data-testid="simulate-xp-max"
              >
                <Bolt size={13} />
                SIMULATE XP MAX
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="simulate-button is-agent"
              onClick={onOpenAgent}
              data-testid="open-agent-from-tower"
            >
              <Radio size={13} />
              {agentStatus === "confirmed" ? "VIEW AGENT RECEIPT" : "OPEN AGENT"}
            </button>
          )}
        </div>

        {skyfallPending ? (
          <div className="skyfall-note" role="status">
            <span className="skyfall-flash" aria-hidden="true" />
            THRESHOLD REACHED — METEOR INBOUND
          </div>
        ) : null}
      </header>

      <div className="teacher-heading">
        <span className="mono">THE ROSTER</span>
        <span>CLICK A TEACHER TO OPEN THEIR TEST</span>
        <span className="mono teacher-count">{TEACHERS.length}</span>
      </div>

      <div className="teacher-list" data-testid="teacher-list">
        {TEACHERS.map((teacher) => {
          const tier = TIER_META[teacher.tier];
          const mastered = clearedTeachers.has(teacher.id);
          const isBoss = teacher.id === 18;
          return (
            <button
              type="button"
              key={teacher.id}
              className={`teacher-row tier-${teacher.tier} ${mastered ? "is-mastered" : ""} ${isBoss ? "is-boss" : ""}`}
              style={
                {
                  "--tier-color": tier.color,
                  "--tier-soft": tier.soft,
                } as React.CSSProperties
              }
              onClick={() => onOpenTeacher(teacher)}
              data-testid={`teacher-row-${teacher.id}`}
            >
              <span className="teacher-rank mono">
                {String(teacher.id).padStart(2, "0")}
              </span>
              <span className="teacher-avatar" aria-hidden="true">
                {initials(teacher.name)}
                <span className="avatar-ring" />
              </span>
              <span className="teacher-body">
                <span className="teacher-name-line">
                  <strong>{teacher.name}</strong>
                  <span className="tier-badge">{tier.label}</span>
                  {isBoss ? <Crown size={13} className="boss-crown" /> : null}
                </span>
                <span className="teacher-meta">
                  <span>{teacher.role}</span>
                  <span className="difficulty" aria-label={`Difficulty ${teacher.tier} of 4`}>
                    {[1, 2, 3, 4].map((level) => (
                      <i
                        key={level}
                        className={level <= teacher.tier ? "is-lit" : ""}
                      />
                    ))}
                  </span>
                </span>
              </span>
              <span className="teacher-reward">
                <small>XP</small>
                <strong className="mono">+{teacher.xp}</strong>
              </span>
              {mastered ? (
                <span className="teacher-status is-mastered" aria-label="Mastered">
                  <Check size={15} />
                </span>
              ) : (
                <ArrowRight size={16} className="teacher-arrow" />
              )}
            </button>
          );
        })}
      </div>

      <div className="tower-footer">
        <span className="mono">HIGHER TIERS / HIGHER XP</span>
        <span>THE LAST TEACHER GUARDS THE CORE</span>
      </div>
    </section>
  );
}
