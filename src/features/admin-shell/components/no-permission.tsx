import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoPermission({
  title = "Sem permissão",
  message = "Seu usuário não tem acesso a esta área. Peça a um administrador para ajustar seu papel.",
  onSignOut,
}: {
  title?: string;
  message?: string;
  onSignOut?: () => void;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center"
    >
      <ShieldAlert aria-hidden="true" className="size-8 text-muted-foreground" />
      <h1 className="mt-6 font-serif text-3xl">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{message}</p>
      {onSignOut && (
        <Button variant="outline" className="mt-8" onClick={onSignOut}>
          Sair
        </Button>
      )}
    </div>
  );
}
