import type { CSSProperties } from "react";
import { features, hero } from "../content";
import { textLinkClass } from "./cta-styles";
import { InkCardBackground } from "./ink-card-background";
import { TiltedPhone } from "./tilted-phone";
import { EmphasisText, Eyebrow } from "./section-header";
import { WaitlistCta } from "./waitlist-cta";

const STAGGER_MS = 90;
const enter = (step: number): CSSProperties => ({ animationDelay: `${step * STAGGER_MS}ms` });
const HERO_SCREENS = [features.blocks[0].screen] as const;
// Card preto full-bleed com cantos só embaixo; passa por trás do header (margem negativa da altura dele).
export function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      data-story-step="0"
      className="section-ink relative isolate -mt-16 overflow-clip rounded-b-[2rem] lg:-mt-[72px] lg:flex lg:min-h-svh lg:items-center lg:rounded-b-[2.5rem]"
    >
      <InkCardBackground />

      <div className="section-container relative grid gap-y-12 pb-16 pt-28 md:pt-32 lg:grid-cols-12 lg:gap-x-8 lg:pb-16 lg:pt-[calc(72px+3rem)]">
        <div className="lg:col-span-6 xl:col-span-5">
          <div className="hero-in" style={enter(0)}>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </div>
          <h1
            id="hero-title"
            style={enter(1)}
            className="hero-in display mt-6 text-balance text-background text-[40px] leading-[1.02] md:text-[60px] lg:text-[54px] xl:text-[64px]"
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
            <WaitlistCta />
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

        <div className="flex justify-center lg:col-span-6 lg:col-start-7 lg:items-center lg:motion-safe:invisible">
          <div>
            <div className="phone-intro">
              <div className="phone-float">
                <TiltedPhone
                  screens={HERO_SCREENS}
                  priority
                  className="w-[min(56vw,230px)] md:w-[280px] lg:w-[min(360px,calc((100svh-10rem)/2))]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
