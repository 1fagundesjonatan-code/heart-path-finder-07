import { createMiddleware } from "@tanstack/react-start";
import { authorizeRequest } from "./authorize-request.server";
import type { AppRole } from "@/shared/roles";

/**
 * Middleware de server function: exige sessão válida (401) e um dos papéis informados (403).
 * A lógica vive em `authorizeRequest` (compartilhada com as rotas de servidor); o contexto
 * entregue ao handler traz o cliente Supabase já autenticado como o usuário (RLS vale).
 * Toda server function do admin DEVE declará-lo (há teste automatizado que verifica).
 */
export function requireRole(allowed: readonly AppRole[]) {
  return createMiddleware({ type: "function" }).server(async ({ next }) => {
    const auth = await authorizeRequest(allowed);
    if (!auth.ok) throw auth.response;
    return next({ context: { supabase: auth.supabase, userId: auth.userId } });
  });
}
