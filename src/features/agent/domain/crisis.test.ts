import { describe, expect, test } from "vitest";
import { CRISIS_RESPONSE, detectCrisisSignals } from "./crisis";

describe("detectCrisisSignals", () => {
  test.each([
    "Eu quero me matar",
    "não quero mais viver",
    "NAO QUERO MAIS VIVER",
    "Nao aguento mais viver assim",
    "tenho pensado em suicídio",
    "SUICIDIO",
    "penso em acabar com tudo",
    "vou tirar minha vida",
    "quero me machucar",
    "estou praticando automutilação",
    "queria morrer",
    "quero   morrer.",
    "às vezes acho que seria melhor eu morrer",
  ])("detecta %s", (text) => {
    expect(detectCrisisSignals(text)).toBe(true);
  });

  test.each([
    "estou morrendo de rir",
    "quero morrer de rir com esse vídeo",
    "morri de vergonha ontem",
    "vou matar o tempo lendo",
    "quero conhecer meu eneagrama",
  ])("não aciona em %s", (text) => {
    expect(detectCrisisSignals(text)).toBe(false);
  });

  test("entrada vazia ou só espaços não aciona", () => {
    expect(detectCrisisSignals("")).toBe(false);
    expect(detectCrisisSignals("   \n ")).toBe(false);
  });

  test("limitação conhecida: eufemismos não são detectados", () => {
    expect(detectCrisisSignals("queria desaparecer para sempre")).toBe(false);
  });

  test("limitação conhecida: 'acabar com tudo' em contexto banal aciona (piso conservador)", () => {
    expect(detectCrisisSignals("vou acabar com tudo da lista de tarefas hoje")).toBe(true);
  });

  test("limitação conhecida: menção neutra à palavra aciona (piso conservador)", () => {
    expect(detectCrisisSignals("estudo sobre suicídio na adolescência")).toBe(true);
  });

  test("resposta de crise cita CVV 188 e SAMU 192", () => {
    expect(CRISIS_RESPONSE).toContain("188");
    expect(CRISIS_RESPONSE).toContain("192");
  });
});
