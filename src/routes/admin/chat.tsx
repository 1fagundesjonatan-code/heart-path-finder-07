import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/features/agent/components/chat/chat-page";

export const Route = createFileRoute("/admin/chat")({
  head: () => ({ meta: [{ title: "Chat com o agente | THE SELF MAP" }] }),
  component: ChatPage,
});
