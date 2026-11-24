import { hasAnyRole, type AppRole } from "@/shared/roles";

/** Espelha admin_funnel() no banco (migration 0500): admin, operator e marketing. */
export const FUNNEL_ROLES: readonly AppRole[] = ["admin", "operator", "marketing"];

export function canSeeFunnel(roles: readonly AppRole[]): boolean {
  return hasAnyRole(roles, FUNNEL_ROLES);
}
