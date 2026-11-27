import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { isAuthError } from "@/features/auth/error-codes";
import { cn } from "@/lib/utils";
import {
  createDraftVersionFn,
  getAgentVersionFn,
  listAgentVersionsFn,
} from "../../functions/versions";
import { VERSIONS_KEY, versionKey } from "./queries";
import { VersionEditor } from "./version-editor";
import { formatVersionDate } from "./format-date";
import { VersionStatusBadge } from "./version-status-badge";

export function PersonaTab({ canPublish }: { canPublish: boolean }) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [dirty, setDirty] = useState(false);

  const list = useQuery({ queryKey: VERSIONS_KEY, queryFn: () => listAgentVersionsFn() });
  const versions = list.data ?? [];
  const activeVersion = versions.find((v) => v.status === "active") ?? null;
  const currentId =
    (versions.some((v) => v.id === selectedId) ? selectedId : null) ??
    activeVersion?.id ??
    versions[0]?.id ??
    null;

  const detail = useQuery({
    queryKey: versionKey(currentId ?? 0),
    queryFn: () => getAgentVersionFn({ data: { id: currentId ?? 0 } }),
    enabled: currentId !== null,
  });

  const create = useMutation({
    mutationFn: () => createDraftVersionFn({ data: {} }),
    onSuccess: (result) => {
      if (!result.ok) return toast.error(result.message);
      queryClient.setQueryData(versionKey(result.version.id), result.version);
      void queryClient.invalidateQueries({ queryKey: VERSIONS_KEY });
      setSelectedId(result.version.id);
      toast.success("Rascunho criado.");
    },
    onError: (error) => {
      if (!isAuthError(error)) toast.error("Falha de comunicação com o servidor. Tente de novo.");
    },
  });

  const select = (id: number | null) => {
    if (id === currentId) return;
    if (dirty && !window.confirm("Descartar as alterações não salvas deste rascunho?")) return;
    setSelectedId(id);
  };
  const handleDirtyChange = useCallback((value: boolean) => setDirty(value), []);

  if (list.isPending) {
    return (
      <div role="status" aria-label="Carregando versões" className="space-y-3">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (list.isError) {
    return (
      <div role="alert" className="space-y-3 rounded-md border border-border p-6">
        <p className="text-sm">Não foi possível carregar as versões do agente.</p>
        <Button variant="outline" onClick={() => void list.refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="mx-auto max-w-xl space-y-4 rounded-md border border-dashed border-border p-8 text-center">
        <h2 className="font-serif text-2xl">Nenhuma versão ainda</h2>
        <p className="text-sm text-muted-foreground">
          Comece por um rascunho com um texto inicial de persona. Você ajusta o tom e testa no chat
          antes de publicar.
        </p>
        <Button onClick={() => create.mutate()} disabled={create.isPending}>
          {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
          Criar primeira versão
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <nav aria-label="Histórico de versões" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-medium">Histórico</h2>
          <Button
            size="sm"
            variant="outline"
            onClick={() => create.mutate()}
            disabled={create.isPending}
          >
            {create.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
            Novo rascunho
          </Button>
        </div>
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.id}>
              <button
                type="button"
                onClick={() => select(v.id)}
                aria-current={v.id === currentId ? "true" : undefined}
                className={cn(
                  "min-h-11 w-full rounded-md border border-border px-3 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  v.id === currentId && "border-foreground/40 bg-muted/60",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Versão {v.version}</span>
                  <VersionStatusBadge status={v.status} />
                </span>
                {v.label && <span className="mt-1 block truncate text-xs">{v.label}</span>}
                <span className="mt-1 block text-xs text-muted-foreground">
                  {v.publishedAt
                    ? `Publicada ${formatVersionDate(v.publishedAt)}${v.publishedByName ? ` por ${v.publishedByName}` : ""}`
                    : `Criada ${formatVersionDate(v.createdAt)}${v.createdByName ? ` por ${v.createdByName}` : ""}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="min-w-0">
        {detail.isPending && (
          <div role="status" aria-label="Carregando versão" className="space-y-3">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-96 w-full" />
          </div>
        )}
        {detail.isError && (
          <div role="alert" className="space-y-3 rounded-md border border-border p-6">
            <p className="text-sm">Não foi possível carregar esta versão.</p>
            <Button variant="outline" onClick={() => void detail.refetch()}>
              Tentar de novo
            </Button>
          </div>
        )}
        {detail.data && (
          <VersionEditor
            key={detail.data.id}
            version={detail.data}
            activeVersion={activeVersion?.version ?? null}
            canPublish={canPublish}
            onSelect={setSelectedId}
            onDirtyChange={handleDirtyChange}
          />
        )}
      </div>
    </div>
  );
}
