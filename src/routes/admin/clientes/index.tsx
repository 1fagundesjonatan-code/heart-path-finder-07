import { createFileRoute } from "@tanstack/react-router";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { PageHeader } from "@/features/admin-shell/components/page-header";
import { canAccessModule, getModule } from "@/features/admin-shell/modules";
import { ClientsList } from "@/features/clients/components/clients-list";

export const Route = createFileRoute("/admin/clientes/")({
  head: () => ({ meta: [{ title: "Clientes | THE SELF MAP" }] }),
  component: ClientsPage,
});

function ClientsPage() {
  const { auth } = Route.useRouteContext();
  const roles = auth.status === "authenticated" ? auth.roles : [];
  if (!canAccessModule(roles, getModule("clientes"))) return <NoPermission />;

  return (
    <>
      <PageHeader
        title="Clientes"
        description="Pessoas com conta: perfil, consentimentos, atividade e resumo de uso da IA."
      />
      <div className="px-6 py-8 md:px-10">
        <ClientsList />
      </div>
    </>
  );
}
