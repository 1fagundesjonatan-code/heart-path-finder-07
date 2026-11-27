import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Loader2, SendHorizontal, Square, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { ChatUIMessage, ChatVersionOption } from "../../chat-types";
import { MAX_USER_MESSAGE_CHARS } from "../../domain/chat-input";
import { ChatControls } from "./chat-controls";
import { MessageBubble } from "./message-bubble";

export type ChatConfig = { versionId: number; simulatedType: number | null };

const STARTERS = [
  "Quero entender meu tipo",
  "Estou ansioso hoje",
  "Como lidar com crítica?",
] as const;

type Props = {
  conversationId: string;
  config: ChatConfig;
  versions: ChatVersionOption[];
  initialMessages: ChatUIMessage[];
  onConfigChange: (config: ChatConfig) => void;
  onResponseSaved: () => void;
};

export function ChatPanel({
  conversationId,
  config,
  versions,
  initialMessages,
  onConfigChange,
  onResponseSaved,
}: Props) {
  const [input, setInput] = useState("");
  const [pendingConfig, setPendingConfig] = useState<ChatConfig | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const transport = useMemo(
    () =>
      new DefaultChatTransport<ChatUIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, id }) => ({
          body: {
            id,
            message: messages.at(-1),
            config: { agentVersionId: config.versionId, simulatedType: config.simulatedType },
          },
        }),
      }),
    [config.versionId, config.simulatedType],
  );

  const { messages, sendMessage, status, error, stop, regenerate } = useChat<ChatUIMessage>({
    id: conversationId,
    messages: initialMessages,
    transport,
    onFinish: onResponseSaved,
  });

  const isBusy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages, status]);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    void sendMessage({ text: trimmed });
  };

  const requestConfigChange = (next: ChatConfig) => {
    if (messages.length === 0) onConfigChange(next);
    else setPendingConfig(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(input);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="space-y-3 border-b border-border p-4">
        <p
          role="note"
          className="flex items-start gap-2 rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground"
        >
          <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          Ambiente de teste da equipe. Não digite dados reais de clientes. O agente não faz
          diagnóstico.
        </p>
        <ChatControls
          versions={versions}
          versionId={config.versionId}
          simulatedType={config.simulatedType}
          onVersionChange={(versionId) => requestConfigChange({ ...config, versionId })}
          onTypeChange={(simulatedType) => requestConfigChange({ ...config, simulatedType })}
        />
      </div>

      <div
        role="log"
        aria-live="polite"
        aria-relevant="additions text"
        aria-label="Mensagens da conversa"
        className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
      >
        {messages.length === 0 && (
          <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-10 text-center">
            <h2 className="font-serif text-xl">Converse com o agente</h2>
            <p className="text-sm text-muted-foreground">
              Escolha a versão e o tipo acima e envie uma mensagem, ou comece por um atalho.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTERS.map((starter) => (
                <Button
                  key={starter}
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => submit(starter)}
                >
                  {starter}
                </Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {status === "submitted" && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />O agente está pensando...
          </p>
        )}

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm"
          >
            <span className="min-w-0 flex-1">
              {error.message.length > 0 && error.message.length < 200
                ? error.message
                : "Não foi possível obter a resposta."}
            </span>
            <Button type="button" variant="outline" size="sm" onClick={() => void regenerate()}>
              Tentar de novo
            </Button>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        className="space-y-1 border-t border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(input);
        }}
      >
        <label htmlFor="chat-input" className="sr-only">
          Mensagem para o agente
        </label>
        <div className="flex items-end gap-2">
          <Textarea
            id="chat-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={MAX_USER_MESSAGE_CHARS}
            rows={2}
            placeholder="Escreva uma mensagem. Enter envia, Shift+Enter quebra a linha."
            disabled={isBusy}
            className="max-h-40 min-h-11 resize-none"
          />
          {isBusy ? (
            <Button
              type="button"
              variant="outline"
              className="size-11 shrink-0"
              onClick={() => void stop()}
              aria-label="Parar resposta"
            >
              <Square className="size-4" aria-hidden="true" />
            </Button>
          ) : (
            <Button
              type="submit"
              className="size-11 shrink-0"
              disabled={!input.trim()}
              aria-label="Enviar mensagem"
            >
              <SendHorizontal className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
        <p className="text-right text-xs tabular-nums text-muted-foreground">
          {input.length}/{MAX_USER_MESSAGE_CHARS}
        </p>
      </form>

      <AlertDialog
        open={pendingConfig !== null}
        onOpenChange={(open) => !open && setPendingConfig(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Iniciar uma nova conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              Trocar a versão ou o tipo simulado inicia uma nova conversa, para os resultados
              continuarem comparáveis. Esta conversa fica salva na lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar aqui</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingConfig) onConfigChange(pendingConfig);
                setPendingConfig(null);
              }}
            >
              Nova conversa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
