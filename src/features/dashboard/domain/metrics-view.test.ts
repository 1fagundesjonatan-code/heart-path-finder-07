import { describe, expect, test } from "vitest";
import type { DashboardMetrics } from "../schemas";
import {
  buildMetricGroups,
  formatPercent,
  hasPeriodData,
  unavailableMetricLabels,
} from "./metrics-view";

const empty: DashboardMetrics = {
  currency: "BRL",
  total_users: 42,
  active_users: 0,
  new_users: 0,
  leads_captured: 0,
  leads_converted: 0,
  lead_to_customer_rate: null,
  new_customers: 0,
  tests_started: 0,
  tests_completed: 0,
  test_completion_rate: null,
  marketing_spend: 0,
  spend_rows_other_currency: 0,
  cpl: null,
  cac: null,
  restricted: { reason: "role", metrics: [] },
  unavailable: { reason: "requires_integration", metrics: ["mrr", "ai_cost"] },
};

const cards = (m: DashboardMetrics) =>
  Object.fromEntries(
    buildMetricGroups(m)
      .groups.flatMap((g) => g.cards)
      .map((c) => [c.key, c]),
  );

describe("buildMetricGroups", () => {
  test("período vazio mostra 'Sem dados', nunca zero", () => {
    const c = cards(empty);
    expect(hasPeriodData(empty)).toBe(false);
    expect(c.new_users).toMatchObject({ state: "empty", value: "Sem dados" });
    expect(c.leads_captured.value).toBe("Sem dados");
    expect(c.tests_started.value).toBe("Sem dados");
  });

  test("total de usuários é estoque e aparece mesmo sem atividade", () => {
    expect(cards(empty).total_users).toMatchObject({ state: "value", value: "42" });
  });

  test("com atividade, zero legítimo aparece como 0", () => {
    const c = cards({ ...empty, tests_started: 10, tests_completed: 0, test_completion_rate: 0 });
    expect(c.tests_completed).toMatchObject({ state: "value", value: "0" });
    expect(c.test_completion_rate.value).toBe("0%");
  });

  test("taxa nula com atividade explica o motivo", () => {
    const c = cards({ ...empty, new_users: 3 });
    expect(c.test_completion_rate).toMatchObject({
      state: "empty",
      hint: expect.stringContaining("teste"),
    });
  });

  test("CAC sem clientes pagantes é 'Necessita integração'", () => {
    expect(cards({ ...empty, new_users: 3 }).cac).toMatchObject({
      state: "unavailable",
      value: "Necessita integração",
    });
  });

  test("com clientes novos e sem gasto, CAC pede o lançamento do gasto", () => {
    const c = cards({ ...empty, new_customers: 2, cac: null, marketing_spend: 0 });
    expect(c.cac).toMatchObject({
      state: "empty",
      hint: "Lance o gasto de marketing no período.",
    });
  });

  test("com clientes novos e gasto, CAC aparece em BRL", () => {
    const c = cards({ ...empty, new_customers: 2, marketing_spend: 100, cac: 50 });
    expect(c.cac).toMatchObject({ state: "value" });
    expect(c.cac.value).toContain("50,00");
  });

  test("gasto e CPL formatados em BRL quando existem", () => {
    const c = cards({ ...empty, leads_captured: 4, marketing_spend: 200, cpl: 50 });
    expect(c.marketing_spend.value).toContain("200,00");
    expect(c.cpl.value).toContain("50,00");
  });

  test("avisa sobre lançamentos em outra moeda", () => {
    const c = cards({ ...empty, new_users: 1, spend_rows_other_currency: 2 });
    expect(c.marketing_spend.hint).toContain("outra moeda");
  });
});

const FINANCE_VIEW: DashboardMetrics = {
  ...empty,
  new_users: 5,
  leads_captured: null,
  leads_converted: null,
  lead_to_customer_rate: null,
  new_customers: null,
  marketing_spend: 300,
  spend_rows_other_currency: 0,
  restricted: {
    reason: "role",
    metrics: ["leads_captured", "leads_converted", "lead_to_customer_rate", "new_customers"],
  },
};

const OPERATOR_VIEW: DashboardMetrics = {
  ...empty,
  new_users: 5,
  leads_captured: 8,
  marketing_spend: null,
  spend_rows_other_currency: null,
  cpl: null,
  cac: null,
  restricted: {
    reason: "role",
    metrics: ["marketing_spend", "spend_rows_other_currency", "cpl", "cac"],
  },
};

describe("indicadores restritos por papel", () => {
  test("financeiro: oculta leads e clientes, mantém gasto, sem tratar como 'sem dados'", () => {
    const view = buildMetricGroups(FINANCE_VIEW);
    const keys = view.groups.flatMap((g) => g.cards.map((c) => c.key));
    expect(keys).not.toContain("leads_captured");
    expect(keys).not.toContain("new_customers");
    expect(keys).toContain("marketing_spend");
    expect(view.groups.map((g) => g.title)).not.toContain("Leads e clientes");
    expect(view.restrictedLabels).toEqual([
      "Leads capturados",
      "Leads que criaram conta",
      "Lead para cliente",
      "Novos clientes pagantes",
    ]);
  });

  test("operador: oculta gasto, CPL e CAC (não vira 'Necessita integração')", () => {
    const view = buildMetricGroups(OPERATOR_VIEW);
    const cards = view.groups.flatMap((g) => g.cards);
    const keys = cards.map((c) => c.key);
    expect(keys).not.toContain("marketing_spend");
    expect(keys).not.toContain("cpl");
    expect(keys).not.toContain("cac");
    expect(cards.some((c) => c.state === "unavailable")).toBe(false);
    expect(view.groups.map((g) => g.title)).not.toContain("Marketing");
    expect(view.groups.map((g) => g.title)).toContain("Leads e clientes");
    expect(view.restrictedLabels).toEqual(["Gasto de marketing", "Custo por lead (CPL)", "CAC"]);
  });

  test("valor restrito nulo não conta como atividade no período", () => {
    expect(hasPeriodData({ ...FINANCE_VIEW, new_users: 0, marketing_spend: 0 })).toBe(false);
  });

  test("sem restrições, nenhum rótulo restrito", () => {
    expect(buildMetricGroups(empty).restrictedLabels).toEqual([]);
  });
});

describe("helpers", () => {
  test("formatPercent trata razão 0..1", () => {
    expect(formatPercent(0.625)).toMatch(/62,5\s?%/);
  });

  test("rótulos de indisponíveis caem no código quando desconhecidos", () => {
    expect(unavailableMetricLabels(["mrr", "novo"])).toEqual(["MRR", "novo"]);
  });
});
