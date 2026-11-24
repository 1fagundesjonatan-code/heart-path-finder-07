import { z } from "zod";

const publicEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

export type SupabasePublicEnv = z.infer<typeof publicEnvSchema>;

export class MissingEnvError extends Error {
  readonly missing: string[];

  constructor(missing: string[]) {
    super(
      `Variáveis de ambiente ausentes ou inválidas: ${missing.join(", ")}. ` +
        "Copie .env.example para .env e preencha os valores do projeto Supabase.",
    );
    this.name = "MissingEnvError";
    this.missing = missing;
  }
}

export function parseEnv<T extends z.ZodTypeAny>(schema: T, source: Record<string, unknown>) {
  const result = schema.safeParse(source);
  if (!result.success) {
    throw new MissingEnvError([...new Set(result.error.issues.map((i) => String(i.path[0])))]);
  }
  return result.data as z.infer<T>;
}

/** Lê as variáveis públicas (URL e publishable key). Falha só quando chamada, nunca no import. */
export function readPublicEnv(source: Record<string, unknown>): SupabasePublicEnv {
  return parseEnv(publicEnvSchema, source);
}
