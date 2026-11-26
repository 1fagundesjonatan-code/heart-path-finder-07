import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getCookies, setCookie } from "@tanstack/react-start/server";
import { getServerPublicEnv } from "./env.server";
import type { Database } from "./types";

/**
 * Cliente Supabase por requisição, autenticado com o JWT do usuário (cookies da sessão).
 * É o padrão no servidor: o Postgres aplica RLS como o usuário logado.
 * Nunca compartilhar entre requisições.
 */
export function createRequestClient(): SupabaseClient<Database> {
  const env = getServerPublicEnv();
  return createServerClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          // Sessão só trafega pelo servidor: o navegador não precisa ler o token (sem client.ts).
          setCookie(name, value, {
            ...options,
            httpOnly: true,
            sameSite: "lax",
            secure: !import.meta.env.DEV,
          });
        }
      },
    },
  });
}
