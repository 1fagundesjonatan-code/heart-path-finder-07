import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, X } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isAuthError } from "@/features/auth/error-codes";
import { APP_ROLES, ROLE_LABELS, type AppRole } from "@/shared/roles";
import { grantRoleFn, listUsersFn, revokeRoleFn } from "../functions/users-fns";
import type { ManagedUser, RoleChangeResult } from "../types";

const USERS_KEY = ["admin", "users"] as const;

type PendingRevoke = { user: ManagedUser; role: AppRole };

export function UsersRolesTable() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pendingRevoke, setPendingRevoke] = useState<PendingRevoke | null>(null);

  const { data, isPending, isError, isPlaceholderData, refetch } = useQuery({
    queryKey: [...USERS_KEY, page],
    queryFn: () => listUsersFn({ data: { page } }),
    placeholderData: keepPreviousData,
  });

  const handleResult = (result: RoleChangeResult, successMessage: string) => {
    if (result.ok) {
      toast.success(successMessage);
      void queryClient.invalidateQueries({ queryKey: USERS_KEY });
    } else {
      toast.error(result.message);
    }
  };
  // 401/403 já são tratados globalmente (redirect para login ou aviso de permissão).
  const handleError = (error: unknown) => {
    if (!isAuthError(error)) toast.error("Falha de comunicação com o servidor. Tente de novo.");
  };

  const grant = useMutation({
    mutationFn: (input: { userId: string; role: AppRole }) => grantRoleFn({ data: input }),
    onSuccess: (result) => handleResult(result, "Papel atribuído."),
    onError: handleError,
  });
  const revoke = useMutation({
    mutationFn: (input: { userId: string; role: AppRole }) => revokeRoleFn({ data: input }),
    onSuccess: (result) => handleResult(result, "Papel removido."),
    onError: handleError,
    onSettled: () => setPendingRevoke(null),
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!data) return [];
    return term
      ? data.users.filter((u) => (u.email ?? "").toLowerCase().includes(term))
      : data.users;
  }, [data, search]);

  if (isPending) {
    return (
      <div role="status" aria-label="Carregando usuários" className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="alert" className="max-w-md border-l-2 border-destructive pl-4 text-sm">
        <p>Não foi possível carregar os usuários.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
          Tentar de novo
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="max-w-sm space-y-2">
        <Label htmlFor="busca-usuario">Buscar por e-mail</Label>
        <Input
          id="busca-usuario"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="nome@exemplo.com"
        />
      </div>

      {search && (
        <p role="note" className="text-sm text-muted-foreground">
          A busca vale só para os usuários desta página.
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">
          {search
            ? "Nenhum usuário encontrado para essa busca."
            : "Nenhum usuário cadastrado ainda."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>E-mail</TableHead>
                <TableHead>Papéis</TableHead>
                <TableHead className="w-64">Atribuir papel</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  isBusy={grant.isPending || revoke.isPending}
                  onGrant={(role) => grant.mutate({ userId: user.id, role })}
                  onRequestRevoke={(role) => setPendingRevoke({ user, role })}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <nav aria-label="Paginação de usuários" className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          disabled={page === 1 || isPlaceholderData}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Anterior
        </Button>
        <span className="text-xs text-muted-foreground">Página {data.page}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={!data.hasNext || isPlaceholderData}
          onClick={() => setPage((p) => p + 1)}
        >
          Próxima
        </Button>
      </nav>

      <AlertDialog open={pendingRevoke !== null} onOpenChange={(o) => !o && setPendingRevoke(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover papel?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRevoke &&
                `${pendingRevoke.user.email ?? "O usuário"} perderá o papel ${ROLE_LABELS[pendingRevoke.role]}. A ação fica registrada na auditoria.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={revoke.isPending}
              onClick={() =>
                pendingRevoke &&
                revoke.mutate({ userId: pendingRevoke.user.id, role: pendingRevoke.role })
              }
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UserRow({
  user,
  isBusy,
  onGrant,
  onRequestRevoke,
}: {
  user: ManagedUser;
  isBusy: boolean;
  onGrant: (role: AppRole) => void;
  onRequestRevoke: (role: AppRole) => void;
}) {
  const [selected, setSelected] = useState<AppRole | "">("");
  const available = APP_ROLES.filter((r) => !user.roles.includes(r));

  return (
    <TableRow>
      <TableCell className="font-medium">{user.email ?? "(sem e-mail)"}</TableCell>
      <TableCell>
        {user.roles.length === 0 ? (
          <span className="text-sm text-muted-foreground">Sem papel</span>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {user.roles.map((role) => (
              <li
                key={role}
                className="inline-flex items-center gap-1 rounded-full border border-border py-0.5 pl-3 pr-1 text-xs"
              >
                {ROLE_LABELS[role]}
                <button
                  type="button"
                  disabled={isBusy}
                  onClick={() => onRequestRevoke(role)}
                  aria-label={`Remover papel ${ROLE_LABELS[role]} de ${user.email ?? "usuário"}`}
                  className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-foreground disabled:opacity-40"
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Select value={selected} onValueChange={(v) => setSelected(v as AppRole)}>
            <SelectTrigger aria-label={`Papel a atribuir para ${user.email ?? "usuário"}`}>
              <SelectValue placeholder="Escolher papel" />
            </SelectTrigger>
            <SelectContent>
              {available.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!selected || isBusy}
            onClick={() => {
              if (selected) {
                onGrant(selected);
                setSelected("");
              }
            }}
          >
            {isBusy && <Loader2 aria-hidden="true" className="animate-spin" />}
            Atribuir
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
