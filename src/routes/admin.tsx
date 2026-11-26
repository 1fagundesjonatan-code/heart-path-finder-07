import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/features/admin-shell/components/admin-sidebar";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { modulesForRoles } from "@/features/admin-shell/modules";
import { getAuthContext, signOutFn } from "@/features/auth/functions/auth-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { isStaff } from "@/shared/roles";

export const Route = createFileRoute("/admin")({
  beforeLoad: async ({ location }) => {
    const auth = await getAuthContext();
    if (auth.status !== "authenticated") {
      throw redirect({ to: "/entrar", search: { next: location.href } });
    }
    return { auth };
  },
  head: () => ({
    meta: [
      { title: "THE SELF MAP — ADMINISTRATION" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

function AdminLayout() {
  const { auth } = Route.useRouteContext();

  const handleSignOut = async () => {
    try {
      await signOutFn();
      window.location.assign("/entrar");
    } catch (error) {
      console.error("logout: falha", error);
      toast.error("Não foi possível sair. Tente de novo.");
    }
  };

  if (auth.status !== "authenticated" || !isStaff(auth.roles)) {
    return (
      <main>
        <NoPermission onSignOut={handleSignOut} />
        <Toaster />
      </main>
    );
  }

  return (
    <SidebarProvider>
      <AdminSidebar
        modules={modulesForRoles(auth.roles)}
        user={auth.user}
        roles={auth.roles}
        onSignOut={handleSignOut}
      />
      <SidebarInset>
        <div className="flex h-12 items-center gap-3 border-b border-border px-4 md:hidden">
          <SidebarTrigger aria-label="Abrir ou fechar o menu" />
          <span className="font-serif text-sm tracking-[0.04em]">
            THE SELF MAP — ADMINISTRATION
          </span>
        </div>
        <div className="hidden h-12 items-center gap-3 border-b border-border px-4 md:flex">
          <SidebarTrigger aria-label="Abrir ou fechar o menu" />
          <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            THE SELF MAP — ADMINISTRATION
          </span>
        </div>
        <Outlet />
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
