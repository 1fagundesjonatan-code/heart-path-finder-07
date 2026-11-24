import { Link, useRouterState } from "@tanstack/react-router";
import { forwardRef } from "react";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import type { AuthUser } from "@/features/auth/types";
import type { ModuleStatus } from "@/shared/module-status";
import { ROLE_LABELS, type AppRole } from "@/shared/roles";
import type { AdminModule } from "../modules";

const SHORT_STATUS: Record<ModuleStatus, string> = {
  Implementado: "Pronto",
  "Em desenvolvimento": "Em dev.",
  Planejado: "Planejado",
  "Necessita integração": "Integração",
  "Necessita validação": "Validação",
};

type NavLinkProps = React.ComponentPropsWithoutRef<"a"> & { module: AdminModule };

const ModuleNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function ModuleNavLink(
  { module, children, ...rest },
  ref,
) {
  switch (module.id) {
    case "dashboard":
      return (
        <Link to="/admin" activeOptions={{ exact: true }} ref={ref} {...rest}>
          {children}
        </Link>
      );
    case "integracoes":
      return (
        <Link to="/admin/integracoes" ref={ref} {...rest}>
          {children}
        </Link>
      );
    case "configuracoes":
      return (
        <Link to="/admin/configuracoes/usuarios" ref={ref} {...rest}>
          {children}
        </Link>
      );
    default:
      return (
        <Link to="/admin/$modulo" params={{ modulo: module.slug }} ref={ref} {...rest}>
          {children}
        </Link>
      );
  }
});

function isActive(pathname: string, module: AdminModule): boolean {
  const base = module.slug ? `/admin/${module.slug}` : "/admin";
  return module.slug ? pathname === base || pathname.startsWith(`${base}/`) : pathname === base;
}

type Props = {
  modules: readonly AdminModule[];
  user: AuthUser;
  roles: readonly AppRole[];
  onSignOut: () => void;
};

export function AdminSidebar({ modules, user, roles, onSignOut }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
        <div className="flex items-center gap-3">
          <div
            aria-hidden="true"
            className="grid size-8 shrink-0 place-items-center rounded-full border border-sidebar-primary/60 font-serif text-sm font-semibold text-sidebar-primary"
          >
            S
          </div>
          <div className="min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <div className="font-serif text-sm tracking-[0.04em] text-sidebar-accent-foreground">
              THE SELF MAP
            </div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/70">
              Administration
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <nav aria-label="Módulos do painel">
              <SidebarMenu>
                {modules.map((module) => {
                  const Icon = module.icon;
                  const active = isActive(pathname, module);
                  return (
                    <SidebarMenuItem key={module.id}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={`${module.label} · ${module.status}`}
                        className="data-[active=true]:font-medium data-[active=true]:shadow-[inset_2px_0_0_var(--sidebar-primary)]"
                      >
                        <ModuleNavLink module={module}>
                          <Icon aria-hidden="true" />
                          <span>{module.label}</span>
                        </ModuleNavLink>
                      </SidebarMenuButton>
                      <SidebarMenuBadge
                        title={module.status}
                        className="text-[10px] uppercase tracking-[0.08em] text-sidebar-foreground/60"
                      >
                        <span aria-hidden="true">{SHORT_STATUS[module.status]}</span>
                        <span className="sr-only">{module.status}</span>
                      </SidebarMenuBadge>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <div className="px-2 py-1 group-data-[collapsible=icon]:hidden">
          <div className="truncate text-xs text-sidebar-accent-foreground">
            {user.email ?? "Usuário"}
          </div>
          <div className="mt-0.5 truncate text-[10px] uppercase tracking-[0.18em] text-sidebar-foreground/60">
            {roles.map((r) => ROLE_LABELS[r]).join(" · ")}
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={onSignOut} tooltip="Sair">
              <LogOut aria-hidden="true" />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
