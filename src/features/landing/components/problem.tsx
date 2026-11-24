import { problem } from "../content";
import { Reveal } from "./reveal";
import { SectionHeader } from "./section-header";

export function Problem() {
  return (
    <section aria-labelledby="problem-title" className="section-container py-2 md:py-3">
      <div className="section-ink rounded-[2rem] px-6 md:px-12 lg:rounded-[2.5rem] lg:px-16 grid gap-y-12 py-16 md:py-24 lg:grid-cols-12 lg:gap-x-8 lg:py-28">
        <div className="lg:col-span-5">
          <SectionHeader
            id="problem-title"
            eyebrow={problem.eyebrow}
            title={problem.title}
            className="lg:sticky lg:top-28"
          />
        </div>
        <ul className="divide-y divide-border border-y border-border lg:col-span-6 lg:col-start-7">
          {problem.items.map((item, i) => (
            <li key={item.title}>
              <Reveal index={i} className="py-8 md:py-10">
                <h3 className="text-balance text-2xl font-medium leading-[1.15] tracking-[-0.025em] text-background md:text-[28px] lg:text-[32px]">
                  {item.title}
                </h3>
                <p className="mt-4 max-w-[62ch] text-pretty text-[17px] leading-[1.65] lg:text-lg">
                  {item.body}
                </p>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
