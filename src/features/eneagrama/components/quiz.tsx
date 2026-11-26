import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { scaleLabels, type Question } from "@/data/enneagram";

type Props = {
  question: Question;
  index: number;
  total: number;
  answeredCount: number;
  selected?: number;
  onChoose: (value: number) => void;
  onBack: () => void;
  onForward: () => void;
};

const OPTIONS = [1, 2, 3, 4, 5] as const;
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function Quiz({
  question,
  index,
  total,
  answeredCount,
  selected,
  onChoose,
  onBack,
  onForward,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isFirstRender = useRef(true);
  // Roving tabindex: só uma opção entra na ordem de Tab; as setas movem o foco dentro do grupo.
  const [focusable, setFocusable] = useState<number>(selected ?? 1);
  const progress = Math.round((answeredCount / total) * 100);

  useEffect(() => {
    optionRefs.current[(selected ?? 1) - 1]?.focus({ preventScroll: true });
    // Foco inicial só ao entrar no teste; depois o foco permanece onde o usuário está.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    cardRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }, [index]);

  // Atalhos de tecla única só valem com o foco dentro do grupo de opções (WCAG 2.1.4).
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) return;
    if (OPTIONS.some((v) => String(v) === event.key)) {
      event.preventDefault();
      onChoose(Number(event.key));
      return;
    }
    const focusedIndex = optionRefs.current.findIndex((el) => el === document.activeElement);
    if (focusedIndex === -1) return;
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step === 0) return;
    event.preventDefault();
    const next = (focusedIndex + step + OPTIONS.length) % OPTIONS.length;
    optionRefs.current[next]?.focus();
  };

  return (
    <section aria-label="Teste" className="mx-auto max-w-3xl px-6 py-12 md:py-20">
      <div className="mb-12">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>
            Pergunta {index + 1} <span className="text-foreground/50">/ {total}</span>
          </span>
          <span>{progress}% concluído</span>
        </div>
        <div
          role="progressbar"
          aria-label="Progresso do teste"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={answeredCount}
          aria-valuetext={`${answeredCount} de ${total} afirmações respondidas`}
          className="mt-3 h-px w-full overflow-hidden bg-border"
        >
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out motion-reduce:transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div
        ref={cardRef}
        className="rounded-3xl border border-border bg-card p-8 shadow-[0_1px_0_oklch(0_0_0/0.04)] md:p-12"
      >
        <p
          id="pergunta-atual"
          aria-live="polite"
          aria-atomic="true"
          className="font-serif text-2xl leading-snug md:text-4xl"
        >
          <span className="sr-only">{`Pergunta ${index + 1} de ${total}. `}</span>
          {question.text}
        </p>

        <div
          role="radiogroup"
          aria-labelledby="pergunta-atual"
          onKeyDown={handleKeyDown}
          className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-5"
        >
          {OPTIONS.map((value) => {
            const active = selected === value;
            return (
              <button
                key={value}
                ref={(el) => {
                  optionRefs.current[value - 1] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={value === focusable ? 0 : -1}
                onFocus={() => setFocusable(value)}
                onClick={() => onChoose(value)}
                className={[
                  "flex min-h-11 flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-colors",
                  FOCUS_RING,
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-foreground/40 hover:bg-secondary",
                ].join(" ")}
              >
                <span className={["font-serif text-2xl", active ? "" : "text-primary"].join(" ")}>
                  {value}
                </span>
                <span
                  className={[
                    "text-xs leading-snug",
                    active ? "text-primary-foreground/90" : "text-muted-foreground",
                  ].join(" ")}
                >
                  {scaleLabels[value]}
                </span>
              </button>
            );
          })}
        </div>

        <p className="mt-8 hidden text-xs uppercase tracking-[0.18em] text-muted-foreground md:block">
          Dica: com o foco nas opções, use as teclas 1–5 e as setas
        </p>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={index === 0}
          className={`min-h-11 text-sm uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 ${FOCUS_RING}`}
        >
          ← Voltar
        </button>
        <button
          type="button"
          onClick={onForward}
          disabled={selected === undefined || index === total - 1}
          className={`min-h-11 text-sm uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 ${FOCUS_RING}`}
        >
          Avançar →
        </button>
      </div>
    </section>
  );
}
