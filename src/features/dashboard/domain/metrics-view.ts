import type { DashboardMetrics, FunnelRow } from "../schemas";

export type MetricCardState = "value" | "empty" | "unavailable";

export type MetricCardModel = {
  key: string;
  label: string;
  state: MetricCardState;
  /** Texto exibido no lugar do número quando não é "value". */
  value: string;
  hint?: string;
};

export type MetricGroupModel = { title: string; cards: MetricCardModel[] };

const EMPTY_VALUE = "Sem dados";

export const UNAVAILABLE_LABELS: Record<string, string> = {
  mrr: "MRR",
  revenue: "Receita",
  arpu: "ARPU",
  churn: "Churn",
  retention: "Retenção",
  active_subscriptions: "Assinaturas ativas",
  ai_conversations: "Conversas com IA",
  ai_tokens: "Tokens de IA",
  ai_cost: "Custo de IA",
  marketplace_revenue: "Receita do marketplace",
  commission: "Comissão",
};

export const UNAVAILABLE_REASON =
  "Ainda não há fonte de dados: dependem de cobrança (Fase 5), IA (Fases 2 e 3) e marketplace (Fase 6), que não estão conectados.";

export const FUNNEL_LABELS: Record<string, string> = {
  page_view: "Visitas",
  lead_captured: "Leads capturados",
  signup_started: "Cadastro iniciado",
  signup_completed: "Conta criada",
  test_started: "Teste iniciado",
  test_completed: "Teste concluído",
  result_viewed: "Resultado visto",
  mentor_first_message: "Primeira mensagem ao Mentor",
  subscription_started: "Assinatura iniciada",
};

export function formatInteger(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

/** Razão 0..1 vira percentual. */
export function formatPercent(ratio: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(ratio);
}

export function formatCurrency(value: number, currency: string): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(value);
}

/** Existe alguma atividade medida dentro do período (total de usuários é estoque, não conta). */
export function hasPeriodData(m: DashboardMetrics): boolean {
  return (
    m.new_users > 0 ||
    m.active_users > 0 ||
    (m.leads_captured ?? 0) > 0 ||
    (m.new_customers ?? 0) > 0 ||
    m.tests_started > 0 ||
    m.tests_completed > 0 ||
    (m.marketing_spend ?? 0) > 0
  );
}

export function hasFunnelData(rows: readonly FunnelRow[]): boolean {
  return rows.some((r) => r.total_events > 0);
}

export function funnelLabel(step: string): string {
  return FUNNEL_LABELS[step] ?? step;
}

function counted(
  key: string,
  label: string,
  value: number | null,
  withData: boolean,
): MetricCardModel {
  return withData
    ? { key, label, state: "value", value: formatInteger(value ?? 0) }
    : { key, label, state: "empty", value: EMPTY_VALUE, hint: "Nenhuma atividade no período." };
}

function ratio(
  key: string,
  label: string,
  value: number | null,
  withData: boolean,
  missingHint: string,
): MetricCardModel {
  if (!withData) {
    return {
      key,
      label,
      state: "empty",
      value: EMPTY_VALUE,
      hint: "Nenhuma atividade no período.",
    };
  }
  return value === null
    ? { key, label, state: "empty", value: EMPTY_VALUE, hint: missingHint }
    : { key, label, state: "value", value: formatPercent(value) };
}

/** Rótulos dos indicadores que o banco pode ocultar por papel (chave de `restricted.metrics`). */
export const RESTRICTED_LABELS: Record<string, string> = {
  leads_captured: "Leads capturados",
  leads_converted: "Leads que criaram conta",
  lead_to_customer_rate: "Lead para cliente",
  new_customers: "Novos clientes pagantes",
  marketing_spend: "Gasto de marketing",
  cpl: "Custo por lead (CPL)",
  cac: "CAC",
};

