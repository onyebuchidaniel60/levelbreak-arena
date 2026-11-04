import { useState } from "react";
import {
  ArrowRight,
  Check,
  CircleHelp,
  ExternalLink,
  Landmark,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { OverlayShell } from "./OverlayShell";
import {
  AGENT,
  AGENT_REWARD_LUNA,
  PHASE5_REFERENCE,
  formatLuna,
} from "../game/conquest";

type AgentModalProps = {
  answered: boolean;
  answerKey: "SAFE" | "RISKY" | "CANT_TELL" | null;
  payoutStage: number;
  confirmed: boolean;
  earnedLuna: number;
  onAnswer: (key: "SAFE" | "RISKY" | "CANT_TELL") => void;
  onClose: () => void;
  onFinish: () => void;
};

const STAGES = ["QUEUED", "SUBMITTED", "CONFIRMED"] as const;
const STAGE_COPY = [
  "Reward reserved in the payout outbox.",
  "Treasury broadcast simulated.",
  "Payout lifecycle complete.",
] as const;

const burstParticles = Array.from({ length: 20 }, (_, index) => ({
  angle: (index / 20) * 360,
  distance: 80 + (index % 6) * 24,
  delay: index * 16,
}));

export function AgentModal({
  answered,
  answerKey,
  payoutStage,
  confirmed,
  earnedLuna,
  onAnswer,
  onClose,
  onFinish,
}: AgentModalProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const selected = AGENT.options.find((option) => option.key === answerKey);

  return (
    <OverlayShell
      titleId="agent-modal-title"
      testId="agent-modal"
      onRequestClose={onClose}
      className="agent-overlay"
      align="center"
    >
      <div className="agent-modal">
        <header className="agent-header">
          <div className="agent-core" aria-hidden="true">
            <Sparkles size={22} />
            <span className="agent-core-ring" />
          </div>
          <div className="agent-header-copy">
            <div className="eyebrow">
              <span className="agent-live-dot" />
              CORE BREACH / FIRST CONTACT
            </div>
            <h2 id="agent-modal-title">
              {answered ? "The Agent has your read." : "The Agent awakens."}
            </h2>
            <p>
              The asteroid broke the seal. One simulated requester is now
              speaking directly through the planet&apos;s core.
            </p>
          </div>
          <span className="agent-reward-chip">
            <span className="mono">+{AGENT_REWARD_LUNA} LUNA</span>
            <small>FIXED FEE</small>
          </span>
        </header>

        <div className="requester-strip">
          <span className="requester-glyph" aria-hidden="true">
            <Radio size={20} />
            <span className="requester-ring" />
          </span>
          <div className="requester-copy">
            <div className="requester-line">
              <strong>SCRIPTED DEMO REQUESTER</strong>
              <span className="scripted-badge">SCRIPTED</span>
              <span className="requester-confidence mono">
                CONFIDENCE / {AGENT.confidence.toUpperCase()}
              </span>
            </div>
            <span className="requester-context mono">{AGENT.context}</span>
            <p>&ldquo;{AGENT.message}&rdquo;</p>
          </div>
          <div className="requester-security">
            <ShieldCheck size={14} />
            <span className="mono">NO HIDDEN ANSWER KEY</span>
          </div>
        </div>

        <div className="agent-grid">
          <section className="agent-evidence" aria-label="Agent evidence">
            <div className="agent-section-label">
              <span className="mono">01</span>
              <span>EVIDENCE FIRST</span>
            </div>
            <div className="agent-evidence-card">
              <span className="evidence-type mono">{AGENT.evidence.type.replace("_", " ")}</span>
              <h3>{AGENT.evidence.title}</h3>
              <dl>
                {AGENT.evidence.lines.map((line, index) => {
                  const separator = line.indexOf(": ");
                  return (
                    <div key={`${line}-${index}`}>
                      <dt>{separator > 0 ? line.slice(0, separator) : `Line ${index + 1}`}</dt>
                      <dd>{separator > 0 ? line.slice(separator + 2) : line}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
            <div className="agent-trust-line">
              <span>
                <ShieldCheck size={13} /> TESTNET / NOT REAL MONEY
              </span>
              <span>
                <Landmark size={13} /> OPERATOR TREASURY
              </span>
            </div>
          </section>

          <section className="agent-question" aria-label="Agent question">
            <div className="agent-section-label">
              <span className="mono">02</span>
              <span>{answered ? "TRANSMISSION RECEIVED" : "YOUR RISK READ"}</span>
            </div>
            {!answered ? (
              <>
                <h3>{AGENT.question}</h3>
                <div className="agent-answer-list">
                  {AGENT.options.map((option, index) => (
                    <button
                      type="button"
                      key={option.key}
                      className={`agent-answer ${hovered === option.key ? "is-hovered" : ""}`}
                      onMouseEnter={() => setHovered(option.key)}
                      onMouseLeave={() => setHovered(null)}
                      onClick={() => onAnswer(option.key)}
                      data-testid={`agent-answer-${option.key}`}
                    >
                      <span className="agent-answer-letter mono">
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>
                        <strong>{option.label}</strong>
                        <small>{option.description}</small>
                      </span>
                      <ArrowRight size={17} />
                    </button>
                  ))}
                </div>
                <p className="agent-hint">
                  <CircleHelp size={13} />
                  Any valid classification earns the fixed 500 Luna. This MVP
                  has no hidden correct/incorrect rubric.
                </p>
              </>
            ) : (
              <div className="agent-reward" data-testid="agent-reward">
                <div className="agent-burst" aria-hidden="true">
                  {burstParticles.map((particle, index) => (
                    <span
                      key={index}
                      className="agent-burst-particle"
                      style={
                        {
                          "--angle": `${particle.angle}deg`,
                          "--distance": `${particle.distance}px`,
                          animationDelay: `${particle.delay}ms`,
                        } as React.CSSProperties
                      }
                    />
                  ))}
                </div>
                <span className="agent-reward-seal">
                  <Check size={24} />
                </span>
                <span className="mono agent-reward-kicker">TRANSMISSION ACCEPTED</span>
                <div className="agent-reward-value mono">
                  +{formatLuna(earnedLuna)}
                  <span> LUNA</span>
                </div>
                <p>
                  Classified as{" "}
                  <strong>{selected?.label ?? "unnamed risk read"}</strong>. The
                  reward is reserved for the scripted requester&apos;s
                  consultation. No funds move in this prototype.
                </p>
              </div>
            )}
          </section>
        </div>

        {answered ? (
          <section className="agent-payout" aria-label="Simulated payout lifecycle">
            <div className="agent-section-label">
              <span className="mono">03</span>
              <span>PAYOUT LIFECYCLE</span>
              <span className="simulation-tag">SIMULATION</span>
            </div>
            <div
              className="payout-track"
              data-testid="payout-status"
              aria-label={`Simulated payout status: ${STAGES[payoutStage]}`}
            >
              {STAGES.map((stage, index) => (
                <div
                  key={stage}
                  className={`payout-step ${index <= payoutStage ? "is-reached" : ""} ${index === payoutStage ? "is-current" : ""}`}
                >
                  <span className="payout-node">
                    {index < payoutStage || confirmed ? <Check size={13} /> : null}
                  </span>
                  <span className="payout-copy">
                    <span className="mono payout-index">0{index + 1}</span>
                    <strong>{stage}</strong>
                    <p>{STAGE_COPY[index]}</p>
                  </span>
                </div>
              ))}
            </div>
            <div className="payout-foot">
              <span className="mono">
                {confirmed ? "SIMULATED PAYOUT CONFIRMED" : `STATUS / ${STAGES[payoutStage]}`}
              </span>
              <span className="mono">NO FINANCIAL TRANSFER IS PERFORMED</span>
            </div>

            <div className="agent-reference" data-testid="phase5-reference">
              <div className="reference-head">
                <span className="mono">PHASE 5 REFERENCE / TESTNET PROOF</span>
                <span className="reference-badge mono">REAL CHAIN EVIDENCE</span>
              </div>
              <div className="reference-body">
                <span>
                  <small className="mono">TX</small>
                  <a
                    href={PHASE5_REFERENCE.explorerUrl}
                    target="_blank"
                    rel="noreferrer"
                    data-testid="phase5-tx"
                  >
                    {PHASE5_REFERENCE.txHash}
                    <ExternalLink size={13} />
                  </a>
                </span>
                <span className="mono reference-meta">
                  1,000 LUNA / BLOCK {PHASE5_REFERENCE.block.toLocaleString("en-US")}
                </span>
              </div>
              <p>
                Reference only. This is a real Phase 5 testnet payout from a
                different play-through, not this 500 Luna simulation.
              </p>
            </div>

            <div className="operator-disclosure">
              <Landmark size={16} />
              <p>
                <strong>Operator Treasury.</strong> Rewards are paid from one
                operator-controlled testnet treasury via ordinary NIM transfer.
                Database reservations are accounting, not on-chain escrow. No
                HTLC, no trustless claim, and the requester is scripted.
              </p>
            </div>
          </section>
        ) : (
          <div className="agent-preflight">
            <div>
              <ShieldCheck size={14} />
              <span>FIXED 500 LUNA / ACCEPTED RESPONSE</span>
            </div>
            <div>
              <Landmark size={14} />
              <span>OPERATOR-CONTROLLED TESTNET TREASURY</span>
            </div>
            <div>
              <Radio size={14} />
              <span>SCRIPTED REQUESTER, NOT A LIVE AI</span>
            </div>
          </div>
        )}

        <div className="agent-actions">
          {answered ? (
            <>
              <span className="agent-settlement mono">
                {confirmed ? "SETTLED / TESTNET SIMULATION" : "AWAITING SIMULATED SETTLEMENT"}
              </span>
              {confirmed ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={onFinish}
                  data-testid="agent-finish"
                >
                  Return to the galaxy
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Close and check later
                </button>
              )}
            </>
          ) : (
            <>
              <span className="agent-settlement mono">
                SELECT A CLASSIFICATION TO TRANSMIT
              </span>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Not yet
              </button>
            </>
          )}
        </div>
      </div>
    </OverlayShell>
  );
}
