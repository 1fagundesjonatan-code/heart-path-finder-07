import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ScreenId } from "../content";
import { AngledPhone } from "./angled-phone";
import { PhoneMockup } from "./phone-mockup";

const MOTION_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

type Props = { screens: readonly ScreenId[]; active: number };

// Celular do desktop que acompanha hero + recursos: fica preso (sticky) na coluna direita do
// wrapper inteiro, então desce junto com o scroll sem trocar de lugar. No caminho até o
// primeiro bloco, o celular em 3/4 do hero vira o frontal no mesmo ponto (crossfade com giro).
export function ScrollPhone({ screens, active }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const angledRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const story = rootRef.current?.parentElement;
    const firstBlock = story?.querySelector('[data-story-step="1"]');
    if (!story || !firstBlock || !angledRef.current || !frontRef.current) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: story,
          start: "top top",
          endTrigger: firstBlock,
          end: "center center",
          scrub: 0.6,
        },
      });
      tl.to(angledRef.current, { rotateY: 28, scale: 0.94, ease: "none", duration: 1 }, 0)
        .to(angledRef.current, { opacity: 0, ease: "none", duration: 0.4 }, 0.45)
        .fromTo(
          frontRef.current,
          { opacity: 0, rotateY: -28, scale: 0.94 },
          { opacity: 1, rotateY: 0, scale: 1, ease: "none", duration: 0.6 },
          0.4,
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
          <div className="sticky top-0 flex h-svh items-center justify-center [perspective:1600px]">
            <div className="phone-intro">
              <div className="phone-float grid place-items-center">
                <div ref={angledRef} className="col-start-1 row-start-1 will-change-transform">
                  <AngledPhone
                    screen="quiz"
                    className="w-[min(380px,calc((100svh-10rem)*0.4656))]"
                  />
                </div>
                <div
                  ref={frontRef}
                  className="col-start-1 row-start-1 opacity-0 will-change-transform"
                >
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
      </div>
    </div>
  );
}
