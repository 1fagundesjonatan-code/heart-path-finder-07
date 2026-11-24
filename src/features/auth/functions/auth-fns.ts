import { createServerFn } from "@tanstack/react-start";
import { MissingEnvError } from "@/integrations/supabase/env";
import { createRequestClient } from "@/integrations/supabase/request-client.server";
import { isAppRole } from "@/shared/roles";
import { loginSchema } from "../schemas";
import type { AuthContext } from "../types";

export type SignInResult = { ok: true } | { ok: false; message: string };

// public-server-fn: lê só a sessão do próprio chamador; é a base do guard de rota.
export const getAuthContext = createServerFn({ method: "GET" }).handler(
  async (): Promise<AuthContext> => {
    try {
      const supabase = createRequestClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return { status: "anonymous" };

      const { data: rows, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user.id);
      if (rolesError) {
        console.error("getAuthContext: falha ao ler papéis", { code: rolesError.code });
        throw new Error("Não foi possível ler os papéis do usuário.", { cause: rolesError });
      }

      return {
        status: "authenticated",
        user: { id: data.user.id, email: data.user.email ?? null },
        roles: (rows ?? []).map((r) => r.role).filter(isAppRole),
      };
    } catch (error) {
      if (error instanceof MissingEnvError) return { status: "unconfigured" };
      throw error;
    }
  },
);

// public-server-fn: login é anônimo por definição; o Supabase aplica rate limit próprio.
export const signInFn = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }): Promise<SignInResult> => {
    let supabase;
    try {
      supabase = createRequestClient();
    } catch (error) {
      if (error instanceof MissingEnvError) {
        return { ok: false, message: "Autenticação ainda não configurada neste ambiente." };
      }
      throw error;
    }

    const { error } = await supabase.auth.signInWithPassword(data);
    if (!error) return { ok: true };

    console.error("signIn: falha de autenticação", { code: error.code, status: error.status });
    if (error.status === 429) {
      return { ok: false, message: "Muitas tentativas. Aguarde um instante e tente de novo." };
    }
    if (error.status && error.status >= 500) {
      return { ok: false, message: "Serviço de login indisponível. Tente de novo em instantes." };
    }
    return { ok: false, message: "E-mail ou senha incorretos." };
  });

// public-server-fn: encerrar a própria sessão não exige papel.
export const signOutFn = createServerFn({ method: "POST" }).handler(async () => {
  const supabase = createRequestClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("signOut: falha", { code: error.code });
    throw new Error("Não foi possível encerrar a sessão.", { cause: error });
  }
  return { ok: true as const };
});
