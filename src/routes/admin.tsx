import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminSidebar } from "@/features/admin-shell/components/admin-sidebar";
import { AdminHeader } from "@/features/admin-shell/components/admin-header";
import { NoPermission } from "@/features/admin-shell/components/no-permission";
import { modulesForRoles } from "@/features/admin-shell/modules";
import { getAuthContext, signOutFn } from "@/features/auth/functions/auth-fns";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
      { title: "THE SELF MAP | ADMINISTRATION" },
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
    <SidebarProvider style={{ "--sidebar-width": "18rem" } as React.CSSProperties}>
      <AdminSidebar
        modules={modulesForRoles(auth.roles)}
        user={auth.user}
        roles={auth.roles}
        onSignOut={handleSignOut}
      />
      <SidebarInset className="h-svh overflow-hidden bg-sidebar md:h-[calc(100svh-0.5rem)] md:peer-data-[variant=inset]:m-0 md:peer-data-[variant=inset]:mt-2 md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none md:peer-data-[state=collapsed]:peer-data-[variant=inset]:ml-0">
        <AdminHeader />
        <div className="admin-scroll min-h-0 flex-1 overflow-y-auto rounded-t-xl bg-background">
          <Outlet />
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}
