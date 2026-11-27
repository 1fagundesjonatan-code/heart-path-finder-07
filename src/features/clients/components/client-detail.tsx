import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/features/admin-shell/components/page-header";
import {
  clientDisplayName,
  CONSENT_LABELS,
  eventLabel,
  formatDate,
  formatDateTime,
  STAGE_LABELS,
} from "../domain/labels";
import { getClientDetailFn } from "../functions/clients-fns";
import type { ClientDetail as ClientDetailData } from "../schemas";

const numberFormat = new Intl.NumberFormat("pt-BR");

function BackLink() {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3">
      <Link to="/admin/clientes">
        <ArrowLeft aria-hidden="true" />
        Voltar para clientes
      </Link>
    </Button>
  );
}

export function ClientDetail({ userId }: { userId: string }) {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ["admin", "client", userId],
    queryFn: () => getClientDetailFn({ data: { userId } }),
  });

  if (isPending) {
    return (
      <div role="status" aria-label="Carregando cliente" className="space-y-4 px-6 py-8 md:px-10">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-4 px-6 py-8 md:px-10">
        <BackLink />
        <div role="alert" className="max-w-md border-l-2 border-destructive pl-4 text-sm">
          <p>Não foi possível carregar este cliente.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
            Tentar de novo
          </Button>
        </div>
      </div>
    );
  }

  if (data === null) {
    return (
      <div className="space-y-4 px-6 py-8 md:px-10">
        <BackLink />
        <p role="status" className="text-sm text-muted-foreground">
          Cliente não encontrado. O link pode estar incorreto ou a conta não é de um cliente.
        </p>
      </div>
    );
  }

  return <ClientSheet detail={data} />;
}

function ClientSheet({ detail }: { detail: ClientDetailData }) {
  const { contact } = detail;
  return (
    <>
      <PageHeader
        title={clientDisplayName(contact)}
        description={[contact.email, STAGE_LABELS[contact.stage], contact.phone]
          .filter(Boolean)
          .join(" · ")}
        actions={<BackLink />}
      />
      <div className="grid gap-4 px-6 py-8 md:grid-cols-2 md:px-10">
        <EnneagramCard detail={detail} />
        <ConsentsCard consents={detail.consents} />
        <ActivityCard activity={detail.activity} />
        <AiCard ai={detail.ai} />
      </div>
    </>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function EnneagramCard({ detail }: { detail: ClientDetailData }) {
  const { enneagram } = detail;
  return (
    <SectionCard title="Eneagrama">
      {!detail.enneagram_shared ? (
        <p className="text-sm text-muted-foreground">
          Não compartilhado. O cliente não autorizou que a equipe veja o tipo.
        </p>
      ) : !enneagram ? (
        <p className="text-sm text-muted-foreground">
          Compartilhamento autorizado, mas o cliente ainda não concluiu o teste.
        </p>
      ) : (
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Tipo principal</dt>
            <dd className="font-medium">Tipo {enneagram.primary_type}</dd>
          </div>
          {enneagram.completed_at && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Concluído em</dt>
              <dd className="tabular-nums">{formatDate(enneagram.completed_at)}</dd>
            </div>
          )}
        </dl>
      )}
    </SectionCard>
  );
}

function ConsentsCard({ consents }: { consents: ClientDetailData["consents"] }) {
  return (
    <SectionCard title="Consentimentos" description="Último registro de cada finalidade.">
      {consents.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum consentimento registrado.</p>
      ) : (
        <ul className="divide-y divide-border text-sm">
          {consents.map((consent) => (
            <li key={consent.consent_type} className="flex justify-between gap-4 py-2">
              <span>{CONSENT_LABELS[consent.consent_type]}</span>
              <span className="shrink-0 text-right text-muted-foreground">
                <span className={consent.granted ? "text-foreground" : ""}>
                  {consent.granted ? "Concedido" : "Revogado"}
                </span>
                {" em "}
                <span className="tabular-nums">{formatDate(consent.at)}</span>
                {` (v. ${consent.document_version})`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function ActivityCard({ activity }: { activity: ClientDetailData["activity"] }) {
  return (
    <SectionCard title="Atividade" description="Os 20 eventos mais recentes.">
      {activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma atividade registrada.</p>
      ) : (
        <ol className="space-y-3 border-l border-border pl-4 text-sm">
          {activity.map((event, index) => (
            <li key={`${event.occurred_at}-${index}`}>
              <p>{eventLabel(event.event_name)}</p>
              <time
                dateTime={event.occurred_at}
                className="text-xs tabular-nums text-muted-foreground"
              >
                {formatDateTime(event.occurred_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  );
}

function AiCard({ ai }: { ai: ClientDetailData["ai"] }) {
  return (
    <SectionCard title="Conversas com a IA">
      <p role="note" className="mb-4 text-sm text-muted-foreground">
        O conteúdo das conversas não é visível para a equipe. Aqui aparecem só contagens e datas.
      </p>
      {!ai || ai.conversations + ai.messages === 0 ? (
        <p className="text-sm">Sem conversas até agora.</p>
      ) : (
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Conversas" value={numberFormat.format(ai.conversations)} />
          <Stat label="Mensagens" value={numberFormat.format(ai.messages)} />
          <Stat label="Tokens de entrada" value={numberFormat.format(ai.input_tokens)} />
          <Stat label="Tokens de saída" value={numberFormat.format(ai.output_tokens)} />
          {ai.last_activity_at && (
            <Stat label="Última atividade" value={formatDateTime(ai.last_activity_at)} />
          )}
        </dl>
      )}
    </SectionCard>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums">{value}</dd>
    </div>
  );
}
