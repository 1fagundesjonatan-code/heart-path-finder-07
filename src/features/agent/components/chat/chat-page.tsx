import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { History } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { queryRetry } from "@/features/auth/error-codes";
import { toChatMessages, type ChatVersionOption, type ConversationSummary } from "../../chat-types";
import {
  deleteConversationFn,
  getConversationFn,
  listChatVersionsFn,
  listConversationsFn,
} from "../../functions/conversations-fns";
import { ChatPanel, type ChatConfig } from "./chat-panel";
import { ConversationList } from "./conversation-list";

const CONVERSATIONS_KEY = ["admin", "agent", "conversations"] as const;
const VERSIONS_KEY = ["admin", "agent", "chat-versions"] as const;

type Selected = { id: string; source: "draft" | "saved"; config: ChatConfig };

function defaultVersion(versions: ChatVersionOption[]): ChatVersionOption | undefined {
  return versions.find((v) => v.status === "active") ?? versions[0];
}

export function ChatPage() {
  const queryClient = useQueryClient();
  const [initialDraftId] = useState(() => crypto.randomUUID());
  const [selected, setSelected] = useState<Selected | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ConversationSummary | null>(null);

  const versions = useQuery({
    queryKey: VERSIONS_KEY,
    queryFn: () => listChatVersionsFn(),
    retry: queryRetry,
  });
  const conversations = useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: () => listConversationsFn(),
    retry: queryRetry,
  });

  const fallback = versions.data ? defaultVersion(versions.data) : undefined;
  const current: Selected | null =
    selected ??
    (fallback
      ? {
          id: initialDraftId,
          source: "draft",
          config: { versionId: fallback.id, simulatedType: null },
        }
      : null);

  const detail = useQuery({
    queryKey: ["admin", "agent", "conversation", current?.id],
    queryFn: () => getConversationFn({ data: { id: current?.id ?? "" } }),
    enabled: current?.source === "saved",
    gcTime: 0,
    retry: queryRetry,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteConversationFn({ data: { id } }),
    onSuccess: (_result, id) => {
      toast.success("Conversa excluída.");
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
      if (current?.id === id && current.config) startDraft(current.config);
    },
    onError: () => toast.error("Não foi possível excluir a conversa."),
  });

  const startDraft = (config: ChatConfig) => {
    setSelected({ id: crypto.randomUUID(), source: "draft", config });
    setDrawerOpen(false);
  };

  const selectConversation = (conversation: ConversationSummary) => {
    setSelected({
      id: conversation.id,
      source: "saved",
      config: {
        versionId: conversation.agentVersionId,
        simulatedType: conversation.simulatedType,
      },
    });
    setDrawerOpen(false);
  };

  const list = (
    <ConversationList
      conversations={conversations.data}
      isPending={conversations.isPending}
      isError={conversations.isError}
      activeId={current?.id ?? ""}
      onRetry={() => void conversations.refetch()}
      onNew={() => current && startDraft(current.config)}
      onSelect={selectConversation}
      onDelete={setPendingDelete}
    />
  );

  return (
    <div className="flex h-full min-h-[32rem]">
      <aside className="hidden w-72 shrink-0 border-r border-border p-3 md:block">{list}</aside>

      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-80 max-w-[90vw]">
          <SheetHeader>
            <SheetTitle>Conversas</SheetTitle>
            <SheetDescription>Suas conversas de teste com o agente.</SheetDescription>
          </SheetHeader>
          <div className="mt-4 h-[calc(100%-5rem)]">{list}</div>
        </SheetContent>
      </Sheet>

      <section aria-label="Chat com o agente" className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 md:hidden">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 gap-2"
            onClick={() => setDrawerOpen(true)}
          >
            <History className="size-4" aria-hidden="true" />
            Conversas
          </Button>
        </div>

        {versions.isPending && <PanelSkeleton />}
        {versions.isError && (
          <PanelMessage
            title="Não foi possível carregar as versões do agente."
            action={
              <Button type="button" variant="outline" onClick={() => void versions.refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}
        {versions.data?.length === 0 && (
          <PanelMessage
            title="Nenhuma versão do agente ainda."
            description="Crie um rascunho de persona para poder testar o agente aqui."
            action={
              <Button asChild>
                <Link to="/admin/$modulo" params={{ modulo: "the-self-ai" }}>
                  Ir para o treinamento
                </Link>
              </Button>
            }
          />
        )}

        {versions.data && current && current.source === "saved" && detail.isPending && (
          <PanelSkeleton />
        )}
        {versions.data && current && current.source === "saved" && detail.isError && (
          <PanelMessage
            title="Não foi possível abrir a conversa."
            action={
              <Button type="button" variant="outline" onClick={() => void detail.refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}
        {versions.data &&
          versions.data.length > 0 &&
          current &&
          (current.source === "draft" || detail.data) && (
            <ChatPanel
              key={current.id}
              conversationId={current.id}
              config={current.config}
              versions={versions.data}
              initialMessages={detail.data ? toChatMessages(detail.data.messages) : []}
              onConfigChange={startDraft}
              onResponseSaved={() =>
                void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY })
              }
            />
          )}
      </section>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta conversa?</AlertDialogTitle>
            <AlertDialogDescription>
              As mensagens desta conversa de teste serão apagadas. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingDelete) deleteMutation.mutate(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PanelSkeleton() {
  return (
    <div className="space-y-4 p-4" aria-busy="true" aria-label="Carregando">
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-11 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

function PanelMessage({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-3 p-6 text-center"
    >
      <h2 className="font-serif text-xl">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}