export function buildMetricGroups(m: DashboardMetrics): {
  groups: MetricGroupModel[];
  withData: boolean;
  /** Indicadores ocultos para o papel do usuário (distinto de "sem dados" e "necessita integração"). */
  restrictedLabels: string[];
} {
  const withData = hasPeriodData(m);
  const spendValue = m.marketing_spend ?? 0;
  const otherCurrencyRows = m.spend_rows_other_currency ?? 0;
  const newCustomers = m.new_customers ?? 0;

  const spend: MetricCardModel =
    withData && spendValue > 0
      ? {
          key: "marketing_spend",
          label: "Gasto de marketing",
          state: "value",
          value: formatCurrency(spendValue, m.currency),
          hint:
            otherCurrencyRows > 0
              ? `${otherCurrencyRows} lançamento(s) em outra moeda não somado(s).`
              : undefined,
        }
      : {
          key: "marketing_spend",
          label: "Gasto de marketing",
          state: "empty",
          value: "Sem gasto lançado",
          hint:
            otherCurrencyRows > 0
              ? `${otherCurrencyRows} lançamento(s) em outra moeda não somado(s).`
              : "Lançamento manual entra com a entrega E8.",
        };

  const cpl: MetricCardModel =
    withData && m.cpl !== null
      ? {
          key: "cpl",
          label: "Custo por lead (CPL)",
          state: "value",
          value: formatCurrency(m.cpl, m.currency),
        }
      : {
          key: "cpl",
          label: "Custo por lead (CPL)",
          state: "empty",
          value: EMPTY_VALUE,
          hint: "Precisa de leads e de gasto lançado no período.",
        };

  const cac: MetricCardModel =
    m.cac !== null
      ? { key: "cac", label: "CAC", state: "value", value: formatCurrency(m.cac, m.currency) }
      : newCustomers > 0
        ? {
            key: "cac",
            label: "CAC",
            state: "empty",
            value: EMPTY_VALUE,
            hint: "Lance o gasto de marketing no período.",
          }
        : {
            key: "cac",
            label: "CAC",
            state: "unavailable",
            value: "Necessita integração",
            hint: "Depende de clientes pagantes (Fase 5).",
          };

  const allGroups: MetricGroupModel[] = [
    {
      title: "Audiência",
      cards: [
        {
          key: "total_users",
          label: "Usuários cadastrados",
          state: "value",
          value: formatInteger(m.total_users),
          hint: "Total até o fim do período.",
        },
        counted("new_users", "Novos usuários", m.new_users, withData),
        counted("active_users", "Usuários ativos", m.active_users, withData),
      ],
    },
    {
      title: "Teste",
      cards: [
        counted("tests_started", "Testes iniciados", m.tests_started, withData),
        counted("tests_completed", "Testes concluídos", m.tests_completed, withData),
        ratio(
          "test_completion_rate",
          "Taxa de conclusão",
          m.test_completion_rate,
          withData,
          "Nenhum teste iniciado no período.",
        ),
      ],
    },
    {
      title: "Leads e clientes",
      cards: [
        counted("leads_captured", "Leads capturados", m.leads_captured, withData),
        counted("leads_converted", "Leads que criaram conta", m.leads_converted, withData),
        ratio(
          "lead_to_customer_rate",
          "Lead para cliente",
          m.lead_to_customer_rate,
          withData,
          "Nenhum lead capturado no período.",
        ),
        counted("new_customers", "Novos clientes pagantes", m.new_customers, withData),
      ],
    },
    { title: "Marketing", cards: [spend, cpl, cac] },
  ];

  const restricted = new Set(m.restricted.metrics);
  const groups = allGroups
    .map((group) => ({ ...group, cards: group.cards.filter((c) => !restricted.has(c.key)) }))
    .filter((group) => group.cards.length > 0);
  const restrictedLabels = [
    ...new Set(
      m.restricted.metrics.flatMap((key) =>
        RESTRICTED_LABELS[key] ? [RESTRICTED_LABELS[key]] : [],
      ),
    ),
  ];

  return { withData, groups, restrictedLabels };
}

export function unavailableMetricLabels(keys: readonly string[]): string[] {
  return keys.map((k) => UNAVAILABLE_LABELS[k] ?? k);
}
