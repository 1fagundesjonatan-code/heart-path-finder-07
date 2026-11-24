import { Link } from "@tanstack/react-router";
import { NonDiagnosticNotice } from "./non-diagnostic-notice";

export function SiteHeader() {
  return (
    <header className="border-b border-border/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <Link
          to="/"
          className="flex min-h-11 items-baseline gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground"
        >
          <span className="text-[17px] font-semibold leading-none tracking-[-0.03em]">
            The Self Map
          </span>
          <span className="text-sm leading-none text-muted-foreground">Eneagrama</span>
          <span className="sr-only">, voltar ao início</span>
        </Link>
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
