import { z } from "zod";
import { parseEnv } from "@/integrations/supabase/env";
import { readRaw } from "@/integrations/supabase/env.server";
import { CHAT_MODEL_IDS } from "./models";

const aiEnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(20),
  AI_DEFAULT_CHAT_MODEL: z.enum(CHAT_MODEL_IDS).default("gpt-5.4-mini"),
  AI_DAILY_MESSAGE_LIMIT: z.coerce.number().int().positive().default(50),
});

export type AiEnv = z.infer<typeof aiEnvSchema>;

/** Lê e valida as variáveis de IA. Falha só quando chamada, nunca no import. */
export function getAiEnv(): AiEnv {
  return parseEnv(aiEnvSchema, {
    OPENAI_API_KEY: readRaw("OPENAI_API_KEY"),
    AI_DEFAULT_CHAT_MODEL: readRaw("AI_DEFAULT_CHAT_MODEL"),
    AI_DAILY_MESSAGE_LIMIT: readRaw("AI_DAILY_MESSAGE_LIMIT"),
  });
}
