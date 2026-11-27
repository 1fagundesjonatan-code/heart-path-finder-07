import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faq } from "../content";
import { SectionHeader } from "./section-header";
import { WaitlistCta } from "./waitlist-cta";

const FIRST_ID = faq.items[0]?.id ?? "";

// Mais (duas barras) que vira "x" ao abrir: a barra vertical gira junto com o conjunto.
function PlusIcon() {
  return (
    <span
      aria-hidden="true"
      className="relative grid size-9 shrink-0 place-items-center rounded-full border border-border transition-[background-color,border-color,transform] duration-200 group-hover:border-foreground/40 group-data-[state=open]:rotate-45 group-data-[state=open]:border-transparent group-data-[state=open]:bg-primary motion-reduce:transition-none"
    >
      <span className="absolute h-px w-3.5 bg-foreground" />
      <span className="absolute h-3.5 w-px bg-foreground" />
    </span>
  );
}

export function Faq() {
  const [open, setOpen] = useState(FIRST_ID);

  // Link direto por pergunta: /#faq-<id> abre e rola até ela.
  useEffect(() => {
    const id = window.location.hash.replace("#faq-", "");
    if (faq.items.some((item) => item.id === id)) setOpen(id);
  }, []);

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 lg:scroll-mt-[72px]">
      <div className="section-container grid gap-y-12 py-20 md:py-28 lg:grid-cols-12 lg:gap-x-12 lg:py-36">
        <div className="lg:col-span-4">
          <div className="lg:sticky lg:top-28">
            <SectionHeader id="faq-title" title={faq.title} />
            <p className="mt-6 max-w-[40ch] text-pretty text-lg leading-[1.55] text-muted-foreground">
              {faq.intro}
            </p>
            <WaitlistCta className="mt-8" />
          </div>
        </div>
        <Accordion
          type="single"
          collapsible
          value={open}
          onValueChange={setOpen}
          className="space-y-3 lg:col-span-8"
        >
          {faq.items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              id={`faq-${item.id}`}
              className="scroll-mt-20 rounded-2xl border border-border px-5 transition-[background-color,border-color] duration-200 hover:border-foreground/30 data-[state=open]:border-foreground/20 data-[state=open]:bg-secondary/60 motion-reduce:transition-none md:px-7 lg:scroll-mt-24"
            >
              <AccordionTrigger className="group focus-ring min-h-[72px] gap-6 rounded-xl py-5 text-left font-sans text-[17px] font-medium leading-snug hover:no-underline md:text-lg [&>svg]:hidden">
                {item.question}
                <PlusIcon />
              </AccordionTrigger>
              <AccordionContent className="max-w-[62ch] pb-7 text-pretty text-[17px] leading-[1.7] text-muted-foreground motion-reduce:animate-none">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
