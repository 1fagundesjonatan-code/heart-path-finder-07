import { useId } from "react";
import { cn } from "@/lib/utils";
import type { MetricCardModel, MetricGroupModel } from "../domain/metrics-view";

function MetricCard({ card }: { card: MetricCardModel }) {
  return (
    <div className="flex flex-col justify-between gap-6 border-t border-border py-5 pr-4">
      <dt className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {card.label}
      </dt>
      <dd>
        <div
          className={cn(
            "font-serif tabular-nums leading-none",
            card.state === "value" ? "text-4xl" : "text-xl text-muted-foreground",
          )}
        >
          {card.value}
        </div>
        {card.hint && (
          <p className="mt-2 text-xs leading-snug text-muted-foreground">{card.hint}</p>
        )}
      </dd>
    </div>
  );
}

function MetricGroup({ group }: { group: MetricGroupModel }) {
  const headingId = useId();
  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-sans text-xs uppercase tracking-[0.22em] text-primary">
        {group.title}
      </h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
        {group.cards.map((card) => (
          <MetricCard key={card.key} card={card} />
        ))}
      </dl>
    </section>
  );
}

export function MetricGroups({ groups }: { groups: readonly MetricGroupModel[] }) {
  return (
    <div className="space-y-10">
      {groups.map((group) => (
        <MetricGroup key={group.title} group={group} />
      ))}
    </div>
  );
}
