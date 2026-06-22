import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { questions, scaleLabels, types, type Question } from "@/data/enneagram";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Teste de Eneagrama — The Self Institute" },
      {
        name: "description",
        content:
          "Um teste reflexivo de 162 afirmações para revelar seu tipo de eneagrama. Conduzido pelo The Self Institute.",
      },
      { property: "og:title", content: "Teste de Eneagrama — The Self Institute" },
      {
        property: "og:description",
        content:
          "162 afirmações em escala de 1 a 5 para mapear seu tipo, asas e direções de estresse e segurança.",
      },
    ],
  }),
  component: Index,
});

type Phase = "intro" | "quiz" | "results";

const ordered = [...questions].sort((a, b) => a.order - b.order);

function computeScores(answers: Record<number, number>) {
  const totals: Record<number, number> = {};
  const counts: Record<number, number> = {};
  for (let t = 1; t <= 9; t++) {
    totals[t] = 0;
    counts[t] = 0;
  }
  for (const q of questions) {
    const v = answers[q.id];
    if (typeof v === "number") {
      totals[q.type] += v;
      counts[q.type] += 1;
    }
  }
  // normalize to 0–100 (max 5 per question)
  const normalized: { type: number; score: number; raw: number }[] = [];
  for (let t = 1; t <= 9; t++) {
    const max = counts[t] * 5 || 1;
    normalized.push({ type: t, raw: totals[t], score: (totals[t] / max) * 100 });
  }
  normalized.sort((a, b) => b.score - a.score);
  return normalized;
}

