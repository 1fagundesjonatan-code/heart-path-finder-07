import { useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { plans, type BillingCycle } from "../content";
import { ctaVariants } from "./cta-styles";
import { SectionHeader } from "./section-header";
import { TestCta } from "./test-cta";

function isBillingCycle(value: string): value is BillingCycle {
  return value === "monthly" || value === "yearly";
}

function PlanList({ items }: { items: string[] }) {
  return (
    <ul className="mt-8 divide-y divide-border border-y border-border">
      {items.map((item) => (
        <li key={item} className="flex items-baseline gap-3 py-3.5 text-[17px] leading-[1.5]">
          <span
            aria-hidden="true"
            className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-primary"
          />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Plans() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const { free, subscription } = plans;

  return (
    <section id="planos" aria-labelledby="plans-title" className="scroll-mt-16 lg:scroll-mt-[72px]">
      <div className="section-container py-20 md:py-28 lg:py-36">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <SectionHeader
            id="plans-title"
            eyebrow={plans.eyebrow}
            title={plans.title}
            className="max-w-2xl"
          />
          <div className="flex items-center gap-3">
            <span id="billing-label" className="text-sm text-muted-foreground">
              {plans.billingLabel}
            </span>
            <ToggleGroup
              type="single"
              value={cycle}
              onValueChange={(value) => isBillingCycle(value) && setCycle(value)}
              aria-labelledby="billing-label"
              className="rounded-full border border-border p-1"
            >
              {plans.cycles.map((c) => (
                <ToggleGroupItem
                  key={c.value}
                  value={c.value}
                  className="focus-ring min-h-11 cursor-pointer rounded-full px-5 text-[15px] data-[state=on]:bg-foreground data-[state=on]:text-background"
                >
                  {c.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {import.meta.env.DEV && (
          <p className="mt-8 inline-block rounded-sm border border-dashed border-destructive px-2 py-1 text-xs font-medium tracking-[0.16em] text-destructive">
            PLACEHOLDER
          </p>
        )}

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="border-t border-border pt-8 lg:col-span-5">
            <h3 className="font-serif text-[28px] leading-[1.15]">{free.name}</h3>
            <p className="mt-4 font-serif text-5xl tracking-[-0.03em] tabular-nums">{free.price}</p>
            <PlanList items={free.items} />
            <TestCta className="mt-10" />
          </div>

          <div className="section-ink rounded-2xl p-8 md:p-10 lg:col-span-7">
            <h3 className="font-serif text-[28px] leading-[1.15] text-background">
              {subscription.name}
            </h3>
            <p
              aria-live="polite"
              className="mt-4 font-serif text-5xl tracking-[-0.03em] tabular-nums text-background"
            >
              {subscription.price[cycle]}
              <span className="ml-1 font-sans text-lg font-normal text-muted-foreground">
                {subscription.period[cycle]}
              </span>
            </p>
            <PlanList items={subscription.items} />
            {/* Sem checkout ainda (pendência 1 da spec): botão desabilitado até existir. */}
            <button
              type="button"
              disabled
              className={cn(ctaVariants(), "mt-10 disabled:cursor-not-allowed disabled:opacity-60")}
            >
              {subscription.cta}
            </button>
          </div>
        </div>

        <p className="mt-10 max-w-[62ch] text-pretty text-sm leading-[1.5] text-muted-foreground">
          {plans.note}
        </p>
      </div>
    </section>
  );
}
