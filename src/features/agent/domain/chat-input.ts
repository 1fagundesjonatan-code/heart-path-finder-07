export const MAX_USER_MESSAGE_CHARS = 2000;
const TITLE_CHARS = 60;
const BRASILIA_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

type TextLikePart = { type: string; text?: unknown };

export function extractMessageText(parts: readonly TextLikePart[]): string {
  return parts
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text as string)
    .join("\n");
}

export function buildConversationTitle(text: string): string {
  return text.replace(/\s+/g, " ").trim().slice(0, TITLE_CHARS);
}

/** Início do dia corrente em Brasília (sem horário de verão desde 2019), em UTC. */
export function dailyWindowStart(now: Date): Date {
  const local = now.getTime() - BRASILIA_OFFSET_MS;
  return new Date(Math.floor(local / DAY_MS) * DAY_MS + BRASILIA_OFFSET_MS);
}
