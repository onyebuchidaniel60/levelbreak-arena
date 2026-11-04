import { ArrowRight, Check, ChevronsRight, ShieldAlert } from "lucide-react";
import type { Sector, SectorProgress } from "../game/types";
import { formatPortfolio } from "../game/sectors";
import { OverlayShell } from "./OverlayShell";

type SectorOverlayProps = {
  sector: Sector;
  progress: SectorProgress | undefined;
  portfolioUnits: number;
  onClose: () => void;
  onDecision: (decisionKey: string) => void;
  onOpenConsultation: () => void;
};

export function SectorOverlay({
  sector,
  progress,
  portfolioUnits,
  onClose,
  onDecision,
  onOpenConsultation,
}: SectorOverlayProps) {
  const decision = progress
    ? sector.decisions.find((item) => item.key === progress.decisionKey)
    : undefined;
  const isCleared = progress?.status === "cleared";
  const hasDecision = Boolean(progress && decision);
  const displayPortfolio = progress?.portfolioAfterUnits ?? portfolioUnits;
  const beforePortfolio = progress?.portfolioBeforeUnits ?? portfolioUnits;
  const delta = displayPortfolio - beforePortfolio;
  const deltaPercent =
    beforePortfolio > 0 ? Math.round((delta / beforePortfolio) * 1_000) / 10 : 0;

  return (
    <OverlayShell
      titleId="sector-overlay-title"
      testId="sector-overlay"
      onRequestClose={onClose}
      className={`sector-overlay sector-${sector.index}`}
    >
      <div className="overlay-masthead">
        <div className="overlay-eyebrow">
          <span className="mono">SECTOR 0{sector.index}</span>
          <span className="eyebrow-slash">/</span>
          <span>{isCleared ? "ARCHIVE" : hasDecision ? "POSITION FILED" : "BRIEFING"}</span>
        </div>
        <h2 id="sector-overlay-title" className="overlay-title">
          {sector.codename}
        </h2>
        <p className="overlay-subtitle">{sector.title}</p>
      </div>

      <div className="sector-orb" aria-hidden="true">
        <img src={sector.texture} alt="" />
        <span className="sector-orb-ring" />
        <span className="sector-orb-index mono">0{sector.index}</span>
      </div>

      <div className="sector-grid">
        <div className="scenario-column">
          <div className="module-label">
            <span className="mono">01</span>
            <span>THE SITUATION</span>
          </div>
          <p className="scenario-setting mono">{sector.scenario.setting}</p>
          <p className="scenario-copy">{sector.scenario.situation}</p>

          <div className="prompt-block">
            <span className="module-label module-label--tight">
              <span className="mono">02</span>
              <span>DECISION PROMPT</span>
            </span>
            <p>{sector.scenario.prompt}</p>
          </div>

          <div className="sector-trust-line">
            <ShieldAlert size={14} />
            <span>
              Virtual portfolio only. No trades execute, no DeFi protocol is
              connected, and the consultation fee is fixed at 500 Luna per valid
              response.
            </span>
          </div>
        </div>

        <div className="decision-column">
          <div className="portfolio-readout">
            <span className="hud-label">VIRTUAL PORTFOLIO</span>
            <div className="portfolio-value mono">
              {formatPortfolio(displayPortfolio)}
              <span className="portfolio-unit">vUSDT</span>
            </div>
            {hasDecision ? (
              delta === 0 ? (
                <span className="delta-chip is-neutral">
                  <span className="mono">BALANCE UNCHANGED</span>
                  <span className="mono">0.0%</span>
                </span>
              ) : (
                <span
                  className={`delta-chip ${delta < 0 ? "is-negative" : "is-positive"}`}
                >
                  <span className="mono">
                    {delta > 0 ? "+" : ""}
                    {formatPortfolio(delta)} vUSDT
                  </span>
                  <span className="mono">
                    {deltaPercent > 0 ? "+" : ""}
                    {deltaPercent.toFixed(1)}%
                  </span>
                </span>
              )
            ) : (
              <span className="portfolio-note">Starting simulation balance</span>
            )}
          </div>

          {!hasDecision ? (
            <>
              <div className="module-label module-label--choice">
                <span className="mono">03</span>
                <span>CHOOSE YOUR POSITION</span>
              </div>
              <div className="decision-list">
                {sector.decisions.map((item, index) => (
                  <button
                    key={item.key}
                    type="button"
                    className="decision-option"
                    onClick={() => onDecision(item.key)}
                    data-testid={`decision-${item.key}`}
                  >
                    <span className="decision-letter mono">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="decision-body">
                      <span className="decision-title">{item.label}</span>
                      <span className="decision-copy">{item.description}</span>
                    </span>
                    <ArrowRight size={18} className="decision-arrow" />
                  </button>
                ))}
              </div>
              <p className="micro-note">
                THIS CHOICE IS FINAL FOR THE SECTOR. EVIDENCE COMES BEFORE THE
                CONSULTATION.
              </p>
            </>
          ) : (
            <>
              <div className="module-label module-label--choice">
                <span className="mono">{isCleared ? "04" : "03"}</span>
                <span>{isCleared ? "SECTOR ARCHIVE" : "SIMULATED OUTCOME"}</span>
              </div>
              <div className={`outcome-block ${delta < 0 ? "is-negative" : ""}`}>
                <div className="outcome-topline">
                  <span className="outcome-status">
                    <Check size={14} />
                    {isCleared ? "SECTOR CLEARED" : "POSITION FILED"}
                  </span>
                  <span className="mono outcome-decision">{decision?.label}</span>
                </div>
                <p className="outcome-copy">{decision?.explanation}</p>
                <div className="lesson-line">
                  <ChevronsRight size={15} />
                  <span>{decision?.lesson}</span>
                </div>
              </div>

              {isCleared ? (
                <div className="archive-reward">
                  <span className="hud-label">CONSULTATION RESULT</span>
                  <span className="mono">
                    {progress?.consultationStatus === "answered"
                      ? "+500 LUNA / +100 XP"
                      : "SKIPPED / +0 LUNA"}
                  </span>
                </div>
              ) : (
                <p className="micro-note">
                  THE SIMULATED PORTFOLIO IS UPDATED. NEXT: READ THE SCRIPTED
                  REQUESTER&apos;S EVIDENCE, THEN CLASSIFY THE RISK.
                </p>
              )}

              {!isCleared ? (
                <button
                  type="button"
                  className="btn btn-primary btn-wide"
                  onClick={onOpenConsultation}
                  data-testid="open-consultation"
                >
                  Open the consultation
                  <ArrowRight size={17} />
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-secondary btn-wide"
                  onClick={onClose}
                >
                  Return to orbit
                  <ArrowRight size={17} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </OverlayShell>
  );
}
