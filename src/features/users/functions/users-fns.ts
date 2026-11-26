import { createServerFn } from "@tanstack/react-start";
import { requireRole } from "@/features/auth/functions/require-role";
import { createServiceRoleClient } from "@/integrations/supabase/admin-client.server";
import { isAppRole } from "@/shared/roles";
import { listUsersSchema, roleChangeSchema, USERS_PAGE_SIZE } from "../schemas";
import type { ManagedUser, RoleChangeResult, UserList } from "../types";

/**
 * Lista uma página de usuários com seus papéis. O e-mail vive em auth.users, inacessível por
 * RLS: este é o único uso de service role da feature, e só roda depois de requireRole(["admin"])
 * aprovar. Os papéis vêm do JWT do usuário, só dos ids da página.
 */
export const listUsersFn = createServerFn({ method: "GET" })
  .middleware([requireRole(["admin"])])
  .inputValidator((data: unknown) => listUsersSchema.parse(data))
  .handler(async ({ data, context }): Promise<UserList> => {
    const service = createServiceRoleClient();
    const authUsers = await service.auth.admin.listUsers({
      page: data.page,
      perPage: USERS_PAGE_SIZE,
    });
    if (authUsers.error) {
      console.error("listUsers: falha ao listar auth.users", { code: authUsers.error.code });
      throw new Error("Não foi possível listar os usuários.", { cause: authUsers.error });
    }

    const pageUsers = authUsers.data.users;
    const rolesByUser = new Map<string, ManagedUser["roles"]>();

    if (pageUsers.length > 0) {
      const roleRows = await context.supabase
        .from("user_roles")
        .select("user_id, role")
        .in(
          "user_id",
          pageUsers.map((u) => u.id),
        );
      if (roleRows.error) {
        console.error("listUsers: falha ao ler user_roles", { code: roleRows.error.code });
        throw new Error("Não foi possível ler os papéis.", { cause: roleRows.error });
      }
      for (const row of roleRows.data) {
        if (!isAppRole(row.role)) continue;
        rolesByUser.set(row.user_id, [...(rolesByUser.get(row.user_id) ?? []), row.role]);
      }
    }

    const users = pageUsers
      .map((u) => ({
        id: u.id,
        email: u.email ?? null,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at ?? null,
        roles: rolesByUser.get(u.id) ?? [],
      }))
      .sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));

    return { users, page: data.page, hasNext: authUsers.data.nextPage !== null };
  });

export const grantRoleFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((data: unknown) => roleChangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<RoleChangeResult> => {
    const { error } = await context.supabase
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });

    if (!error) return { ok: true };
    if (error.code === "23505") return { ok: false, message: "O usuário já tem esse papel." };
    console.error("grantRole: falha", { code: error.code });
    return { ok: false, message: "Não foi possível atribuir o papel." };
  });

export const revokeRoleFn = createServerFn({ method: "POST" })
  .middleware([requireRole(["admin"])])
  .inputValidator((data: unknown) => roleChangeSchema.parse(data))
  .handler(async ({ data, context }): Promise<RoleChangeResult> => {
    if (data.role === "admin" && data.userId === context.userId) {
      return { ok: false, message: "Você não pode remover seu próprio papel de administrador." };
    }

    const { error, count } = await context.supabase
      .from("user_roles")
      .delete({ count: "exact" })
      .eq("user_id", data.userId)
      .eq("role", data.role);

    if (error) {
      // O banco impede remover o último administrador (trigger levanta 'last_admin', P0001).
      if (error.code === "P0001" && error.message.includes("last_admin")) {
        return { ok: false, message: "É preciso manter pelo menos um administrador." };
      }
      console.error("revokeRole: falha", { code: error.code });
      return { ok: false, message: "Não foi possível remover o papel." };
    }
    if (!count) return { ok: false, message: "O usuário não tem esse papel." };
    return { ok: true };
  });
