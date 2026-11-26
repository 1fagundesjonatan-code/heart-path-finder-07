import { z } from "zod";
import { parseEnv, readPublicEnv, type SupabasePublicEnv } from "./env";

const serviceRoleSchema = z.object({ SUPABASE_SERVICE_ROLE_KEY: z.string().min(20) });

function readRaw(name: string): string | undefined {
  const fromProcess = typeof process !== "undefined" ? process.env?.[name] : undefined;
  if (fromProcess) return fromProcess;
  const fromImportMeta = (import.meta.env as Record<string, string | undefined>)[name];
  return fromImportMeta || undefined;
}

export function getServerPublicEnv(): SupabasePublicEnv {
  return readPublicEnv({
    VITE_SUPABASE_URL: readRaw("VITE_SUPABASE_URL"),
    VITE_SUPABASE_PUBLISHABLE_KEY: readRaw("VITE_SUPABASE_PUBLISHABLE_KEY"),
  });
}

export function getServiceRoleKey(): string {
  return parseEnv(serviceRoleSchema, {
    SUPABASE_SERVICE_ROLE_KEY: readRaw("SUPABASE_SERVICE_ROLE_KEY"),
  }).SUPABASE_SERVICE_ROLE_KEY;
}

/** Diagnóstico sem valores: só informa se cada variável existe e é válida. */
export function describeEnvStatus(): { publicConfigured: boolean; serviceRoleConfigured: boolean } {
  const check = (fn: () => unknown) => {
    try {
      fn();
      return true;
    } catch {
      return false;
    }
  };
  return {
    publicConfigured: check(getServerPublicEnv),
    serviceRoleConfigured: check(getServiceRoleKey),
  };
}
