import { finalCta } from "../content";
import { textLinkClass } from "./cta-styles";
import { EmphasisText } from "./section-header";
import { WaitlistCta } from "./waitlist-cta";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="section-container py-2 md:py-3">
      <div className="section-ink rounded-[2rem] px-6 md:px-12 lg:rounded-[2.5rem] lg:px-16 py-20 md:py-28 lg:py-36">
        <h2
          id="final-cta-title"
          className="display max-w-4xl text-balance text-[40px] leading-[1.04] text-background md:text-[56px] lg:text-[72px]"
        >
          <EmphasisText text={finalCta.title} />
        </h2>
        <p className="mt-6 text-lg tabular-nums md:text-xl">{finalCta.body}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <WaitlistCta size="lg" />
          <a href="#planos" className={textLinkClass}>
            {finalCta.plansLink}
          </a>
        </div>
      </div>
    </section>
  );
}
