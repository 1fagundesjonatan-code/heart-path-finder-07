import { cn } from "@/lib/utils";
import type { AgentVersionStatus } from "../../types";

const TONES: Record<AgentVersionStatus, { label: string; dot: string }> = {
  active: { label: "Ativa", dot: "bg-emerald-600" },
  draft: { label: "Rascunho", dot: "bg-primary" },
  archived: { label: "Arquivada", dot: "bg-foreground/30" },
};

export function VersionStatusBadge({ status }: { status: AgentVersionStatus }) {
  const tone = TONES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium",
        status === "archived" && "text-muted-foreground",
      )}
    >
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone.dot)} />
      {tone.label}
    </span>
  );
}
