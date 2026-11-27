import { AdminBreadcrumb } from "./admin-breadcrumb";
import { AdminSidebarTrigger } from "./admin-sidebar-trigger";

export function AdminHeader() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 bg-sidebar px-3 text-sidebar-foreground md:px-4">
      <AdminSidebarTrigger />
      <AdminBreadcrumb />
    </header>
  );
}
