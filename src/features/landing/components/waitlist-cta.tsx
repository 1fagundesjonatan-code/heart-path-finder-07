import { ArrowRight } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { cta, WAITLIST_URL } from "../content";
import { ctaIconSizes, ctaVariants } from "./cta-styles";

type Props = VariantProps<typeof ctaVariants> & {
  label?: string;
  className?: string;
};

const ARROW_CLASS =
  "col-start-1 row-start-1 size-4 transition-transform duration-200 ease-out motion-reduce:transition-none";

// A seta sai pela direita e outra entra pela esquerda dentro da pílula, que clareia no hover.
export function WaitlistCta({ label = cta.primary, className, size }: Props) {
  return (
    <a
      href={WAITLIST_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(ctaVariants({ size }), className)}
    >
      {label}
      <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
      <span
        aria-hidden="true"
        className={cn(
          "grid shrink-0 place-items-center overflow-hidden rounded-full bg-white/20 transition-[background-color,color] duration-200 group-hover:bg-white group-hover:text-[oklch(0.5_0.1_80)] motion-reduce:transition-none",
          ctaIconSizes[size ?? "md"],
        )}
      >
        <ArrowRight
          strokeWidth={1.75}
          className={cn(
            ARROW_CLASS,
            "group-hover:translate-x-6 motion-reduce:group-hover:translate-x-0",
          )}
        />
        <ArrowRight
          strokeWidth={1.75}
          className={cn(
            ARROW_CLASS,
            "-translate-x-6 group-hover:translate-x-0 motion-reduce:translate-x-0 motion-reduce:hidden",
          )}
        />
      </span>
    </a>
  );
}
