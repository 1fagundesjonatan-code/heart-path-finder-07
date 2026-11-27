import type { SupabaseClient } from "@supabase/supabase-js";
import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  validateUIMessages,
} from "ai";
import { z } from "zod";
import { getAiEnv } from "@/integrations/ai/env.server";
import { isChatModelId } from "@/integrations/ai/models";
import { chatModel } from "@/integrations/ai/provider.server";
import { recordUsage, type AiUsageRecord } from "@/integrations/ai/usage.server";
import type { Database, Json } from "@/integrations/supabase/types";
import { CHAT_DATA_SCHEMAS, chatRequestSchema } from "./chat-schemas";
import type { ChatUIMessage } from "./chat-types";
import { buildInstructions } from "./domain/build-instructions";
import {
  buildConversationTitle,
  dailyWindowStart,
  extractMessageText,
  MAX_USER_MESSAGE_CHARS,
} from "./domain/chat-input";
import { CRISIS_RESPONSE, detectCrisisSignals } from "./domain/crisis";

const HISTORY_LIMIT = 30;
const INSTRUCTIONS_MAX_CHARS = 32_000;
const GENERIC_ERROR = "Não foi possível gerar a resposta agora. Tente de novo em instantes.";

const generateMessageId = createIdGenerator({ prefix: "msg", size: 16 });
const typeGuidesSchema = z.record(z.string(), z.string());

export type ChatAuth = { supabase: SupabaseClient<Database>; userId: string };
type ChatConfig = z.infer<typeof chatRequestSchema>["config"];

const reply = (message: string, status: number) => new Response(message, { status });

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  const host =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    new URL(request.url).host;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

async function parseUserMessage(raw: unknown): Promise<ChatUIMessage | string> {
  const validated = await validateUIMessages<ChatUIMessage>({
    messages: [raw],
    dataSchemas: CHAT_DATA_SCHEMAS,
  }).catch(() => null);
  const message = validated?.[0];
  if (!message || message.role !== "user" || message.parts.some((p) => p.type !== "text")) {
    return "Mensagem inválida.";
  }
  const text = extractMessageText(message.parts);
  if (!text.trim()) return "Escreva uma mensagem.";
  if (text.length > MAX_USER_MESSAGE_CHARS) {
    return `A mensagem passa de ${MAX_USER_MESSAGE_CHARS} caracteres. Encurte e envie de novo.`;
  }
  return message;
}

type ConversationRow = {
  id: string;
  title: string | null;
  agent_version_id: number;
  simulated_type: number | null;
};

const CONVERSATION_COLUMNS = "id, title, agent_version_id, simulated_type";

async function loadOrCreateConversation(
  { supabase, userId }: ChatAuth,
  id: string,
  config: ChatConfig,
): Promise<ConversationRow | null> {
  const existing = await supabase
    .from("ai_conversations")
    .select(CONVERSATION_COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("channel", "playground")
    .maybeSingle();
  if (existing.error) {
    console.error("chat: falha ao carregar conversa", { code: existing.error.code });
    return null;
  }
  if (existing.data || !config) return existing.data;

  const created = await supabase
    .from("ai_conversations")
    .insert({
      id,
      user_id: userId,
      channel: "playground",
      agent_version_id: config.agentVersionId,
      simulated_type: config.simulatedType,
    })
    .select(CONVERSATION_COLUMNS)
    .single();
  if (created.error) {
    console.error("chat: falha ao criar conversa", { code: created.error.code });
    return null;
  }
  return created.data;
}

async function loadHistory(
  supabase: ChatAuth["supabase"],
  conversationId: string,
  excludeId: string,
): Promise<ChatUIMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("id, role, parts")
    .eq("conversation_id", conversationId)
    .order("seq", { ascending: false })
    .limit(HISTORY_LIMIT - 1);
  if (error) throw new Error("Falha ao carregar o histórico.", { cause: error });
  return data
    .filter((row) => row.id !== excludeId && (row.role === "user" || row.role === "assistant"))
    .reverse()
    .map((row) => ({ id: row.id, role: row.role, parts: row.parts }) as ChatUIMessage);
}

