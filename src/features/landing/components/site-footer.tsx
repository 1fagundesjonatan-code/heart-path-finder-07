import { NonDiagnosticNotice } from "@/features/eneagrama/components/non-diagnostic-notice";
import { footer } from "../content";
import { Logo } from "./site-header";

const footerLinkClass =
  "focus-ring inline-flex min-h-11 items-center rounded-sm text-[15px] text-muted-foreground transition-colors duration-150 hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="section-container pt-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div>
            <Logo />
            <p className="mt-4 text-[15px]">{footer.tagline}</p>
            <p className="mt-1 text-sm text-muted-foreground">{footer.company}</p>
          </div>
          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-foreground/70">
                {column.title}
              </p>
              <ul className="mt-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className={footerLinkClass}>
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p
          role="note"
          className="mt-14 rounded-xl bg-secondary px-5 py-4 text-[15px] leading-[1.5] md:px-6"
        >
          <strong className="font-medium">{footer.crisis.lead}</strong>{" "}
          <a
            href="tel:188"
            className="focus-ring rounded-sm font-medium underline decoration-primary decoration-2 underline-offset-4"
          >
            {footer.crisis.action}
          </a>{" "}
          {footer.crisis.rest}
        </p>

        <div className="mt-8 flex flex-col gap-3 border-t border-border py-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <NonDiagnosticNotice short className="text-sm" />
          <div className="flex items-center gap-6">
            <a
              href={footer.instagram.href}
              target="_blank"
              rel="noopener noreferrer"
              className={footerLinkClass}
            >
              {footer.instagram.handle}
              <span className="sr-only"> no Instagram (abre em nova aba)</span>
            </a>
            <span className="tabular-nums">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
