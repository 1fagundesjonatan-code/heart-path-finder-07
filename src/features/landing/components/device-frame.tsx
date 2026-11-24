import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const DEVICE_SHADOW = "shadow-[0_1px_2px_oklch(0.14_0_0/8%),0_24px_48px_-12px_oklch(0.14_0_0/22%)]";

type FrameProps = { children: ReactNode; className?: string };

export function BrowserFrame({ children, className }: FrameProps) {
  return (
    <div
      className={cn(
        "aspect-[1200/760] w-full overflow-hidden rounded-xl border border-border bg-background text-foreground",
        DEVICE_SHADOW,
        className,
      )}
    >
      {children}
    </div>
  );
}
