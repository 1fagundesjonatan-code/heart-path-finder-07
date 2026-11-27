/** Única fonte dos modelos de chat aceitos. Versões do agente só podem gravar ids desta lista. */
export const CHAT_MODEL_IDS = ["gpt-5.4-mini", "gpt-5.4", "gpt-5.5"] as const;
export type ChatModelId = (typeof CHAT_MODEL_IDS)[number];

export const EMBEDDING_MODEL_ID = "text-embedding-3-small";

export function isChatModelId(value: unknown): value is ChatModelId {
  return typeof value === "string" && (CHAT_MODEL_IDS as readonly string[]).includes(value);
}
