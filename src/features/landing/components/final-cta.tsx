import { finalCta } from "../content";
import { textLinkClass } from "./cta-styles";
import { EmphasisText } from "./section-header";
import { TestCta } from "./test-cta";

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-title" className="section-ink">
      <div className="mx-auto max-w-[1200px] px-5 py-28 md:px-8 lg:px-12 lg:py-40">
        <h2
          id="final-cta-title"
          className="display max-w-4xl text-balance text-[40px] leading-[1.04] text-background md:text-[56px] lg:text-[72px]"
        >
          <EmphasisText text={finalCta.title} />
        </h2>
        <p className="mt-6 text-lg tabular-nums md:text-xl">{finalCta.body}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <TestCta size="lg" />
          <a href="#planos" className={textLinkClass}>
            {finalCta.plansLink}
          </a>
        </div>
      </div>
    </section>
  );
}