function Index() {
  const [phase, setPhase] = useState<Phase>("intro");
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const total = ordered.length;
  const current: Question | undefined = ordered[idx];
  const answered = Object.keys(answers).length;
  const progress = (answered / total) * 100;

  const startQuiz = () => {
    setIdx(0);
    setAnswers({});
    setPhase("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const choose = (val: number) => {
    if (!current) return;
    setAnswers((a) => ({ ...a, [current.id]: val }));
    setTimeout(() => {
      if (idx < total - 1) setIdx(idx + 1);
      else setPhase("results");
    }, 180);
  };

  // keyboard 1–5, arrows
  useEffect(() => {
    if (phase !== "quiz") return;
    const h = (e: KeyboardEvent) => {
      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        choose(parseInt(e.key, 10));
      } else if (e.key === "ArrowLeft" && idx > 0) {
        setIdx(idx - 1);
      } else if (e.key === "ArrowRight" && current && answers[current.id] && idx < total - 1) {
        setIdx(idx + 1);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  return (
    <main className="min-h-screen grain">
      <Header />
      {phase === "intro" && <Intro onStart={startQuiz} total={total} />}
      {phase === "quiz" && current && (
        <Quiz
          q={current}
          idx={idx}
          total={total}
          progress={progress}
          selected={answers[current.id]}
          onChoose={choose}
          onBack={() => idx > 0 && setIdx(idx - 1)}
          onSkipForward={() =>
            current && answers[current.id] && idx < total - 1 && setIdx(idx + 1)
          }
        />
      )}
      {phase === "results" && (
        <Results
          ranking={computeScores(answers)}
          onRestart={() => {
            setPhase("intro");
            setAnswers({});
            setIdx(0);
          }}
        />
      )}
      <Footer />
    </main>
  );
}

function Header() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 place-items-center rounded-full border border-foreground/30 font-serif text-sm font-semibold">
            S
          </div>
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              The Self Institute
            </div>
            <div className="font-serif text-base">Eneagrama</div>
          </div>
        </div>
        <div className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground md:block">
          Autoconhecimento · 9 tipos
        </div>
      </div>
    </header>
  );
}

function Intro({ onStart, total }: { onStart: () => void; total: number }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="text-[11px] uppercase tracking-[0.22em] text-primary">
        Teste reflexivo · {total} afirmações
      </div>
      <h1 className="mt-5 font-serif text-5xl leading-[1.05] md:text-7xl">
        Conheça <em className="not-italic text-primary">quem você é</em>{" "}
        por dentro.
      </h1>
      <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
        O Eneagrama é um mapa antigo da alma — nove tipos, nove jeitos de
        ver o mundo. Responda com honestidade, no ritmo que pedir o seu
        corpo. Não há respostas certas, apenas você se aproximando de si.
      </p>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { k: "1", v: "Leia cada afirmação devagar." },
          { k: "2", v: "Responda como você é, não como gostaria de ser." },
          { k: "3", v: "Cerca de 15–25 minutos no total." },
        ].map((s) => (
          <div
            key={s.k}
            className="rounded-2xl border border-border bg-card p-5"
          >
            <div className="font-serif text-3xl text-primary">{s.k}</div>
            <div className="mt-2 text-sm leading-relaxed text-foreground/80">
              {s.v}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <button
          onClick={onStart}
          className="group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-medium uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-primary/90"
        >
          Começar o teste
          <span className="transition group-hover:translate-x-1">→</span>
        </button>
        <span className="text-sm text-muted-foreground">
          Escala 1 (não me identifico) a 5 (me identifico totalmente)
        </span>
      </div>
    </section>
  );
}

function Quiz({
  q,
  idx,
  total,
  progress,
  selected,
  onChoose,
  onBack,
  onSkipForward,
}: {
  q: Question;
  idx: number;
  total: number;
  progress: number;
  selected?: number;
  onChoose: (v: number) => void;
  onBack: () => void;
  onSkipForward: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [idx]);

  return (
    <section className="mx-auto max-w-3xl px-6 py-12 md:py-20">
      {/* progress */}
      <div className="mb-12">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span>
            Pergunta {idx + 1} <span className="text-foreground/30">/ {total}</span>
          </span>
          <span>{Math.round(progress)}% concluído</span>
        </div>
        <div className="mt-3 h-px w-full overflow-hidden bg-border">
          <div
            className="h-full bg-primary transition-[width] duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div ref={cardRef} className="rounded-3xl border border-border bg-card p-8 shadow-[0_1px_0_oklch(0_0_0/0.04)] md:p-12">
        <div className="font-serif text-2xl leading-snug md:text-4xl">
          {q.text}
        </div>

        <div className="mt-10 grid grid-cols-1 gap-2.5 sm:grid-cols-5">
          {[1, 2, 3, 4, 5].map((v) => {
            const active = selected === v;
            return (
              <button
                key={v}
                onClick={() => onChoose(v)}
                className={[
                  "group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition",
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-foreground/40 hover:bg-secondary",
                ].join(" ")}
              >
                <span
                  className={[
                    "font-serif text-2xl",
                    active ? "text-primary-foreground" : "text-primary",
                  ].join(" ")}
                >
                  {v}
                </span>
                <span
                  className={[
                    "text-xs leading-snug",
                    active
                      ? "text-primary-foreground/90"
                      : "text-muted-foreground",
                  ].join(" ")}
                >
                  {scaleLabels[v]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 hidden text-xs uppercase tracking-[0.18em] text-muted-foreground md:block">
          Dica: você pode usar as teclas 1–5
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          onClick={onBack}
          disabled={idx === 0}
          className="text-sm uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground disabled:opacity-30"
        >
          ← Voltar
        </button>
        <button
          onClick={onSkipForward}
          disabled={!selected || idx === total - 1}
          className="text-sm uppercase tracking-[0.18em] text-muted-foreground transition hover:text-foreground disabled:opacity-30"
        >
          Avançar →
        </button>
      </div>
    </section>
  );
}

function Results({
  ranking,
  onRestart,
}: {
  ranking: { type: number; score: number; raw: number }[];
  onRestart: () => void;
}) {
  const top = ranking[0];
  const second = ranking[1];
  const t = types[top.type];

  const bars = useMemo(() => [...ranking].sort((a, b) => a.type - b.type), [ranking]);

  return (
    <section className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <div className="text-[11px] uppercase tracking-[0.22em] text-primary">
        Seu resultado
      </div>
      <h1 className="mt-4 font-serif text-5xl leading-[1.05] md:text-7xl">
        {t.name}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
        {t.short}
      </p>

      {/* score chart */}
      <div className="mt-12 rounded-3xl border border-border bg-card p-6 md:p-10">
        <div className="mb-6 flex items-baseline justify-between">
          <div className="font-serif text-2xl">Distribuição por tipo</div>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Score normalizado
          </div>
        </div>
        <div className="space-y-3">
          {bars.map((b) => {
            const isTop = b.type === top.type;
            const isSecond = b.type === second?.type;
            return (
              <div key={b.type} className="flex items-center gap-4">
                <div className="w-10 font-serif text-lg text-foreground/70">
                  T{b.type}
                </div>
                <div className="flex-1 truncate text-sm text-foreground/80">
                  {types[b.type].name.replace(/^Tipo \d+ — /, "")}
                </div>
                <div className="flex w-1/2 items-center gap-3 md:w-2/3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className={[
                        "h-full rounded-full transition-all duration-700",
                        isTop
                          ? "bg-primary"
                          : isSecond
                          ? "bg-accent"
                          : "bg-foreground/30",
                      ].join(" ")}
                      style={{ width: `${b.score}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                    {Math.round(b.score)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* detailed sections */}
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Block title="Visão geral" body={t.overview} />
        <Block title="Motivação central" body={t.motivacao} />
        <Block title="No dia a dia" body={t.diaadia} />
        <Block title="Caminho de crescimento" body={t.crescimento} />
      </div>

      {/* dynamics */}
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Mini label="Asas" values={t.wings} />
        <Mini label="Sob estresse" values={[t.stressArrow]} />
        <Mini label="Em segurança" values={[t.securityArrow]} />
      </div>

      {second && (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/50 p-6 md:p-8">
          <div className="text-[11px] uppercase tracking-[0.22em] text-accent">
            Tipo secundário próximo
          </div>
          <div className="mt-2 font-serif text-2xl">{types[second.type].name}</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {types[second.type].short} Vale a pena observar como ele se mistura ao seu tipo principal.
          </p>
        </div>
      )}

      <div className="mt-14 flex flex-wrap gap-3">
        <button
          onClick={onRestart}
          className="rounded-full border border-foreground/30 px-6 py-3 text-sm uppercase tracking-[0.16em] transition hover:bg-foreground hover:text-background"
        >
          Refazer o teste
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.16em] text-primary-foreground transition hover:bg-primary/90"
        >
          Imprimir / salvar PDF
        </button>
      </div>
    </section>
  );
}

function Block({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-primary">
        {title}
      </div>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
        {body}
      </p>
    </div>
  );
}

function Mini({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="mt-3 font-serif text-xl">{values.join(" · ")}</div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        <span>The Self Institute</span>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}
