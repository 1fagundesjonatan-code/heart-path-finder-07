import { createServiceRoleClient } from "@/integrations/supabase/admin-client.server";
import type { TablesInsert } from "@/integrations/supabase/types";

export type AiUsageRecord = Omit<TablesInsert<"ai_usage">, "id" | "at">;

/**
 * Registra uso de IA (tokens e metadados, nunca conteúdo). Usa service role porque a tabela
 * não tem policy de escrita para usuários (ADR 0008, caso nomeado). Falha de registro não deve
 * derrubar a resposta ao usuário: é logada com código e engolida de propósito, só aqui.
 */
export async function recordUsage(record: AiUsageRecord): Promise<void> {
  const { error } = await createServiceRoleClient().from("ai_usage").insert(record);
  if (error) {
    console.error("recordUsage: falha ao gravar uso de IA", {
      code: error.code,
      feature: record.feature,
      status: record.status,
    });
  }
}
