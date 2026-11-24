import { z } from "zod";
import { MAX_PERIOD_DAYS } from "./domain/period";

const DAY_MS = 86_400_000;

export const dashboardInputSchema = z
  .object({
    from: z.string().datetime({ offset: true }),
    to: z.string().datetime({ offset: true }),
  })
  .refine((v) => new Date(v.from) < new Date(v.to), { message: "Período inválido." })
  .refine(
    (v) => (new Date(v.to).getTime() - new Date(v.from).getTime()) / DAY_MS <= MAX_PERIOD_DAYS,
    {
      message: "Período longo demais.",
    },
  );
export type DashboardInput = z.infer<typeof dashboardInputSchema>;

const nullableRatio = z.number().nullable();

export const metricsSchema = z.object({
  currency: z.string(),
  total_users: z.number(),
  active_users: z.number(),
  new_users: z.number(),
  leads_captured: z.number().nullable(),
  leads_converted: z.number().nullable(),
  lead_to_customer_rate: nullableRatio,
  new_customers: z.number().nullable(),
  tests_started: z.number(),
  tests_completed: z.number(),
  test_completion_rate: nullableRatio,
  marketing_spend: z.number().nullable(),
  spend_rows_other_currency: z.number().nullable(),
  cpl: z.number().nullable(),
  cac: z.number().nullable(),
  restricted: z.object({
    reason: z.literal("role"),
    metrics: z.array(z.string()),
  }),
  unavailable: z.object({
    reason: z.literal("requires_integration"),
    metrics: z.array(z.string()),
  }),
});
export type DashboardMetrics = z.infer<typeof metricsSchema>;

export const funnelRowSchema = z.object({
  step: z.string(),
  step_order: z.number(),
  unique_actors: z.number(),
  total_events: z.number(),
  conversion_from_previous: z.number().nullable(),
});
export type FunnelRow = z.infer<typeof funnelRowSchema>;

export const seriesRowSchema = z.object({
  bucket_start: z.string(),
  new_users: z.number(),
});
export type SeriesRow = z.infer<typeof seriesRowSchema>;

export type DashboardData = {
  metrics: DashboardMetrics;
  /** null: o papel do usuário não tem acesso ao funil (RPC devolveria 42501). */
  funnel: FunnelRow[] | null;
  series: SeriesRow[];
  bucket: "day" | "week" | "month";
};
