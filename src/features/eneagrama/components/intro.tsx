import { NonDiagnosticNotice } from "./non-diagnostic-notice";

export function Intro({ onStart, total }: { onStart: () => void; total: number }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
        <span aria-hidden="true" className="h-0.5 w-6 shrink-0 bg-primary" />
        Teste reflexivo · {total} afirmações
      </div>
      <h1 className="mt-5 font-serif text-5xl leading-[1.05] md:text-7xl">
        Conheça <em className="mark-gold not-italic">quem você é</em> por dentro.
      </h1>
      <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
        O Eneagrama é um mapa antigo da alma — nove tipos, nove jeitos de ver o mundo. Responda com
        honestidade, no ritmo que pedir o seu corpo. Não há respostas certas, apenas você se
        aproximando de si.
      </p>

      <ol className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { k: "1", v: "Leia cada afirmação devagar." },
          { k: "2", v: "Responda como você é, não como gostaria de ser." },
          { k: "3", v: "Cerca de 15–25 minutos no total." },
        ].map((s) => (
          <li key={s.k} className="rounded-2xl border border-border bg-card p-5">
            <div aria-hidden="true" className="font-serif text-3xl text-primary">
              {s.k}
            </div>
            <div className="mt-2 text-sm leading-relaxed text-foreground/80">{s.v}</div>
          </li>
        ))}
      </ol>

      <div className="mt-12 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={onStart}
          className="group inline-flex items-center gap-3 rounded-full bg-primary px-7 py-4 text-sm font-medium uppercase tracking-[0.16em] text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          Começar o teste
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </button>
        <span className="text-sm text-muted-foreground">
          Escala 1 (não me identifico) a 5 (me identifico totalmente)
        </span>
      </div>

      <NonDiagnosticNotice className="mt-10 max-w-xl border-l-2 border-primary pl-4" />
    </section>
  );
}
