import { useEffect, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Landmark,
  RotateCcw,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import {
  formatLuna,
  formatPortfolio,
  lunaToNim,
  MAX_REWARD_LUNA,
  PHASE5_REFERENCE,
} from "../game/sectors";
import { OverlayShell } from "./OverlayShell";

type SummaryOverlayProps = {
  xp: number;
  earnedLuna: number;
  answers: number;
  skips: number;
  portfolioUnits: number;
  onInspect: () => void;
  onReplay: () => void;
};

const PAYOUT_STAGES = ["QUEUED", "SUBMITTED", "CONFIRMED"] as const;

const STAGE_COPY = {
  QUEUED: "Reward reserved in the payout outbox.",
  SUBMITTED: "Broadcast request handed to treasury.",
  CONFIRMED: "Simulated lifecycle complete.",
} as const;

export function SummaryOverlay({
  xp,
  earnedLuna,
  answers,
  skips,
  portfolioUnits,
  onInspect,
  onReplay,
}: SummaryOverlayProps) {
  const [stageIndex, setStageIndex] = useState(0);
  const hasPayout = earnedLuna > 0;

  useEffect(() => {
    if (!hasPayout) return;
    const submitTimer = window.setTimeout(() => setStageIndex(1), 1050);
    const confirmTimer = window.setTimeout(() => setStageIndex(2), 2250);
    return () => {
      window.clearTimeout(submitTimer);
      window.clearTimeout(confirmTimer);
    };
  }, [hasPayout]);

  return (
    <OverlayShell
      titleId="summary-overlay-title"
      testId="summary-overlay"
      onRequestClose={onInspect}
      className="summary-overlay"
      align="center"
    >
      <div className="summary-scroll">
        <div className="summary-stamp mono">FINAL SWEEP // RUN 001</div>

        <div className="summary-hero">
        <div className="summary-hero-copy">
          <div className="overlay-eyebrow">
            <span className="status-dot" />
            RUN COMPLETE
          </div>
          <h2 id="summary-overlay-title" className="overlay-title summary-title">
            Orbit cleared.
          </h2>
          <p className="overlay-subtitle">
            Three risk signals answered. The simulated run is settled and queued
            for its payout review.
          </p>
          <div className="summary-badges">
            <span>
              <Trophy size={14} /> PEG NAVIGATOR
            </span>
            <span>
              <Trophy size={14} /> POOL DIVER
            </span>
            <span>
              <Trophy size={14} /> YIELD SENTINEL
            </span>
          </div>
        </div>

        <div className="summary-total">
          <span className="hud-label">SIMULATED EARNINGS</span>
          <div className="summary-total-value mono">
            {formatLuna(earnedLuna)}
            <span> LUNA</span>
          </div>
          <span className="summary-total-nim mono">
            {lunaToNim(earnedLuna)} NIM // TESTNET UNITS
          </span>
          <span className="summary-total-cap mono">
            CAP {formatLuna(MAX_REWARD_LUNA)} LUNA
          </span>
        </div>
      </div>

      <div className="summary-stats">
        <div>
          <span className="hud-label">RUN XP</span>
          <strong className="mono">{xp} / 300</strong>
        </div>
        <div>
          <span className="hud-label">ANSWERS</span>
          <strong className="mono">{answers} / 3</strong>
        </div>
        <div>
          <span className="hud-label">SKIPPED</span>
          <strong className="mono">{skips} / 3</strong>
        </div>
        <div>
          <span className="hud-label">FINAL PORTFOLIO</span>
          <strong className="mono">{formatPortfolio(portfolioUnits)} vUSDT</strong>
        </div>
      </div>

      <div className="summary-columns">
        <div className="payout-column">
          <div className="module-label">
            <span className="mono">01</span>
            <span>PAYOUT LIFECYCLE</span>
            <span className="simulation-tag">SIMULATION</span>
          </div>

          {hasPayout ? (
            <div
              className="payout-track"
              data-testid="payout-status"
              aria-label={`Simulated payout status: ${PAYOUT_STAGES[stageIndex]}`}
            >
              {PAYOUT_STAGES.map((stage, index) => {
                const reached = index <= stageIndex;
                const current = index === stageIndex;
                return (
                  <div
                    className={`payout-step ${reached ? "is-reached" : ""} ${current ? "is-current" : ""}`}
                    key={stage}
                  >
                    <div className="payout-node">{reached ? <Check size={13} /> : null}</div>
                    <div className="payout-step-copy">
                      <span className="mono payout-index">0{index + 1}</span>
                      <strong>{stage}</strong>
                      <p>{STAGE_COPY[stage]}</p>
                    </div>
                  </div>
                );
              })}
              <div className="payout-summary-line">
                <span className="mono">
                  {stageIndex === 2 ? "SIMULATED CONFIRMED" : `STATUS ${PAYOUT_STAGES[stageIndex]}`}
                </span>
                <span className="mono">NO FUNDS MOVE IN THIS PROTOTYPE</span>
              </div>
            </div>
          ) : (
            <div className="zero-payout" data-testid="zero-payout">
              <span className="zero-payout-value mono">0 LUNA</span>
              <strong>No payout record.</strong>
              <p>
                Skipped consultations earn zero. With no accepted answers, no
                payout would be queued in the real product.
              </p>
            </div>
          )}

          <section className="reference-receipt" aria-labelledby="reference-receipt-title">
            <div className="reference-head">
              <span id="reference-receipt-title" className="module-label module-label--tight">
                <span className="mono">02</span>
                <span>PHASE 5 REFERENCE RECEIPT</span>
              </span>
              <span className="real-proof-badge">REAL TESTNET PROOF</span>
            </div>
            <div className="reference-grid">
              <div>
                <span className="hud-label">STATUS</span>
                <strong className="mono receipt-status">
                  <Check size={13} /> CONFIRMED
                </strong>
              </div>
              <div>
                <span className="hud-label">AMOUNT</span>
                <strong className="mono">1,000 LUNA</strong>
              </div>
              <div>
                <span className="hud-label">BLOCK</span>
                <strong className="mono">15,838,771</strong>
              </div>
              <div>
                <span className="hud-label">NETWORK</span>
                <strong className="mono">{PHASE5_REFERENCE.network}</strong>
              </div>
            </div>
            <a
              className="tx-link"
              href={PHASE5_REFERENCE.explorerUrl}
              target="_blank"
              rel="noreferrer"
              data-testid="phase5-tx"
            >
              <span className="mono">{PHASE5_REFERENCE.txHash}</span>
              <ArrowUpRight size={15} />
            </a>
            <p className="reference-note">
              This is the real Phase 5 payout from play-through A, shown as
              reference evidence. It is not this prototype&apos;s simulated
              payout and it may not equal this run&apos;s earnings.
            </p>
          </section>
        </div>

        <div className="trust-column">
          <div className="module-label">
            <span className="mono">03</span>
            <span>TRUST DISCLOSURE</span>
          </div>
          <div className="operator-disclosure">
            <div className="operator-icon" aria-hidden="true">
              <Landmark size={22} />
            </div>
            <h3>Operator Treasury</h3>
            <p>
              Rewards are paid from one operator-controlled Nimiq testnet
              treasury by ordinary NIM transfer. Once funded, those testnet
              funds are custodied by the operator.
            </p>
            <ul>
              <li>Accounting reservation, not on-chain escrow.</li>
              <li>No HTLC and no trustless payment claim.</li>
              <li>Scripted requester, not a live AI agent.</li>
            </ul>
          </div>

          <div className="trust-pills">
            <span>
              <ShieldCheck size={14} />
              TESTNET · NOT REAL MONEY
            </span>
            <span>
              <Check size={14} />
              FIXED 500 LUNA / ACCEPTED RESPONSE
            </span>
          </div>

          <p className="summary-endnote">
            Prototype only. No wallet connection, API call, payout worker, or
            transfer is active on this screen.
          </p>
        </div>
      </div>
      </div>

      <div className="summary-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={onInspect}
          data-testid="summary-inspect"
        >
          Inspect cleared orbit
          <ArrowRight size={17} />
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onReplay}
          data-testid="summary-replay"
        >
          <RotateCcw size={15} />
          Replay demo
        </button>
      </div>
    </OverlayShell>
  );
}
