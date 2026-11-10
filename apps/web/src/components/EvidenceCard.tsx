import type { ReactNode } from "react";
import type { Evidence } from "@levelbreak-arena/contracts";
import { Badge, Panel, SectionLabel } from "./ui";

function asRecord(evidence: Evidence): Record<string, unknown> {
  return evidence as unknown as Record<string, unknown>;
}

function stringValue(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function stringList(record: Record<string, unknown>, key: string): string[] {
  const value = record[key];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function EvidenceShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Panel className="overflow-hidden rounded-[26px]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink/10 bg-sky/45 px-4 py-3.5">
        <div>
          <SectionLabel className="text-ink/45">Bundled evidence</SectionLabel>
          <h3 className="mt-1 text-sm font-bold text-ink">{title}</h3>
        </div>
        <Badge tone="neutral">Static · no live feed</Badge>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </Panel>
  );
}

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const record = asRecord(evidence);
  const title = stringValue(record, "title") ?? "Bundled evidence";

  if (evidence.type === "image") {
    const src = stringValue(record, "src");
    const alt = stringValue(record, "alt") ?? title;
    if (!src) return <UnsupportedEvidence type={evidence.type} />;
    return (
      <EvidenceShell title={title}>
        <img
          src={src}
          alt={alt}
          className="max-w-full rounded-[16px] border border-ink/10"
        />
      </EvidenceShell>
    );
  }

  if (evidence.type === "data_card") {
    const lines = stringList(record, "lines");
    return (
      <EvidenceShell title={title}>
        <dl className="divide-y divide-ink/10">
          {lines.map((line, index) => {
            const separator = line.indexOf(": ");
            const term = separator > 0 ? line.slice(0, separator) : `Fact ${index + 1}`;
            const description = separator > 0 ? line.slice(separator + 2) : line;
            return (
              <div key={`${term}-${index}`} className="grid gap-1 py-2.5 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] sm:gap-4">
                <dt className="font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-ink/50">
                  {term}
                </dt>
                <dd className="text-sm leading-6 text-ink/80">{description}</dd>
              </div>
            );
          })}
        </dl>
      </EvidenceShell>
    );
  }

  if (evidence.type === "text_snippet") {
    const text = stringValue(record, "text");
    const sourceLabel = stringValue(record, "sourceLabel");
    if (!text) return <UnsupportedEvidence type={evidence.type} />;
    return (
      <EvidenceShell title={title}>
        <blockquote className="border-l-4 border-coral pl-4">
          <p className="font-mono text-[13px] leading-6 text-ink/80">{text}</p>
          {sourceLabel ? (
            <footer className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink/45">
              {sourceLabel}
            </footer>
          ) : null}
        </blockquote>
      </EvidenceShell>
    );
  }

  if (evidence.type === "scenario_card") {
    const lines = stringList(record, "lines");
    return (
      <EvidenceShell title={title}>
        <ul className="space-y-2.5">
          {lines.map((line, index) => (
            <li key={`${line}-${index}`} className="flex gap-2.5 text-sm leading-6 text-ink/80">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-coral" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </EvidenceShell>
    );
  }

  return <UnsupportedEvidence type={String(evidence.type)} />;
}

function UnsupportedEvidence({ type }: { type: string }) {
  return (
    <Panel tone="gold" className="rounded-[22px] p-4">
      <h3 className="font-bold text-ink">Unsupported evidence</h3>
      <p className="mt-1 text-sm leading-6 text-ink/70">
        This consultation uses an evidence type this preview cannot display
        ({type}). You can still answer or skip.
      </p>
    </Panel>
  );
}
