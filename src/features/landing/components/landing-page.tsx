import { SkipLink } from "@/features/eneagrama/components/site-chrome";
import { Faq } from "./faq";
import { FeatureStory } from "./feature-story";
import { FinalCta } from "./final-cta";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { Plans } from "./plans";
import { Privacy } from "./privacy";
import { Problem } from "./problem";
import { Professionals } from "./professionals";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function LandingPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <Problem />
        <HowItWorks />
        <FeatureStory />
        <Privacy />
        <Professionals />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
