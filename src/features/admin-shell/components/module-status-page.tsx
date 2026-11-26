import { MODULE_STATUS_MEANING } from "@/shared/module-status";
import type { AdminModule } from "../modules";
import { PageHeader } from "./page-header";
import { StatusBadge } from "./status-badge";

/** Página honesta para módulo sem tela: diz o que é, em que fase está e o que falta. Sem números. */
export function ModuleStatusPage({ module }: { module: AdminModule }) {
  return (
    <>
      <PageHeader title={module.label} description={module.description} />
      <div className="max-w-2xl space-y-8 px-6 py-8 md:px-10">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={module.status} />
          <span className="text-sm text-muted-foreground">Fase {module.phase}</span>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {MODULE_STATUS_MEANING[module.status]}
        </p>

        <dl className="space-y-6 border-t border-border pt-6">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Situação
            </dt>
            <dd className="mt-2 text-[15px] leading-relaxed">{module.delivery}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              Depende de
            </dt>
            <dd className="mt-2">
              <ul className="space-y-1.5 text-[15px] leading-relaxed">
                {module.dependencies.map((dep) => (
                  <li key={dep} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 h-px w-3 shrink-0 bg-primary" />
                    {dep}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
