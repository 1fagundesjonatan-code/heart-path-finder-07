import { cn } from "@/lib/utils";

export const NON_DIAGNOSTIC_TEXT =
  "Este teste é uma ferramenta de autoconhecimento. Não é um diagnóstico clínico, psicológico ou psiquiátrico e não substitui o acompanhamento de um profissional de saúde.";

export const NON_DIAGNOSTIC_SHORT = "Ferramenta de autoconhecimento. Não é diagnóstico clínico.";

type Props = { className?: string; short?: boolean };

export function NonDiagnosticNotice({ className, short = false }: Props) {
  return (
    <p
      role="note"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      data-testid="non-diagnostic-notice"
    >
      {short ? NON_DIAGNOSTIC_SHORT : NON_DIAGNOSTIC_TEXT}
    </p>
  );
}
