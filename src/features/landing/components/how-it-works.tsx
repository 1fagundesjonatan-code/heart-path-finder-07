import { howItWorks } from "../content";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";
import { StepDemo } from "./step-demos";
import { WaitlistCta } from "./waitlist-cta";

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      aria-labelledby="how-title"
      className="scroll-mt-16 lg:scroll-mt-[72px]"
    >
      <div className="section-container py-20 md:py-28 lg:py-36">
        <SectionHeader
          id="how-title"
          eyebrow={howItWorks.eyebrow}
          title={howItWorks.title}
          className="max-w-2xl"
        />

        <ol className="relative mt-16 grid gap-14 border-l border-border pl-8 md:mt-20 lg:grid-cols-3 lg:gap-8 lg:border-l-0 lg:border-t lg:pl-0">
          {howItWorks.steps.map((step, i) => (
            <li key={step.number} className="relative lg:pt-10">
              <span
                aria-hidden="true"
                className="absolute -left-8 top-6 size-2 -translate-x-1/2 rounded-full bg-primary lg:left-0 lg:top-0 lg:-translate-y-1/2 lg:translate-x-0"
              />
              <Reveal index={i}>
                <span
                  aria-hidden="true"
                  className="block font-serif text-[64px] leading-none tracking-[-0.04em] tabular-nums"
                >
                  {step.number}
                </span>
                <span aria-hidden="true" className="mt-3 block h-[3px] w-10 bg-primary" />
                <h3 className="mt-6 text-balance text-2xl font-medium leading-[1.15] tracking-[-0.025em] md:text-[28px]">
                  {step.title}
                </h3>
                <p className="mt-3 max-w-[62ch] text-pretty text-[17px] leading-[1.65] text-muted-foreground lg:text-lg">
                  {step.body}
                </p>
                <div className="mt-8">
                  <StepDemo id={step.screen} />
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <WaitlistCta className="mt-16" />
      </div>
    </section>
  );
}
