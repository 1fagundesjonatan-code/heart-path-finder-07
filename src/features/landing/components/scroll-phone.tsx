import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ScreenId } from "../content";
import { PhoneMockup } from "./phone-mockup";

const MOTION_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

type Props = { screens: readonly ScreenId[]; active: number };

// Celular frontal de recursos no desktop: preso (sticky) na coluna direita enquanto os blocos
// passam e liberado no fim da seção. O GSAP só faz a entrada com scrub (opacity/transform).
export function ScrollPhone({ screens, active }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const phoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trigger = rootRef.current?.parentElement;
    const phone = phoneRef.current;
    if (!trigger || !phone) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, () => {
      gsap.fromTo(
        phone,
        { opacity: 0, y: 120, scale: 0.92 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger, start: "top 85%", end: "top 15%", scrub: 0.6 },
        },
      );
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 hidden lg:motion-safe:block"
    >
      <div className="section-container grid h-full grid-cols-12 gap-x-8">
        <div className="col-span-6 col-start-7">
          <div className="sticky top-[72px] flex h-[calc(100svh-72px)] items-center justify-center">
            <div ref={phoneRef} className="will-change-transform">
              <PhoneMockup
                screens={screens}
                active={active}
                className="w-[min(360px,calc((100svh-10rem)/2))]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
