import { SkipLink } from "@/features/eneagrama/components/site-chrome";
import { Faq } from "./faq";
import { FinalCta } from "./final-cta";
import { HowItWorks } from "./how-it-works";
import { Plans } from "./plans";
import { Privacy } from "./privacy";
import { Problem } from "./problem";
import { ProductStory } from "./product-story";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function LandingPage() {
  return (
    <>
      <SkipLink />
      <SiteHeader />
      <main id="conteudo" tabIndex={-1} className="focus:outline-none">
        <ProductStory />
        <Problem />
        <HowItWorks />
        <Privacy />
        <Plans />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
