import { useEffect, useRef } from "react";
import { X } from "lucide-react";

type OverlayShellProps = {
  children: React.ReactNode;
  titleId: string;
  testId: string;
  onRequestClose: () => void;
  className?: string;
  align?: "bottom" | "center";
};

export function OverlayShell({
  children,
  titleId,
  testId,
  onRequestClose,
  className = "",
  align = "bottom",
}: OverlayShellProps) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef(onRequestClose);

  useEffect(() => {
    closeRef.current = onRequestClose;
  }, [onRequestClose]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const frame = window.requestAnimationFrame(() => {
      panelRef.current?.focus({ preventScroll: true });
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.({ preventScroll: true });
    };
  }, []);

  return (
    <div
      className={`overlay-layer ${align === "center" ? "overlay-layer--center" : ""}`}
      data-testid={testId}
    >
      <div className="overlay-veil" aria-hidden="true" />
      <section
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`overlay-panel glass-panel ${className}`}
      >
        <button
          type="button"
          className="overlay-close"
          onClick={onRequestClose}
          aria-label="Close overlay"
          data-testid="overlay-close"
        >
          <X size={18} />
        </button>
        {children}
      </section>
    </div>
  );
}
