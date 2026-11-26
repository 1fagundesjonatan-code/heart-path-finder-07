import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BUSINESS_TIME_ZONE } from "../domain/period";
import { formatInteger } from "../domain/metrics-view";
import type { SeriesRow } from "../schemas";

const config = {
  new_users: { label: "Novos usuários", color: "var(--foreground)" },
} satisfies ChartConfig;

const BUCKET_LABEL = { day: "dia", week: "semana", month: "mês" } as const;

function formatBucket(iso: string, bucket: "day" | "week" | "month"): string {
  const options: Intl.DateTimeFormatOptions =
    bucket === "month" ? { month: "short", year: "2-digit" } : { day: "2-digit", month: "2-digit" };
  return new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: BUSINESS_TIME_ZONE }).format(
    new Date(iso),
  );
}

export function NewUsersChart({
  series,
  bucket,
}: {
  series: readonly SeriesRow[];
  bucket: "day" | "week" | "month";
}) {
  const total = series.reduce((sum, row) => sum + row.new_users, 0);
  const data = series.map((row) => ({
    label: formatBucket(row.bucket_start, bucket),
    new_users: row.new_users,
  }));

  return (
    <section aria-labelledby="novos-usuarios-titulo">
      <h2 id="novos-usuarios-titulo" className="font-serif text-2xl">
        Novos usuários
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">Por {BUCKET_LABEL[bucket]}.</p>

      {total === 0 ? (
        <p className="mt-6 border-y border-border py-10 text-center text-sm text-muted-foreground">
          Sem dados no período. Nenhum cadastro novo foi registrado.
        </p>
      ) : (
        <>
          <ChartContainer config={config} className="mt-6 aspect-auto h-64 w-full">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }} accessibilityLayer>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={16} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="new_users" fill="var(--color-new_users)" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <details className="mt-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer underline-offset-4 hover:underline">
              Ver como tabela
            </summary>
            <table className="mt-2 w-full max-w-xs">
              <caption className="sr-only">Novos usuários por {BUCKET_LABEL[bucket]}</caption>
              <thead>
                <tr>
                  <th scope="col" className="text-left font-medium">
                    {bucket === "month" ? "Mês" : "Início"}
                  </th>
                  <th scope="col" className="text-right font-medium">
                    Novos
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td className="text-right tabular-nums">{formatInteger(row.new_users)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
