import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export const CLIENTS_PAGE_SIZE = 25;

export const CRM_STAGES = [
  "visitor",
  "lead_captured",
  "lead_qualified",
  "signup_started",
  "signup_completed",
  "test_started",
  "test_completed",
  "result_viewed",
  "subscription_started",
  "active_customer",
  "recurring_customer",
  "churned",
  "reactivated",
] as const satisfies readonly Database["public"]["Enums"]["crm_stage"][];

export const CONSENT_TYPES = [
  "terms",
  "privacy",
  "marketing",
  "ai_memory",
  "enneagram_profile_share",
] as const satisfies readonly Database["public"]["Enums"]["consent_type"][];

export const listClientsInputSchema = z.object({
  search: z.string().max(100).optional(),
  after: z.number().int().positive().optional(),
});
export type ListClientsInput = z.infer<typeof listClientsInputSchema>;

export const clientDetailInputSchema = z.object({ userId: z.string().uuid() });

const stageSchema = z.enum(CRM_STAGES);

export const clientRowSchema = z.object({
  contact_id: z.number(),
  user_id: z.string().uuid(),
  full_name: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  stage: stageSchema,
  created_at: z.string(),
  primary_type: z.string().nullable(),
  assessment_completed_at: z.string().nullable(),
});
export type ClientRow = z.infer<typeof clientRowSchema>;

export type ClientsPage = { items: ClientRow[]; nextCursor: number | null };

export const clientDetailSchema = z.object({
  contact: z.object({
    id: z.number(),
    user_id: z.string().uuid(),
    full_name: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    stage: stageSchema,
    notes: z.string().nullable(),
    created_at: z.string(),
    last_interaction_at: z.string().nullable(),
  }),
  enneagram_shared: z.boolean(),
  enneagram: z
    .object({
      primary_type: z.string(),
      scoring_version: z.string().nullable(),
      completed_at: z.string().nullable(),
    })
    .nullable(),
  consents: z.array(
    z.object({
      consent_type: z.enum(CONSENT_TYPES),
      granted: z.boolean(),
      document_version: z.string(),
      at: z.string(),
    }),
  ),
  activity: z.array(z.object({ event_name: z.string(), occurred_at: z.string() })),
  ai: z
    .object({
      conversations: z.number(),
      messages: z.number(),
      input_tokens: z.number(),
      output_tokens: z.number(),
      last_activity_at: z.string().nullable(),
    })
    .nullable(),
});
export type ClientDetail = z.infer<typeof clientDetailSchema>;
