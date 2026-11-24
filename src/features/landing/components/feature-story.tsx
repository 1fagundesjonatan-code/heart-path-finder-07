import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { features } from "../content";
import { AppScreen } from "./app-screens";
import { DeviceFrame } from "./device-frame";
import { SectionHeader } from "./section-header";
import { StatusPill } from "./status-pill";
import { TestCta } from "./test-cta";

// Bloco ativo = o que cruza a faixa central (20%) da viewport.
function useActiveBlock(count: number) {
  const refs = useRef<Array<HTMLLIElement | null>>([]);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    refs.current.slice(0, count).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [count]);

  return { refs, active };
}

export function FeatureStory() {
  const { blocks } = features;
  const { refs, active } = useActiveBlock(blocks.length);

  return (
    <section
      id="recursos"
      aria-labelledby="features-title"
      className="scroll-mt-16 border-t border-border lg:scroll-mt-[72px]"
    >
      <div className="mx-auto max-w-[1200px] px-5 py-20 md:px-8 md:py-28 lg:px-12 lg:py-36">
        <SectionHeader
          id="features-title"
          eyebrow={features.eyebrow}
          title={features.title}
          className="max-w-3xl"
        />

        <div className="mt-16 lg:grid-cols-12 lg:gap-x-8 lg:motion-safe:mt-8 lg:motion-safe:grid">
          <ol className="space-y-20 lg:col-span-5 lg:motion-safe:space-y-0">
            {blocks.map((block, i) => {
              const isActive = i === active;
              return (
                <li
                  key={block.id}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  data-index={i}
                  className="lg:motion-safe:flex lg:motion-safe:min-h-[70vh] lg:motion-safe:items-center"
                >
                  <article
                    aria-labelledby={`feature-${block.id}`}
                    className={cn(
                      "transition-[opacity,border-color] duration-[250ms] lg:motion-safe:border-l-2 lg:motion-safe:pl-8",
                      isActive
                        ? "lg:motion-safe:border-primary"
                        : "lg:motion-safe:border-transparent lg:motion-safe:opacity-45",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <StatusPill status={block.status} />
                      <span className="text-sm text-muted-foreground">{block.name}</span>
                    </div>
                    <h3
                      id={`feature-${block.id}`}
                      className="mt-5 text-balance text-2xl font-normal leading-[1.15] tracking-[-0.01em] md:text-[28px] lg:text-[32px]"
                    >
                      {block.title}
                    </h3>
                    <p className="mt-4 max-w-[62ch] text-pretty text-[17px] leading-[1.65] text-muted-foreground lg:text-lg">
                      {block.body}
                    </p>
                    <ul className="mt-6 space-y-2">
                      {block.items.map((item) => (
                        <li key={item} className="flex items-baseline gap-3 text-[17px]">
                          <span
                            aria-hidden="true"
                            className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-primary"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                    {block.note && (
                      <p className="mt-5 text-sm text-muted-foreground">{block.note}</p>
                    )}

                    <div className="relative mt-10 h-[440px] overflow-hidden rounded-t-[2.5rem] bg-secondary px-6 pt-8 lg:motion-safe:hidden">
                      <DeviceFrame className="mx-auto max-w-[280px]">
                        <AppScreen id={block.screen} />
                      </DeviceFrame>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>

          <div className="hidden lg:col-span-6 lg:col-start-7 lg:motion-safe:block">
            <div className="sticky top-24 flex h-[calc(100vh-7rem)] items-center justify-center">
              <DeviceFrame className="lg:max-w-[min(360px,calc((100vh-9rem)*0.46))]">
                {blocks.map((block, i) => (
                  <div
                    key={block.id}
                    aria-hidden={i !== active}
                    className={cn(
                      "absolute inset-0 transition-opacity duration-[250ms]",
                      i === active ? "opacity-100" : "opacity-0",
                    )}
                  >
                    <AppScreen id={block.screen} />
                  </div>
                ))}
              </DeviceFrame>
            </div>
          </div>
        </div>

        <TestCta label={features.closingCta} className="mt-16" />
      </div>
    </section>
  );
}
