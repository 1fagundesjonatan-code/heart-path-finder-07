import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_ERROR_CODES } from "../error-codes";
import { createRequestClient } from "@/integrations/supabase/request-client.server";
import type { Database } from "@/integrations/supabase/types";
import type { AppRole } from "@/shared/roles";

export type RequestAuthorization =
  | { ok: true; supabase: SupabaseClient<Database>; userId: string }
  | { ok: false; response: Response };

/**
 * Sessão válida (401) e um dos papéis (403), conferidos no banco via has_any_role com o JWT do
 * usuário. Núcleo compartilhado por `requireRole` (server functions) e por rotas de servidor.
 */
export async function authorizeWith(
  supabase: SupabaseClient<Database>,
  allowed: readonly AppRole[],
): Promise<RequestAuthorization> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { ok: false, response: new Response(AUTH_ERROR_CODES.unauthenticated, { status: 401 }) };
  }

  const { data: permitted, error: roleError } = await supabase.rpc("has_any_role", {
    p_roles: [...allowed],
  });
  if (roleError) {
    console.error("authorizeRequest: falha ao verificar papel", { code: roleError.code });
    return {
      ok: false,
      response: new Response("Não foi possível verificar a permissão.", { status: 500 }),
    };
  }
  if (!permitted) {
    return { ok: false, response: new Response(AUTH_ERROR_CODES.forbidden, { status: 403 }) };
  }

  return { ok: true, supabase, userId: data.user.id };
}

/** Uso em rotas de servidor: `const auth = await authorizeRequest([...]); if (!auth.ok) return auth.response;` */
export function authorizeRequest(allowed: readonly AppRole[]): Promise<RequestAuthorization> {
  return authorizeWith(createRequestClient(), allowed);
}
