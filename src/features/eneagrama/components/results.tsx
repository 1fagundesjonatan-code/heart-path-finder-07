import { useMemo } from "react";
import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { types } from "@/data/enneagram";
import { computeDimensionScore, computeScores, DIMENSIONS, type Answers } from "../domain/scoring";
import { NonDiagnosticNotice } from "./non-diagnostic-notice";

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";
const RADAR_COLORS = ["var(--primary)", "var(--foreground)", "var(--muted-foreground)"];

export function Results({ answers, onRestart }: { answers: Answers; onRestart: () => void }) {
  const ranking = useMemo(() => computeScores(answers), [answers]);
  const [top, second] = ranking;
  const focus = ranking.slice(0, 3);
  const t = types[top.type];

  const bars = useMemo(() => [...ranking].sort((a, b) => a.type - b.type), [ranking]);

  const radarData = useMemo(
    () =>
      DIMENSIONS.map((d) => {
        const row: Record<string, number | string> = { dimension: d.label };
        for (const f of ranking.slice(0, 3)) {
          row[`T${f.type}`] = computeDimensionScore(answers, f.type, d.key);
        }
        return row;
      }),
    [answers, ranking],
  );

  return (
    <section aria-labelledby="resultado-titulo" className="mx-auto max-w-4xl px-6 py-16 md:py-24">
      <div className="text-[11px] uppercase tracking-[0.22em] text-primary">Seu resultado</div>
      <h1 id="resultado-titulo" className="mt-4 font-serif text-5xl leading-[1.05] md:text-7xl">
        {t.name}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">{t.short}</p>
      <NonDiagnosticNotice className="mt-6 max-w-2xl border-l-2 border-primary pl-4" />

      <div className="mt-12 rounded-3xl border border-border bg-card p-6 md:p-10">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">Distribuição por tipo</h2>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Score normalizado
          </div>
        </div>
        <ul className="space-y-3">
          {bars.map((b) => {
            const isTop = b.type === top.type;
            const isSecond = b.type === second?.type;
            return (
              <li key={b.type} className="flex items-center gap-4">
                <div className="w-10 font-serif text-lg text-foreground/70">T{b.type}</div>
                <div className="flex-1 truncate text-sm text-foreground/80">
                  {types[b.type].name.replace(/^Tipo \d+ — /, "")}
                </div>
                <div className="flex w-1/2 items-center gap-3 md:w-2/3">
                  <div
                    role="img"
                    aria-label={`Tipo ${b.type}: ${Math.round(b.score)} de 100`}
                    className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"
                  >
                    <div
                      className={[
                        "h-full rounded-full transition-[width] duration-700 motion-reduce:transition-none",
                        isTop ? "bg-primary" : isSecond ? "bg-accent" : "bg-foreground/30",
                      ].join(" ")}
                      style={{ width: `${b.score}%` }}
                    />
                  </div>
                  <div className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                    {Math.round(b.score)}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-8 rounded-3xl border border-border bg-card p-6 md:p-10">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl">Perfil por dimensão</h2>
          <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Top 3 tipos
          </div>
        </div>
        <div className="h-[360px] w-full" aria-hidden="true">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="dimension"
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 100]}
                tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                stroke="var(--border)"
              />
              {focus.map((s, i) => (
                <Radar
                  key={s.type}
                  name={types[s.type].name}
                  dataKey={`T${s.type}`}
                  stroke={RADAR_COLORS[i]}
                  fill={RADAR_COLORS[i]}
                  fillOpacity={i === 0 ? 0.35 : 0.15}
                  strokeWidth={i === 0 ? 2 : 1.5}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <table className="sr-only">
          <caption>Perfil por dimensão dos três tipos com maior pontuação</caption>
          <thead>
            <tr>
              <th scope="col">Dimensão</th>
              {focus.map((f) => (
                <th key={f.type} scope="col">
                  {types[f.type].name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {radarData.map((row) => (
              <tr key={String(row.dimension)}>
                <th scope="row">{row.dimension}</th>
                {focus.map((f) => (
                  <td key={f.type}>{row[`T${f.type}`]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Block title="Visão geral" body={t.overview} />
        <Block title="Motivação central" body={t.motivacao} />
        <Block title="No dia a dia" body={t.diaadia} />
        <Block title="Caminho de crescimento" body={t.crescimento} />
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <Mini label="Asas" values={t.wings} />
        <Mini label="Sob estresse" values={[t.stressArrow]} />
        <Mini label="Em segurança" values={[t.securityArrow]} />
      </div>

      {second && (
        <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/50 p-6 md:p-8">
          <div className="text-[11px] uppercase tracking-[0.22em] text-accent-foreground/70">
            Tipo secundário próximo
          </div>
          <div className="mt-2 font-serif text-2xl">{types[second.type].name}</div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {types[second.type].short} Vale a pena observar como ele se mistura ao seu tipo
            principal.
          </p>
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-border bg-secondary/40 p-6 md:p-8">
        <h2 className="text-[11px] font-sans uppercase tracking-[0.2em] text-muted-foreground">
          Sobre o subtipo
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
          O Eneagrama vai além dos 9 tipos — cada tipo se expressa de forma diferente conforme o seu
          subtipo dominante: <strong className="font-medium">Conservação</strong> (foco em segurança
          e recursos pessoais), <strong className="font-medium">Social</strong> (foco em
          pertencimento e grupos) ou <strong className="font-medium">Sexual/Sincronia</strong> (foco
          em conexão intensa e renovação). O subtipo pode mudar significativamente como o seu tipo
          se manifesta — inclusive fazer você se reconhecer em outro tipo à primeira vista.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-foreground/70">
          Aprofunde esse mapa na{" "}
          <span className="italic">Formação em Tipologias Humanas — The Self Map</span>.
        </p>
      </div>

      <div className="mt-14 flex flex-wrap gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className={`min-h-11 rounded-full border border-foreground/30 px-6 py-3 text-sm uppercase tracking-[0.16em] transition-colors hover:bg-foreground hover:text-background ${FOCUS_RING}`}
            >
              Refazer o teste
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Refazer o teste?</AlertDialogTitle>
              <AlertDialogDescription>
                Seu resultado atual não fica salvo. Ao refazer, ele será perdido.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Manter resultado</AlertDialogCancel>
              <AlertDialogAction onClick={onRestart}>Refazer</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <button
          type="button"
          onClick={() => window.print()}
          className={`min-h-11 rounded-full bg-primary px-6 py-3 text-sm uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-primary/90 ${FOCUS_RING}`}
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
      <h2 className="font-sans text-[11px] uppercase tracking-[0.2em] text-primary">{title}</h2>
      <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">{body}</p>
    </div>
  );
}

function Mini({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="font-sans text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </h2>
      <div className="mt-3 font-serif text-xl">{values.join(" · ")}</div>
    </div>
  );
}
