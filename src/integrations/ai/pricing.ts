import type { ChatModelId } from "./models";

/** Dólares por 1M de tokens. */
export type ModelPrice = { input: number; output: number; cachedInput: number };

/**
 * Preços ainda não informados (decisão D-1/D-2 do plano). Sem preço, o custo é `null`
 * e a UI mostra "custo indisponível", nunca zero.
 */
export const MODEL_PRICES: Partial<Record<ChatModelId, ModelPrice>> = {};

export type TokenCounts = { inputTokens: number; outputTokens: number; cachedInputTokens: number };

export function estimateCostUsd(
  model: string,
  usage: TokenCounts,
  prices: Partial<Record<string, ModelPrice>> = MODEL_PRICES,
): number | null {
  const price = prices[model];
  if (!price) return null;
  const uncachedInput = Math.max(usage.inputTokens - usage.cachedInputTokens, 0);
  return (
    (uncachedInput * price.input +
      usage.cachedInputTokens * price.cachedInput +
      usage.outputTokens * price.output) /
    1_000_000
  );
}
