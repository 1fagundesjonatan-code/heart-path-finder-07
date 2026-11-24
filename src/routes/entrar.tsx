import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/features/auth/components/login-form";
import { sanitizeNextPath } from "@/features/auth/schemas";
import { getAuthContext } from "@/features/auth/functions/auth-fns";

export const Route = createFileRoute("/entrar")({
  validateSearch: (search: Record<string, unknown>): { next: string } => ({
    next: sanitizeNextPath(search.next),
  }),
  beforeLoad: async ({ search }) => {
    const auth = await getAuthContext();
    if (auth.status === "authenticated") throw redirect({ href: search.next });
    return { auth };
  },
  head: () => ({
    meta: [{ title: "Entrar — The Self Map" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const { auth } = Route.useRouteContext();

  return (
    <div className="grain grid min-h-screen place-items-center px-6 py-16">
      <main className="w-full max-w-sm">
        <div className="text-[11px] uppercase tracking-[0.22em] text-primary">The Self Map</div>
        <h1 className="mt-4 font-serif text-5xl leading-none">Entrar</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Acesso restrito à equipe. Use o e-mail e a senha cadastrados pelo administrador.
        </p>
        <div className="mt-10">
          {auth.status === "unconfigured" ? (
            <p role="alert" className="border-l-2 border-destructive pl-3 text-sm">
              A autenticação ainda não está configurada neste ambiente. Defina as variáveis do
              Supabase (veja .env.example) e reinicie o servidor.
            </p>
          ) : (
            <LoginForm next={next} />
          )}
        </div>
      </main>
    </div>
  );
}
