import { createServerFn } from "@tanstack/react-start";
import { describeEnvStatus } from "@/integrations/supabase/env.server";
import { requireRole } from "@/features/auth/functions/require-role";

export type ServerHealth = {
  env: { publicConfigured: boolean; serviceRoleConfigured: boolean };
  supabase: { reachable: boolean; latencyMs: number };
  checkedAt: string;
};

/** Verificação de conexão equivalente a `select 1` (RPC is_staff), sem expor chaves. */
export const getServerHealth = createServerFn({ method: "GET" })
  .middleware([requireRole(["admin", "collaborator"])])
  .handler(async ({ context }): Promise<ServerHealth> => {
    const startedAt = Date.now();
    const { error } = await context.supabase.rpc("is_staff");
    if (error) console.error("health: Supabase inacessível", { code: error.code });
    return {
      env: describeEnvStatus(),
      supabase: { reachable: !error, latencyMs: Date.now() - startedAt },
      checkedAt: new Date().toISOString(),
    };
  });
