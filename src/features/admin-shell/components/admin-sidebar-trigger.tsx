import { ChevronsLeft } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function AdminSidebarTrigger({ className }: { className?: string }) {
  const { isMobile, open, openMobile, toggleSidebar } = useSidebar();
  const expanded = isMobile ? openMobile : open;

  return (
    <button
      type="button"
      onClick={toggleSidebar}
      aria-label={expanded ? "Recolher menu" : "Expandir menu"}
      aria-expanded={expanded}
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-md text-sidebar-accent-foreground outline-none transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring md:size-9",
        className,
      )}
    >
      <ChevronsLeft
        aria-hidden="true"
        className={cn(
          "size-5 transition-transform duration-200 ease-out motion-reduce:transition-none",
          !expanded && "rotate-180",
        )}
      />
    </button>
  );
}
