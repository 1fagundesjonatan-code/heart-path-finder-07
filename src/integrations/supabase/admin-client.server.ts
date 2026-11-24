import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerPublicEnv, getServiceRoleKey } from "./env.server";
import type { Database } from "./types";

/**
 * Cliente com service role: IGNORA RLS. Só pode ser usado no servidor, depois de autorizar o
 * chamador, e apenas em casos nomeados (cada uso precisa justificar por que RLS não serve):
 *  - features/users: listar e-mails de auth.users (a tabela não é acessível por RLS).
 * Este módulo é `*.server.ts`: o build bloqueia qualquer import vindo do código do navegador.
 */
export function createServiceRoleClient(): SupabaseClient<Database> {
  const env = getServerPublicEnv();
  return createClient<Database>(env.VITE_SUPABASE_URL, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
