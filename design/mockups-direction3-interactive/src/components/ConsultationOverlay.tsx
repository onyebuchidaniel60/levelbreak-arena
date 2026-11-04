import {
  ArrowRight,
  Check,
  CircleHelp,
  RadioTower,
  ShieldCheck,
  SkipForward,
  BadgeCheck,
} from "lucide-react";
import type { Evidence, Sector, SectorProgress } from "../game/types";
import { REWARD_LUNA, XP_PER_SECTOR } from "../game/sectors";
import { OverlayShell } from "./OverlayShell";

type ConsultationOverlayProps = {
  sector: Sector;
  progress: SectorProgress | undefined;
  onClose: () => void;
  onAnswer: (answerKey: "SAFE" | "RISKY" | "CANT_TELL") => void;
  onSkip: () => void;
  onFinish: () => void;
};

function EvidenceBlock({ evidence }: { evidence: Evidence }) {
  if (evidence.type === "data_card") {
    return (
      <div className="evidence-card" data-testid="evidence-block">
        <div className="evidence-card-head">
          <span className="evidence-type mono">DATA CARD</span>
          <span className="evidence-corner" aria-hidden="true" />
        </div>
        <h3>{evidence.title}</h3>
        <dl className="evidence-data-list">
          {evidence.lines.map((line, index) => {
            const separator = line.indexOf(": ");
            const term = separator > 0 ? line.slice(0, separator) : `Line ${index + 1}`;
            const value = separator > 0 ? line.slice(separator + 2) : line;
            return (
              <div className="evidence-data-row" key={`${term}-${index}`}>
                <dt>{term}</dt>
                <dd>{value}</dd>
              </div>
            );
          })}
        </dl>
      </div>
    );
  }

  if (evidence.type === "text_snippet") {
    return (
      <div className="evidence-card" data-testid="evidence-block">
        <div className="evidence-card-head">
          <span className="evidence-type mono">TEXT SNIPPET</span>
          <span className="evidence-corner" aria-hidden="true" />
        </div>
        <h3>{evidence.title}</h3>
        <blockquote className="evidence-quote">
          <p>{evidence.text}</p>
          <footer className="mono">{evidence.sourceLabel}</footer>
        </blockquote>
      </div>
    );
  }

  return (
    <div className="evidence-card" data-testid="evidence-block">
      <div className="evidence-card-head">
        <span className="evidence-type mono">SCENARIO CARD</span>
        <span className="evidence-corner" aria-hidden="true" />
      </div>
      <h3>{evidence.title}</h3>
      <ol className="evidence-scenario-list">
        {evidence.lines.map((line, index) => (
          <li key={`${line}-${index}`}>
            <span className="mono">0{index + 1}</span>
            <span>{line}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

const burstParticles = Array.from({ length: 18 }, (_, index) => ({
  angle: (index / 18) * 360,
  distance: 76 + (index % 5) * 19,
  delay: index * 17,
}));

export function ConsultationOverlay({
  sector,
  progress,
  onClose,
  onAnswer,
  onSkip,
  onFinish,
}: ConsultationOverlayProps) {
  const answered = progress?.consultationStatus === "answered";
  const selectedAnswer = progress?.answerKey;

  return (
    <OverlayShell
      titleId="consultation-overlay-title"
      testId="consultation-overlay"
      onRequestClose={onClose}
      className={`consultation-overlay sector-${sector.index}`}
    >
      <div className="overlay-masthead transmission-masthead">
        <div className="overlay-eyebrow">
          <span className="transmission-live">
            <span className="transmission-live-dot" />
            INCOMING TRANSMISSION
          </span>
          <span className="eyebrow-slash">/</span>
          <span className="mono">SECTOR 0{sector.index}</span>
        </div>
        <h2 id="consultation-overlay-title" className="overlay-title">
          {answered ? "Signal accepted." : "Classify the risk."}
        </h2>
        <p className="overlay-subtitle">
          Evidence is bundled and static. Read it first, then send a risk read.
        </p>
      </div>

      <div className="agent-strip">
        <div className="agent-glyph" aria-hidden="true">
          <RadioTower size={22} />
          <span className="agent-glyph-ring" />
        </div>
        <div className="agent-copy">
          <div className="agent-heading">
            <strong>SCRIPTED DEMO REQUESTER</strong>
            <span className="scripted-badge">SCRIPTED</span>
            <span className="agent-confidence mono">
              CONFIDENCE / {sector.consultation.agentConfidence.toUpperCase()}
            </span>
          </div>
          <p className="agent-context mono">{sector.consultation.agentContext}</p>
          <p className="agent-message">&ldquo;{sector.consultation.agentMessage}&rdquo;</p>
        </div>
        <div className="agent-fee">
          <span className="hud-label">FIXED FEE</span>
          <span className="mono agent-fee-value">+{REWARD_LUNA} LUNA</span>
          <span className="agent-fee-note">PAID AT RUN END</span>
        </div>
      </div>

      <div className="consultation-grid">
        <div className="evidence-column">
          <div className="module-label">
            <span className="mono">01</span>
            <span>EVIDENCE FIRST</span>
          </div>
          <EvidenceBlock evidence={sector.consultation.evidence} />

          <div className="consultation-trust">
            <span>
              <ShieldCheck size={14} /> TESTNET · NOT REAL MONEY
            </span>
            <span>
              <RadioTower size={14} /> SCRIPTED REQUESTER
            </span>
            <span>
              <BadgeCheck size={14} /> NO HIDDEN ANSWER KEY
            </span>
          </div>
        </div>

        <div className="question-column">
          <div className="module-label">
            <span className="mono">02</span>
            <span>YOUR RISK READ</span>
          </div>
          <h3 className="consultation-question">{sector.consultation.question}</h3>

          {!answered ? (
            <>
              <div className="answer-list">
                {sector.consultation.options.map((option, index) => (
                  <button
                    key={option.key}
                    type="button"
                    className={`answer-option is-${option.key.toLowerCase()}`}
                    onClick={() => onAnswer(option.key)}
                    data-testid={`answer-${option.key}`}
                  >
                    <span className="answer-marker" aria-hidden="true">
                      {index === 2 ? "?" : index === 1 ? "!" : "✓"}
                    </span>
                    <span className="answer-body">
                      <span className="answer-label">{option.label}</span>
                      <span className="answer-copy">{option.description}</span>
                    </span>
                    <ArrowRight size={17} className="answer-arrow" />
                  </button>
                ))}
              </div>

              <div className="consultation-footer">
                <p className="micro-note">
                  ANY VALID CLASSIFICATION EARNS THE FIXED 500 LUNA REWARD. THIS
                  MVP HAS NO HIDDEN CORRECT/INCORRECT RUBRIC.
                </p>
                <button
                  type="button"
                  className="skip-link"
                  onClick={onSkip}
                  data-testid="skip-consultation"
                >
                  <SkipForward size={14} />
                  Skip — earn 0
                </button>
              </div>
            </>
          ) : (
            <div className="reward-receipt" data-testid="reward-receipt">
              <div className="reward-burst" aria-hidden="true">
                {burstParticles.map((particle, index) => (
                  <span
                    key={index}
                    className="burst-particle"
                    style={
                      {
                        "--angle": `${particle.angle}deg`,
                        "--distance": `${particle.distance}px`,
                        animationDelay: `${particle.delay}ms`,
                      } as React.CSSProperties
                    }
                  />
                ))}
                <span className="reward-float mono">+{REWARD_LUNA} LUNA</span>
              </div>

              <div className="receipt-seal" aria-hidden="true">
                <Check size={26} />
              </div>
              <span className="hud-label">TRANSMISSION ACCEPTED</span>
              <div className="receipt-reward mono">
                +{REWARD_LUNA}
                <span> LUNA</span>
              </div>
              <div className="receipt-stats">
                <div>
                  <span className="hud-label">RUN XP</span>
                  <span className="mono">+{XP_PER_SECTOR}</span>
                </div>
                <div>
                  <span className="hud-label">SETTLEMENT</span>
                  <span className="mono">PENDING</span>
                </div>
                <div>
                  <span className="hud-label">SELECTED</span>
                  <span className="mono">
                    {sector.consultation.options.find(
                      (option) => option.key === selectedAnswer,
                    )?.label ?? "—"}
                  </span>
                </div>
              </div>
              <p className="receipt-note">
                <CircleHelp size={14} />
                Not paid yet. The fixed reward is reserved and settles after the
                run. A skipped consultation earns zero.
              </p>
              <button
                type="button"
                className="btn btn-primary btn-wide"
                onClick={onFinish}
                data-testid="finish-sector"
              >
                Return to orbit
                <ArrowRight size={17} />
              </button>
            </div>
          )}
        </div>
      </div>
    </OverlayShell>
  );
}
