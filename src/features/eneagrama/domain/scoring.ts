import { questions, type Question } from "@/data/enneagram";

export const INSTRUMENT_VERSION = "enneagram-v1";

export const TYPE_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const MAX_ANSWER = 5;

export type Answers = Readonly<Record<number, number>>;
export type TypeScore = { type: number; score: number; raw: number };

export type DimensionKey = "C" | "M" | "E";
export const DIMENSIONS: ReadonlyArray<{ key: DimensionKey; label: string }> = [
  { key: "C", label: "Comportamento" },
  { key: "M", label: "Motivação" },
  { key: "E", label: "Estresse" },
];

function isValidAnswer(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= MAX_ANSWER;
}

/**
 * Pontuação por tipo: soma das respostas dividida pelo máximo possível (5 por item respondido),
 * em escala 0-100. Como a menor resposta vale 1, o piso real de um tipo respondido é 20.
 * Mantida assim de propósito (fórmula do instrumento enneagram-v1).
 * Ordena por pontuação decrescente; empate desfaz pelo número do tipo (crescente).
 */
export function computeScores(
  answers: Answers,
  items: readonly Question[] = questions,
): TypeScore[] {
  const totals = new Map<number, number>(TYPE_NUMBERS.map((t) => [t, 0]));
  const counts = new Map<number, number>(TYPE_NUMBERS.map((t) => [t, 0]));

  for (const q of items) {
    const value = answers[q.id];
    if (!isValidAnswer(value)) continue;
    totals.set(q.type, (totals.get(q.type) ?? 0) + value);
    counts.set(q.type, (counts.get(q.type) ?? 0) + 1);
  }

  return TYPE_NUMBERS.map((type) => {
    const raw = totals.get(type) ?? 0;
    const max = (counts.get(type) ?? 0) * MAX_ANSWER || 1;
    return { type, raw, score: (raw / max) * 100 };
  }).sort((a, b) => b.score - a.score || a.type - b.type);
}

/** Pontuação 0-100 (arredondada) de um tipo por dimensão; 0 quando não há itens respondidos. */
export function computeDimensionScore(
  answers: Answers,
  type: number,
  dimension: DimensionKey,
  items: readonly Question[] = questions,
): number {
  let sum = 0;
  let count = 0;
  for (const q of items) {
    if (q.type !== type || q.dimension !== dimension) continue;
    const value = answers[q.id];
    if (!isValidAnswer(value)) continue;
    sum += value;
    count += 1;
  }
  return count ? Math.round((sum / (count * MAX_ANSWER)) * 100) : 0;
}
