import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Flame,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  X,
} from "lucide-react";
import { OverlayShell } from "./OverlayShell";
import { TIER_META, type Teacher } from "../game/conquest";

type TeacherTestModalProps = {
  teacher: Teacher;
  skyfallPending: boolean;
  onClose: () => void;
  onPass: (teacher: Teacher) => void;
};

export function TeacherTestModal({
  teacher,
  skyfallPending,
  onClose,
  onPass,
}: TeacherTestModalProps) {
  const tier = TIER_META[teacher.tier];
  const [choice, setChoice] = useState<number | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);

  function handleChoose(index: number) {
    if (result !== null) return;
    setChoice(index);
    if (index === teacher.question.correctIndex) {
      setResult("correct");
      onPass(teacher);
    } else {
      setResult("wrong");
    }
  }

  function handleRetry() {
    setChoice(null);
    setResult(null);
  }

  const style = {
    "--tier-color": tier.color,
    "--tier-soft": tier.soft,
  } as React.CSSProperties;

  return (
    <OverlayShell
      titleId="teacher-test-title"
      testId="teacher-test-modal"
      onRequestClose={onClose}
      className="test-overlay"
      align="center"
    >
      <div className="test-panel" style={style}>
        <div className="test-header">
          <span className="test-avatar" aria-hidden="true">
            {teacher.name.split(" ").at(-1)?.slice(0, 2).toUpperCase()}
            <span />
          </span>
          <div className="test-heading">
            <span className="eyebrow">
              TEACHER {String(teacher.id).padStart(2, "0")} / {tier.label}
            </span>
            <h2 id="teacher-test-title">{teacher.name}</h2>
            <p>{teacher.role} · Xylos Teacher Tower</p>
          </div>
          <div className="test-reward-chip">
            <Sparkles size={13} />
            <span className="mono">+{teacher.xp} XP</span>
          </div>
        </div>

        <div className="test-question-block">
          <div className="test-question-label">
            <span className="mono">RISK TRIAL</span>
            <span className="difficulty" aria-label={`Difficulty ${teacher.tier} of 4`}>
              {[1, 2, 3, 4].map((level) => (
                <i key={level} className={level <= teacher.tier ? "is-lit" : ""} />
              ))}
            </span>
          </div>
          <h3>{teacher.question.prompt}</h3>
        </div>

        <div className="test-options">
          {teacher.question.options.map((option, index) => {
            const isChosen = choice === index;
            const isCorrect = result === "correct" && isChosen;
            const isWrong = result === "wrong" && isChosen;
            return (
              <button
                type="button"
                key={option}
                className={`test-option ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""} ${result !== null ? "is-locked" : ""}`}
                onClick={() => handleChoose(index)}
                disabled={result !== null}
                data-testid={`teacher-option-${index}`}
              >
                <span className="test-option-letter mono">
                  {String.fromCharCode(65 + index)}
                </span>
                <span>{option}</span>
                {isCorrect ? (
                  <Check size={18} className="test-option-icon" />
                ) : isWrong ? (
                  <X size={18} className="test-option-icon" />
                ) : (
                  <ChevronRight size={16} className="test-option-arrow" />
                )}
              </button>
            );
          })}
        </div>

        {result ? (
          <div
            className={`test-feedback is-${result}`}
            data-testid="teacher-test-feedback"
            role="status"
          >
            <span className="feedback-icon" aria-hidden="true">
              {result === "correct" ? (
                <Check size={18} />
              ) : (
                <ShieldAlert size={18} />
              )}
            </span>
            <div className="feedback-copy">
              <strong>
                {result === "correct"
                  ? `Mastered. +${teacher.xp} XP claimed.`
                  : "Not quite. Read the lesson and try again."}
              </strong>
              <p>{teacher.question.explanation}</p>
              {skyfallPending ? (
                <span className="skyfall-inline">
                  <Flame size={13} /> CONQUEST THRESHOLD REACHED — THE SKY IS
                  BREAKING.
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="test-hint">
            <Sparkles size={12} />
            One answer per trial. A wrong answer costs nothing; learning does
            not.
          </p>
        )}

        <div className="test-actions">
          {result === "wrong" ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRetry}
              data-testid="teacher-retry"
            >
              <RotateCcw size={15} />
              Try again
            </button>
          ) : result === "correct" ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onClose}
              data-testid="teacher-test-finish"
            >
              Return to the tower
              <ArrowRight size={16} />
            </button>
          ) : (
            <button type="button" className="test-skip" onClick={onClose}>
              Leave the trial
            </button>
          )}
        </div>
      </div>
    </OverlayShell>
  );
}
