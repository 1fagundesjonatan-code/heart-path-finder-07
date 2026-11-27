import { describe, expect, test } from "vitest";
import {
  buildConversationTitle,
  dailyWindowStart,
  extractMessageText,
  MAX_USER_MESSAGE_CHARS,
} from "./chat-input";

describe("extractMessageText", () => {
  test("junta só as partes de texto", () => {
    const text = extractMessageText([
      { type: "text", text: "Olá" },
      { type: "step-start" },
      { type: "text", text: "mundo" },
    ]);
    expect(text).toBe("Olá\nmundo");
  });

  test("devolve vazio sem partes de texto", () => {
    expect(extractMessageText([{ type: "step-start" }])).toBe("");
  });
});

describe("buildConversationTitle", () => {
  test("usa os primeiros 60 caracteres sem quebras de linha", () => {
    const title = buildConversationTitle(`a\n${"b".repeat(100)}`);
    expect(title).toHaveLength(60);
    expect(title.startsWith("a b")).toBe(true);
  });

  test("devolve texto curto inteiro", () => {
    expect(buildConversationTitle("  Quero entender meu tipo  ")).toBe("Quero entender meu tipo");
  });
});

describe("dailyWindowStart", () => {
  test("usa a meia-noite de Brasília (UTC-3)", () => {
    expect(dailyWindowStart(new Date("2026-11-27T15:00:00Z")).toISOString()).toBe(
      "2026-11-27T03:00:00.000Z",
    );
  });

  test("antes das 03:00 UTC ainda é o dia anterior em Brasília", () => {
    expect(dailyWindowStart(new Date("2026-11-27T02:00:00Z")).toISOString()).toBe(
      "2026-11-26T03:00:00.000Z",
    );
  });
});

test("limite de entrada é 2000 caracteres", () => {
  expect(MAX_USER_MESSAGE_CHARS).toBe(2000);
});
