import { cn } from "@/lib/utils";
import { statusLabel, type FeatureStatus } from "../content";

export function StatusPill({ status }: { status: FeatureStatus }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-medium uppercase tracking-[0.12em]",
        status === "available"
          ? "bg-primary text-primary-foreground"
          : "border border-border text-muted-foreground",
      )}
    >
      {statusLabel[status]}
    </span>
  );
}
