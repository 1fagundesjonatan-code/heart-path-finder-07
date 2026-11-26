import { useEffect, useRef, useState } from "react";
import { features, type ScreenId } from "../content";
import { FeatureStory } from "./feature-story";
import { Hero } from "./hero";
import { ScrollPhone } from "./scroll-phone";

const FEATURE_SCREENS: readonly ScreenId[] = features.blocks.map((b) => b.screen);

// Passo ativo = o [data-story-step] que cruza a faixa central (20%) da viewport.
function useStoryStep() {
  const ref = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const steps = ref.current?.querySelectorAll<HTMLElement>("[data-story-step]");
    if (!steps) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting)
            setStep(Number((entry.target as HTMLElement).dataset.storyStep));
        }
      },
      { rootMargin: "-40% 0px -40% 0px" },
    );
    steps.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return { ref, step };
}

// Hero + recursos dividem um wrapper pra um celular só viajar entre os dois.
export function ProductStory() {
  const { ref, step } = useStoryStep();

  return (
    <div ref={ref} className="relative">
      <Hero />
      <FeatureStory activeStep={step} />
      <ScrollPhone screens={FEATURE_SCREENS} active={Math.max(step - 1, 0)} />
    </div>
  );
}
