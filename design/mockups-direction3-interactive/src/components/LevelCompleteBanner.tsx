import { ArrowRight, Sparkles, Trophy, X } from "lucide-react";
import type { Sector } from "../game/types";
import { formatLuna } from "../game/sectors";

type LevelCompleteBannerProps = {
  sector: Sector;
  isRunComplete: boolean;
  rewardLuna: number;
  xpEarned: number;
  onAction: () => void;
  onDismiss: () => void;
};

export function LevelCompleteBanner({
  sector,
  isRunComplete,
  rewardLuna,
  xpEarned,
  onAction,
  onDismiss,
}: LevelCompleteBannerProps) {
  return (
    <div className="level-banner" data-testid="level-complete-banner" role="status">
      <span className="level-banner-sweep" aria-hidden="true" />
      <div className="level-banner-mark" aria-hidden="true">
        <Trophy size={21} />
      </div>
      <div className="level-banner-copy">
        <span className="level-banner-kicker mono">
          {isRunComplete
            ? "RUN COMPLETE // ALL SECTORS CLEARED"
            : `ROUTE ILLUMINATED // SECTOR 0${sector.index + 1} UNLOCKED`}
        </span>
        <strong className="level-banner-title">
          Sector 0{sector.index} cleared
        </strong>
        <span className="level-banner-meta">
          <Sparkles size={13} />
          {sector.badge} earned ·{" "}
          {rewardLuna > 0 ? `+${formatLuna(rewardLuna)} Luna pending` : "0 Luna — skipped"}{" "}
          · +{xpEarned} XP
        </span>
      </div>
      <button
        type="button"
        className="btn btn-primary level-banner-action"
        onClick={onAction}
        data-testid={isRunComplete ? "level-summary" : "next-sector"}
      >
        {isRunComplete ? "Open final summary" : `Enter sector 0${sector.index + 1}`}
        <ArrowRight size={16} />
      </button>
      <button
        type="button"
        className="level-banner-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss sector-cleared banner"
      >
        <X size={16} />
      </button>
    </div>
  );
}
