import { UNAVAILABLE_REASON, unavailableMetricLabels } from "../domain/metrics-view";

export function UnavailablePanel({ metrics }: { metrics: readonly string[] }) {
  if (metrics.length === 0) return null;
  return (
    <section
      aria-labelledby="indisponiveis-titulo"
      className="border border-dashed border-border bg-secondary/40 p-6"
    >
      <h2
        id="indisponiveis-titulo"
        className="font-sans text-xs uppercase tracking-[0.22em] text-muted-foreground"
      >
        Necessita integração
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        {UNAVAILABLE_REASON}
      </p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {unavailableMetricLabels(metrics).map((label) => (
          <li
            key={label}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs"
          >
            {label}
          </li>
        ))}
      </ul>
    </section>
  );
}
