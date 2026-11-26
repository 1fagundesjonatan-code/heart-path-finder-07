import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getServerHealth } from "../functions/health";

function Row({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm last:border-b-0">
      <dt>{label}</dt>
      <dd className="flex items-center gap-2 text-muted-foreground">
        {ok !== undefined && (
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${ok ? "bg-emerald-600" : "bg-destructive"}`}
          />
        )}
        {value}
      </dd>
    </div>
  );
}

export function SupabaseHealthPanel() {
  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin", "health"],
    queryFn: () => getServerHealth(),
    staleTime: 30_000,
  });

  return (
    <section aria-labelledby="supabase-titulo" className="max-w-xl">
      <h2 id="supabase-titulo" className="font-serif text-xl">
        Supabase
      </h2>
      <div aria-live="polite" className="mt-4">
        {isPending && <Skeleton className="h-28 w-full" />}
        {isError && (
          <div role="alert" className="border-l-2 border-destructive pl-3 text-sm">
            Não foi possível verificar a conexão. O Supabase pode não estar configurado ou estar
            inacessível.{" "}
            <button
              type="button"
              className="underline underline-offset-4"
              onClick={() => refetch()}
            >
              Tentar de novo
            </button>
          </div>
        )}
        {data && (
          <dl>
            <Row
              label="Conexão"
              value={
                data.supabase.reachable
                  ? `Conectado (${data.supabase.latencyMs} ms)`
                  : "Sem resposta"
              }
              ok={data.supabase.reachable}
            />
            <Row
              label="URL e chave publishable"
              value={data.env.publicConfigured ? "Configuradas" : "Ausentes"}
              ok={data.env.publicConfigured}
            />
            <Row
              label="Service role (servidor)"
              value={data.env.serviceRoleConfigured ? "Configurada" : "Ausente"}
              ok={data.env.serviceRoleConfigured}
            />
            <Row
              label="Verificado em"
              value={new Date(data.checkedAt).toLocaleString("pt-BR", {
                timeZone: "America/Sao_Paulo",
              })}
            />
          </dl>
        )}
      </div>
      <button
        type="button"
        onClick={() => refetch()}
        disabled={isFetching}
        className="mt-4 text-xs uppercase tracking-[0.18em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline disabled:opacity-50"
      >
        {isFetching ? "Verificando..." : "Verificar de novo"}
      </button>
    </section>
  );
}
