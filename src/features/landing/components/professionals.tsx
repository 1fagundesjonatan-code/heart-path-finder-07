import { cn } from "@/lib/utils";
import { pendingRoutes, professionals } from "../content";
import { ClientsWindow } from "./app-screens";
import { ctaVariants } from "./cta-styles";
import { BrowserFrame } from "./device-frame";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function Professionals() {
  return (
    <section
      id="profissionais"
      aria-labelledby="professionals-title"
      className="scroll-mt-16 border-y border-border bg-secondary lg:scroll-mt-[72px]"
    >
      <div className="mx-auto grid max-w-[1200px] gap-y-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:items-center lg:gap-x-8 lg:px-12 lg:py-36">
        <div className="lg:col-span-6">
          <SectionHeader
            id="professionals-title"
            eyebrow={professionals.eyebrow}
            title={professionals.title}
          />
          <p className="mt-6 max-w-[62ch] text-pretty text-[17px] leading-[1.65] text-muted-foreground lg:text-lg">
            {professionals.body}
          </p>
          <ul className="mt-8 divide-y divide-border border-y border-border">
            {professionals.items.map((item) => (
              <li key={item} className="py-4 text-[17px] leading-[1.5]">
                {item}
              </li>
            ))}
          </ul>
          <a
            href={pendingRoutes.professionalInterest}
            className={cn(ctaVariants({ variant: "outline" }), "mt-10")}
          >
            {professionals.cta}
          </a>
          <p className="mt-4 text-sm text-muted-foreground">{professionals.note}</p>
        </div>
        <Reveal className="lg:col-span-6">
          <BrowserFrame>
            <ClientsWindow />
          </BrowserFrame>
        </Reveal>
      </div>
    </section>
  );
}
