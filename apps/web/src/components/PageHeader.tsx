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
        {eyebrow ? <SectionLabel>{eyebrow}</SectionLabel> : null}
        <h1 className="text-balance break-words text-2xl font-semibold tracking-[-0.03em] text-numeric sm:text-3xl">
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
