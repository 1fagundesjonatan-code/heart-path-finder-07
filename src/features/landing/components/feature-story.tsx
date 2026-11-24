import { cn } from "@/lib/utils";
import { features } from "../content";
import { PhoneMockup } from "./phone-mockup";
import { SectionHeader } from "./section-header";
import { StatusPill } from "./status-pill";
import { TestCta } from "./test-cta";

type Props = { activeStep: number };

// Passo 0 é o hero; os blocos são 1..n (data-story-step), lidos pelo useStoryStep.
export function FeatureStory({ activeStep }: Props) {
  const { blocks } = features;

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
          className="max-w-3xl lg:max-w-[600px]"
        />

        <div className="mt-16 lg:grid-cols-12 lg:gap-x-8 lg:motion-safe:mt-8 lg:motion-safe:grid">
          <ol className="space-y-20 lg:col-span-5 lg:motion-safe:space-y-0">
            {blocks.map((block, i) => {
              const isActive = i + 1 === activeStep;
              return (
                <li
                  key={block.id}
                  data-story-step={i + 1}
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
                      className="mt-5 text-balance text-2xl font-medium leading-[1.15] tracking-[-0.025em] md:text-[28px] lg:text-[32px]"
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
                      <PhoneMockup screens={[block.screen]} className="mx-auto max-w-[280px]" />
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>

        <TestCta label={features.closingCta} className="mt-16" />
      </div>
    </section>
  );
}
