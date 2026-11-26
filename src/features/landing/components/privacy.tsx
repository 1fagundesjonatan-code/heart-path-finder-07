import { Lock } from "lucide-react";
import { pendingRoutes, privacy } from "../content";
import { textLinkClass } from "./cta-styles";
import { SectionHeader } from "./section-header";

export function Privacy() {
  return (
    <section aria-labelledby="privacy-title" className="section-container py-2 md:py-3">
      <div className="section-ink rounded-[2rem] px-6 md:px-12 lg:rounded-[2.5rem] lg:px-16 grid gap-y-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-x-8 lg:py-28">
        <div className="lg:col-span-5">
          <SectionHeader
            id="privacy-title"
            eyebrow={privacy.eyebrow}
            eyebrowIcon={<Lock aria-hidden="true" strokeWidth={1.5} className="size-5" />}
            title={privacy.title}
          />
          <a href={pendingRoutes.privacy} className={`${textLinkClass} mt-8`}>
            {privacy.policyLink}
          </a>
        </div>
        <dl className="divide-y divide-border border-y border-border lg:col-span-6 lg:col-start-7">
          {privacy.items.map((item) => (
            <div key={item.term} className="py-7 md:py-8">
              <dt className="font-serif text-2xl leading-[1.15] tracking-[-0.02em] text-background md:text-[28px]">
                {item.term}
              </dt>
              <dd className="mt-3 max-w-[62ch] text-pretty text-[17px] leading-[1.65] lg:text-lg">
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
