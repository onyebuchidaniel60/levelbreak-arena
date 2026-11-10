import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

type PanelTone =
  | "paper"
  | "cream"
  | "gold"
  | "lilac"
  | "sky"
  | "coral"
  | "ink"
  | "mint"
  | "blush";

const panelTones: Record<PanelTone, string> = {
  paper: "panel",
  cream: "panel panel-cream",
  gold: "panel panel-gold",
  lilac: "panel panel-lilac",
  sky: "panel panel-sky",
  coral: "panel panel-coral",
  ink: "panel panel-ink",
  mint: "panel panel-mint",
  blush: "panel panel-blush",
};

export function Panel({
  className,
  children,
  tone = "paper",
  ...props
}: HTMLAttributes<HTMLDivElement> & { tone?: PanelTone }) {
  return (
    <div className={cn(panelTones[tone], "rounded-[24px]", className)} {...props}>
      {children}
    </div>
  );
}

export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn("eyebrow", className)}>{children}</p>;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
      <h2 className="text-balance text-2xl font-bold tracking-[-0.035em] text-numeric sm:text-[1.75rem]">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </div>
  );
}

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "success"
  | "inverse";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border border-coral bg-coral text-ink hover:border-[#ff7457] hover:bg-[#ff7457] active:bg-[#ef4827]",
  secondary:
    "border border-ink/15 bg-paper text-ink hover:border-ink/30 hover:bg-cream",
  ghost:
    "border border-transparent text-muted hover:bg-ink/[0.06] hover:text-ink",
  danger:
    "border border-danger bg-danger text-paper hover:bg-[#a3311c]",
  success:
    "border border-positive bg-positive text-paper hover:bg-[#0f6644]",
  inverse:
    "border border-white/20 bg-white/[0.08] text-cream hover:border-white/35 hover:bg-white/[0.14]",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-11 px-3.5 py-1.5 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-5 py-3 text-sm sm:text-[15px]",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  type = "button",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-50",
        buttonVariants[variant],
        buttonSizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

type BadgeTone =
  | "neutral"
  | "paid"
  | "pending"
  | "error"
  | "info"
  | "gold"
  | "dark"
  | "ink"
  | "lilac";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "border-ink/12 bg-paper text-ink/60",
  paid: "border-positive/25 bg-positive/[0.09] text-positive",
  pending: "border-amber/25 bg-gold/30 text-amber",
  error: "border-danger/25 bg-danger/[0.09] text-danger",
  info: "border-info/25 bg-sky/50 text-info",
  gold: "border-ink/15 bg-gold text-ink",
  dark: "border-white/20 bg-white/[0.1] text-cream",
  ink: "border-ink bg-ink text-gold",
  lilac: "border-ink/12 bg-lilac/45 text-ink",
};

const badgeDots: Record<BadgeTone, string> = {
  neutral: "bg-dim",
  paid: "bg-positive",
  pending: "bg-amber",
  error: "bg-danger",
  info: "bg-info",
  gold: "bg-ink",
  dark: "bg-gold",
  ink: "bg-gold",
  lilac: "bg-ink",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-sans text-[10px] font-semibold uppercase tracking-[0.1em]",
        badgeTones[tone],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", badgeDots[tone])} />
      {children}
    </span>
  );
}

type StatTone = "neutral" | "positive" | "pending" | "error" | "gold" | "paid";

const statSurfaces: Record<StatTone, string> = {
  neutral: "panel",
  positive: "panel panel-mint",
  pending: "panel panel-gold",
  error: "panel panel-blush",
  gold: "panel panel-gold",
  paid: "panel panel-forest",
};

export function StatTile({
  label,
  value,
  sub,
  tone = "neutral",
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  const paid = tone === "paid";
  const valueTone =
    tone === "positive"
      ? "text-positive"
      : tone === "pending"
        ? "text-amber"
        : tone === "error"
          ? "text-danger"
          : tone === "gold"
            ? "text-ink"
            : paid
              ? "text-cream"
              : "text-numeric";
  return (
    <div className={cn(statSurfaces[tone], "rounded-[20px] p-4", className)}>
      <p className={cn("eyebrow", paid ? "text-cream/70" : "text-dim")}>
        {label}
      </p>
      <p
        className={cn(
          "numeric mt-2 text-xl font-semibold leading-tight sm:text-2xl",
          valueTone,
        )}
      >
        {value}
      </p>
      {sub ? (
        <p
          className={cn(
            "mt-1 text-xs leading-5",
            paid ? "text-cream/70" : "text-muted",
          )}
        >
          {sub}
        </p>
      ) : null}
    </div>
  );
}

export function ProgressRail({
  total,
  current,
  completed,
  className,
}: {
  total: number;
  current: number;
  completed: number[];
  className?: string;
}) {
  const levels = Array.from({ length: total }, (_, index) => index + 1);
  return (
    <div
      className={cn("space-y-2", className)}
      role="list"
      aria-label={`Level progress: ${completed.length} of ${total} complete`}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow">Run progress</span>
        <span className="numeric text-[11px] text-ink">
          {String(Math.min(current, total)).padStart(2, "0")} /{" "}
          {String(total).padStart(2, "0")}
        </span>
      </div>
      <div className="flex gap-1.5">
        {levels.map((level) => {
          const isComplete = completed.includes(level);
          const isCurrent = level === current && !isComplete;
          return (
            <div
              key={level}
              role="listitem"
              aria-current={isCurrent ? "step" : undefined}
              className="min-w-0 flex-1"
            >
              <div
                className={cn(
                  "h-2 rounded-full transition-colors",
                  isComplete
                    ? "bg-ink"
                    : isCurrent
                      ? "bg-coral"
                      : "bg-ink/10",
                )}
              />
              <p
                className={cn(
                  "numeric mt-1.5 text-[10px]",
                  isComplete
                    ? "text-ink"
                    : isCurrent
                      ? "text-coral"
                      : "text-dim",
                )}
              >
                {String(level).padStart(2, "0")}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-ink/10", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-ink/[0.08]", className)} />
  );
}

export function KeyValue({
  label,
  children,
  mono = false,
  inverted = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
  inverted?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className={cn("text-xs", inverted ? "text-cream/60" : "text-muted")}>
        {label}
      </dt>
      <dd
        className={cn(
          "text-right text-sm",
          inverted ? "text-cream" : "text-ink",
          mono ? "numeric break-all text-[11px]" : "",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
