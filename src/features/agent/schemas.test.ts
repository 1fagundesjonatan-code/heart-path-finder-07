import { describe, expect, test } from "vitest";
import {
  createDraftSchema,
  MAX_PERSONA_CHARS,
  MAX_TYPE_GUIDE_CHARS,
  updateDraftSchema,
  versionIdSchema,
} from "./schemas";

const valid = {
  id: 1,
  label: "Tom mais acolhedor",
  persona: "Você é acolhedor.",
  typeGuides: { "1": "Guia do tipo 1" },
  model: "gpt-5.4-mini",
  maxOutputTokens: 800,
  knowledgeEnabled: true,
};

describe("updateDraftSchema", () => {
  test("aceita entrada válida", () => {
    expect(updateDraftSchema.parse(valid)).toMatchObject({ id: 1, persona: "Você é acolhedor." });
  });

  test("persona vazia ou só espaços é rejeitada", () => {
    expect(updateDraftSchema.safeParse({ ...valid, persona: "" }).success).toBe(false);
    expect(updateDraftSchema.safeParse({ ...valid, persona: "   \n " }).success).toBe(false);
  });

  test("persona no limite passa e acima do limite falha", () => {
    const at = "a".repeat(MAX_PERSONA_CHARS);
    expect(updateDraftSchema.safeParse({ ...valid, persona: at }).success).toBe(true);
    expect(updateDraftSchema.safeParse({ ...valid, persona: at + "a" }).success).toBe(false);
  });

  test("modelo fora da lista é rejeitado", () => {
    expect(updateDraftSchema.safeParse({ ...valid, model: "gpt-9" }).success).toBe(false);
  });

  test("max tokens fora de 100..4000 ou não inteiro é rejeitado", () => {
    for (const maxOutputTokens of [99, 4001, 800.5, Number.NaN]) {
      expect(updateDraftSchema.safeParse({ ...valid, maxOutputTokens }).success).toBe(false);
    }
    expect(updateDraftSchema.safeParse({ ...valid, maxOutputTokens: 100 }).success).toBe(true);
    expect(updateDraftSchema.safeParse({ ...valid, maxOutputTokens: 4000 }).success).toBe(true);
  });

  test("typeGuides aceita só chaves 1 a 9", () => {
    expect(updateDraftSchema.safeParse({ ...valid, typeGuides: { "0": "x" } }).success).toBe(false);
    expect(updateDraftSchema.safeParse({ ...valid, typeGuides: { "10": "x" } }).success).toBe(
      false,
    );
    expect(updateDraftSchema.safeParse({ ...valid, typeGuides: { a: "x" } }).success).toBe(false);
    expect(updateDraftSchema.safeParse({ ...valid, typeGuides: { "9": "x" } }).success).toBe(true);
  });

  test("guia de tipo acima do limite é rejeitado", () => {
    const big = "a".repeat(MAX_TYPE_GUIDE_CHARS + 1);
    expect(updateDraftSchema.safeParse({ ...valid, typeGuides: { "1": big } }).success).toBe(false);
  });

  test("descarta guias vazios e normaliza label vazio para null", () => {
    const parsed = updateDraftSchema.parse({
      ...valid,
      label: "   ",
      typeGuides: { "1": "  ", "2": " texto " },
    });
    expect(parsed.label).toBeNull();
    expect(parsed.typeGuides).toEqual({ "2": "texto" });
  });

  test("label acima de 80 caracteres é rejeitado", () => {
    expect(updateDraftSchema.safeParse({ ...valid, label: "a".repeat(81) }).success).toBe(false);
  });
});

describe("versionIdSchema e createDraftSchema", () => {
  test("id precisa ser inteiro positivo", () => {
    expect(versionIdSchema.safeParse({ id: 0 }).success).toBe(false);
    expect(versionIdSchema.safeParse({ id: 1.5 }).success).toBe(false);
    expect(versionIdSchema.safeParse({ id: "1" }).success).toBe(false);
    expect(versionIdSchema.safeParse({ id: 7 }).success).toBe(true);
  });

  test("fromVersionId é opcional", () => {
    expect(createDraftSchema.safeParse({}).success).toBe(true);
    expect(createDraftSchema.safeParse({ fromVersionId: 3 }).success).toBe(true);
    expect(createDraftSchema.safeParse({ fromVersionId: -1 }).success).toBe(false);
  });
});
