import { ArrowRight } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { cta, WAITLIST_URL } from "../content";
import { ctaVariants } from "./cta-styles";

type Props = VariantProps<typeof ctaVariants> & {
  label?: string;
  className?: string;
  withArrow?: boolean;
};

export function WaitlistCta({
  label = cta.primary,
  className,
  withArrow = true,
  ...variants
}: Props) {
  return (
    <a
      href={WAITLIST_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(ctaVariants(variants), className)}
    >
      {label}
      <span className="sr-only"> (abre o WhatsApp em nova aba)</span>
      {withArrow && (
        <ArrowRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-5 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none"
        />
      )}
    </a>
  );
}
