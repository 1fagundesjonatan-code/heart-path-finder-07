import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Lock } from "lucide-react";
import { pendingRoutes, privacy } from "../content";
import { textLinkClass } from "./cta-styles";
import { InkCardBackground } from "./ink-card-background";
import { SectionHeader } from "./section-header";

const MOTION_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

// Desktop com motion: a seção fica presa e o trilho desliza até o último card; depois solta.
// Mobile e reduced motion: carrossel nativo com scroll-snap (ver classes do viewport).
function useHorizontalPin() {
  const sectionRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!section || !viewport || !track) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, () => {
      // com o pin GSAP ativo não há scroll nativo: sem tabindex (volta no cleanup)
      viewport.removeAttribute("tabindex");
      const distance = () => Math.max(track.scrollWidth - viewport.clientWidth, 0);
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "center center",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });
      return () => viewport.setAttribute("tabindex", "0");
    });
    return () => mm.revert();
  }, []);

  return { sectionRef, viewportRef, trackRef };
}

export function Privacy() {
  const { sectionRef, viewportRef, trackRef } = useHorizontalPin();

  return (
    <section
      ref={sectionRef}
      aria-labelledby="privacy-title"
      className="section-container py-20 md:py-28 lg:py-24"
    >
      <div>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6">
          <SectionHeader
            id="privacy-title"
            eyebrow={privacy.eyebrow}
            eyebrowIcon={<Lock aria-hidden="true" strokeWidth={1.5} className="size-5" />}
            title={privacy.title}
            className="max-w-2xl"
          />
          <a href={pendingRoutes.privacy} className={textLinkClass}>
            {privacy.policyLink}
          </a>
        </div>

        <div
          ref={viewportRef}
          role="region"
          tabIndex={0}
          aria-label="Privacidade e método"
          className="focus-ring -mx-5 mt-12 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:-mx-8 md:px-8 lg:mx-0 lg:px-0 lg:motion-safe:overflow-hidden"
        >
          <ul
            ref={trackRef}
            className="flex snap-x snap-mandatory gap-4 will-change-transform lg:gap-6 lg:motion-safe:snap-none"
          >
            {privacy.items.map((item, index) => (
              <li
                key={item.term}
                className="flex min-h-72 w-[82%] shrink-0 snap-start flex-col section-ink relative isolate overflow-hidden rounded-3xl p-7 md:w-[420px] lg:w-[calc((100%-3rem)/3)] lg:p-8"
              >
                <InkCardBackground />
                <span
                  aria-hidden="true"
                  className="text-sm tabular-nums tracking-[0.16em] text-muted-foreground"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-auto font-serif text-2xl leading-[1.15] tracking-[-0.02em] text-background md:text-[28px]">
                  {item.term}
                </h3>
                <p className="mt-3 text-pretty text-[17px] leading-[1.6]">{item.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
