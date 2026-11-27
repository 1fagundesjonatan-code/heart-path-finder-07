import { createFileRoute } from "@tanstack/react-router";
import { handleChatRequest } from "@/features/agent/chat-handler.server";
import { authorizeRequest } from "@/features/auth/functions/authorize-request.server";

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await authorizeRequest(["admin", "collaborator"]);
        if (!auth.ok) return auth.response;
        return handleChatRequest(request, auth);
      },
    },
  },
});
