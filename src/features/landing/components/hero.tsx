import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { hero } from "../content";
import { AngledPhone } from "./angled-phone";
import { textLinkClass } from "./cta-styles";
import { EmphasisText, Eyebrow } from "./section-header";
import { WaitlistCta } from "./waitlist-cta";

const STAGGER_MS = 90;
const enter = (step: number): CSSProperties => ({ animationDelay: `${step * STAGGER_MS}ms` });
const MOTION_QUERY = "(prefers-reduced-motion: no-preference)";

// Parallax das curvas de nível. No desktop o celular é o do ScrollPhone (acompanha o scroll).
function useHeroScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const linesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);
    const scrub = { trigger: section, start: "top top", end: "bottom top", scrub: 0.6 };
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, () => {
      gsap.to(linesRef.current, { yPercent: 8, ease: "none", scrollTrigger: scrub });
    });
    return () => mm.revert();
  }, []);

  return { sectionRef, linesRef };
}

// Full-bleed: o fundo topográfico passa por trás do header (margem negativa da altura dele).
export function Hero() {
  const { sectionRef, linesRef } = useHeroScroll();

  return (
    <section
      ref={sectionRef}
      aria-labelledby="hero-title"
      data-story-step="0"
      className="relative -mt-16 overflow-x-clip bg-[oklch(0.985_0.004_85)] lg:-mt-[72px] lg:flex lg:min-h-svh lg:items-center"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="hero-glow absolute bottom-0 left-1/2 aspect-square w-[150%] -translate-x-1/2 translate-y-1/3 lg:top-1/2 lg:bottom-auto lg:left-[72%] lg:w-[60%] lg:-translate-y-1/2" />
        <div ref={linesRef} className="hero-topography absolute inset-x-0 -inset-y-[10%]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-background" />
      </div>

      <div className="section-container relative grid gap-y-12 pb-16 pt-28 md:pt-32 lg:grid-cols-12 lg:gap-x-8 lg:pb-16 lg:pt-[calc(72px+3rem)]">
        <div className="lg:col-span-6 xl:col-span-5">
          <div className="hero-in" style={enter(0)}>
            <Eyebrow>{hero.eyebrow}</Eyebrow>
          </div>
          <h1
            id="hero-title"
            style={enter(1)}
            className="hero-in display mt-6 text-balance text-[40px] leading-[1.02] md:text-[60px] lg:text-[54px] xl:text-[64px]"
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
                <AngledPhone
                  screen="quiz"
                  className="w-[min(64vw,260px)] md:w-[300px] lg:w-[min(380px,calc((100svh-10rem)*0.4656))]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
