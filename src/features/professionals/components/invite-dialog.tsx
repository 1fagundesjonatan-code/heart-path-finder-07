import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, MailPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { isAuthError } from "@/features/auth/error-codes";
import { INVITE_ACCEPT_READY, INVITE_DISABLED_MESSAGE } from "../invite-config";
import { inviteProfessionalFn } from "../functions/professionals-fns";
import { inviteProfessionalSchema, type InviteProfessionalInput } from "../schemas";
import { PROFESSIONALS_KEY } from "../query-keys";
import { ProfessionalFormFields } from "./professional-fields";

const EMPTY: InviteProfessionalInput = {
  email: "",
  fullName: "",
  registryCouncil: "CRP",
  registryNumber: "",
  registryState: "" as InviteProfessionalInput["registryState"],
  specialties: [],
  bio: "",
};

export function InviteDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<InviteProfessionalInput>({
    resolver: zodResolver(inviteProfessionalSchema),
    defaultValues: EMPTY,
    mode: "onBlur",
  });

  const invite = useMutation({
    mutationFn: (input: InviteProfessionalInput) => inviteProfessionalFn({ data: input }),
    onSuccess: (result, input) => {
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`Convite enviado para ${input.email}.`);
      void queryClient.invalidateQueries({ queryKey: PROFESSIONALS_KEY });
      form.reset(EMPTY);
      setOpen(false);
    },
    onError: (error) => {
      if (!isAuthError(error)) toast.error("Falha de comunicação com o servidor. Tente de novo.");
    },
  });

  if (!INVITE_ACCEPT_READY) {
    return (
      <div className="flex flex-col items-start gap-1 sm:items-end">
        <Button disabled aria-describedby="invite-disabled-hint">
          <MailPlus aria-hidden="true" />
          Convidar profissional
        </Button>
        <p id="invite-disabled-hint" className="text-xs text-muted-foreground">
          {INVITE_DISABLED_MESSAGE}
        </p>
      </div>
    );
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(EMPTY);
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <MailPlus aria-hidden="true" />
          Convidar profissional
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Convidar profissional</DialogTitle>
          <DialogDescription>
            O profissional recebe um e-mail para definir a senha. Até confirmar, o convite fica
            pendente. O envio de e-mails usa o limite padrão do Supabase, que é baixo: se falhar,
            aguarde alguns minutos.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => invite.mutate(values))}
            className="space-y-4"
            noValidate
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" maxLength={254} {...field} />
                  </FormControl>
                  <FormDescription>Para onde o convite será enviado.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <ProfessionalFormFields disabled={invite.isPending} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending && <Loader2 aria-hidden="true" className="animate-spin" />}
                Enviar convite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
