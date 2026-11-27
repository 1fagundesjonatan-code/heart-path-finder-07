import { createOpenAI } from "@ai-sdk/openai";
import { getAiEnv } from "./env.server";
import { EMBEDDING_MODEL_ID, type ChatModelId } from "./models";

function getProvider() {
  return createOpenAI({ apiKey: getAiEnv().OPENAI_API_KEY });
}

export function chatModel(id: ChatModelId) {
  return getProvider()(id);
}

export function embeddingModel() {
  return getProvider().embedding(EMBEDDING_MODEL_ID);
}
