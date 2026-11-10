import type { ReactNode } from "react";
import { SectionLabel } from "./ui";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  actions,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-3xl space-y-2">
        {eyebrow ? (
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-coral" aria-hidden="true" />
            <SectionLabel className="text-ink/55">{eyebrow}</SectionLabel>
          </div>
        ) : null}
        <h1 className="text-balance break-words text-[1.9rem] font-bold leading-[1.02] tracking-[-0.05em] text-ink sm:text-[2.6rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-muted">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}
