import { InkCardBackground } from "./ink-card-background";
import { launch } from "../content";
import { SectionHeader } from "./section-header";
import { WaitlistCta } from "./waitlist-cta";

export function Launch() {
  return (
    <section
      id="lancamento"
      aria-labelledby="launch-title"
      className="section-container scroll-mt-16 py-2 md:py-3 lg:scroll-mt-[72px]"
    >
      <div className="grid gap-12 section-ink relative isolate overflow-hidden rounded-[2rem] px-6 py-16 md:px-12 md:py-20 lg:grid-cols-12 lg:gap-x-8 lg:rounded-[2.5rem] lg:px-16 lg:py-28">
        <InkCardBackground />
        <div className="lg:col-span-7">
          <SectionHeader
            id="launch-title"
            eyebrow={launch.eyebrow}
            title={launch.title}
            className="max-w-2xl"
          />
          <p className="mt-6 max-w-[52ch] text-pretty text-lg leading-[1.55] text-muted-foreground">
            {launch.lead}
          </p>
          <WaitlistCta label={launch.cta} size="lg" className="mt-10" />
        </div>

        <div className="lg:col-span-5 lg:pt-3">
          <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {launch.itemsTitle}
          </h3>
          <ul className="mt-4 divide-y divide-border border-y border-border">
            {launch.items.map((item) => (
              <li key={item} className="flex items-baseline gap-3 py-3.5 text-[17px] leading-[1.5]">
                <span
                  aria-hidden="true"
                  className="size-1.5 shrink-0 -translate-y-0.5 rounded-full bg-primary"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
