import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { PageHeader } from "@/features/admin-shell/components/page-header";
import { canAccessModule, getModule } from "@/features/admin-shell/modules";
import { PersonaTab } from "@/features/agent/components/training/persona-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { hasAnyRole } from "@/shared/roles";

const TABS = [
  { id: "persona", label: "Persona" },
  { id: "base", label: "Base de conhecimento" },
  { id: "tipos", label: "Tipos" },
  { id: "exemplos", label: "Exemplos" },
  { id: "uso", label: "Uso" },
] as const;
type TabId = (typeof TABS)[number]["id"];

function parseTab(value: unknown): TabId {
  return TABS.find((tab) => tab.id === value)?.id ?? "persona";
}

export const Route = createFileRoute("/admin/the-self-ai")({
  validateSearch: (search: Record<string, unknown>): { tab: TabId } => ({
    tab: parseTab(search.tab),
  }),
  head: () => ({ meta: [{ title: "Treinamento do agente | THE SELF MAP" }] }),
  component: TrainingPage,
});

function TrainingPage() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { auth } = Route.useRouteContext();
  const roles = auth.status === "authenticated" ? auth.roles : [];
  if (!canAccessModule(roles, getModule("the-self-ai"))) return <NoPermission />;

  return (
    <>
      <PageHeader
        title="Treinamento do agente"
        description="Versione a persona do agente, teste o rascunho no chat e publique quando estiver pronto. Só administradores publicam."
      />
      <div className="px-6 py-8 md:px-10">
        <Tabs
          value={tab}
          onValueChange={(next) => void navigate({ search: { tab: parseTab(next) } })}
        >
          <div className="-mx-1 mb-6 overflow-x-auto px-1">
            <TabsList className="h-auto min-h-11">
              {TABS.map((item) => (
                <TabsTrigger key={item.id} value={item.id} className="min-h-9">
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="persona">
            <PersonaTab canPublish={hasAnyRole(roles, ["admin"])} />
          </TabsContent>
          {TABS.filter((item) => item.id !== "persona").map((item) => (
            <TabsContent key={item.id} value={item.id}>
              <p className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {item.label}: em breve.
              </p>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  );
}
