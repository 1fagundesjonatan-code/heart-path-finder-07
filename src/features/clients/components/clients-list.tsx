import { useInfiniteQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { clientDisplayName, enneagramLabel, formatDate, STAGE_LABELS } from "../domain/labels";
import { listClientsFn } from "../functions/clients-fns";
import type { ClientRow } from "../schemas";

const SEARCH_DEBOUNCE_MS = 300;

function useDebouncedValue(value: string, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

export function ClientsList() {
  const [input, setInput] = useState("");
  const search = useDebouncedValue(input.trim(), SEARCH_DEBOUNCE_MS);

  const { data, isPending, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useInfiniteQuery({
      queryKey: ["admin", "clients", search],
      queryFn: ({ pageParam }) =>
        listClientsFn({ data: { search: search || undefined, after: pageParam } }),
      initialPageParam: undefined as number | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
    });

  const clients = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="space-y-6">
      <div className="max-w-sm space-y-2">
        <Label htmlFor="client-search">Buscar por nome ou e-mail</Label>
        <Input
          id="client-search"
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Maria ou maria@exemplo.com"
          maxLength={100}
        />
      </div>

      {isPending ? (
        <div role="status" aria-label="Carregando clientes" className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div role="alert" className="max-w-md border-l-2 border-destructive pl-4 text-sm">
          <p>Não foi possível carregar os clientes.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : clients.length === 0 ? (
        <EmptyState isSearching={search !== ""} />
      ) : (
        <>
          <p role="status" className="text-xs text-muted-foreground">
            {clients.length} {clients.length === 1 ? "cliente carregado" : "clientes carregados"}
            {hasNextPage ? ", há mais" : ""}
          </p>
          <ClientsTable clients={clients} />
          <ClientsCards clients={clients} />
          {hasNextPage && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                disabled={isFetchingNextPage}
                onClick={() => fetchNextPage()}
              >
                {isFetchingNextPage && <Loader2 aria-hidden="true" className="animate-spin" />}
                Carregar mais
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ isSearching }: { isSearching: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 border-y border-border py-14 text-center">
      <Users aria-hidden="true" className="size-8 text-muted-foreground" />
      <p className="max-w-sm text-sm text-muted-foreground">
        {isSearching
          ? "Nenhum cliente encontrado. Confira a grafia ou busque por outro trecho do nome ou do e-mail."
          : "Ainda não há clientes com conta. Quem criar conta e confirmar o e-mail aparece aqui."}
      </p>
    </div>
  );
}

function ClientsTable({ clients }: { clients: ClientRow[] }) {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Estágio</TableHead>
            <TableHead>Eneagrama</TableHead>
            <TableHead>Cadastro</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.contact_id}>
              <TableCell className="font-medium">
                <Link
                  to="/admin/clientes/$id"
                  params={{ id: client.user_id }}
                  className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-foreground"
                >
                  {clientDisplayName(client)}
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {client.email ?? "Sem e-mail"}
              </TableCell>
              <TableCell>{STAGE_LABELS[client.stage]}</TableCell>
              <TableCell className={client.primary_type ? "" : "text-muted-foreground"}>
                {enneagramLabel(client)}
              </TableCell>
              <TableCell className="tabular-nums">{formatDate(client.created_at)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ClientsCards({ clients }: { clients: ClientRow[] }) {
  return (
    <ul className="space-y-3 md:hidden">
      {clients.map((client) => (
        <li key={client.contact_id}>
          <Link
            to="/admin/clientes/$id"
            params={{ id: client.user_id }}
            className="block min-h-11 space-y-1 border border-border p-4 focus-visible:outline-2 focus-visible:outline-foreground"
          >
            <span className="block font-medium">{clientDisplayName(client)}</span>
            <span className="block truncate text-sm text-muted-foreground">
              {client.email ?? "Sem e-mail"}
            </span>
            <span className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
              <span>{STAGE_LABELS[client.stage]}</span>
              <span>{enneagramLabel(client)}</span>
              <span className="tabular-nums">{formatDate(client.created_at)}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
