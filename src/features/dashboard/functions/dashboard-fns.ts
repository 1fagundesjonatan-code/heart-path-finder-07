import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AUTH_ERROR_CODES } from "@/features/auth/error-codes";
import { requireRole } from "@/features/auth/functions/require-role";
import { STAFF_ROLES } from "@/shared/roles";
import { FUNNEL_ROLES } from "../domain/access";
import { pickBucket } from "../domain/period";
import {
  dashboardInputSchema,
  funnelRowSchema,
  metricsSchema,
  seriesRowSchema,
  type DashboardData,
} from "../schemas";

/**
 * Métricas do dashboard. Roda com o JWT do usuário (nunca service role): as RPCs checam
 * is_staff() no banco e nenhuma agregação acontece no código.
 */
export const getDashboardFn = createServerFn({ method: "GET" })
  .middleware([requireRole(STAFF_ROLES)])
  .inputValidator((data: unknown) => dashboardInputSchema.parse(data))
  .handler(async ({ data, context }): Promise<DashboardData> => {
    const bucket = pickBucket(data.from, data.to);
    const { supabase } = context;

    // O funil exige papel específico no banco; quem não tem não dispara a RPC (evitaria um 42501).
    const { data: canSeeFunnelRows, error: roleError } = await supabase.rpc("has_any_role", {
      p_roles: [...FUNNEL_ROLES],
    });
    if (roleError) {
      console.error("dashboard: falha ao verificar papel do funil", { code: roleError.code });
      throw new Error("Não foi possível carregar as métricas.", { cause: roleError });
    }

    const [metricsRes, funnelRes, seriesRes] = await Promise.all([
      supabase.rpc("admin_dashboard_metrics", { p_from: data.from, p_to: data.to }),
      canSeeFunnelRows
        ? supabase.rpc("admin_funnel", { p_from: data.from, p_to: data.to })
        : Promise.resolve(null),
      supabase.rpc("admin_new_users_series", {
        p_from: data.from,
        p_to: data.to,
        p_bucket: bucket,
      }),
    ]);

    const failed = [metricsRes, funnelRes, seriesRes].find((r) => r?.error);
    if (failed?.error) {
      console.error("dashboard: falha em RPC", { code: failed.error.code });
      if (failed.error.code === "42501") {
        throw new Response(AUTH_ERROR_CODES.forbidden, { status: 403 });
      }
      throw new Error("Não foi possível carregar as métricas.", { cause: failed.error });
    }

    return {
      metrics: metricsSchema.parse(metricsRes.data),
      funnel: funnelRes ? z.array(funnelRowSchema).parse(funnelRes.data ?? []) : null,
      series: z.array(seriesRowSchema).parse(seriesRes.data ?? []),
      bucket,
    };
  });
