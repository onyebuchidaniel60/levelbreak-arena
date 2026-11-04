import { useCallback, useEffect, useRef, useState } from "react";
import { GalaxyScene } from "./scene/GalaxyScene";
import { GalaxyHud, type AgentStatus } from "./components/GalaxyHud";
import { PlanetDossier } from "./components/PlanetDossier";
import { ConquestPanel } from "./components/ConquestPanel";
import { TeacherTestModal } from "./components/TeacherTestModal";
import { AgentModal } from "./components/AgentModal";
import { ImpactOverlay } from "./components/ImpactOverlay";
import { Toast } from "./components/Toast";
import {
  AGENT_REWARD_LUNA,
  CONQUEST_XP,
  PLANETS,
  type Teacher,
} from "./game/conquest";

type Screen = "galaxy" | "conquest";

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

export default function App() {
  const reducedMotion = usePrefersReducedMotion();
  const [screen, setScreen] = useState<Screen>("galaxy");
  const [xp, setXp] = useState(0);
  const [clearedTeachers, setClearedTeachers] = useState<Set<number>>(
    () => new Set(),
  );
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [agentUnlocked, setAgentUnlocked] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentAnswered, setAgentAnswered] = useState(false);
  const [agentAnswerKey, setAgentAnswerKey] = useState<
    "SAFE" | "RISKY" | "CANT_TELL" | null
  >(null);
  const [agentConfirmed, setAgentConfirmed] = useState(false);
  const [payoutStage, setPayoutStage] = useState(0);
  const [earnedLuna, setEarnedLuna] = useState(0);
  const [impactActive, setImpactActive] = useState(false);
  const [skyfallPending, setSkyfallPending] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastId = useRef(0);

  const agentStatus: AgentStatus = agentConfirmed
    ? "confirmed"
    : agentUnlocked
      ? "awake"
      : "sealed";
  const conquered = agentConfirmed;

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
    if (!agentAnswered || agentConfirmed) return;
    const submitTimer = window.setTimeout(() => setPayoutStage(1), 1100);
    const confirmTimer = window.setTimeout(() => {
      setPayoutStage(2);
      setAgentConfirmed(true);
    }, 2400);
    return () => {
      window.clearTimeout(submitTimer);
      window.clearTimeout(confirmTimer);
    };
  }, [agentAnswered, agentConfirmed]);

  useEffect(() => {
    if (!impactActive) return;
    const timer = window.setTimeout(() => {
      setImpactActive(false);
      setAgentModalOpen(true);
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [impactActive]);

  useEffect(() => {
    if (!skyfallPending) return;
    const timer = window.setTimeout(() => {
      setSkyfallPending(false);
      setSelectedTeacher(null);
      setXp(CONQUEST_XP);
      setAgentUnlocked(true);
      setImpactActive(true);
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [skyfallPending]);

  function triggerImpact() {
    if (agentUnlocked || impactActive) return;
    setXp(CONQUEST_XP);
    setAgentUnlocked(true);
    setImpactActive(true);
    setSkyfallPending(false);
    setSelectedTeacher(null);
  }

  function handleOpenXylos() {
    setScreen("conquest");
    setToast(null);
  }

  function handleLockedPlanet(planetName: string, id: number) {
    showToast(
      conquered
        ? `PLANET ${String(id).padStart(2, "0")} // ${planetName.toUpperCase()} IS SEALED FOR THE NEXT CHAPTER.`
        : `PLANET ${String(id).padStart(2, "0")} // ${planetName.toUpperCase()} IS SEALED — CONQUER XYLOS FIRST.`,
    );
  }

  function handleSimulateXpMax() {
    if (agentUnlocked) return;
    triggerImpact();
  }

  function handleOpenTeacher(teacher: Teacher) {
    if (clearedTeachers.has(teacher.id)) {
      showToast(`${teacher.name.toUpperCase()} IS ALREADY MASTERED — NO EXTRA XP.`);
      return;
    }
    setSelectedTeacher(teacher);
  }

  function handleTestPass(teacher: Teacher) {
    if (clearedTeachers.has(teacher.id)) return;
    const nextXp = Math.min(CONQUEST_XP, xp + teacher.xp);
    setClearedTeachers((current) => {
      const next = new Set(current);
      next.add(teacher.id);
      return next;
    });
    setXp(nextXp);
    if (nextXp >= CONQUEST_XP && !agentUnlocked) {
      setSkyfallPending(true);
    }
  }

  function handleAgentAnswer(key: "SAFE" | "RISKY" | "CANT_TELL") {
    if (agentAnswered) return;
    setAgentAnswered(true);
    setAgentAnswerKey(key);
    setEarnedLuna(AGENT_REWARD_LUNA);
    setPayoutStage(0);
  }

  function handleOpenAgent() {
    if (!agentUnlocked) {
      showToast("THE AGENT IS SEALED — REACH 100 XP ON XYLOS TO BREAK THE CORE.");
      return;
    }
    setAgentModalOpen(true);
  }

  function handleAgentFinish() {
    setAgentModalOpen(false);
    setScreen("galaxy");
    showToast("XYLOS CONQUERED — AGENT PAYOUT CONFIRMED. THE NEXT CHAPTER IS SEALED.");
  }

  function handleReset() {
    setScreen("galaxy");
    setXp(0);
    setClearedTeachers(new Set());
    setSelectedTeacher(null);
    setAgentUnlocked(false);
    setAgentModalOpen(false);
    setAgentAnswered(false);
    setAgentAnswerKey(null);
    setAgentConfirmed(false);
    setPayoutStage(0);
    setEarnedLuna(0);
    setImpactActive(false);
    setSkyfallPending(false);
    showToast("DEMO RESET — XYLOS AWAITS ITS FIRST CONQUEST.");
  }

  const sceneMode = impactActive
    ? "impact"
    : screen === "conquest"
      ? "conquest"
      : "galaxy";

  return (
    <div
      className="app-shell"
      data-screen={screen}
      data-impact={impactActive ? "true" : "false"}
      data-testid="app"
    >
      <div className="cosmic-backdrop" aria-hidden="true" />
      <div className="cosmic-grain" aria-hidden="true" />
      <div className="cosmic-vignette" aria-hidden="true" />

      <GalaxyScene
        mode={sceneMode}
        conquered={conquered}
        agentUnlocked={agentUnlocked}
        impactActive={impactActive}
        reducedMotion={reducedMotion}
        onOpenXylos={handleOpenXylos}
        onLockedPlanet={(planet) => handleLockedPlanet(planet.name, planet.id)}
      />

      {!impactActive ? (
        <GalaxyHud
          xp={xp}
          earnedLuna={earnedLuna}
          clearedTeachers={clearedTeachers.size}
          agentStatus={agentStatus}
          onOpenAgent={handleOpenAgent}
          onReset={handleReset}
        />
      ) : null}

      {!impactActive && screen === "galaxy" ? (
        <PlanetDossier
          planet={PLANETS[0]}
          xp={xp}
          clearedTeachers={clearedTeachers.size}
          agentStatus={agentStatus}
          earnedLuna={earnedLuna}
          conquered={conquered}
          onEnter={handleOpenXylos}
          onOpenAgent={handleOpenAgent}
        />
      ) : null}

      {!impactActive && screen === "conquest" ? (
        <ConquestPanel
          xp={xp}
          clearedTeachers={clearedTeachers}
          agentStatus={agentStatus}
          skyfallPending={skyfallPending}
          onBack={() => setScreen("galaxy")}
          onOpenTeacher={handleOpenTeacher}
          onSimulateXp={handleSimulateXpMax}
          onOpenAgent={handleOpenAgent}
        />
      ) : null}

      {selectedTeacher ? (
        <TeacherTestModal
          teacher={selectedTeacher}
          skyfallPending={skyfallPending}
          onClose={() => setSelectedTeacher(null)}
          onPass={handleTestPass}
        />
      ) : null}

      {agentModalOpen ? (
        <AgentModal
          answered={agentAnswered}
          answerKey={agentAnswerKey}
          payoutStage={payoutStage}
          confirmed={agentConfirmed}
          earnedLuna={earnedLuna}
          onAnswer={handleAgentAnswer}
          onClose={() => setAgentModalOpen(false)}
          onFinish={handleAgentFinish}
        />
      ) : null}

      {impactActive ? (
        <ImpactOverlay
          onOpenAgent={() => {
            setImpactActive(false);
            setAgentModalOpen(true);
          }}
        />
      ) : null}

      <Toast message={toast?.text ?? null} />
    </div>
  );
}
