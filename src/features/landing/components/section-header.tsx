import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Emphasized } from "../content";

type EyebrowProps = { children: ReactNode; className?: string; icon?: ReactNode };

export function Eyebrow({ children, className, icon }: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-xs font-medium uppercase leading-[1.2] tracking-[0.16em] text-foreground/70 [.section-ink_&]:text-muted-foreground",
        className,
      )}
    >
      <span aria-hidden="true" className="h-0.5 w-6 shrink-0 bg-primary" />
      {icon}
      {children}
    </p>
  );
}

export function EmphasisText({ text, animate = false }: { text: Emphasized; animate?: boolean }) {
  return (
    <>
      {text.before}
      <em className={cn("mark-gold font-light italic", animate && "mark-gold-draw")}>
        {text.emphasis}
      </em>
      {text.after}
    </>
  );
}

type SectionHeaderProps = {
  id: string;
  eyebrow?: string;
  eyebrowIcon?: ReactNode;
  title: ReactNode;
  className?: string;
};

export function SectionHeader({ id, eyebrow, eyebrowIcon, title, className }: SectionHeaderProps) {
  return (
    <div className={className}>
      {eyebrow && <Eyebrow icon={eyebrowIcon}>{eyebrow}</Eyebrow>}
      <h2
        id={id}
        className={cn(
          eyebrow && "mt-6",
          "display text-balance text-[32px] font-light leading-[1.08] tracking-[-0.015em] md:text-[44px] lg:text-[56px]",
        )}
      >
        {title}
      </h2>
    </div>
  );
}
