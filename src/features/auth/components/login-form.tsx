import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "../schemas";
import { signInFn } from "../functions/auth-fns";

export function LoginForm({ next }: { next: string }) {
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema), mode: "onBlur" });

  const onSubmit = async (values: LoginInput) => {
    setFormError(null);
    try {
      const result = await signInFn({ data: values });
      if (!result.ok) {
        setFormError(result.message);
        return;
      }
      // Recarga completa: garante cookies de sessão aplicados e SSR com a sessão nova.
      window.location.assign(next);
    } catch (error) {
      console.error("login: falha inesperada", error);
      setFormError("Não foi possível entrar agora. Tente de novo em instantes.");
    }
  };

  return (
    <form
      // POST: submit antes da hidratacao nao pode por a senha na URL.
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          aria-required="true"
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? "email-erro" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-erro" role="alert" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-required="true"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? "senha-erro" : undefined}
          {...register("password")}
        />
        {errors.password && (
          <p id="senha-erro" role="alert" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        )}
      </div>

      {formError && (
        <p role="alert" className="border-l-2 border-destructive pl-3 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting && <Loader2 aria-hidden="true" className="animate-spin" />}
        {isSubmitting ? "Entrando..." : "Entrar"}
      </Button>
    </form>
  );
}
