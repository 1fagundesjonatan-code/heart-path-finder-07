import { Link, useRouterState } from "@tanstack/react-router";
import { forwardRef } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import type { AuthUser } from "@/features/auth/types";
import type { ModuleStatus } from "@/shared/module-status";
import type { AppRole } from "@/shared/roles";
import "../admin-scroll.css";
import { useScrollFade } from "./use-scroll-fade";
import { NavUser } from "./admin-account-menu";
import { BrandMark } from "./brand-mark";
import { groupModules, type AdminModule } from "../modules";

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
  const sections = groupModules(modules);
  const scrollRef = useScrollFade<HTMLDivElement>();

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader className="h-14 justify-center px-4 py-0 group-data-[collapsible=icon]:px-2">
        <BrandMark className="size-8 shrink-0 text-sidebar-primary" />
      </SidebarHeader>

      <SidebarContent ref={scrollRef} className="admin-nav-scroll">
        <nav aria-label="Módulos do painel">
          {sections.map((section) => {
            const headingId = `admin-nav-group-${section.id}`;
            return (
              <SidebarGroup key={section.id}>
                <SidebarGroupLabel
                  asChild
                  className="text-[10px] font-medium uppercase tracking-[0.18em] text-sidebar-foreground/60"
                >
                  <h2 id={headingId}>{section.label}</h2>
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu aria-labelledby={headingId}>
                    {section.modules.map((module) => {
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
                            <ModuleNavLink
                              module={module}
                              aria-current={active ? "page" : undefined}
                            >
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
                </SidebarGroupContent>
              </SidebarGroup>
            );
          })}
        </nav>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <NavUser user={user} roles={roles} onSignOut={onSignOut} />
      </SidebarFooter>
    </Sidebar>
  );
}
