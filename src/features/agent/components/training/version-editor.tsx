import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Rocket, Save, Trash2, Undo2 } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { isAuthError } from "@/features/auth/error-codes";
import { CHAT_MODEL_IDS } from "@/integrations/ai/models";
import { buildInstructions } from "../../domain/build-instructions";
import { SAFETY_FLOOR } from "../../domain/safety-floor";
import {
  deleteDraftVersionFn,
  duplicateVersionFn,
  publishVersionFn,
  updateDraftVersionFn,
} from "../../functions/versions";
import {
  MAX_LABEL_CHARS,
  MAX_OUTPUT_TOKENS,
  MAX_PERSONA_CHARS,
  MIN_OUTPUT_TOKENS,
} from "../../schemas";
import type { AgentVersion, DeleteVersionResult, VersionActionResult } from "../../types";
import { VERSIONS_KEY, versionKey } from "./queries";
import { formatVersionDate } from "./format-date";
import { VersionStatusBadge } from "./version-status-badge";

const PREVIEW_MAX_CHARS = 32_000;

type FormState = {
  label: string;
  persona: string;
  model: string;
  maxOutputTokens: string;
  knowledgeEnabled: boolean;
};

function toForm(version: AgentVersion): FormState {
  return {
    label: version.label ?? "",
    persona: version.persona,
    model: version.model,
    maxOutputTokens: String(version.maxOutputTokens),
    knowledgeEnabled: version.knowledgeEnabled,
  };
}

type Props = {
  version: AgentVersion;
  activeVersion: number | null;
  canPublish: boolean;
  onSelect: (id: number | null) => void;
  onDirtyChange: (dirty: boolean) => void;
};

