import { useRouterState } from "@tanstack/react-router";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { MODULE_GROUPS, getModuleBySlug } from "../modules";

export function AdminBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const module = getModuleBySlug(pathname.split("/")[2] ?? "");
  if (!module) return null;
  const groupLabel = MODULE_GROUPS.find((g) => g.id === module.group)?.label;

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap text-sidebar-foreground">
        {groupLabel && (
          <>
            <BreadcrumbItem className="hidden text-[11px] uppercase tracking-[0.16em] sm:inline-flex">
              {groupLabel}
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden sm:block" />
          </>
        )}
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="truncate text-sidebar-accent-foreground">
            {module.label}
          </BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
