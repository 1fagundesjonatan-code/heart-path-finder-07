import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { queryRetry } from "@/features/auth/error-codes";
import { listProfessionalsFn } from "../functions/professionals-fns";
import { PROFESSIONALS_KEY } from "../query-keys";
import type { Professional, VerificationStatus } from "../types";
import { InviteDialog } from "./invite-dialog";
import { ProfessionalSheet } from "./professional-sheet";
import { InviteBadge, VerificationBadge, VERIFICATION_LABELS } from "./status-badges";

type Filter = VerificationStatus | "all";
const FILTERS: Filter[] = ["all", "pending", "verified", "rejected"];

export function ProfessionalsView({ isAdmin }: { isAdmin: boolean }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [...PROFESSIONALS_KEY, filter],
    queryFn: () => listProfessionalsFn({ data: filter === "all" ? {} : { status: filter } }),
    retry: queryRetry,
  });

  const selected = data?.professionals.find((p) => p.userId === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ToggleGroup
          type="single"
          value={filter}
          onValueChange={(value) => value && setFilter(value as Filter)}
          aria-label="Filtrar por verificação"
          variant="outline"
          className="flex-wrap justify-start"
        >
          {FILTERS.map((f) => (
            <ToggleGroupItem key={f} value={f} className="min-h-11 px-4">
              {f === "all" ? "Todos" : VERIFICATION_LABELS[f]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        {isAdmin && <InviteDialog />}
      </div>

      {isPending ? (
        <div role="status" aria-label="Carregando profissionais" className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : isError ? (
        <div role="alert" className="max-w-md border-l-2 border-destructive pl-4 text-sm">
          <p>Não foi possível carregar os profissionais.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      ) : data.professionals.length === 0 ? (
        <p className="border-y border-border py-10 text-center text-sm text-muted-foreground">
          {filter === "all"
            ? isAdmin
              ? 'Nenhum profissional cadastrado. Use "Convidar profissional" para começar.'
              : "Nenhum profissional cadastrado ainda."
            : "Nenhum profissional com esse status."}
        </p>
      ) : (
        <>
          <ProfessionalsList professionals={data.professionals} onSelect={setSelectedId} />
          {data.truncated && (
            <p role="note" className="text-sm text-muted-foreground">
              Mostrando os 200 mais recentes. Use o filtro para refinar.
            </p>
          )}
        </>
      )}

      <ProfessionalSheet
        professional={selected}
        isAdmin={isAdmin}
        onClose={() => setSelectedId(null)}
      />
    </div>
  );
}

function registryLabel(p: Professional): string {
  return `${p.registryCouncil === "OTHER" ? "Registro" : p.registryCouncil} ${p.registryNumber}/${p.registryState}`;
}

function ProfessionalsList({
  professionals,
  onSelect,
}: {
  professionals: Professional[];
  onSelect: (id: string) => void;
}) {
  return (
    <>
      <ul className="space-y-3 md:hidden">
        {professionals.map((p) => (
          <li key={p.userId}>
            <button
              type="button"
              onClick={() => onSelect(p.userId)}
              className="w-full space-y-2 border border-border p-4 text-left focus-visible:outline-2 focus-visible:outline-foreground"
            >
              <span className="block font-medium">{p.fullName}</span>
              <span className="block text-sm text-muted-foreground">{registryLabel(p)}</span>
              {p.specialties.length > 0 && (
                <span className="block text-sm">{p.specialties.join(", ")}</span>
              )}
              <span className="flex flex-wrap items-center gap-3">
                <VerificationBadge status={p.verificationStatus} />
                <InviteBadge acceptedAt={p.inviteAcceptedAt} />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead>Especialidades</TableHead>
              <TableHead>Verificação</TableHead>
              <TableHead>Convite</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professionals.map((p) => (
              <TableRow key={p.userId}>
                <TableCell className="font-medium">
                  <button
                    type="button"
                    onClick={() => onSelect(p.userId)}
                    className="min-h-11 text-left underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-foreground"
                  >
                    {p.fullName}
                  </button>
                </TableCell>
                <TableCell>{registryLabel(p)}</TableCell>
                <TableCell className="max-w-64 text-sm">
                  {p.specialties.length > 0 ? p.specialties.join(", ") : "Sem especialidades"}
                </TableCell>
                <TableCell>
                  <VerificationBadge status={p.verificationStatus} />
                </TableCell>
                <TableCell>
                  <InviteBadge acceptedAt={p.inviteAcceptedAt} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
