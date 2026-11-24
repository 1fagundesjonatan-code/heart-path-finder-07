import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { faq } from "../content";
import { SectionHeader } from "./section-header";

const FIRST_ID = faq.items[0]?.id ?? "";

export function Faq() {
  const [open, setOpen] = useState(FIRST_ID);

  // Link direto por pergunta: /#faq-<id> abre e rola até ela.
  useEffect(() => {
    const id = window.location.hash.replace("#faq-", "");
    if (faq.items.some((item) => item.id === id)) setOpen(id);
  }, []);

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-16 lg:scroll-mt-[72px]">
      <div className="mx-auto grid max-w-[1200px] gap-y-12 px-5 py-20 md:px-8 md:py-28 lg:grid-cols-12 lg:gap-x-8 lg:px-12 lg:py-36">
        <SectionHeader id="faq-title" title={faq.title} className="lg:col-span-4" />
        <Accordion
          type="single"
          collapsible
          value={open}
          onValueChange={setOpen}
          className="border-t border-border lg:col-span-7 lg:col-start-6"
        >
          {faq.items.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              id={`faq-${item.id}`}
              className="scroll-mt-20 border-border lg:scroll-mt-24"
            >
              <AccordionTrigger className="focus-ring min-h-14 gap-4 rounded-sm py-4 text-left font-sans text-[17px] font-medium transition-colors hover:no-underline hover:text-foreground/80 [&>svg]:size-5">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="max-w-[62ch] pb-6 text-pretty text-[17px] leading-[1.65] text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
