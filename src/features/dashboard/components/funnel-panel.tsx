import { funnelLabel, formatInteger, formatPercent, hasFunnelData } from "../domain/metrics-view";
import type { FunnelRow } from "../schemas";

export function FunnelPanel({ rows }: { rows: readonly FunnelRow[] }) {
  const max = Math.max(1, ...rows.map((r) => r.unique_actors));

  return (
    <section aria-labelledby="funil-titulo">
      <h2 id="funil-titulo" className="font-serif text-2xl">
        Funil
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Pessoas distintas por etapa no período. Cada etapa conta o próprio volume; não é uma coorte
        estrita.
      </p>

      {!hasFunnelData(rows) ? (
        <p className="mt-6 border-y border-border py-10 text-center text-sm text-muted-foreground">
          Sem dados no período. As etapas aparecem aqui quando houver eventos registrados.
        </p>
      ) : (
        <ol className="mt-6 space-y-4">
          {rows.map((row) => (
            <li
              key={row.step}
              className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 gap-y-1.5"
            >
              <span className="text-sm">{funnelLabel(row.step)}</span>
              <span className="text-sm tabular-nums">
                {formatInteger(row.unique_actors)}
                {row.conversion_from_previous !== null && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {formatPercent(row.conversion_from_previous)} da etapa anterior
                  </span>
                )}
              </span>
              <div aria-hidden="true" className="col-span-2 h-1.5 bg-secondary">
                <div
                  className="h-full bg-foreground"
                  style={{ width: `${(row.unique_actors / max) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
