import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatusPage } from "@/features/admin-shell/components/module-status-page";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { canAccessModule, getModule } from "@/features/admin-shell/modules";
import { SupabaseHealthPanel } from "@/features/integrations/components/supabase-health-panel";

export const Route = createFileRoute("/admin/integracoes")({
  head: () => ({ meta: [{ title: "Integrações | THE SELF MAP" }] }),
  component: IntegrationsPage,
});

function IntegrationsPage() {
  const { auth } = Route.useRouteContext();
  const module = getModule("integracoes");
  const roles = auth.status === "authenticated" ? auth.roles : [];
  if (!canAccessModule(roles, module)) return <NoPermission />;

  return (
    <>
      <ModuleStatusPage module={module} />
      <div className="px-6 pb-12 md:px-10">
        <SupabaseHealthPanel />
      </div>
    </>
  );
}