export function VersionEditor({
  version,
  activeVersion,
  canPublish,
  onSelect,
  onDirtyChange,
}: Props) {
  const queryClient = useQueryClient();
  const ids = { label: useId(), model: useId(), tokens: useId(), persona: useId(), kb: useId() };
  const isDraft = version.status === "draft";
  const [form, setForm] = useState<FormState>(() => toForm(version));
  const [confirm, setConfirm] = useState<"publish" | "delete" | null>(null);

  const saved = useMemo(() => toForm(version), [version]);
  const isDirty = isDraft && JSON.stringify(form) !== JSON.stringify(saved);
  useEffect(() => onDirtyChange(isDirty), [isDirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  const tokens = Number(form.maxOutputTokens);
  const tokensValid =
    Number.isInteger(tokens) && tokens >= MIN_OUTPUT_TOKENS && tokens <= MAX_OUTPUT_TOKENS;
  const personaValid = form.persona.trim().length > 0 && form.persona.length <= MAX_PERSONA_CHARS;
  const canSave = isDirty && tokensValid && personaValid;

  const preview = useMemo(
    () =>
      buildInstructions({
        version: { persona: form.persona, typeGuides: version.typeGuides },
        enneagramType: null,
        examples: [],
        knowledgeAvailable: form.knowledgeEnabled,
        crisis: false,
        maxChars: PREVIEW_MAX_CHARS,
      }),
    [form.persona, form.knowledgeEnabled, version.typeGuides],
  );

  const handleError = (error: unknown) => {
    if (!isAuthError(error)) toast.error("Falha de comunicação com o servidor. Tente de novo.");
  };
  const applyResult = (result: VersionActionResult, message: string, after?: () => void) => {
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    queryClient.setQueryData(versionKey(result.version.id), result.version);
    void queryClient.invalidateQueries({ queryKey: VERSIONS_KEY });
    toast.success(message);
    after?.();
  };

  const save = useMutation({
    mutationFn: () =>
      updateDraftVersionFn({
        data: {
          id: version.id,
          label: form.label,
          persona: form.persona,
          typeGuides: version.typeGuides,
          model: form.model,
          maxOutputTokens: tokens,
          knowledgeEnabled: form.knowledgeEnabled,
        },
      }),
    onSuccess: (result) => applyResult(result, "Rascunho salvo."),
    onError: handleError,
  });
  const duplicate = useMutation({
    mutationFn: () => duplicateVersionFn({ data: { id: version.id } }),
    onSuccess: (result) =>
      applyResult(result, "Rascunho criado.", () => result.ok && onSelect(result.version.id)),
    onError: handleError,
  });
  const publish = useMutation({
    mutationFn: () => publishVersionFn({ data: { id: version.id } }),
    onSuccess: (result) =>
      applyResult(result, isDraft ? "Versão publicada." : "Versão restaurada como ativa."),
    onError: handleError,
    onSettled: () => setConfirm(null),
  });
  const remove = useMutation({
    mutationFn: () => deleteDraftVersionFn({ data: { id: version.id } }),
    onSuccess: (result: DeleteVersionResult) => {
      if (!result.ok) return toast.error(result.message);
      void queryClient.invalidateQueries({ queryKey: VERSIONS_KEY });
      toast.success("Rascunho apagado.");
      onSelect(null);
    },
    onError: handleError,
    onSettled: () => setConfirm(null),
  });

  const busy = save.isPending || duplicate.isPending || publish.isPending || remove.isPending;
  const publishVerb = isDraft ? "Publicar" : "Reverter para esta versão";

  return (
    <section aria-labelledby={`${ids.label}-title`} className="min-w-0 space-y-6">
      <header className="flex flex-wrap items-center gap-3">
        <h2 id={`${ids.label}-title`} className="font-serif text-2xl">
          Versão {version.version}
        </h2>
        <VersionStatusBadge status={version.status} />
        {version.publishedAt && (
          <span className="text-xs text-muted-foreground">
            Publicada em {formatVersionDate(version.publishedAt)}
            {version.publishedByName ? ` por ${version.publishedByName}` : ""}
          </span>
        )}
      </header>

      {!isDraft && (
        <p className="rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Versões ativas e arquivadas não podem ser editadas. Duplique como rascunho para alterar.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={ids.label}>Nome da versão (opcional)</Label>
          <Input
            id={ids.label}
            value={form.label}
            maxLength={MAX_LABEL_CHARS}
            disabled={!isDraft}
            placeholder="Ex.: Tom mais acolhedor"
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={ids.model}>Modelo</Label>
          <Select
            value={form.model}
            disabled={!isDraft}
            onValueChange={(model) => setForm({ ...form, model })}
          >
            <SelectTrigger id={ids.model}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CHAT_MODEL_IDS.map((id) => (
                <SelectItem key={id} value={id}>
                  {id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor={ids.tokens}>Máximo de tokens na resposta</Label>
          <Input
            id={ids.tokens}
            type="number"
            inputMode="numeric"
            min={MIN_OUTPUT_TOKENS}
            max={MAX_OUTPUT_TOKENS}
            value={form.maxOutputTokens}
            disabled={!isDraft}
            aria-invalid={!tokensValid}
            aria-describedby={`${ids.tokens}-hint`}
            onChange={(e) => setForm({ ...form, maxOutputTokens: e.target.value })}
          />
          <p
            id={`${ids.tokens}-hint`}
            role={tokensValid ? undefined : "alert"}
            className={tokensValid ? "text-xs text-muted-foreground" : "text-xs text-destructive"}
          >
            Entre {MIN_OUTPUT_TOKENS} e {MAX_OUTPUT_TOKENS}.
          </p>
        </div>
        <div className="flex items-center gap-3 md:col-span-2">
          <Switch
            id={ids.kb}
            checked={form.knowledgeEnabled}
            disabled={!isDraft}
            onCheckedChange={(knowledgeEnabled) => setForm({ ...form, knowledgeEnabled })}
          />
          <Label htmlFor={ids.kb}>Usar a base de conhecimento nas respostas</Label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${ids.persona}-floor`}>Piso de segurança (fixo, não editável)</Label>
        <Textarea
          id={`${ids.persona}-floor`}
          readOnly
          value={SAFETY_FLOOR}
          rows={6}
          className="resize-none bg-muted/40 text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">
          Vem sempre antes da persona e vale acima dela. Mudanças só pelo código.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={ids.persona}>Persona</Label>
        <Textarea
          id={ids.persona}
          value={form.persona}
          readOnly={!isDraft}
          rows={14}
          aria-invalid={!personaValid}
          aria-describedby={`${ids.persona}-count`}
          className="min-h-72 font-mono text-sm"
          onChange={(e) => setForm({ ...form, persona: e.target.value })}
        />
        <p
          id={`${ids.persona}-count`}
          className={personaValid ? "text-xs text-muted-foreground" : "text-xs text-destructive"}
          aria-live="polite"
        >
          {form.persona.length.toLocaleString("pt-BR")} /{" "}
          {MAX_PERSONA_CHARS.toLocaleString("pt-BR")} caracteres
          {form.persona.trim().length === 0 && " (a persona não pode ficar vazia)"}
        </p>
      </div>

      <details className="rounded-md border border-border">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
          Prévia do prompt montado (sem tipo, sem exemplos)
        </summary>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap border-t border-border px-4 py-3 text-xs leading-relaxed">
          {preview}
        </pre>
      </details>

      <div className="flex flex-wrap items-center gap-3">
        {isDraft && (
          <Button onClick={() => save.mutate()} disabled={!canSave || busy}>
            {save.isPending ? <Loader2 className="animate-spin" /> : <Save />}
            Salvar rascunho
          </Button>
        )}
        <Button variant="outline" onClick={() => duplicate.mutate()} disabled={busy}>
          <Copy />
          Duplicar como rascunho
        </Button>
        {canPublish && version.status !== "active" && (
          <Button
            variant={isDraft ? "default" : "outline"}
            onClick={() => setConfirm("publish")}
            disabled={busy || isDirty}
            title={isDirty ? "Salve o rascunho antes de publicar" : undefined}
          >
            {isDraft ? <Rocket /> : <Undo2 />}
            {publishVerb}
          </Button>
        )}
        {canPublish && isDraft && (
          <Button variant="ghost" onClick={() => setConfirm("delete")} disabled={busy}>
            <Trash2 />
            Apagar rascunho
          </Button>
        )}
        {isDirty && <span className="text-xs text-muted-foreground">Alterações não salvas</span>}
        {!canPublish && version.status !== "active" && (
          <span className="text-xs text-muted-foreground">
            Só administradores publicam ou revertem versões.
          </span>
        )}
      </div>

      <AlertDialog open={confirm === "publish"} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isDraft
                ? `Publicar a versão ${version.version}?`
                : `Reverter para a versão ${version.version}?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activeVersion === null
                ? "Ela passa a ser a versão ativa do agente."
                : `Ela passa a ser a versão ativa e a versão ${activeVersion} será arquivada.`}{" "}
              {isDraft && "Depois de publicada, ela não pode mais ser editada."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => publish.mutate()}>
              {publish.isPending ? "Publicando..." : isDraft ? "Publicar" : "Reverter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirm === "delete"} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apagar o rascunho da versão {version.version}?</AlertDialogTitle>
            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => remove.mutate()}>Apagar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
