import { useCallback, useEffect, useRef, useState } from "react";
import { OrbitScene } from "./scene/OrbitScene";
import { Hud } from "./components/Hud";
import { OrbitDossier } from "./components/OrbitDossier";
import { SectorOverlay } from "./components/SectorOverlay";
import { ConsultationOverlay } from "./components/ConsultationOverlay";
import { SummaryOverlay } from "./components/SummaryOverlay";
import { LevelCompleteBanner } from "./components/LevelCompleteBanner";
import { Toast } from "./components/Toast";
import {
  applyBasisPoints,
  getSector,
  REWARD_LUNA,
  STARTING_PORTFOLIO_UNITS,
  XP_PER_SECTOR,
  SECTORS,
} from "./game/sectors";
import type { SectorProgress } from "./game/types";

type Screen = "orbit" | "sector" | "consultation" | "summary";

function usePrefersReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  return reducedMotion;
}

function emptyProgress(): Record<number, SectorProgress> {
  return {};
}

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const [screen, setScreen] = useState<Screen>("orbit");
  const [activeIndex, setActiveIndex] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [progress, setProgress] =
    useState<Record<number, SectorProgress>>(emptyProgress);
  const [portfolioUnits, setPortfolioUnits] = useState(STARTING_PORTFOLIO_UNITS);
  const [xp, setXp] = useState(0);
  const [earnedLuna, setEarnedLuna] = useState(0);
  const [answers, setAnswers] = useState(0);
  const [skips, setSkips] = useState(0);
  const [levelCompleteIndex, setLevelCompleteIndex] = useState<number | null>(null);
  const [celebratingIndex, setCelebratingIndex] = useState<number | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastId = useRef(0);
  const decisionGuard = useRef<Set<number>>(new Set());
  const answerGuard = useRef<Set<number>>(new Set());
  const finishGuard = useRef<Set<number>>(new Set());

  const selectedSector = selectedIndex ? getSector(selectedIndex) : null;
  const selectedProgress =
    selectedIndex === null ? undefined : progress[selectedIndex];
  const clearedCount = SECTORS.filter(
    (sector) => progress[sector.index]?.status === "cleared",
  ).length;
  const runComplete = clearedCount === SECTORS.length;
  const activeSector =
    progress[activeIndex]?.status === "cleared"
      ? null
      : getSector(activeIndex);
  const focusedIndex =
    screen === "sector" || screen === "consultation" ? selectedIndex : null;

  const showToast = useCallback((text: string) => {
    toastId.current += 1;
    setToast({ id: toastId.current, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (celebratingIndex === null) return;
    const timer = window.setTimeout(() => setCelebratingIndex(null), 2600);
    return () => window.clearTimeout(timer);
  }, [celebratingIndex]);

  function handleOpenSector(index: number) {
    if (progress[index]?.status === "cleared") {
      setLevelCompleteIndex(null);
      setSelectedIndex(index);
      setScreen("sector");
      return;
    }

    if (index !== activeIndex) {
      showToast(
        `SECTOR 0${index} IS LOCKED — CLEAR SECTOR 0${index - 1} TO OPEN THE ROUTE.`,
      );
      return;
    }

    setLevelCompleteIndex(null);
    setSelectedIndex(index);
    setScreen("sector");
  }

  function handleLockedSector(index: number) {
    showToast(
      `SECTOR 0${index} IS LOCKED — CLEAR SECTOR 0${index - 1} TO OPEN THE ROUTE.`,
    );
  }

  function handleDecision(decisionKey: string) {
    if (!selectedSector) return;
    if (decisionGuard.current.has(selectedSector.index)) return;
    if (progress[selectedSector.index]) return;
    const decision = selectedSector.decisions.find(
      (item) => item.key === decisionKey,
    );
    if (!decision) return;

    decisionGuard.current.add(selectedSector.index);
    const portfolioAfter = applyBasisPoints(
      portfolioUnits,
      decision.basisPoints,
    );

    setProgress((current) => ({
      ...current,
      [selectedSector.index]: {
        status: "open",
        decisionKey,
        portfolioBeforeUnits: portfolioUnits,
        portfolioAfterUnits: portfolioAfter,
        consultationStatus: null,
        answerKey: null,
        rewardLuna: 0,
        xp: 0,
      },
    }));
    setPortfolioUnits(portfolioAfter);
  }

  function handleOpenConsultation() {
    if (!selectedSector || !progress[selectedSector.index]) return;
    setScreen("consultation");
  }

  function handleAnswer(answerKey: "SAFE" | "RISKY" | "CANT_TELL") {
    if (!selectedSector) return;
    const current = progress[selectedSector.index];
    if (!current) return;
    if (current.consultationStatus) return;
    if (answerGuard.current.has(selectedSector.index)) return;
    answerGuard.current.add(selectedSector.index);

    setProgress((previous) => ({
      ...previous,
      [selectedSector.index]: {
        ...current,
        consultationStatus: "answered",
        answerKey,
        rewardLuna: REWARD_LUNA,
        xp: XP_PER_SECTOR,
      },
    }));
    setXp((value) => Math.min(300, value + XP_PER_SECTOR));
    setEarnedLuna((value) => Math.min(1_500, value + REWARD_LUNA));
    setAnswers((value) => value + 1);
    setCelebratingIndex(selectedSector.index);
  }

  function finishSector(index: number, consultationStatus: "answered" | "skipped") {
    if (finishGuard.current.has(index)) return;
    finishGuard.current.add(index);
    const current = progress[index];
    if (!current) return;

    setProgress((previous) => ({
      ...previous,
      [index]: {
        ...current,
        status: "cleared",
        consultationStatus:
          current.consultationStatus ?? consultationStatus,
      },
    }));
    if (index < 3) {
      setActiveIndex(index + 1);
    }
    setSelectedIndex(null);
    setScreen("orbit");
    setLevelCompleteIndex(index);
    setCelebratingIndex(null);
  }

  function handleFinishConsultation() {
    if (!selectedSector) return;
    finishSector(selectedSector.index, "answered");
  }

  function handleSkip() {
    if (!selectedSector) return;
    const current = progress[selectedSector.index];
    if (!current || current.consultationStatus) return;

    setProgress((previous) => ({
      ...previous,
      [selectedSector.index]: {
        ...current,
        status: "cleared",
        consultationStatus: "skipped",
        answerKey: null,
        rewardLuna: 0,
        xp: 0,
      },
    }));
    setSkips((value) => value + 1);
    if (selectedSector.index < 3) setActiveIndex(selectedSector.index + 1);
    finishGuard.current.add(selectedSector.index);
    setSelectedIndex(null);
    setScreen("orbit");
    setLevelCompleteIndex(selectedSector.index);
    setCelebratingIndex(null);
    showToast("TRANSMISSION SKIPPED — 0 LUNA. SKIPPED TASKS EARN ZERO.");
  }

  function handleCloseOverlay() {
    if (screen === "summary") {
      setScreen("orbit");
      setSelectedIndex(null);
      setLevelCompleteIndex(3);
      return;
    }

    if (screen === "consultation" && selectedSector) {
      if (progress[selectedSector.index]?.consultationStatus === "answered") {
        finishSector(selectedSector.index, "answered");
        return;
      }
      if (!progress[selectedSector.index]?.consultationStatus) {
        setScreen("orbit");
        setSelectedIndex(null);
        return;
      }
    }

    setScreen("orbit");
    setSelectedIndex(null);
  }

  function handleLevelBannerAction() {
    if (levelCompleteIndex === null) return;
    if (levelCompleteIndex >= 3 || runComplete) {
      setScreen("summary");
      return;
    }
    handleOpenSector(levelCompleteIndex + 1);
  }

  function handleOpenSummary() {
    if (!runComplete) return;
    setLevelCompleteIndex(null);
    setScreen("summary");
  }

  function resetDemo(message = "DEMO RESET — ALL SECTORS LOCKED. CHOOSE SECTOR 01.") {
    decisionGuard.current.clear();
    answerGuard.current.clear();
    finishGuard.current.clear();
    setScreen("orbit");
    setActiveIndex(1);
    setSelectedIndex(null);
    setProgress(emptyProgress());
    setPortfolioUnits(STARTING_PORTFOLIO_UNITS);
    setXp(0);
    setEarnedLuna(0);
    setAnswers(0);
    setSkips(0);
    setLevelCompleteIndex(null);
    setCelebratingIndex(null);
    showToast(message);
  }

  const activeSectorLabel = runComplete
    ? "ALL SECTORS CLEARED // RECEIPT READY"
    : activeSector
      ? `SECTOR 0${activeSector.index} // ${activeSector.codename.toUpperCase()}`
      : "ROUTE STANDBY";

  return (
    <div className="app-shell" data-screen={screen} data-testid="app">
      <div className="cosmic-backdrop" aria-hidden="true" />
      <div className="cosmic-grain" aria-hidden="true" />
      <div className="cosmic-vignette" aria-hidden="true" />

      <OrbitScene
        activeIndex={activeIndex}
        progress={progress}
        focusedIndex={focusedIndex}
        showLabels={screen === "orbit"}
        celebratingIndex={celebratingIndex}
        onOpenSector={handleOpenSector}
        onLockedSector={handleLockedSector}
        reducedMotion={reducedMotion}
      />

      <h1 className="sr-only">
        LevelBreak Arena interactive orbit map prototype
      </h1>

      <Hud
        xp={xp}
        earnedLuna={earnedLuna}
        clearedCount={clearedCount}
        activeSectorLabel={activeSectorLabel}
        summaryAvailable={runComplete}
        onReset={() => resetDemo()}
        onOpenSummary={handleOpenSummary}
      />

      {screen === "orbit" ? (
        <OrbitDossier
          activeSector={activeSector}
          portfolioUnits={portfolioUnits}
          clearedCount={clearedCount}
          runComplete={runComplete}
          onOpenSector={() => {
            if (activeSector) handleOpenSector(activeSector.index);
          }}
          onOpenSummary={handleOpenSummary}
        />
      ) : null}

      {screen === "orbit" && levelCompleteIndex !== null ? (
        <LevelCompleteBanner
          sector={getSector(levelCompleteIndex)}
          isRunComplete={runComplete}
          rewardLuna={progress[levelCompleteIndex]?.rewardLuna ?? 0}
          xpEarned={progress[levelCompleteIndex]?.xp ?? 0}
          onAction={handleLevelBannerAction}
          onDismiss={() => setLevelCompleteIndex(null)}
        />
      ) : null}

      {screen === "sector" && selectedSector ? (
        <SectorOverlay
          sector={selectedSector}
          progress={selectedProgress}
          portfolioUnits={portfolioUnits}
          onClose={handleCloseOverlay}
          onDecision={handleDecision}
          onOpenConsultation={handleOpenConsultation}
        />
      ) : null}

      {screen === "consultation" && selectedSector && selectedProgress ? (
        <ConsultationOverlay
          sector={selectedSector}
          progress={selectedProgress}
          onClose={handleCloseOverlay}
          onAnswer={handleAnswer}
          onSkip={handleSkip}
          onFinish={handleFinishConsultation}
        />
      ) : null}

      {screen === "summary" ? (
        <SummaryOverlay
          xp={xp}
          earnedLuna={earnedLuna}
          answers={answers}
          skips={skips}
          portfolioUnits={portfolioUnits}
          onInspect={handleCloseOverlay}
          onReplay={() => resetDemo("DEMO REPLAYED — ORBIT RESET.")}
        />
      ) : null}

      <Toast message={toast?.text ?? null} />
    </div>
  );
}
