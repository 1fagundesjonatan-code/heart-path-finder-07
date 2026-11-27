import { useEffect, useRef, useState, type CSSProperties } from "react";
import { types } from "@/data/enneagram";
import { cn } from "@/lib/utils";
import type { ScreenId } from "../content";

// Telas animadas dos cards de "Como funciona". O estado base (sem data-play, ou com
// prefers-reduced-motion) é o final da animação; os keyframes estão em styles.css (.demo-*).
// Conteúdo fictício e genérico: não usa as afirmações reais do teste.

const SCORES = [48, 41, 36, 82, 57, 44, 31, 27, 52];
const TOP_TYPE = 4;
const SECOND_TYPE = 5;
const QUIZ_STATEMENT = "Prefiro planejar o meu dia antes de começar.";

const demoLabels: Partial<Record<ScreenId, string>> = {
  quiz: "Animação do teste: uma afirmação aparece, a resposta 4 da escala de 1 a 5 é marcada e a barra de progresso avança",
  result:
    "Animação do resultado: as barras dos nove tipos crescem e a pontuação do Tipo 4 sobe até 82",
  chat: "Animação da conversa com o mentor de IA: uma pergunta, o indicador de digitando e duas respostas",
};

function useInView() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), {
      threshold: 0.35,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, inView };
}

function Counter({ value, className }: { value: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("demo-num tabular-nums", className)}
      style={{ "--v": value } as CSSProperties}
    />
  );
}

function QuizDemo() {
  return (
    <div className="flex h-full flex-col">
      <div className="text-[11px] tabular-nums text-foreground/60">
        Afirmação <Counter value={38} className="demo-count-quiz" /> de 162
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
        <div className="demo-progress h-full origin-left scale-x-[0.26] rounded-full bg-primary" />
      </div>
      <p className="demo-in mt-8 text-balance font-serif text-[22px] leading-snug tracking-[-0.02em]">
        {QUIZ_STATEMENT}
      </p>
      <div className="demo-in mt-auto">
        <div className="flex justify-between gap-2">
          {[1, 2, 3, 4, 5].map((value) => (
            <div
              key={value}
              className="relative grid size-11 place-items-center rounded-full border border-border font-serif text-base"
            >
              {value}
              {value === 4 && (
                <span className="demo-select absolute inset-0 grid place-items-center rounded-full bg-foreground text-background">
                  {value}
                </span>
              )}
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-foreground/60">
          <span>Discordo</span>
          <span>Concordo</span>
        </div>
      </div>
    </div>
  );
}

function shortTypeName(type: number): string {
  return types[type]?.name.replace(/^Tipo \d+\s*\S\s*/, "") ?? "";
}

function ResultDemo() {
  return (
    <div className="flex h-full flex-col">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/60">
        Seu resultado, Ana
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="font-serif text-[26px] leading-[1.05] tracking-[-0.03em]">
          {shortTypeName(TOP_TYPE)}
        </div>
        <div
          className="font-serif text-[34px] leading-none tracking-[-0.03em] text-primary"
          style={{ "--i": 3 } as CSSProperties}
        >
          <Counter value={SCORES[TOP_TYPE - 1] ?? 0} className="demo-count" />
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {SCORES.map((score, i) => {
          const type = i + 1;
          const vars = { "--i": i, "--s": score / 100, "--v": score } as CSSProperties;
          return (
            <li key={type} className="flex items-center gap-2 text-[11px]" style={vars}>
              <span className="w-6 font-serif text-foreground/70">T{type}</span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                <span
                  className={cn(
                    "demo-grow block h-full origin-left rounded-full",
                    type === TOP_TYPE
                      ? "bg-primary"
                      : type === SECOND_TYPE
                        ? "bg-accent"
                        : "bg-foreground/30",
                  )}
                  style={{ transform: `scaleX(${score / 100})` }}
                />
              </span>
              <Counter value={score} className="demo-count w-6 text-right text-foreground/60" />
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TypingDots({ className }: { className: string }) {
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-1 self-start opacity-0 rounded-2xl rounded-bl-md border border-border px-3.5 py-3",
        className,
      )}
    >
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="demo-dot size-1.5 rounded-full bg-foreground/50"
          style={{ animationDelay: `${dot * 150}ms` }}
        />
      ))}
    </div>
  );
}

const BUBBLE =
  "max-w-[88%] rounded-2xl rounded-bl-md border border-border px-3.5 py-2.5 text-[12px] leading-relaxed";

function ChatDemo() {
  return (
    <div className="flex h-full flex-col gap-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/60">
        Mentor · com o seu mapa
      </div>
      <div className="demo-chat-user ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-3.5 py-2.5 text-[12px] leading-relaxed text-background">
        Por que eu adio conversas difíceis mesmo sabendo que vão me aliviar?
      </div>
      <div className="grid">
        <TypingDots className="demo-chat-typing-a col-start-1 row-start-1" />
        <div className={cn(BUBBLE, "demo-chat-a col-start-1 row-start-1")}>
          No seu mapa, o Tipo 4 aparece forte. Esse perfil costuma esperar o momento de dizer tudo
          do jeito certo, e esse momento demora.
        </div>
      </div>
      <div className="grid">
        <TypingDots className="demo-chat-typing-b col-start-1 row-start-1" />
        <div className={cn(BUBBLE, "demo-chat-b col-start-1 row-start-1")}>
          Quer tentar um exercício curto esta semana? Escreva só a primeira frase da conversa.
        </div>
      </div>
    </div>
  );
}

const DEMOS = { quiz: QuizDemo, result: ResultDemo, chat: ChatDemo } as const;

export function StepDemo({ id }: { id: keyof typeof DEMOS }) {
  const { ref, inView } = useInView();
  const Demo = DEMOS[id];

  return (
    <div
      ref={ref}
      data-play={inView}
      role="img"
      aria-label={demoLabels[id]}
      className="h-[360px] overflow-hidden rounded-xl border border-border bg-background p-5"
    >
      <Demo />
    </div>
  );
}
