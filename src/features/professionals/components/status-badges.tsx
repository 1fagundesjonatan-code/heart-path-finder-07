import { cn } from "@/lib/utils";
import type { VerificationStatus } from "../types";

const VERIFICATION: Record<VerificationStatus, { label: string; dot: string }> = {
  pending: { label: "Pendente", dot: "bg-accent ring-1 ring-foreground/40" },
  verified: { label: "Verificado", dot: "bg-emerald-600" },
  rejected: { label: "Rejeitado", dot: "bg-destructive" },
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  pending: VERIFICATION.pending.label,
  verified: VERIFICATION.verified.label,
  rejected: VERIFICATION.rejected.label,
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const tone = VERIFICATION[status];
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium">
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", tone.dot)} />
      {tone.label}
    </span>
  );
}

export function InviteBadge({ acceptedAt }: { acceptedAt: string | null }) {
  return (
    <span className="text-xs text-muted-foreground">
      {acceptedAt ? "Convite aceito" : "Convite pendente"}
    </span>
  );
}