async function saveMessage(
  supabase: ChatAuth["supabase"],
  conversationId: string,
  message: ChatUIMessage,
): Promise<void> {
  // DO NOTHING: o usuário só tem grant de update em `parts`, e mensagem salva não muda.
  const { error } = await supabase.from("ai_messages").upsert(
    {
      id: message.id,
      conversation_id: conversationId,
      role: message.role,
      parts: message.parts as unknown as NonNullable<Json>,
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
  if (error) {
    console.error("chat: falha ao salvar mensagem", { code: error.code, role: message.role });
    throw new Error("Falha ao salvar a mensagem.", { cause: error });
  }
}

async function touchConversation(
  supabase: ChatAuth["supabase"],
  conversationId: string,
  title?: string,
): Promise<void> {
  const { error } = await supabase
    .from("ai_conversations")
    .update({ last_message_at: new Date().toISOString(), ...(title ? { title } : {}) })
    .eq("id", conversationId);
  if (error) console.error("chat: falha ao atualizar conversa", { code: error.code });
}

function hasContent(message: ChatUIMessage): boolean {
  return message.parts.some((part) => part.type === "text" && part.text.trim() !== "");
}

export async function handleChatRequest(request: Request, auth: ChatAuth): Promise<Response> {
  if (!isSameOrigin(request)) return reply("Origem não permitida.", 403);

  const body = chatRequestSchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return reply("Requisição inválida.", 400);

  const userMessage = await parseUserMessage(body.data.message);
  if (typeof userMessage === "string") return reply(userMessage, 400);

  const { supabase, userId } = auth;
  const conversation = await loadOrCreateConversation(auth, body.data.id, body.data.config);
  if (!conversation) return reply("Conversa não encontrada.", 404);

  const versionResult = await supabase
    .from("ai_agent_versions")
    .select("persona, type_guides, model, max_output_tokens")
    .eq("id", conversation.agent_version_id)
    .maybeSingle();
  const version = versionResult.data;
  if (!version || !isChatModelId(version.model)) {
    return reply("Versão do agente indisponível.", 404);
  }

  const usageBase = {
    user_id: userId,
    conversation_id: conversation.id,
    agent_version_id: conversation.agent_version_id,
    feature: "chat",
    model: version.model,
  } satisfies Partial<AiUsageRecord>;

  const userText = extractMessageText(userMessage.parts);
  const isCrisis = detectCrisisSignals(userText);

  // crise sempre responde, mesmo com o limite diário estourado
  if (!isCrisis) {
    const dailyLimit = getAiEnv().AI_DAILY_MESSAGE_LIMIT;
    const used = await supabase
      .from("ai_usage")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("feature", "chat")
      .neq("status", "limit_blocked")
      .gte("at", dailyWindowStart(new Date()).toISOString());
    if (used.error) {
      console.error("chat: falha ao contar uso do dia", { code: used.error.code });
      return reply(GENERIC_ERROR, 500);
    }
    if ((used.count ?? 0) >= dailyLimit) {
      await recordUsage({ ...usageBase, status: "limit_blocked" });
      return reply(
        `Você atingiu o limite de ${dailyLimit} mensagens de hoje. Volte amanhã ou peça à equipe para ajustar o limite.`,
        429,
      );
    }
  }

  let history: ChatUIMessage[];
  try {
    history = await loadHistory(supabase, conversation.id, userMessage.id);
    await saveMessage(supabase, conversation.id, userMessage);
  } catch {
    return reply(GENERIC_ERROR, 500);
  }
  const messages = [...history, userMessage];
  await touchConversation(
    supabase,
    conversation.id,
    conversation.title ? undefined : buildConversationTitle(userText),
  );

  const persistReply = async ({ responseMessage }: { responseMessage: ChatUIMessage }) => {
    if (!hasContent(responseMessage)) return;
    try {
      await saveMessage(supabase, conversation.id, responseMessage);
      await touchConversation(supabase, conversation.id);
    } catch {
      // já logado em saveMessage: a resposta chegou ao usuário, só não ficou salva
    }
  };

  if (isCrisis) {
    const stream = createUIMessageStream<ChatUIMessage>({
      originalMessages: messages,
      generateId: generateMessageId,
      execute: ({ writer }) => {
        writer.write({ type: "start", messageId: generateMessageId() });
        writer.write({ type: "data-crisis", data: {} });
        writer.write({ type: "text-start", id: "crisis" });
        writer.write({ type: "text-delta", id: "crisis", delta: CRISIS_RESPONSE });
        writer.write({ type: "text-end", id: "crisis" });
        writer.write({ type: "finish" });
      },
      onEnd: persistReply,
    });
    await recordUsage({ ...usageBase, status: "ok", crisis_detected: true, latency_ms: 0 });
    return createUIMessageStreamResponse({ stream });
  }

  const startedAt = Date.now();
  let usageRecorded = false;
  const recordOnce = (record: Pick<AiUsageRecord, "status"> & Partial<AiUsageRecord>) => {
    if (usageRecorded) return;
    usageRecorded = true;
    void recordUsage({ ...usageBase, latency_ms: Date.now() - startedAt, ...record });
  };

  const guides = typeGuidesSchema.safeParse(version.type_guides);
  const result = streamText({
    model: chatModel(version.model),
    instructions: buildInstructions({
      version: { persona: version.persona, typeGuides: guides.success ? guides.data : {} },
      enneagramType: conversation.simulated_type,
      examples: [],
      knowledgeAvailable: false,
      crisis: false,
      maxChars: INSTRUCTIONS_MAX_CHARS,
    }),
    messages: await convertToModelMessages(messages),
    maxOutputTokens: version.max_output_tokens,
    onError: ({ error }) => {
      console.error("chat: falha do provedor", {
        name: error instanceof Error ? error.name : "unknown",
      });
      recordOnce({ status: "error", error_code: "provider_error" });
    },
    onEnd: ({ totalUsage }) =>
      recordOnce({
        status: "ok",
        input_tokens: totalUsage.inputTokens ?? 0,
        output_tokens: totalUsage.outputTokens ?? 0,
        cached_input_tokens: totalUsage.inputTokenDetails.cacheReadTokens ?? 0,
      }),
  });
  // Sem abortSignal de propósito: com a aba fechada ou o botão Parar, a resposta termina e é salva.
  void result.consumeStream();

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
      generateMessageId,
      onError: () => GENERIC_ERROR,
      onEnd: persistReply,
    }),
  });
}
