import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  resolvePeriod,
  type CustomRange,
  type PeriodPreset,
  type ResolvedPeriod,
} from "../domain/period";
import { buildMetricGroups } from "../domain/metrics-view";
import type { DashboardData } from "../schemas";
import { getDashboardFn } from "../functions/dashboard-fns";
import { FunnelPanel } from "./funnel-panel";
import { MetricGroups } from "./metric-groups";
import { NewUsersChart } from "./new-users-chart";
import { PeriodFilter } from "./period-filter";
import { UnavailablePanel } from "./unavailable-panel";

const STALE_MS = 60_000;

function initialPeriod(): ResolvedPeriod {
  const period = resolvePeriod("30d", new Date());
  if (!period) throw new Error("Período padrão inválido.");
  return period;
}

export function DashboardView() {
  // O período depende do relógio: calculá-lo só após a montagem evita divergência de hidratação
  // (servidor e navegador podem estar em dias diferentes perto da meia-noite).
  const [period, setPeriod] = useState<ResolvedPeriod | null>(null);
  useEffect(() => setPeriod(initialPeriod()), []);

  const { data, isPending, isError, isFetching, refetch } = useQuery({
    queryKey: ["admin", "dashboard", period?.from, period?.to],
    queryFn: () => {
      if (!period) throw new Error("Período não definido.");
      return getDashboardFn({ data: { from: period.from, to: period.to } });
    },
    enabled: period !== null,
    staleTime: STALE_MS,
    placeholderData: (previous) => previous,
  });

  const handlePreset = (preset: Exclude<PeriodPreset, "custom">) => {
    const next = resolvePeriod(preset, new Date());
    if (next) setPeriod(next);
  };
  const handleCustom = (range: CustomRange) => {
    const next = resolvePeriod("custom", new Date(), range);
    if (next) setPeriod(next);
  };

  return (
    <div className="space-y-12 px-6 py-8 md:px-10">
      {period ? (
        <PeriodFilter
          preset={period.preset}
          period={period}
          onPresetChange={handlePreset}
          onCustomChange={handleCustom}
        />
      ) : (
        <Skeleton className="h-16 w-full max-w-xl" />
      )}

      <div aria-live="polite" aria-busy={isFetching}>
        {isPending && (
          <div role="status" aria-label="Carregando métricas" className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        )}

        {isError && (
          <div role="alert" className="max-w-md border-l-2 border-destructive pl-4 text-sm">
            <p>Não foi possível carregar as métricas deste período.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}

        {data && <DashboardContent data={data} isRefreshing={isFetching} />}
      </div>
    </div>
  );
}

function DashboardContent({ data, isRefreshing }: { data: DashboardData; isRefreshing: boolean }) {
  const { groups, withData, restrictedLabels } = buildMetricGroups(data.metrics);
  return (
    <div className={isRefreshing ? "space-y-12 opacity-60 transition-opacity" : "space-y-12"}>
      {!withData && (
        <p role="status" className="border-l-2 border-primary pl-4 text-sm leading-relaxed">
          Sem dados neste período. Os números aparecem aqui assim que houver atividade registrada;
          nenhum valor é preenchido por estimativa.
        </p>
      )}
      <MetricGroups groups={groups} />
      {restrictedLabels.length > 0 && (
        <p role="note" className="text-xs leading-relaxed text-muted-foreground">
          Não exibido para o seu papel: {restrictedLabels.join(", ")}.
        </p>
      )}
      <div className="grid gap-12 lg:grid-cols-2">
        <NewUsersChart series={data.series} bucket={data.bucket} />
        {data.funnel ? (
          <FunnelPanel rows={data.funnel} />
        ) : (
          <p role="note" className="text-sm text-muted-foreground">
            O funil não é exibido para o seu papel.
          </p>
        )}
      </div>
      <UnavailablePanel metrics={data.metrics.unavailable.metrics} />
    </div>
  );
}
