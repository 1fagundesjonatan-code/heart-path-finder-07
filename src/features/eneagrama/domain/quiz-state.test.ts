import { describe, expect, test } from "vitest";
import type { Question } from "@/data/enneagram";
import { createQuizReducer, initialQuizState, type QuizState } from "./quiz-state";

const items: Question[] = [1, 2, 3].map((id) => ({
  id,
  type: id,
  dimension: "C",
  text: `q${id}`,
  order: id,
}));
const reduce = createQuizReducer(items);

describe("quizReducer", () => {
  const started = reduce(initialQuizState, { type: "start" });

  test("duas respostas seguidas gravam em perguntas diferentes, sem sobrescrever", () => {
    const first = reduce(started, { type: "answer", value: 4 });
    const second = reduce(first, { type: "answer", value: 2 });
    expect(second.answers).toEqual({ 1: 4, 2: 2 });
    expect(second.index).toBe(2);
  });

  test("responder a última pergunta leva ao resultado", () => {
    const last: QuizState = { ...started, index: 2 };
    const done = reduce(last, { type: "answer", value: 5 });
    expect(done.phase).toBe("results");
    expect(done.answers[3]).toBe(5);
  });

  test("resposta extra depois do resultado é ignorada", () => {
    const done = reduce({ ...started, index: 2 }, { type: "answer", value: 5 });
    expect(reduce(done, { type: "answer", value: 1 })).toBe(done);
  });

  test("rejeita valores fora de 1-5", () => {
    expect(reduce(started, { type: "answer", value: 6 })).toBe(started);
    expect(reduce(started, { type: "answer", value: 0 })).toBe(started);
    expect(reduce(started, { type: "answer", value: 2.5 })).toBe(started);
  });

  test("voltar e refazer a resposta mantém as demais", () => {
    const s = reduce(reduce(started, { type: "answer", value: 4 }), { type: "back" });
    const redone = reduce(s, { type: "answer", value: 1 });
    expect(redone.answers).toEqual({ 1: 1 });
    expect(redone.index).toBe(1);
  });

  test("avançar só é possível com a pergunta atual respondida", () => {
    expect(reduce(started, { type: "forward" })).toBe(started);
    const back = reduce(reduce(started, { type: "answer", value: 3 }), { type: "back" });
    expect(reduce(back, { type: "forward" }).index).toBe(1);
  });

  test("voltar na primeira pergunta não faz nada", () => {
    expect(reduce(started, { type: "back" })).toBe(started);
  });

  test("restart volta à introdução e limpa respostas", () => {
    const s = reduce(started, { type: "answer", value: 3 });
    expect(reduce(s, { type: "restart" })).toEqual(initialQuizState);
  });
});
