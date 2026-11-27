import { createServerFn } from "@tanstack/react-start";
import { requireRole } from "@/features/auth/functions/require-role";
import { conversationIdSchema } from "../chat-schemas";
import type { ChatVersionOption, ConversationDetail, ConversationSummary } from "../chat-types";

const STAFF = ["admin", "collaborator"] as const;
const LIST_LIMIT = 50;
const COLUMNS =
  "id, title, agent_version_id, simulated_type, last_message_at, ai_agent_versions(version)";

type ConversationRow = {
  id: string;
  title: string | null;
  agent_version_id: number;
  simulated_type: number | null;
  last_message_at: string;
  ai_agent_versions: { version: number } | null;
};

function toSummary(row: ConversationRow): ConversationSummary {
  return {
    id: row.id,
    title: row.title,
    agentVersionId: row.agent_version_id,
    versionNumber: row.ai_agent_versions?.version ?? null,
    simulatedType: row.simulated_type,
    lastMessageAt: row.last_message_at,
  };
}

function fail(scope: string, error: { code?: string }, message: string): never {
  console.error(`${scope}: falha`, { code: error.code });
  throw new Error(message, { cause: error });
}

/** Versões que o playground pode testar (rascunhos, ativa e arquivadas). */
export const listChatVersionsFn = createServerFn({ method: "GET" })
  .middleware([requireRole(STAFF)])
  .handler(async ({ context }): Promise<ChatVersionOption[]> => {
    const { data, error } = await context.supabase
      .from("ai_agent_versions")
      .select("id, version, status, label")
      .order("version", { ascending: false })
      .limit(100);
    if (error) fail("listChatVersions", error, "Não foi possível carregar as versões.");
    return data.flatMap((row) =>
      row.status === "draft" || row.status === "active" || row.status === "archived"
        ? [{ id: row.id, version: row.version, status: row.status, label: row.label }]
        : [],
    );
  });

export const listConversationsFn = createServerFn({ method: "GET" })
  .middleware([requireRole(STAFF)])
  .handler(async ({ context }): Promise<ConversationSummary[]> => {
    const { data, error } = await context.supabase
      .from("ai_conversations")
      .select(COLUMNS)
      .eq("user_id", context.userId)
      .eq("channel", "playground")
      .order("last_message_at", { ascending: false })
      .limit(LIST_LIMIT)
      .returns<ConversationRow[]>();
    if (error) fail("listConversations", error, "Não foi possível carregar as conversas.");
    return data.map(toSummary);
  });

export const getConversationFn = createServerFn({ method: "GET" })
  .middleware([requireRole(STAFF)])
  .inputValidator((data: unknown) => conversationIdSchema.parse(data))
  .handler(async ({ data, context }): Promise<ConversationDetail> => {
    const conversation = await context.supabase
      .from("ai_conversations")
      .select(COLUMNS)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .returns<ConversationRow[]>()
      .maybeSingle();
    if (conversation.error) {
      fail("getConversation", conversation.error, "Não foi possível abrir a conversa.");
    }
    if (!conversation.data) throw new Error("Conversa não encontrada.");

    const messages = await context.supabase
      .from("ai_messages")
      .select("id, role, parts")
      .eq("conversation_id", data.id)
      .order("seq", { ascending: false })
      .limit(500);
    if (messages.error)
      fail("getConversation", messages.error, "Não foi possível abrir a conversa.");

    return {
      ...toSummary(conversation.data),
      messages: [...messages.data]
        .reverse()
        .flatMap((row) =>
          row.role === "user" || row.role === "assistant"
            ? [{ id: row.id, role: row.role, parts: row.parts }]
            : [],
        ),
    };
  });

export const deleteConversationFn = createServerFn({ method: "POST" })
  .middleware([requireRole(STAFF)])
  .inputValidator((data: unknown) => conversationIdSchema.parse(data))
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("ai_conversations")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) fail("deleteConversation", error, "Não foi possível excluir a conversa.");
    return { ok: true };
  });
