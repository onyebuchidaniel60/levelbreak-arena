import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
} from "react";

export function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export function Panel({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("panel rounded-lg", className)} {...props}>
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
      <h2 className="text-balance text-xl font-semibold tracking-tight text-numeric">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </div>
  );
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "border border-gold bg-gold text-ink hover:border-amber-300 hover:bg-amber-300",
  secondary:
    "border border-line bg-white/[0.02] text-body hover:border-line-soft hover:bg-white/[0.05]",
  ghost: "border border-transparent text-muted hover:bg-white/[0.04] hover:text-body",
  danger:
    "border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
  success:
    "border border-positive/40 bg-positive/10 text-positive hover:bg-positive/20",
};

const buttonSizes: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3 py-1.5 text-xs",
  md: "min-h-11 px-4 py-2 text-sm",
  lg: "min-h-12 px-5 py-3 text-sm",
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
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/70 focus-visible:ring-offset-2 focus-visible:ring-offset-ink disabled:cursor-not-allowed disabled:opacity-50",
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

type BadgeTone = "neutral" | "paid" | "pending" | "error" | "info" | "gold";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "border-line bg-white/[0.03] text-muted",
  paid: "border-positive/30 bg-positive/10 text-positive",
  pending: "border-pending/30 bg-pending/10 text-pending",
  error: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info",
  gold: "border-gold/30 bg-gold/10 text-gold",
};

const badgeDots: Record<BadgeTone, string> = {
  neutral: "bg-dim",
  paid: "bg-positive",
  pending: "bg-pending",
  error: "bg-danger",
  info: "bg-info",
  gold: "bg-gold",
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
        "inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
        badgeTones[tone],
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", badgeDots[tone])} />
      {children}
    </span>
  );
}

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
  tone?: "neutral" | "positive" | "pending" | "error" | "gold";
  className?: string;
}) {
  const valueTone =
    tone === "positive"
      ? "text-positive"
      : tone === "pending"
        ? "text-pending"
        : tone === "error"
          ? "text-danger"
          : tone === "gold"
            ? "text-gold"
            : "text-numeric";
  return (
    <div className={cn("panel rounded-lg p-3", className)}>
      <p className="eyebrow">{label}</p>
      <p className={cn("numeric mt-2 text-xl font-semibold sm:text-2xl", valueTone)}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs leading-5 text-dim">{sub}</p> : null}
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
        <span className="numeric text-[11px] text-muted">
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
                  "h-1.5 rounded-full transition-colors",
                  isComplete
                    ? "bg-positive"
                    : isCurrent
                      ? "bg-gold"
                      : "bg-line",
                )}
              />
              <p
                className={cn(
                  "numeric mt-1.5 text-[10px]",
                  isComplete
                    ? "text-positive"
                    : isCurrent
                      ? "text-gold"
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
  return <div className={cn("h-px w-full bg-line", className)} />;
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded bg-white/[0.06]",
        className,
      )}
    />
  );
}

export function KeyValue({
  label,
  children,
  mono = false,
}: {
  label: string;
  children: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={cn(
          "text-right text-sm text-body",
          mono ? "numeric break-all text-[11px]" : "",
        )}
      >
        {children}
      </dd>
    </div>
  );
}
