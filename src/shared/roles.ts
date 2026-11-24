export const APP_ROLES = ["admin", "collaborator", "partner", "client"] as const;
export type AppRole = (typeof APP_ROLES)[number];

/** Papéis que acessam o painel administrativo (espelha is_staff() no banco). */
export const STAFF_ROLES = ["admin", "collaborator"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Administrador",
  collaborator: "Colaborador",
  partner: "Profissional",
  client: "Cliente",
};

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (APP_ROLES as readonly string[]).includes(value);
}

export function hasAnyRole(userRoles: readonly AppRole[], allowed: readonly AppRole[]): boolean {
  return userRoles.some((role) => allowed.includes(role));
}

export function isStaff(userRoles: readonly AppRole[]): boolean {
  return hasAnyRole(userRoles, STAFF_ROLES);
}
