import type { CSSProperties } from "react";
import { hero } from "../content";
import { textLinkClass } from "./cta-styles";
import { PhoneMockup } from "./phone-mockup";
import { EmphasisText, Eyebrow } from "./section-header";
import { TestCta } from "./test-cta";

const STAGGER_MS = 90;
const enter = (step: number): CSSProperties => ({ animationDelay: `${step * STAGGER_MS}ms` });

// No desktop com motion, o celular vem do ScrollPhone (sobreposto); aqui fica só o palco.
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      data-story-step="0"
      className="overflow-x-clip lg:flex lg:min-h-[calc(100svh-72px)] lg:items-center"
    >
      <div className="section-container grid gap-y-14 pt-12 md:pt-20 lg:grid-cols-12 lg:gap-x-8 lg:py-16">
        <div className="lg:col-span-5">
          <div className="hero-in" style={enter(0)}>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </div>
          <h1
            id="hero-title"
            style={enter(1)}
            className="hero-in display mt-6 text-balance text-[40px] leading-[1.02] md:text-[60px] lg:text-[56px] xl:text-[68px]"
          >
            <EmphasisText text={hero.title} animate />
          </h1>
          <p
            style={enter(2)}
            className="hero-in mt-6 max-w-[52ch] text-pretty text-lg leading-[1.55] text-muted-foreground md:text-xl"
          >
            {hero.lead}
          </p>
          <div
            style={enter(3)}
            className="hero-in mt-10 flex flex-wrap items-center gap-x-6 gap-y-3"
          >
            <TestCta />
            <a href="#como-funciona" className={textLinkClass}>
              {hero.secondary}
            </a>
          </div>
          <p style={enter(4)} className="hero-in mt-5 text-sm tabular-nums text-muted-foreground">
            {hero.meta.join(" · ")}
          </p>
          <p
            role="note"
            style={enter(5)}
            className="hero-in mt-8 max-w-[44ch] border-l-2 border-primary pl-4 text-sm leading-[1.5] text-muted-foreground"
          >
            {hero.notice}
          </p>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7 lg:-mr-12">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[70%] rounded-t-[2.5rem] bg-secondary lg:rounded-[2.5rem]"
          />
          <div className="relative mx-auto h-[min(118vw,520px)] max-w-[300px] overflow-hidden pt-8 md:h-[560px] md:max-w-[340px] lg:hidden lg:motion-reduce:block lg:h-auto lg:overflow-visible lg:pt-0">
            <PhoneMockup screens={["quiz"]} priority className="hero-in mx-auto" />
          </div>
          <div
            aria-hidden="true"
            style={enter(6)}
            className="hero-in absolute bottom-10 left-0 z-20 hidden max-w-[260px] rounded-2xl border border-border bg-card/90 p-4 text-sm leading-snug text-card-foreground shadow-[0_1px_2px_oklch(0.14_0_0/6%),0_16px_32px_-16px_oklch(0.14_0_0/24%)] backdrop-blur-sm lg:block"
          >
            <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Mentor de IA
            </span>
            {hero.chatPreview}
          </div>
        </div>
      </div>
    </section>
  );
}
