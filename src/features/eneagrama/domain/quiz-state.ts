import type { Question } from "@/data/enneagram";
import type { Answers } from "./scoring";

export type Phase = "intro" | "quiz" | "results";

export type QuizState = {
  phase: Phase;
  index: number;
  answers: Answers;
};

export type QuizAction =
  | { type: "start" }
  | { type: "answer"; value: number }
  | { type: "back" }
  | { type: "forward" }
  | { type: "restart" };

export const initialQuizState: QuizState = { phase: "intro", index: 0, answers: {} };

/**
 * Reducer puro do fluxo do teste. A resposta é gravada e o avanço acontece na mesma transição,
 * então dois cliques/teclas seguidos nunca sobrescrevem a mesma pergunta: o segundo sempre
 * responde a pergunta seguinte.
 */
export function createQuizReducer(items: readonly Question[]) {
  const lastIndex = items.length - 1;

  return function quizReducer(state: QuizState, action: QuizAction): QuizState {
    switch (action.type) {
      case "start":
        return { phase: "quiz", index: 0, answers: {} };
      case "restart":
        return initialQuizState;
      case "answer": {
        const current = items[state.index];
        if (state.phase !== "quiz" || !current) return state;
        if (!Number.isInteger(action.value) || action.value < 1 || action.value > 5) return state;
        const answers = { ...state.answers, [current.id]: action.value };
        return state.index >= lastIndex
          ? { phase: "results", index: state.index, answers }
          : { phase: "quiz", index: state.index + 1, answers };
      }
      case "back":
        return state.phase === "quiz" && state.index > 0
          ? { ...state, index: state.index - 1 }
          : state;
      case "forward": {
        const current = items[state.index];
        const canForward =
          state.phase === "quiz" &&
          current !== undefined &&
          state.answers[current.id] !== undefined &&
          state.index < lastIndex;
        return canForward ? { ...state, index: state.index + 1 } : state;
      }
    }
  };
}
