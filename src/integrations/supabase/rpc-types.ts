// Tipos de retorno estruturados das RPCs que devolvem jsonb.
// Ficam fora de types.ts porque `supabase gen types` sobrescreve aquele arquivo
// e só enxerga `Json` para retornos jsonb. Manter alinhado com a migration 0500.

/** Métrica sem fonte de dados hoje: o valor é sempre null. */
export type UnavailableMetricKey =
  | "mrr"
  | "revenue"
  | "arpu"
  | "churn"
  | "retention"
  | "active_subscriptions"
  | "ai_conversations"
  | "ai_tokens"
  | "ai_cost"
  | "marketplace_revenue"
  | "commission";

/** Métrica ocultada pelo papel do chamador: o valor vem null e a chave aparece em `restricted`. */
export type RestrictedMetricKey =
  | "leads_captured"
  | "leads_converted"
  | "lead_to_customer_rate"
  | "new_customers"
  | "marketing_spend"
  | "spend_rows_other_currency"
  | "cpl"
  | "cac";

/**
 * leads_*, lead_to_customer_rate, new_customers: só admin/operator/marketing.
 * marketing_spend, spend_rows_other_currency, cpl, cac: só admin/marketing/finance.
 * Demais campos: qualquer staff.
 */
export type AdminDashboardMetrics = {
  period: { from: string; to: string };
  active_window_days: number;
  currency: string;

  total_users: number;
  active_users: number;
  new_users: number;
  leads_captured: number | null;
  leads_converted: number | null;
  /** Razão 0..1 (não percentual). null se não houve lead no período. */
  lead_to_customer_rate: number | null;
  new_customers: number | null;
  tests_started: number;
  tests_completed: number;
  /** Razão 0..1. null se nenhum teste iniciado no período. */
  test_completion_rate: number | null;
  marketing_spend: number | null;
  /** Linhas de gasto em outra moeda, NÃO somadas em marketing_spend. */
  spend_rows_other_currency: number | null;
  /** null se sem lead ou sem gasto lançado no período. */
  cpl: number | null;
  /** null se sem cliente pagante novo ou sem gasto lançado no período. */
  cac: number | null;
} & Record<UnavailableMetricKey, null> & {
    restricted: {
      reason: "role";
      metrics: RestrictedMetricKey[];
    };
    unavailable: {
      reason: "requires_integration";
      metrics: UnavailableMetricKey[];
    };
  };

export type FunnelBucket = "day" | "week" | "month";

/** Entrada de capture_lead (server function, service role). */
export type LeadConsentInput = {
  consent_type: "terms" | "privacy" | "marketing" | "ai_memory" | "enneagram_profile_share";
  document_version: string;
  granted: boolean;
};

export type UtmInput = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
};
