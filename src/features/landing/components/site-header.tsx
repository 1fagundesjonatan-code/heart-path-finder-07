import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { cta, nav } from "../content";
import { ctaVariants } from "./cta-styles";
import { TestCta } from "./test-cta";

const SCROLL_THRESHOLD = 8;

function useScrolled(): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);
  return scrolled;
}

function useActiveSection(): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    const sections = nav
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          setActive((prev) => (entry.isIntersecting ? id : prev === id ? null : prev));
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
  return active;
}

export function Logo() {
  return (
    <Link
      to="/"
      className="focus-ring flex min-h-11 shrink-0 items-center gap-2.5 whitespace-nowrap rounded-md"
      aria-label="The Self Map, início"
    >
      <span
        aria-hidden="true"
        className="grid size-8 place-items-center rounded-full border border-current/30 font-serif text-sm font-semibold"
      >
        S
      </span>
      <span aria-hidden="true" className="font-serif text-[17px] leading-none">
        The Self Map
      </span>
    </Link>
  );
}

export function SiteHeader() {
  const scrolled = useScrolled();
  const active = useActiveSection();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b transition-[background-color,border-color] duration-200",
        scrolled
          ? "border-border bg-background/90 backdrop-blur-sm"
          : "border-transparent bg-background",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-2 px-5 sm:gap-4 md:px-8 lg:h-[72px] lg:px-12">
        <Logo />

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? "location" : undefined}
                  className="focus-ring relative inline-flex min-h-11 items-center rounded-full px-3 text-[15px] text-foreground/70 transition-colors duration-150 hover:text-foreground aria-[current=location]:text-foreground"
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute bottom-2 left-1/2 size-1 -translate-x-1/2 rounded-full bg-primary transition-opacity duration-150",
                      active === item.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/entrar"
            search={{ next: "/" }}
            className={cn(ctaVariants({ variant: "ghost", size: "sm" }), "hidden lg:inline-flex")}
          >
            {cta.login}
          </Link>
          <TestCta size="sm" withArrow={false} label={cta.compact} className="xl:hidden" />
          <TestCta size="sm" withArrow={false} className="hidden xl:inline-flex" />

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              className="focus-ring grid size-11 cursor-pointer place-items-center rounded-full transition-colors duration-150 hover:bg-foreground/5 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu aria-hidden="true" strokeWidth={1.5} className="size-5" />
            </SheetTrigger>
            <SheetContent side="right" className="flex w-full flex-col gap-0 p-6 sm:max-w-sm">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <nav aria-label="Menu" className="mt-12">
                <ul className="divide-y divide-border border-y border-border">
                  {nav.map((item) => (
                    <li key={item.id}>
                      <a
                        href={`#${item.id}`}
                        onClick={() => setMenuOpen(false)}
                        className="focus-ring flex min-h-14 items-center font-serif text-[28px] font-light"
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                  <li>
                    <Link
                      to="/entrar"
                      search={{ next: "/" }}
                      className="focus-ring flex min-h-14 items-center font-serif text-[28px] font-light"
                    >
                      {cta.login}
                    </Link>
                  </li>
                </ul>
              </nav>
              <TestCta className="mt-auto w-full" />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
