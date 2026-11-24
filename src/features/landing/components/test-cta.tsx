import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { cta } from "../content";
import { ctaVariants } from "./cta-styles";

type Props = VariantProps<typeof ctaVariants> & {
  label?: string;
  className?: string;
  withArrow?: boolean;
};

export function TestCta({ label = cta.primary, className, withArrow = true, ...variants }: Props) {
  return (
    <Link to="/eneagrama" className={cn(ctaVariants(variants), className)}>
      {label}
      {withArrow && (
        <ArrowRight
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-5 transition-transform duration-150 group-hover:translate-x-1 motion-reduce:transition-none"
        />
      )}
    </Link>
  );
}
