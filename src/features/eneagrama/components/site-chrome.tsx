import { NonDiagnosticNotice } from "./non-diagnostic-notice";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-full border border-foreground/30 font-serif text-sm font-semibold"
          >
            S
          </div>
          <div className="leading-tight">
            <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              The Self Map
            </div>
            <div className="font-serif text-base">Eneagrama</div>
          </div>
        </div>
        <div className="hidden text-xs uppercase tracking-[0.18em] text-muted-foreground md:block">
          Autoconhecimento · 9 tipos
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 py-8 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <span className="uppercase tracking-[0.18em]">The Self Map</span>
        <NonDiagnosticNotice short className="text-xs" />
        <span className="uppercase tracking-[0.18em]">© {new Date().getFullYear()}</span>
      </div>
    </footer>
  );
}

export function SkipLink() {
  return (
    <a
      href="#conteudo"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-4 focus-visible:z-50 focus-visible:rounded-md focus-visible:bg-foreground focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-background"
    >
      Ir para o conteúdo
    </a>
  );
}
