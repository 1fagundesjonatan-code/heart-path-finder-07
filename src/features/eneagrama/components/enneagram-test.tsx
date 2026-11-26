import { useEffect, useReducer } from "react";
import { questions } from "@/data/enneagram";
import { createQuizReducer, initialQuizState } from "../domain/quiz-state";
import { Intro } from "./intro";
import { Quiz } from "./quiz";
import { Results } from "./results";
import { SiteFooter, SiteHeader, SkipLink } from "./site-chrome";

const ordered = [...questions].sort((a, b) => a.order - b.order);
const quizReducer = createQuizReducer(ordered);

export function EnneagramTest() {
  const [state, dispatch] = useReducer(quizReducer, initialQuizState);
  const current = ordered[state.index];

  useEffect(() => {
    if (state.phase !== "quiz") window.scrollTo({ top: 0, behavior: "auto" });
  }, [state.phase]);

  const handleStart = () => dispatch({ type: "start" });

  return (
    <div className="grain min-h-screen">
      <SkipLink />
      <SiteHeader />
      <main id="conteudo" tabIndex={-1}>
        {state.phase === "intro" && <Intro onStart={handleStart} total={ordered.length} />}
        {state.phase === "quiz" && current && (
          <Quiz
            question={current}
            index={state.index}
            total={ordered.length}
            answeredCount={Object.keys(state.answers).length}
            selected={state.answers[current.id]}
            onChoose={(value) => dispatch({ type: "answer", value })}
            onBack={() => dispatch({ type: "back" })}
            onForward={() => dispatch({ type: "forward" })}
          />
        )}
        {state.phase === "results" && (
          <Results answers={state.answers} onRestart={() => dispatch({ type: "restart" })} />
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
