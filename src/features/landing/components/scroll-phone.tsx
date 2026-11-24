import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ScreenId } from "../content";
import { PhoneMockup } from "./phone-mockup";

// Mesmos valores da classe .phone-tilt (styles.css), pra não pular quando o GSAP assume.
const HERO_TILT = { rotateX: 14, rotateY: -22, rotateZ: 5, scale: 1.04, xPercent: 0 };
const STORY_POSE = { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0.94, xPercent: -8 };
const MOTION_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

type Props = { screens: readonly ScreenId[]; active: number };

// Celular único que acompanha hero + recursos no desktop. Fica preso (sticky) na coluna
// direita e é liberado ao fim do wrapper; o GSAP só anima a pose com scrub.
export function ScrollPhone({ screens, active }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const story = rootRef.current?.parentElement;
    const tilt = tiltRef.current;
    const firstBlock = story?.querySelector('[data-story-step="1"]');
    if (!story || !tilt || !firstBlock) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, () => {
      gsap.fromTo(tilt, HERO_TILT, {
        ...STORY_POSE,
        ease: "none",
        scrollTrigger: {
          trigger: story,
          start: "top top",
          endTrigger: firstBlock,
          end: "center center",
          scrub: 0.6,
        },
      });
    });
    return () => mm.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 hidden lg:motion-safe:block"
    >
      <div className="mx-auto grid h-full max-w-[1200px] grid-cols-12 gap-x-8 px-12">
        <div className="col-span-6 col-start-7 -mr-12">
          <div className="sticky top-[72px] flex h-[calc(100svh-72px)] items-center justify-center [perspective:1600px]">
            <div ref={tiltRef} className="phone-tilt will-change-transform">
              <div className="phone-intro">
                <div className="phone-float">
                  <PhoneMockup
                    screens={screens}
                    active={active}
                    priority
                    className="w-[min(380px,calc((100svh-10rem)/2))]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
