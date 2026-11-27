import { createFileRoute } from "@tanstack/react-router";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { canAccessModule, getModule } from "@/features/admin-shell/modules";
import { ClientDetail } from "@/features/clients/components/client-detail";

export const Route = createFileRoute("/admin/clientes/$id")({
  head: () => ({ meta: [{ title: "Ficha do cliente | THE SELF MAP" }] }),
  component: ClientDetailPage,
});

function ClientDetailPage() {
  const { id } = Route.useParams();
  const { auth } = Route.useRouteContext();
  const roles = auth.status === "authenticated" ? auth.roles : [];
  if (!canAccessModule(roles, getModule("clientes"))) return <NoPermission />;

  return <ClientDetail userId={id} />;
}
