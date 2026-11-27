import { createFileRoute } from "@tanstack/react-router";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { PageHeader } from "@/features/admin-shell/components/page-header";
import { canAccessModule, getModule } from "@/features/admin-shell/modules";
import { ProfessionalsView } from "@/features/professionals/components/professionals-view";

export const Route = createFileRoute("/admin/profissionais/")({
  head: () => ({ meta: [{ title: "Profissionais | THE SELF MAP" }] }),
  component: ProfessionalsPage,
});

function ProfessionalsPage() {
  const { auth } = Route.useRouteContext();
  const roles = auth.status === "authenticated" ? auth.roles : [];
  if (!canAccessModule(roles, getModule("profissionais"))) return <NoPermission />;

  return (
    <>
      <PageHeader
        title="Profissionais"
        description="Convide psicólogos e terapeutas, confira o registro no conselho e acompanhe o aceite do convite."
      />
      <div className="px-6 py-8 md:px-10">
        <ProfessionalsView isAdmin={roles.includes("admin")} />
      </div>
    </>
  );
}
