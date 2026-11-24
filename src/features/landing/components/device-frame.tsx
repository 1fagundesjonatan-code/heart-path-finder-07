import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const DEVICE_SHADOW = "shadow-[0_1px_2px_oklch(0.14_0_0/8%),0_24px_48px_-12px_oklch(0.14_0_0/22%)]";

type FrameProps = { children: ReactNode; className?: string };

// Raio concêntrico: externo 2.5rem = tela 2rem + bezel 8px.
export function DeviceFrame({ children, className }: FrameProps) {
  return (
    <div
      className={cn(
        "w-full max-w-[320px] rounded-[2.5rem] bg-foreground p-2 lg:max-w-[360px]",
        DEVICE_SHADOW,
        className,
      )}
    >
      <div className="relative aspect-[390/844] overflow-hidden rounded-[2rem] bg-background text-foreground outline outline-1 -outline-offset-1 outline-black/10">
        <div
          aria-hidden="true"
          className="absolute left-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-foreground"
        />
        {children}
      </div>
    </div>
  );
}

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
