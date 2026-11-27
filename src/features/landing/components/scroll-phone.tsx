import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { ScreenId } from "../content";
import { TiltedPhone } from "./tilted-phone";

const MOTION_QUERY = "(min-width: 1024px) and (prefers-reduced-motion: no-preference)";

// Mesmos valores de .phone-tilt (styles.css), pra não pular quando o GSAP assume.
const PHONE_TILT_POSE = { rotateX: 14, rotateY: -22, rotateZ: 5, scale: 1.03 };
const PHONE_STORY_POSE = { rotateX: 0, rotateY: 0, rotateZ: 0, scale: 1 };

type Props = { screens: readonly ScreenId[]; active: number };

// Celular do desktop que acompanha hero + recursos: um objeto só, preso (sticky) na coluna
// direita do wrapper. Do topo até o primeiro bloco ele sai da pose inclinada e endireita.
export function ScrollPhone({ screens, active }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const story = rootRef.current?.parentElement;
    const firstBlock = story?.querySelector('[data-story-step="1"]');
    const tilt = tiltRef.current;
    if (!story || !firstBlock || !tilt) return;

    gsap.registerPlugin(ScrollTrigger);
    const mm = gsap.matchMedia();
    mm.add(MOTION_QUERY, () => {
      gsap.fromTo(tilt, PHONE_TILT_POSE, {
        ...PHONE_STORY_POSE,
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
      <div className="section-container grid h-full grid-cols-12 gap-x-8">
        <div className="col-span-6 col-start-7">
          <div className="sticky top-0 flex h-svh items-center justify-center">
            <div className="phone-intro">
              <div className="phone-float">
                <TiltedPhone
                  screens={screens}
                  active={active}
                  tiltRef={tiltRef}
                  priority
                  className="w-[min(360px,calc((100svh-10rem)/2))]"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
