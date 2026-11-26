import { createMiddleware } from "@tanstack/react-start";
import { AUTH_ERROR_CODES } from "../error-codes";
import { createRequestClient } from "@/integrations/supabase/request-client.server";
import type { AppRole } from "@/shared/roles";

/**
 * Middleware de server function: exige sessão válida (401) e um dos papéis informados (403).
 * O papel é conferido no banco via RPC has_any_role com o JWT do usuário; o contexto entregue
 * ao handler traz o cliente Supabase já autenticado como o usuário (RLS vale).
 * Toda server function do admin DEVE declará-lo (há teste automatizado que verifica).
 */
export function requireRole(allowed: readonly AppRole[]) {
  return createMiddleware({ type: "function" }).server(async ({ next }) => {
    const supabase = createRequestClient();

    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw new Response(AUTH_ERROR_CODES.unauthenticated, { status: 401 });
    }

    const { data: permitted, error: roleError } = await supabase.rpc("has_any_role", {
      p_roles: [...allowed],
    });
    if (roleError) {
      console.error("requireRole: falha ao verificar papel", { code: roleError.code });
      throw new Response("Não foi possível verificar a permissão.", { status: 500 });
    }
    if (!permitted) {
      throw new Response(AUTH_ERROR_CODES.forbidden, { status: 403 });
    }

    return next({ context: { supabase, userId: data.user.id } });
  });
}
