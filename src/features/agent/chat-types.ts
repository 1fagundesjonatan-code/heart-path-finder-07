import type { UIMessage } from "ai";
import type { Json } from "@/integrations/supabase/types";

export type ChatUIMessage = UIMessage<undefined, { crisis: Record<string, never> }>;

export type ChatVersionOption = {
  id: number;
  version: number;
  status: "draft" | "active" | "archived";
  label: string | null;
};

export type ConversationSummary = {
  id: string;
  title: string | null;
  agentVersionId: number;
  versionNumber: number | null;
  simulatedType: number | null;
  lastMessageAt: string;
};

/** Formato de transporte: `parts` é o jsonb salvo em ai_messages (UIMessage parts). */
export type StoredChatMessage = {
  id: string;
  role: "user" | "assistant";
  parts: NonNullable<Json>;
};

export type ConversationDetail = ConversationSummary & { messages: StoredChatMessage[] };

export function toChatMessages(stored: readonly StoredChatMessage[]): ChatUIMessage[] {
  return stored.map((message) => ({ ...message }) as unknown as ChatUIMessage);
}
