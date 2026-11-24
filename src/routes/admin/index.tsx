import { createFileRoute } from "@tanstack/react-router";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { PageHeader } from "@/features/admin-shell/components/page-header";
import { canAccessModule, getModule } from "@/features/admin-shell/modules";
import { StatusBadge } from "@/features/admin-shell/components/status-badge";
import { DashboardView } from "@/features/dashboard/components/dashboard-view";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Dashboard — THE SELF MAP" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { auth } = Route.useRouteContext();
  const module = getModule("dashboard");
  const roles = auth.status === "authenticated" ? auth.roles : [];
  if (!canAccessModule(roles, module)) return <NoPermission />;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Funil e operação com números reais por período. Métricas sem fonte aparecem como Necessita integração."
        actions={<StatusBadge status={module.status} />}
      />
      <DashboardView />
    </>
  );
}
