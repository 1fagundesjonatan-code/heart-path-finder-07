import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ConversationSummary } from "../../chat-types";

type Props = {
  conversations: ConversationSummary[] | undefined;
  isPending: boolean;
  isError: boolean;
  activeId: string;
  onRetry: () => void;
  onNew: () => void;
  onSelect: (conversation: ConversationSummary) => void;
  onDelete: (conversation: ConversationSummary) => void;
};

const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function ConversationList({
  conversations,
  isPending,
  isError,
  activeId,
  onRetry,
  onNew,
  onSelect,
  onDelete,
}: Props) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Button type="button" onClick={onNew} className="min-h-11 w-full justify-start gap-2">
        <Plus className="size-4" aria-hidden="true" />
        Nova conversa
      </Button>

      <nav aria-label="Conversas" className="min-h-0 flex-1 overflow-y-auto">
        {isPending && (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className="h-14 w-full" />
            ))}
          </div>
        )}
        {isError && (
          <div role="alert" className="space-y-2 text-sm text-muted-foreground">
            <p>Não foi possível carregar as conversas.</p>
            <Button type="button" variant="outline" size="sm" onClick={onRetry}>
              Tentar de novo
            </Button>
          </div>
        )}
        {conversations?.length === 0 && (
          <p className="px-1 text-sm text-muted-foreground">
            Nenhuma conversa ainda. Envie a primeira mensagem para começar.
          </p>
        )}
        <ul className="space-y-1">
          {conversations?.map((conversation) => (
            <li key={conversation.id} className="group relative">
              <button
                type="button"
                onClick={() => onSelect(conversation)}
                aria-current={conversation.id === activeId ? "true" : undefined}
                className={cn(
                  "min-h-14 w-full rounded-md px-3 py-2 pr-11 text-left text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  conversation.id === activeId && "bg-accent",
                )}
              >
                <span className="block truncate font-medium">
                  {conversation.title ?? "Nova conversa"}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {conversation.versionNumber
                    ? `v${conversation.versionNumber}`
                    : "versão removida"}
                  {conversation.simulatedType ? ` · tipo ${conversation.simulatedType}` : ""}
                  {" · "}
                  {dateFormat.format(new Date(conversation.lastMessageAt))}
                </span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-11 -translate-y-1/2 opacity-70 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                aria-label={`Excluir conversa ${conversation.title ?? "sem título"}`}
                onClick={() => onDelete(conversation)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
