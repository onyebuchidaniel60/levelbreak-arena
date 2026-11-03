import type { Evidence } from "@levelbreak-arena/contracts";

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

export function EvidenceCard({ evidence }: { evidence: Evidence }) {
  const record = asRecord(evidence);
  const title = stringValue(record, "title") ?? "Bundled evidence";

  if (evidence.type === "image") {
    const src = stringValue(record, "src");
    const alt = stringValue(record, "alt") ?? title;
    if (!src) return <UnsupportedEvidence type={evidence.type} />;
    return (
      <section aria-label="Evidence" className="rounded border border-slate-300 bg-white p-4">
        <h3 className="font-semibold">{title}</h3>
        <img src={src} alt={alt} className="mt-3 max-w-full rounded border border-slate-200" />
      </section>
    );
  }

  if (evidence.type === "data_card") {
    const lines = stringList(record, "lines");
    return (
      <section aria-label="Evidence" className="rounded border border-slate-300 bg-white p-4">
        <h3 className="font-semibold">{title}</h3>
        <dl className="mt-3 space-y-2 text-sm">
          {lines.map((line, index) => {
            const separator = line.indexOf(": ");
            const term = separator > 0 ? line.slice(0, separator) : `Fact ${index + 1}`;
            const description = separator > 0 ? line.slice(separator + 2) : line;
            return (
              <div key={`${term}-${index}`}>
                <dt className="font-medium text-slate-900">{term}</dt>
                <dd className="text-slate-700">{description}</dd>
              </div>
            );
          })}
        </dl>
      </section>
    );
  }

  if (evidence.type === "text_snippet") {
    const text = stringValue(record, "text");
    const sourceLabel = stringValue(record, "sourceLabel");
    if (!text) return <UnsupportedEvidence type={evidence.type} />;
    return (
      <section aria-label="Evidence" className="rounded border border-slate-300 bg-white p-4">
        <h3 className="font-semibold">{title}</h3>
        <blockquote className="mt-3 border-l-4 border-slate-300 pl-3 text-sm text-slate-800">
          <p className="font-mono">{text}</p>
          {sourceLabel ? (
            <footer className="mt-2 text-xs text-slate-600">{sourceLabel}</footer>
          ) : null}
        </blockquote>
      </section>
    );
  }

  if (evidence.type === "scenario_card") {
    const lines = stringList(record, "lines");
    return (
      <section
        aria-label="Evidence"
        className="rounded border-2 border-slate-400 bg-slate-50 p-4"
      >
        <h3 className="font-semibold">{title}</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-800">
          {lines.map((line, index) => (
            <li key={`${line}-${index}`}>{line}</li>
          ))}
        </ul>
      </section>
    );
  }

  return <UnsupportedEvidence type={String(evidence.type)} />;
}

function UnsupportedEvidence({ type }: { type: string }) {
  return (
    <section aria-label="Evidence" className="rounded border border-amber-300 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-950">Unsupported evidence</h3>
      <p className="mt-1 text-sm text-amber-900">
        This consultation uses an evidence type this preview cannot display
        ({type}). You can still answer or skip.
      </p>
    </section>
  );
}
