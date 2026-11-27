import type { ClientRow, CONSENT_TYPES, CRM_STAGES } from "../schemas";

export const STAGE_LABELS: Record<(typeof CRM_STAGES)[number], string> = {
  visitor: "Visitante",
  lead_captured: "Lead captado",
  lead_qualified: "Lead qualificado",
  signup_started: "Cadastro iniciado",
  signup_completed: "Cadastro concluído",
  test_started: "Teste iniciado",
  test_completed: "Teste concluído",
  result_viewed: "Resultado visto",
  subscription_started: "Assinatura iniciada",
  active_customer: "Cliente ativo",
  recurring_customer: "Cliente recorrente",
  churned: "Cancelado",
  reactivated: "Reativado",
};

export const CONSENT_LABELS: Record<(typeof CONSENT_TYPES)[number], string> = {
  terms: "Termos de uso",
  privacy: "Política de privacidade",
  marketing: "Comunicações de marketing",
  ai_memory: "Memória da IA",
  enneagram_profile_share: "Compartilhar o tipo do Eneagrama com a equipe",
};

const EVENT_LABELS: Record<string, string> = {
  page_view: "Visitou uma página",
  lead_captured: "Deixou contato",
  signup_started: "Abriu o cadastro",
  signup_completed: "Criou a conta",
  test_started: "Iniciou o teste",
  test_progress: "Avançou no teste",
  test_completed: "Concluiu o teste",
  result_viewed: "Viu o resultado",
  mentor_first_message: "Primeira mensagem ao mentor de IA",
  subscription_started: "Iniciou uma assinatura",
};

export function eventLabel(name: string): string {
  return EVENT_LABELS[name] ?? name;
}

export function clientDisplayName(client: Pick<ClientRow, "full_name" | "email">): string {
  return client.full_name?.trim() || client.email || "Sem nome";
}

export function enneagramLabel(row: Pick<ClientRow, "primary_type">): string {
  return row.primary_type ? `Tipo ${row.primary_type}` : "Não compartilhado";
}

const DATE = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" });
const DATE_TIME = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export const formatDate = (iso: string) => DATE.format(new Date(iso));
export const formatDateTime = (iso: string) => DATE_TIME.format(new Date(iso));
