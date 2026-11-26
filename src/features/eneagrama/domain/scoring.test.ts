import { describe, expect, test } from "vitest";
import { questions, type Question } from "@/data/enneagram";
import { computeDimensionScore, computeScores } from "./scoring";

function answerAll(value: number): Record<number, number> {
  return Object.fromEntries(questions.map((q) => [q.id, value]));
}

describe("computeScores", () => {
  test("instrumento tem 162 afirmações com ids únicos", () => {
    expect(questions).toHaveLength(162);
    expect(new Set(questions.map((q) => q.id)).size).toBe(162);
  });

  test("respostas vazias dão pontuação zero para os 9 tipos, ordenados por tipo", () => {
    const ranking = computeScores({});
    expect(ranking).toHaveLength(9);
    expect(ranking.every((r) => r.score === 0 && r.raw === 0)).toBe(true);
    expect(ranking.map((r) => r.type)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test("todas as respostas 1 dão 20 (piso real do instrumento)", () => {
    const ranking = computeScores(answerAll(1));
    expect(ranking.every((r) => r.score === 20)).toBe(true);
  });

  test("todas as respostas 5 dão 100", () => {
    const ranking = computeScores(answerAll(5));
    expect(ranking.every((r) => r.score === 100)).toBe(true);
  });

  test("empate é desfeito pelo número do tipo, de forma estável", () => {
    const ranking = computeScores(answerAll(3));
    expect(ranking.map((r) => r.type)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  test("162 respostas válidas: tipo com respostas altas lidera", () => {
    const answers = Object.fromEntries(questions.map((q) => [q.id, q.type === 7 ? 5 : 2]));
    const ranking = computeScores(answers);
    expect(ranking[0]).toMatchObject({ type: 7, score: 100 });
    expect(ranking[1].score).toBe(40);
  });

  test("ignora respostas fora de 1-5, não inteiras ou ids desconhecidos", () => {
    const first = questions[0];
    const ranking = computeScores({ [first.id]: 9, 99999: 5, [questions[1].id]: 2.5 });
    expect(ranking.every((r) => r.raw === 0)).toBe(true);
  });

  test("normaliza pelo número de itens respondidos do tipo", () => {
    const items: Question[] = [
      { id: 1, type: 1, dimension: "C", text: "a", order: 1 },
      { id: 2, type: 1, dimension: "C", text: "b", order: 2 },
    ];
    const ranking = computeScores({ 1: 5 }, items);
    expect(ranking[0]).toMatchObject({ type: 1, raw: 5, score: 100 });
  });

  test("não muta as respostas recebidas", () => {
    const answers = Object.freeze({ [questions[0].id]: 4 });
    expect(() => computeScores(answers)).not.toThrow();
  });
});

describe("computeDimensionScore", () => {
  test("retorna 0 sem respostas na dimensão", () => {
    expect(computeDimensionScore({}, 1, "C")).toBe(0);
  });

  test("todas 5 dão 100 e todas 1 dão 20", () => {
    expect(computeDimensionScore(answerAll(5), 4, "M")).toBe(100);
    expect(computeDimensionScore(answerAll(1), 4, "M")).toBe(20);
  });
});
