import type { ReactNode } from "react";
import { questions, types } from "@/data/enneagram";
import { cn } from "@/lib/utils";
import type { ScreenId } from "../content";

// Prévia: telas estáticas com dados fictícios ("Ana"). Resultado e quiz recriam telas que
// já existem; chat, kanban, pomodoro e profissionais são mocks até as features existirem.
// Substituir por captura real quando houver, sem camada de compatibilidade.

const SAMPLE_SCORES = [48, 41, 36, 82, 57, 44, 31, 27, 52];
const TOP_TYPE = 4;
const SECOND_TYPE = 5;

function shortTypeName(type: number): string {
  return types[type]?.name.replace(/^Tipo \d+\s*\S\s*/, "") ?? "";
}

const screenLabels: Record<ScreenId, string> = {
  result:
    "Tela de resultado do teste mostrando a distribuição de pontuação pelos nove tipos, com o Tipo 4 em destaque",
  quiz: "Tela do teste com uma afirmação e a escala de resposta de 1 a 5",
  chat: "Prévia da conversa com o mentor de IA sobre adiar conversas difíceis",
  kanban: "Prévia do quadro de tarefas com as colunas A fazer, Fazendo e Feito",
  pomodoro: "Prévia do cronômetro de foco com 18 minutos restantes e a tarefa atual",
  professionals: "Prévia da lista de profissionais com iniciais, registro e abordagem",
};

function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex h-full flex-col px-5 pb-5 pt-11", className)}>{children}</div>;
}

function ScreenLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-foreground/60">
      {children}
    </div>
  );
}

