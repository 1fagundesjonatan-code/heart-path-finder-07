import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { isAuthError } from "@/features/auth/error-codes";
import { setVerificationFn, updateProfessionalFn } from "../functions/professionals-fns";
import { PROFESSIONALS_KEY } from "../query-keys";
import { professionalFieldsSchema, type ProfessionalFields } from "../schemas";
import type { ActionResult, Professional, VerificationStatus } from "../types";
import { ProfessionalFormFields } from "./professional-fields";
import { VerificationBadge } from "./status-badges";

type Props = {
  professional: Professional | null;
  isAdmin: boolean;
  onClose: () => void;
};

export function ProfessionalSheet({ professional, isAdmin, onClose }: Props) {
  return (
    <Sheet open={professional !== null} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {professional && (
          <ProfessionalDetail
            key={professional.userId}
            professional={professional}
            isAdmin={isAdmin}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

function useActionToasts() {
  const queryClient = useQueryClient();
  return {
    onResult: (result: ActionResult, successMessage: string) => {
      if (result.ok) {
        toast.success(successMessage);
        void queryClient.invalidateQueries({ queryKey: PROFESSIONALS_KEY });
      } else {
        toast.error(result.message);
      }
    },
    onError: (error: unknown) => {
      if (!isAuthError(error)) toast.error("Falha de comunicação com o servidor. Tente de novo.");
    },
  };
}

function ProfessionalDetail({
  professional,
  isAdmin,
}: {
  professional: Professional;
  isAdmin: boolean;
}) {
  const { onResult, onError } = useActionToasts();
  const form = useForm<ProfessionalFields>({
    resolver: zodResolver(professionalFieldsSchema),
    mode: "onBlur",
    defaultValues: {
      fullName: professional.fullName,
      registryCouncil: professional.registryCouncil,
      registryNumber: professional.registryNumber,
      registryState: professional.registryState as ProfessionalFields["registryState"],
      specialties: professional.specialties,
      bio: professional.bio ?? "",
    },
  });

  const save = useMutation({
    mutationFn: (values: ProfessionalFields) =>
      updateProfessionalFn({ data: { ...values, userId: professional.userId } }),
    onSuccess: (result) => {
      onResult(result, "Ficha atualizada.");
      if (result.ok) form.reset(form.getValues());
    },
    onError,
  });

  const registryChanged =
    professional.verificationStatus === "verified" &&
    (form.watch("registryCouncil") !== professional.registryCouncil ||
      form.watch("registryNumber").trim().toUpperCase() !== professional.registryNumber ||
      form.watch("registryState") !== professional.registryState);

  return (
    <>
      <SheetHeader>
        <SheetTitle>{professional.fullName}</SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-wrap items-center gap-3">
            <VerificationBadge status={professional.verificationStatus} />
            <span>
              {professional.inviteAcceptedAt
                ? `Convite aceito em ${formatDate(professional.inviteAcceptedAt)}`
                : "Convite pendente"}
            </span>
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-8 px-4 pb-6">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => save.mutate(values))}
            className="space-y-4"
            noValidate
          >
            <ProfessionalFormFields disabled={save.isPending} />
            {registryChanged && (
              <p role="note" className="text-sm text-muted-foreground">
                Alterar o registro de um profissional verificado volta a ficha para pendente.
              </p>
            )}
            <Button type="submit" disabled={save.isPending || !form.formState.isDirty}>
              {save.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
              Salvar ficha
            </Button>
          </form>
        </Form>

        <VerificationPanel professional={professional} isAdmin={isAdmin} />
      </div>
    </>
  );
}

function VerificationPanel({
  professional,
  isAdmin,
}: {
  professional: Professional;
  isAdmin: boolean;
}) {
  const { onResult, onError } = useActionToasts();
  const [note, setNote] = useState(professional.verificationNote ?? "");
  const [noteError, setNoteError] = useState<string | null>(null);

  const verify = useMutation({
    mutationFn: (status: VerificationStatus) =>
      setVerificationFn({ data: { userId: professional.userId, status, note } }),
    onSuccess: (result, status) =>
      onResult(
        result,
        status === "verified"
          ? "Profissional verificado."
          : status === "rejected"
            ? "Profissional rejeitado."
            : "Verificação reaberta.",
      ),
    onError,
  });

  const submit = (status: VerificationStatus) => {
    if (status === "rejected" && !note.trim()) {
      setNoteError("Informe o motivo da rejeição.");
      return;
    }
    setNoteError(null);
    verify.mutate(status);
  };

  return (
    <section aria-labelledby="verification-title" className="space-y-4 border-t border-border pt-6">
      <h2 id="verification-title" className="font-serif text-xl">
        Verificação do registro
      </h2>
      <p className="text-sm text-muted-foreground">
        {professional.verifiedAt
          ? `${professional.verificationStatus === "verified" ? "Verificado" : "Rejeitado"} em ${formatDate(professional.verifiedAt)}.`
          : "Aguardando conferência do registro no conselho."}
        {professional.verificationNote && ` Nota: ${professional.verificationNote}`}
      </p>

      {isAdmin ? (
        <div className="space-y-3">
          <Label htmlFor="verification-note">Nota (obrigatória para rejeitar)</Label>
          <Textarea
            id="verification-note"
            rows={3}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-invalid={noteError !== null}
            aria-describedby={noteError ? "verification-note-error" : undefined}
          />
          {noteError && (
            <p id="verification-note-error" role="alert" className="text-sm text-destructive">
              {noteError}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {professional.verificationStatus !== "verified" && (
              <Button disabled={verify.isPending} onClick={() => submit("verified")}>
                Verificar
              </Button>
            )}
            {professional.verificationStatus !== "rejected" && (
              <Button
                variant="outline"
                disabled={verify.isPending}
                onClick={() => submit("rejected")}
              >
                Rejeitar
              </Button>
            )}
            {professional.verificationStatus !== "pending" && (
              <Button variant="ghost" disabled={verify.isPending} onClick={() => submit("pending")}>
                Voltar a pendente
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p role="note" className="text-sm text-muted-foreground">
          Só administradores alteram a verificação.
        </p>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}
