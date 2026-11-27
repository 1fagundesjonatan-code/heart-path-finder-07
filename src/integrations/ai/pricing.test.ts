import { describe, expect, test } from "vitest";
import { estimateCostUsd, type ModelPrice } from "./pricing";

const prices: Record<string, ModelPrice> = { m: { input: 1, output: 4, cachedInput: 0.1 } };

describe("estimateCostUsd", () => {
  test("calcula sem cache", () => {
    const cost = estimateCostUsd(
      "m",
      { inputTokens: 1_000_000, outputTokens: 500_000, cachedInputTokens: 0 },
      prices,
    );
    expect(cost).toBeCloseTo(3);
  });

  test("cobra tokens em cache pelo preço de cache", () => {
    const cost = estimateCostUsd(
      "m",
      { inputTokens: 1_000_000, outputTokens: 0, cachedInputTokens: 600_000 },
      prices,
    );
    expect(cost).toBeCloseTo(0.4 + 0.06);
  });

  test("devolve null para modelo sem preço", () => {
    expect(
      estimateCostUsd("x", { inputTokens: 10, outputTokens: 10, cachedInputTokens: 0 }, prices),
    ).toBeNull();
  });

  test("cache maior que a entrada não gera custo negativo", () => {
    const cost = estimateCostUsd(
      "m",
      { inputTokens: 100, outputTokens: 0, cachedInputTokens: 200 },
      prices,
    );
    expect(cost).toBeGreaterThanOrEqual(0);
  });
});