function ResultScreen() {
  return (
    <Screen>
      <ScreenLabel>Seu resultado, Ana</ScreenLabel>
      <div className="mt-2 font-serif text-[24px] leading-[1.05] tracking-[-0.03em]">
        {shortTypeName(TOP_TYPE)}
      </div>
      <p className="mt-2 line-clamp-3 text-[11px] leading-relaxed text-foreground/70">
        {types[TOP_TYPE]?.short}
      </p>
      <div className="mt-4 rounded-2xl border border-border p-3">
        <div className="font-serif text-[13px]">Distribuição por tipo</div>
        <ul className="mt-2 space-y-[7px]">
          {SAMPLE_SCORES.map((score, i) => {
            const type = i + 1;
            return (
              <li key={type} className="flex items-center gap-2 text-[10px]">
                <span className="w-5 font-serif text-foreground/70">T{type}</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span
                    className={cn(
                      "block h-full rounded-full",
                      type === TOP_TYPE
                        ? "bg-primary"
                        : type === SECOND_TYPE
                          ? "bg-accent"
                          : "bg-foreground/30",
                    )}
                    style={{ width: `${score}%` }}
                  />
                </span>
                <span className="w-5 text-right tabular-nums text-foreground/60">{score}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
        <div className="rounded-xl bg-secondary p-2.5">
          <ScreenLabel>Asas</ScreenLabel>
          <div className="mt-1 font-serif text-[12px]">4w3 · 4w5</div>
        </div>
        <div className="rounded-xl bg-secondary p-2.5">
          <ScreenLabel>Estresse e segurança</ScreenLabel>
          <div className="mt-1 font-serif text-[12px]">2 · 1</div>
        </div>
      </div>
    </Screen>
  );
}

function QuizScreen() {
  const question = questions[0];
  return (
    <Screen>
      <div className="flex items-center justify-between text-[10px] tabular-nums text-foreground/60">
        <span>Afirmação 37 de 162</span>
        <span>23%</span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full w-[23%] rounded-full bg-primary" />
      </div>
      <p className="mt-10 font-serif text-[20px] leading-snug tracking-[-0.02em]">
        {question?.text}
      </p>
      <div className="mt-auto space-y-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <div
            key={value}
            className={cn(
              "flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[11px]",
              value === 4 ? "border-foreground bg-foreground text-background" : "border-border",
            )}
          >
            <span className="font-serif text-[13px]">{value}</span>
            <span className="h-px flex-1 bg-current/15" />
          </div>
        ))}
      </div>
    </Screen>
  );
}

function ChatScreen() {
  return (
    <Screen className="gap-3">
      <ScreenLabel>Mentor · com o seu mapa</ScreenLabel>
      <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-foreground px-3 py-2.5 text-[11px] leading-relaxed text-background">
        Por que eu adio conversas difíceis mesmo sabendo que vão me aliviar?
      </div>
      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-border px-3 py-2.5 text-[11px] leading-relaxed">
        No seu mapa, o Tipo 4 aparece forte. Esse perfil costuma esperar o momento em que vai
        conseguir dizer tudo do jeito certo, e esse momento demora.
      </div>
      <div className="max-w-[88%] rounded-2xl rounded-bl-md border border-border px-3 py-2.5 text-[11px] leading-relaxed">
        Quer tentar um exercício curto pra esta semana? Escreva só a primeira frase da conversa.
      </div>
      <div className="mt-auto flex items-center gap-2 rounded-full border border-border px-3 py-2 text-[11px] text-foreground/50">
        Escreva uma mensagem
      </div>
    </Screen>
  );
}

const KANBAN = [
  { title: "A fazer", cards: ["Escrever a primeira frase da conversa", "Ler sobre a asa 3"] },
  { title: "Fazendo", cards: ["Revisar metas do mês"] },
  { title: "Feito", cards: ["Fazer o teste", "Ler o meu mapa"] },
];

function KanbanScreen() {
  return (
    <Screen>
      <ScreenLabel>Minhas tarefas</ScreenLabel>
      <div className="mt-4 grid flex-1 grid-cols-3 gap-2">
        {KANBAN.map((column) => (
          <div key={column.title} className="rounded-xl bg-secondary p-1.5">
            <div className="px-1 py-1 text-[10px] font-medium">{column.title}</div>
            <div className="space-y-1.5">
              {column.cards.map((card) => (
                <div
                  key={card}
                  className="rounded-lg bg-background p-2 text-[10px] leading-snug shadow-[0_1px_2px_oklch(0.14_0_0/8%)]"
                >
                  {card}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

function PomodoroScreen() {
  return (
    <Screen className="items-center text-center">
      <ScreenLabel>Foco</ScreenLabel>
      <div className="mt-16 grid size-48 place-items-center rounded-full border-[6px] border-secondary [border-top-color:var(--primary)] [border-right-color:var(--primary)]">
        <span className="font-serif text-[44px] tracking-[-0.04em] tabular-nums">18:24</span>
      </div>
      <div className="mt-8 text-[10px] uppercase tracking-[0.16em] text-foreground/60">
        Tarefa atual
      </div>
      <div className="mt-1 font-serif text-[15px]">Revisar metas do mês</div>
      <div className="mt-auto w-full rounded-xl bg-secondary p-3 text-left text-[10px] tabular-nums">
        Esta semana: 6 sessões · 2h30 de foco
      </div>
    </Screen>
  );
}

const PROFESSIONALS = [
  { initials: "MR", name: "Marina Rocha", role: "Psicóloga · CRP 00/00000", approach: "TCC" },
  { initials: "JL", name: "João Lima", role: "Psicólogo · CRP 00/00000", approach: "Humanista" },
  { initials: "CS", name: "Clara Souza", role: "Terapeuta", approach: "Abordagem sistêmica" },
];

function ProfessionalsScreen() {
  return (
    <Screen>
      <ScreenLabel>Profissionais</ScreenLabel>
      <ul className="mt-4 divide-y divide-border">
        {PROFESSIONALS.map((p) => (
          <li key={p.name} className="flex items-center gap-3 py-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-foreground/20 font-serif text-[12px]">
              {p.initials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[12px] font-medium">{p.name}</span>
              <span className="block text-[10px] text-foreground/60">{p.role}</span>
              <span className="block text-[10px] text-foreground/60">{p.approach}</span>
            </span>
          </li>
        ))}
      </ul>
    </Screen>
  );
}

const SCREENS: Record<ScreenId, () => ReactNode> = {
  result: ResultScreen,
  quiz: QuizScreen,
  chat: ChatScreen,
  kanban: KanbanScreen,
  pomodoro: PomodoroScreen,
  professionals: ProfessionalsScreen,
};

export function AppScreen({ id }: { id: ScreenId }) {
  const Content = SCREENS[id];
  return (
    <div role="img" aria-label={screenLabels[id]} className="h-full">
      <Content />
    </div>
  );
}
