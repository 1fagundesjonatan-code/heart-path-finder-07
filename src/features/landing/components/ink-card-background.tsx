import { lazy, Suspense, useEffect, useRef, useState } from "react";

const Beams = lazy(() => import("./beams").then((m) => ({ default: m.Beams })));

const DESKTOP_QUERY = "(min-width: 768px)";
const MOUNT_MARGIN = "200px 0px";

// Fundo de todo card preto. O pai precisa de `relative isolate overflow-hidden`. O canvas WebGL só
// existe enquanto o card está perto da viewport e só no desktop (mobile fica no preto estático).
// Limite do navegador é ~8 a 16 contextos WebGL; na landing coexistem no máximo ~6.
export function InkCardBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia(DESKTOP_QUERY).matches) return;
    const observer = new IntersectionObserver(([entry]) => setActive(!!entry?.isIntersecting), {
      rootMargin: MOUNT_MARGIN,
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-60"
    >
      {active && (
        <Suspense fallback={null}>
          <Beams
            color="#b8923c"
            backgroundColor="#0a0a0a"
            brightness={0.9}
            glow={0.35}
            fillLight={0.15}
            grain={0.25}
            beamWidth={170}
            rotation={28}
            speed={0.6}
            quality={0.5}
            dpr={1}
            mouseInteraction={false}
          />
        </Suspense>
      )}
    </div>
  );
}
