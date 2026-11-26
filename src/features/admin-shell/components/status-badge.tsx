import { cn } from "@/lib/utils";
import type { ModuleStatus } from "@/shared/module-status";

const TONES: Record<ModuleStatus, { dot: string; text: string }> = {
  Implementado: { dot: "bg-emerald-600", text: "text-foreground" },
  "Em desenvolvimento": { dot: "bg-primary", text: "text-foreground" },
  Planejado: { dot: "bg-foreground/30", text: "text-muted-foreground" },
  "Necessita integração": { dot: "bg-destructive", text: "text-foreground" },
  "Necessita validação": { dot: "bg-accent ring-1 ring-foreground/40", text: "text-foreground" },
};

export function StatusBadge({ status, className }: { status: ModuleStatus; className?: string }) {
  const tone = TONES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium",
        tone.text,
        className,
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone.dot)} />
      {status}
    </span>
  );
}
