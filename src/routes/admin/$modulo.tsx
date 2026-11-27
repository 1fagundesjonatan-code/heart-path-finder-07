import { createFileRoute, notFound } from "@tanstack/react-router";
import { ModuleStatusPage } from "@/features/admin-shell/components/module-status-page";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { canAccessModule, getModuleBySlug } from "@/features/admin-shell/modules";

export const Route = createFileRoute("/admin/$modulo")({
  beforeLoad: ({ params }) => {
    // slug vazio pertence ao Dashboard (/admin); o módulo em si não é serializável (ícone).
    if (!params.modulo || !getModuleBySlug(params.modulo)) throw notFound();
  },
  head: ({ params }) => ({
    meta: [{ title: `${getModuleBySlug(params.modulo)?.label ?? "Módulo"} | THE SELF MAP` }],
  }),
  component: ModulePage,
});

function ModulePage() {
  const { modulo } = Route.useParams();
  const { auth } = Route.useRouteContext();
  const module = getModuleBySlug(modulo);
  const roles = auth.status === "authenticated" ? auth.roles : [];

  if (!module) return null;
  if (!canAccessModule(roles, module)) return <NoPermission />;
  return <ModuleStatusPage module={module} />;
}
