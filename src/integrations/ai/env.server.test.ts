import { afterEach, describe, expect, test, vi } from "vitest";
import { getAiEnv } from "./env.server";

afterEach(() => vi.unstubAllEnvs());

describe("getAiEnv", () => {
  test("falha sem OPENAI_API_KEY e nomeia a variável", () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    expect(() => getAiEnv()).toThrow(/OPENAI_API_KEY/);
  });

  test("aplica padrões de modelo e limite diário", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key-0000000000000000");
    vi.stubEnv("AI_DEFAULT_CHAT_MODEL", "");
    vi.stubEnv("AI_DAILY_MESSAGE_LIMIT", "");
    const env = getAiEnv();
    expect(env.AI_DEFAULT_CHAT_MODEL).toBe("gpt-5.4-mini");
    expect(env.AI_DAILY_MESSAGE_LIMIT).toBe(50);
  });

  test("rejeita modelo fora da lista", () => {
    vi.stubEnv("OPENAI_API_KEY", "sk-test-key-0000000000000000");
    vi.stubEnv("AI_DEFAULT_CHAT_MODEL", "modelo-inventado");
    expect(() => getAiEnv()).toThrow(/AI_DEFAULT_CHAT_MODEL/);
  });
});
