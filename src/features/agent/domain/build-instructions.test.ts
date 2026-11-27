import { describe, expect, test } from "vitest";
import type { AgentExample } from "../types";
import { buildInstructions } from "./build-instructions";
import { CRISIS_DIRECTIVE, SAFETY_FLOOR } from "./safety-floor";

const version = { persona: "PERSONA_ACOLHEDORA", typeGuides: { "4": "GUIA_TIPO_4", "7": "" } };
const base = {
  version,
  enneagramType: null,
  examples: [] as AgentExample[],
  knowledgeAvailable: false,
  crisis: false,
  maxChars: 100_000,
};

const example = (n: number, enneagramType: AgentExample["enneagramType"]): AgentExample => ({
  enneagramType,
  userMessage: `PERGUNTA_${n}`,
  idealReply: `RESPOSTA_${n}`,
});

describe("buildInstructions", () => {
  test("piso vem antes da persona", () => {
    const out = buildInstructions(base);
    expect(out.startsWith(SAFETY_FLOOR)).toBe(true);
    expect(out.indexOf(SAFETY_FLOOR)).toBeLessThan(out.indexOf("PERSONA_ACOLHEDORA"));
  });

  test("persona vazia ou só espaços não gera bloco de persona", () => {
    const out = buildInstructions({ ...base, version: { persona: "  ", typeGuides: {} } });
    expect(out).toBe(
      `${SAFETY_FLOOR}\n\nO tipo do Eneagrama da pessoa não foi informado. Não presuma o tipo.`,
    );
  });

  test("tipo conhecido com guia injeta o guia", () => {
    const out = buildInstructions({ ...base, enneagramType: 4 });
    expect(out).toContain("GUIA_TIPO_4");
    expect(out).not.toContain("não foi informado");
  });

  test("tipo conhecido sem texto de guia não gera bloco nem 'não presumir'", () => {
    const out = buildInstructions({ ...base, enneagramType: 7 });
    expect(out).not.toContain("Guia do tipo");
    expect(out).not.toContain("não foi informado");
  });

  test.each([null, undefined, 0, 10, 2.5, Number.NaN])(
    "tipo ausente ou inválido (%s) manda não presumir",
    (type) => {
      const out = buildInstructions({ ...base, enneagramType: type });
      expect(out).toContain("Não presuma o tipo");
      expect(out).not.toContain("GUIA_TIPO_4");
    },
  );

  test("exemplos priorizam o tipo, depois genéricos, e excluem outros tipos", () => {
    const out = buildInstructions({
      ...base,
      enneagramType: 4,
      examples: [example(1, 2), example(2, null), example(3, 4), example(4, 4)],
    });
    expect(out).not.toContain("PERGUNTA_1");
    expect(out.indexOf("PERGUNTA_3")).toBeLessThan(out.indexOf("PERGUNTA_4"));
    expect(out.indexOf("PERGUNTA_4")).toBeLessThan(out.indexOf("PERGUNTA_2"));
  });

  test("sem tipo, só entram exemplos genéricos", () => {
    const out = buildInstructions({ ...base, examples: [example(1, 4), example(2, null)] });
    expect(out).not.toContain("PERGUNTA_1");
    expect(out).toContain("PERGUNTA_2");
  });

  test("no máximo 6 exemplos", () => {
    const examples = Array.from({ length: 9 }, (_, i) => example(i + 1, null));
    const out = buildInstructions({ ...base, examples });
    expect(out).toContain("PERGUNTA_6");
    expect(out).not.toContain("PERGUNTA_7");
  });

  test("uso da base só quando há base disponível", () => {
    expect(buildInstructions(base)).not.toContain("searchKnowledge");
    expect(buildInstructions({ ...base, knowledgeAvailable: true })).toContain("searchKnowledge");
  });

  test("diretiva de crise só quando crisis é verdadeiro, e por último", () => {
    expect(buildInstructions(base)).not.toContain(CRISIS_DIRECTIVE);
    const out = buildInstructions({ ...base, crisis: true, knowledgeAvailable: true });
    expect(out.endsWith(CRISIS_DIRECTIVE)).toBe(true);
  });

  test("é determinístico", () => {
    const input = { ...base, enneagramType: 4, examples: [example(1, 4)], crisis: true };
    expect(buildInstructions(input)).toBe(buildInstructions(input));
  });

  describe("orçamento", () => {
    const examples = Array.from({ length: 6 }, (_, i) => example(i + 1, null));
    const full = buildInstructions({ ...base, enneagramType: 4, examples, crisis: true });

    test("estouro corta exemplos do fim antes do guia", () => {
      const out = buildInstructions({
        ...base,
        enneagramType: 4,
        examples,
        crisis: true,
        maxChars: full.length - 10,
      });
      expect(out.length).toBeLessThanOrEqual(full.length - 10);
      expect(out).toContain("GUIA_TIPO_4");
      expect(out).toContain("PERGUNTA_1");
      expect(out).not.toContain("PERGUNTA_6");
    });

    test("sem espaço para exemplos, trunca o guia e nunca o piso, a persona nem a crise", () => {
      const longGuide = "G".repeat(2000);
      const withoutGuide = buildInstructions({
        ...base,
        version: { persona: "PERSONA_ACOLHEDORA", typeGuides: {} },
        enneagramType: null,
        crisis: true,
      });
      const maxChars = withoutGuide.length + 300;
      const out = buildInstructions({
        ...base,
        version: { persona: "PERSONA_ACOLHEDORA", typeGuides: { "4": longGuide } },
        enneagramType: 4,
        examples,
        crisis: true,
        maxChars,
      });
      expect(out.length).toBeLessThanOrEqual(maxChars);
      expect(out).not.toContain("PERGUNTA_1");
      expect(out).toContain("GGG");
      expect(out).not.toContain("G".repeat(2000));
      expect(out).toContain(SAFETY_FLOOR);
      expect(out).toContain("PERSONA_ACOLHEDORA");
      expect(out.endsWith(CRISIS_DIRECTIVE)).toBe(true);
    });

    test("orçamento menor que os blocos fixos mantém piso, persona e crise", () => {
      const out = buildInstructions({
        ...base,
        enneagramType: 4,
        examples,
        crisis: true,
        maxChars: 10,
      });
      expect(out).toContain(SAFETY_FLOOR);
      expect(out).toContain("PERSONA_ACOLHEDORA");
      expect(out).toContain(CRISIS_DIRECTIVE);
      expect(out).not.toContain("GUIA_TIPO_4");
      expect(out).not.toContain("PERGUNTA_1");
    });
  });
});
