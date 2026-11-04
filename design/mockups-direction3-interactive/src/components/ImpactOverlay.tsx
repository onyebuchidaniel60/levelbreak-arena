import { useEffect, useState } from "react";
import { ArrowRight, Check, Flame } from "lucide-react";

const COPY = [
  {
    kicker: "TRAJECTORY LOCKED",
    title: "Meteor inbound.",
    body: "A luminous rock is cutting through Xylos atmosphere. The teachers scatter.",
  },
  {
    kicker: "CORE BREACH",
    title: "The sky breaks.",
    body: "Impact. The surface splits and the Agent's sealed signal floods the tower.",
  },
  {
    kicker: "SEAL OFFLINE",
    title: "Agent signal rising.",
    body: "The asteroid has cracked the core open. First contact is coming through.",
  },
] as const;

export function ImpactOverlay({ onOpenAgent }: { onOpenAgent: () => void }) {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const impactTimer = window.setTimeout(() => setStage(1), 1500);
    const revealTimer = window.setTimeout(() => setStage(2), 2800);
    return () => {
      window.clearTimeout(impactTimer);
      window.clearTimeout(revealTimer);
    };
  }, []);

  const copy = COPY[stage];

  return (
    <div
      className={`impact-layer impact-stage-${stage}`}
      data-testid="impact-overlay"
      data-stage={stage}
      role="status"
      aria-live="assertive"
    >
      <div className="impact-vignette" aria-hidden="true" />
      <div className="impact-topbar">
        <span className="meteor-alert mono">
          <span className="meteor-dot" aria-hidden="true" />
          {stage === 0
            ? "METEOR SIGNATURE LOCKED"
            : stage === 1
              ? "SURFACE IMPACT REGISTERED"
              : "CORE SEAL OFFLINE"}
        </span>
        <span className="impact-system mono">XYLOS / CORE IMPACT</span>
        <span className="impact-testnet mono">TESTNET SIMULATION</span>
      </div>

      <div className="impact-meteor" aria-hidden="true">
        <span className="meteor-trail" />
        <span className="meteor-rock">
          <i />
          <i />
          <i />
        </span>
      </div>

      <div className={`impact-headline impact-headline-${stage}`} key={stage}>
        <span className="impact-kicker mono">
          <Flame size={14} /> {copy.kicker}
        </span>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
      </div>

      {stage >= 1 ? <div className="impact-flash" aria-hidden="true" /> : null}

      <div className="impact-bottom">
        <div className="impact-progress mono">
          <span className={stage >= 0 ? "is-active" : ""}>
            <span className="impact-node">01</span> METEOR
          </span>
          <span className={stage >= 1 ? "is-active" : ""}>
            <span className="impact-node">02</span> IMPACT
          </span>
          <span className={stage >= 2 ? "is-active" : ""}>
            <span className="impact-node">03</span> AGENT
          </span>
        </div>
        {stage >= 2 ? (
          <button
            type="button"
            className="impact-agent-button"
            onClick={onOpenAgent}
            data-testid="open-agent-impact"
          >
            OPEN AGENT TRANSMISSION
            <ArrowRight size={14} />
          </button>
        ) : (
          <span className="impact-caption mono">
            {stage < 2 ? "THE SKY IS FALLING" : "FIRST CONTACT INBOUND"}
          </span>
        )}
        {stage === 2 ? <Check size={14} className="impact-check" /> : null}
      </div>
    </div>
  );
}
