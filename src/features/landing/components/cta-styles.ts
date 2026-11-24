import { cva } from "class-variance-authority";

export const ctaVariants = cva(
  "focus-ring group inline-flex cursor-pointer whitespace-nowrap items-center justify-center gap-2 rounded-full text-[15px] font-medium leading-none tracking-[0.01em] transition-[background-color,border-color,color,transform] duration-150 active:scale-[0.97] motion-reduce:active:scale-100",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-gold-light",
        outline: "border border-current/25 hover:border-current/60",
        ghost: "hover:bg-foreground/5",
      },
      size: {
        sm: "min-h-11 px-3.5 sm:px-4",
        md: "min-h-12 px-6",
        lg: "min-h-14 px-8 text-base",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export const textLinkClass =
  "focus-ring inline-flex min-h-11 items-center rounded-sm text-[15px] font-medium underline decoration-current/30 decoration-1 underline-offset-[6px] transition-[text-decoration-color] duration-150 hover:decoration-current";
