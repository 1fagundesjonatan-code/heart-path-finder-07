import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ChatUIMessage } from "../../chat-types";
import { extractMessageText } from "../../domain/chat-input";
import { MarkdownText } from "./markdown-text";

type Props = { message: ChatUIMessage };

export function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const text = extractMessageText(message.parts);
  const crisis = message.parts.some((part) => part.type === "data-crisis");

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] space-y-2 rounded-2xl px-4 py-3 text-sm leading-relaxed md:max-w-[75%]",
          isUser ? "bg-primary text-primary-foreground" : "border border-border bg-card",
        )}
      >
        <span className="sr-only">{isUser ? "Você disse:" : "O agente respondeu:"}</span>
        {crisis && (
          <Badge variant="destructive" className="gap-1">
            <ShieldAlert className="size-3" aria-hidden="true" />
            Protocolo de crise acionado
          </Badge>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{text}</p>
        ) : (
          <MarkdownText text={text} />
        )}
      </div>
    </div>
  );
}
