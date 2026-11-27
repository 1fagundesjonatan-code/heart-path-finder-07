import { cva } from "class-variance-authority";

// Dourado escurecido (oklch 0.55) pra o texto branco passar AA (>= 4.5:1).
export const ctaVariants = cva(
  "focus-ring group inline-flex cursor-pointer whitespace-nowrap items-center justify-center gap-3 rounded-full bg-[oklch(0.55_0.11_80)] text-[15px] font-medium leading-none tracking-[0.01em] text-white shadow-[0_1px_2px_oklch(0.3_0.05_80/30%)] transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:bg-[oklch(0.5_0.1_80)] hover:shadow-[0_8px_20px_-6px_oklch(0.4_0.08_80/55%)] active:translate-y-0 active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none",
  {
    variants: {
      size: {
        sm: "min-h-11 pl-4 pr-1.5",
        md: "min-h-12 pl-6 pr-2",
        lg: "min-h-14 pl-8 pr-2.5 text-base",
      },
    },
    defaultVariants: { size: "md" },
  },
);

export const ctaIconSizes = { sm: "size-8", md: "size-8", lg: "size-9" } as const;

export const textLinkClass =
  "focus-ring inline-flex min-h-11 items-center rounded-sm text-[15px] font-medium underline decoration-current/30 decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-150 hover:decoration-current";
