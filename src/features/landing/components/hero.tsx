import { hero } from "../content";
import { AppScreen } from "./app-screens";
import { textLinkClass } from "./cta-styles";
import { DeviceFrame } from "./device-frame";
import { EmphasisText, Eyebrow } from "./section-header";
import { TestCta } from "./test-cta";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="overflow-x-clip">
      <div className="mx-auto grid max-w-[1200px] gap-y-14 px-5 pt-12 md:px-8 md:pt-20 lg:grid-cols-12 lg:gap-x-8 lg:px-12 lg:pb-28 lg:pt-24">
        <div className="lg:col-span-5 lg:pt-6">
          <Eyebrow>{hero.eyebrow}</Eyebrow>
          <h1
            id="hero-title"
            className="display mt-6 text-balance text-[40px] font-light leading-[1.04] tracking-[-0.02em] md:text-[60px] lg:text-[64px] xl:text-[80px]"
          >
            <EmphasisText text={hero.title} animate />
          </h1>
          <p className="mt-6 max-w-[62ch] text-pretty text-lg leading-[1.55] text-muted-foreground md:text-xl">
            {hero.lead}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3">
            <TestCta />
            <a href="#como-funciona" className={textLinkClass}>
              {hero.secondary}
            </a>
          </div>
          <p className="mt-5 text-sm tabular-nums text-muted-foreground">{hero.meta.join(" · ")}</p>
          <p
            role="note"
            className="mt-8 max-w-[44ch] border-l-2 border-primary pl-4 text-sm leading-[1.5] text-muted-foreground"
          >
            {hero.notice}
          </p>
        </div>

        <div className="relative lg:col-span-6 lg:col-start-7 lg:-mr-12">
          <div
            aria-hidden="true"
            className="absolute inset-x-0 bottom-0 h-[70%] rounded-t-[2.5rem] bg-secondary lg:rounded-[2.5rem]"
          />
          <div className="relative mx-auto h-[min(118vw,520px)] max-w-[320px] overflow-hidden pt-8 md:h-[560px] md:max-w-[360px] lg:mr-0 lg:h-auto lg:overflow-visible lg:pt-0">
            <DeviceFrame className="mx-auto">
              <AppScreen id="result" />
            </DeviceFrame>
            <div
              aria-hidden="true"
              className="absolute bottom-6 -left-6 hidden max-w-[260px] rounded-2xl border border-border bg-card p-4 text-sm leading-snug text-card-foreground lg:block"
            >
              <span className="mb-1 block text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Mentor de IA
              </span>
              {hero.chatPreview}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
