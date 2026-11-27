import { z } from "zod";
import { CHAT_MODEL_IDS } from "@/integrations/ai/models";

export const MAX_PERSONA_CHARS = 12_000;
export const MAX_TYPE_GUIDE_CHARS = 4_000;
export const MAX_LABEL_CHARS = 80;
export const MIN_OUTPUT_TOKENS = 100;
export const MAX_OUTPUT_TOKENS = 4_000;

const TYPE_KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export const versionIdSchema = z.object({ id: z.number().int().positive() });

export const createDraftSchema = z.object({
  fromVersionId: z.number().int().positive().optional(),
});

export const updateDraftSchema = z.object({
  id: z.number().int().positive(),
  label: z
    .string()
    .trim()
    .max(MAX_LABEL_CHARS)
    .transform((value) => value || null)
    .nullable(),
  persona: z.string().trim().min(1).max(MAX_PERSONA_CHARS),
  typeGuides: z
    .record(z.enum(TYPE_KEYS), z.string().trim().max(MAX_TYPE_GUIDE_CHARS))
    .transform((guides) => Object.fromEntries(Object.entries(guides).filter(([, text]) => text))),
  model: z.enum(CHAT_MODEL_IDS),
  maxOutputTokens: z.number().int().min(MIN_OUTPUT_TOKENS).max(MAX_OUTPUT_TOKENS),
  knowledgeEnabled: z.boolean(),
});
export type UpdateDraftInput = z.input<typeof updateDraftSchema>;
