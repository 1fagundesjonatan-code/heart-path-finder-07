import { hasAnyRole, type AppRole } from "@/shared/roles";

/** Espelha admin_funnel() no banco (migration 0700): admin e collaborator. */
export const FUNNEL_ROLES: readonly AppRole[] = ["admin", "collaborator"];

export function canSeeFunnel(roles: readonly AppRole[]): boolean {
  return hasAnyRole(roles, FUNNEL_ROLES);
}
