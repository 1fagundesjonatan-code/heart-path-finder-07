import { describe, expect, test } from "vitest";
import { toAgentVersion, type AgentVersionRow } from "./version-row";

const row: AgentVersionRow = {
  id: 3,
  version: 2,
  status: "active",
  label: null,
  model: "gpt-5.4-mini",
  persona: "P",
  type_guides: { "1": "g1", "2": 5 },
  max_output_tokens: 800,
  knowledge_enabled: true,
  created_at: "2026-11-27T10:00:00Z",
  created_by: "u1",
  published_at: "2026-11-27T11:00:00Z",
  published_by: "u2",
};

describe("toAgentVersion", () => {
  test("mapeia colunas e resolve nomes", () => {
    const v = toAgentVersion(row, new Map([["u1", "Ana"]]));
    expect(v).toMatchObject({
      id: 3,
      maxOutputTokens: 800,
      createdByName: "Ana",
      publishedByName: null,
    });
  });

  test("ignora guias que não são texto e type_guides inválido vira vazio", () => {
    expect(toAgentVersion(row, new Map()).typeGuides).toEqual({ "1": "g1" });
    expect(toAgentVersion({ ...row, type_guides: [1] }, new Map()).typeGuides).toEqual({});
    expect(toAgentVersion({ ...row, type_guides: null }, new Map()).typeGuides).toEqual({});
  });

  test("status desconhecido lança erro", () => {
    expect(() => toAgentVersion({ ...row, status: "x" }, new Map())).toThrow();
  });
});
