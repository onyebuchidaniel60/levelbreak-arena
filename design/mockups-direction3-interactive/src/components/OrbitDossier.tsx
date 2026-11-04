import { ArrowUpRight, Orbit, Trophy } from "lucide-react";
import type { Sector } from "../game/types";
import { formatPortfolio } from "../game/sectors";

type OrbitDossierProps = {
  activeSector: Sector | null;
  portfolioUnits: number;
  clearedCount: number;
  runComplete: boolean;
  onOpenSector: () => void;
  onOpenSummary: () => void;
};

export function OrbitDossier({
  activeSector,
  portfolioUnits,
  clearedCount,
  runComplete,
  onOpenSector,
  onOpenSummary,
}: OrbitDossierProps) {
  if (runComplete || !activeSector) {
    return (
      <aside className="orbit-dossier orbit-dossier--complete">
        <div className="dossier-rule" aria-hidden="true" />
        <div className="dossier-kicker">
          <span className="status-dot" />
          RUN COMPLETE // ALL SECTORS CLEARED
        </div>
        <h2 className="dossier-title">Orbit secured.</h2>
        <p className="dossier-subtitle">
          Three risk signals mapped. Your simulated run is settled and the
          payout receipt is ready for review.
        </p>
        <div className="dossier-trophies" aria-label="Cleared sectors">
          <Trophy size={16} />
          <span className="mono">3 / 3 SECTORS CLEARED</span>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={onOpenSummary}
          data-testid="dossier-summary"
        >
          Open run summary
          <ArrowUpRight size={17} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="orbit-dossier">
      <div className="dossier-rule" aria-hidden="true" />
      <div className="dossier-kicker">
        <span className="status-dot" />
        ACTIVE SIGNAL // SECTOR 0{activeSector.index}
      </div>
      <h2 className="dossier-title">{activeSector.codename}</h2>
      <p className="dossier-subtitle">{activeSector.title}</p>

      <dl className="dossier-stats">
        <div>
          <dt>VIRTUAL PORTFOLIO</dt>
          <dd className="mono">{formatPortfolio(portfolioUnits)} vUSDT</dd>
        </div>
        <div>
          <dt>CONSULTATION FEE</dt>
          <dd className="mono accent">+500 LUNA</dd>
        </div>
        <div>
          <dt>ROUTE</dt>
          <dd className="mono">
            {clearedCount.toString().padStart(2, "0")} / 03 CLEARED
          </dd>
        </div>
      </dl>

      <button
        type="button"
        className="btn btn-primary dossier-cta"
        onClick={onOpenSector}
        data-testid="open-sector"
      >
        <Orbit size={17} />
        Open sector 0{activeSector.index}
      </button>
      <p className="dossier-hint">
        CLICK THE ILLUMINATED PLANET, OR ENTER THE SIGNAL HERE
      </p>
    </aside>
  );
}
