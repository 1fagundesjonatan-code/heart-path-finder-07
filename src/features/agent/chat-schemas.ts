import { z } from "zod";

export const simulatedTypeSchema = z.number().int().min(1).max(9).nullable();

export const conversationConfigSchema = z.object({
  agentVersionId: z.number().int().positive(),
  simulatedType: simulatedTypeSchema,
});

/** `config` só é lido quando a conversa ainda não existe: a configuração é imutável depois (A6). */
export const chatRequestSchema = z.object({
  id: z.string().uuid(),
  message: z.unknown(),
  config: conversationConfigSchema.optional(),
});

export const conversationIdSchema = z.object({ id: z.string().uuid() });

export const CHAT_DATA_SCHEMAS = { crisis: z.object({}) } as const;
