import { createFileRoute } from "@tanstack/react-router";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { PageHeader } from "@/features/admin-shell/components/page-header";
import { canAccessModule, getModule } from "@/features/admin-shell/modules";
import { UsersRolesTable } from "@/features/users/components/users-roles-table";

export const Route = createFileRoute("/admin/configuracoes/usuarios")({
  head: () => ({ meta: [{ title: "Usuários e papéis — THE SELF MAP" }] }),
  component: UsersPage,
});

function UsersPage() {
  const { auth } = Route.useRouteContext();
  const roles = auth.status === "authenticated" ? auth.roles : [];
  if (!canAccessModule(roles, getModule("configuracoes"))) return <NoPermission />;

  return (
    <>
      <PageHeader
        title="Usuários e papéis"
        description="Atribua ou remova papéis de acesso. Cada mudança fica registrada na auditoria. Usuários novos são criados no painel do Supabase (Authentication)."
      />
      <div className="px-6 py-8 md:px-10">
        <UsersRolesTable />
      </div>
    </>
  );
}
