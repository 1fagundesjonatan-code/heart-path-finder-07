import {
  BarChart3,
  BookOpen,
  Brain,
  Briefcase,
  Compass,
  CreditCard,
  Gauge,
  Megaphone,
  MessagesSquare,
  Plug,
  FileText,
  Settings,
  ShoppingBag,
  Sparkles,
  Target,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import type { ModuleStatus } from "@/shared/module-status";
import { hasAnyRole, type AppRole } from "@/shared/roles";

export type ModuleId =
  | "dashboard"
  | "chat"
  | "clientes"
  | "crm"
  | "leads"
  | "marketing"
  | "the-self-ai"
  | "mentor-ia"
  | "eneagrama"
  | "jornadas"
  | "assinaturas"
  | "marketplace"
  | "profissionais"
  | "financeiro"
  | "analytics"
  | "conteudo"
  | "integracoes"
  | "configuracoes";

export type ModuleGroup =
  "overview" | "people" | "acquisition" | "agent" | "product" | "revenue" | "system";

/** Ordem e rótulo dos grupos no menu. */
export const MODULE_GROUPS: readonly { id: ModuleGroup; label: string }[] = [
  { id: "overview", label: "Visão geral" },
  { id: "people", label: "Pessoas" },
  { id: "acquisition", label: "Aquisição" },
  { id: "agent", label: "Agente de IA" },
  { id: "product", label: "Produto" },
  { id: "revenue", label: "Receita" },
  { id: "system", label: "Sistema" },
];

export type AdminModule = {
  id: ModuleId;
  group: ModuleGroup;
  /** Segmento da URL em /admin/<slug>. O dashboard vive em /admin. */
  slug: string;
  label: string;
  icon: LucideIcon;
  description: string;
  phase: number;
  status: ModuleStatus;
  /** Papéis com acesso (matriz do doc 01, seção 5.2). Fonte única para menu, guard e páginas. */
  roles: readonly AppRole[];
  dependencies: readonly string[];
  /** O que existe hoje, ou quando entra. Texto honesto, sem prometer o que não há. */
  delivery: string;
};

const ALL_STAFF = ["admin", "collaborator"] as const;

export const ADMIN_MODULES: readonly AdminModule[] = [
  {
    id: "dashboard",
    group: "overview",
    slug: "",
    label: "Dashboard",
    icon: Gauge,
    description: "Visão única do funil e da operação, com números reais por período.",
    phase: 1,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Eventos do funil (E7)", "CRM e leads (E5, E6)", "Gasto manual (E8)"],
    delivery: "Métricas reais disponíveis; várias dependem das entregas E5 a E8 para ter dado.",
  },
  {
    id: "analytics",
    group: "overview",
    slug: "analytics",
    label: "Analytics",
    icon: BarChart3,
    description: "Funil detalhado, coortes e retenção.",
    phase: 1,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Eventos do funil (E7)"],
    delivery: "Funil básico já aparece no Dashboard. Coortes e retenção são da Fase 4.",
  },
  {
    id: "clientes",
    group: "people",
    slug: "clientes",
    label: "Clientes",
    icon: Users,
    description: "Pessoas com conta: perfil, consentimentos, resumo do resultado e atividade.",
    phase: 1,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Autenticação", "CRM (E5)"],
    delivery: "Entra com a entrega E5 (CRM). Aba de assinatura depende da Fase 5.",
  },
  {
    id: "profissionais",
    group: "people",
    slug: "profissionais",
    label: "Profissionais",
    icon: UserRound,
    description: "Cadastro, verificação e vínculo de psicólogos e terapeutas.",
    phase: 2,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Autenticação e papéis", "Validação do registro profissional"],
    delivery:
      "Lista, convite e verificação disponíveis. A venda de atendimentos depende do Marketplace (Fase 6).",
  },
  {
    id: "marketing",
    group: "acquisition",
    slug: "marketing",
    label: "Marketing",
    icon: Megaphone,
    description: "Fase 1: gasto manual por canal e período para calcular CPL.",
    phase: 1,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Lançamento manual de gasto (E8)"],
    delivery:
      "Gasto manual entra com a entrega E8. Campanhas, e-mail e WhatsApp são da Fase 4 e exigem integrações.",
  },
  {
    id: "leads",
    group: "acquisition",
    slug: "leads",
    label: "Leads",
    icon: Target,
    description: "Visão do CRM para contatos em estágio inicial, com origem, UTM e consentimento.",
    phase: 1,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["CRM (E5)", "Captura de lead com consentimento (E6)"],
    delivery: "Entra com a entrega E6, depois de política de privacidade e consentimento prontos.",
  },
  {
    id: "crm",
    group: "acquisition",
    slug: "crm",
    label: "CRM",
    icon: Briefcase,
    description: "Contato único (lead ou cliente) com estágio, histórico, notas e linha do tempo.",
    phase: 1,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Autenticação e papéis"],
    delivery: "Entra com a entrega E5.",
  },
  {
    id: "chat",
    group: "agent",
    slug: "chat",
    label: "Chat",
    icon: MessagesSquare,
    description:
      "Playground para conversar com o agente, escolher a versão e simular o tipo do Eneagrama.",
    phase: 2,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Treinamento do agente", "Chave do provedor de IA"],
    delivery: "Em construção na Fase 2. A conversa com o agente ainda não está disponível.",
  },
  {
    id: "the-self-ai",
    group: "agent",
    slug: "the-self-ai",
    label: "Treinamento do agente",
    icon: Sparkles,
    description:
      "Eneagrama conversacional e configuração operacional da IA (prompts, modelo, limites).",
    phase: 2,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Fase 1 concluída", "Chave do provedor de IA", "Protocolo de crise"],
    delivery: "Em construção na Fase 2: versões, base de conhecimento, exemplos e uso.",
  },
  {
    id: "mentor-ia",
    group: "agent",
    slug: "mentor-ia",
    label: "Mentor IA",
    icon: Brain,
    description: "Mentor pessoal com memória em camadas, controlada pelo usuário.",
    phase: 3,
    status: "Planejado",
    roles: ALL_STAFF,
    dependencies: ["The Self AI (Fase 2)", "Embeddings", "Validação jurídica (dados sensíveis)"],
    delivery:
      "Planejado para a Fase 3. Conteúdo de conversas nunca será lido por padrão pela equipe.",
  },
  {
    id: "eneagrama",
    group: "product",
    slug: "eneagrama",
    label: "Eneagrama",
    icon: Compass,
    description: "Versões do instrumento, distribuição de resultados e qualidade das respostas.",
    phase: 1,
    status: "Necessita validação",
    roles: ALL_STAFF,
    dependencies: ["Resultados salvos (E6)", "Revisão psicométrica do instrumento"],
    delivery:
      "O teste público funciona, mas é autorrelato sem validação psicométrica. Agregados entram após E6.",
  },
  {
    id: "jornadas",
    group: "product",
    slug: "jornadas",
    label: "Jornadas",
    icon: BookOpen,
    description: "Trilhas guiadas de autoconhecimento.",
    phase: 3,
    status: "Planejado",
    roles: ALL_STAFF,
    dependencies: ["Mentor IA (Fase 3)"],
    delivery: "Planejado para as Fases 3 e 4.",
  },
  {
    id: "conteudo",
    group: "product",
    slug: "conteudo",
    label: "Conteúdo",
    icon: FileText,
    description: "Edição de textos e itens publicados.",
    phase: 4,
    status: "Planejado",
    roles: ALL_STAFF,
    dependencies: ["Jornadas"],
    delivery: "Planejado para a Fase 4. Hoje os textos ficam no código.",
  },
  {
    id: "assinaturas",
    group: "revenue",
    slug: "assinaturas",
    label: "Assinaturas",
    icon: CreditCard,
    description: "Planos, cobrança recorrente, limites de uso por plano.",
    phase: 5,
    status: "Necessita integração",
    roles: ALL_STAFF,
    dependencies: ["Stripe e/ou Mercado Pago", "Decisão de preços"],
    delivery: "Depende de gateway de pagamento. Planejado para a Fase 5.",
  },
  {
    id: "marketplace",
    group: "revenue",
    slug: "marketplace",
    label: "Marketplace",
    icon: ShoppingBag,
    description: "Agendamento e venda de atendimentos de profissionais.",
    phase: 6,
    status: "Planejado",
    roles: ALL_STAFF,
    dependencies: ["Gateway com split e repasse", "Definição jurídica clínico x Mentor IA"],
    delivery: "Planejado para a Fase 6.",
  },
  {
    id: "financeiro",
    group: "revenue",
    slug: "financeiro",
    label: "Financeiro",
    icon: Wallet,
    description: "Receita, repasses e conciliação.",
    phase: 5,
    status: "Necessita integração",
    roles: ALL_STAFF,
    dependencies: ["Gateway de pagamento (Fase 5)", "Marketplace (Fase 6)"],
    delivery:
      "Sem fonte de receita hoje. A única informação financeira real da Fase 1 é o gasto manual de marketing.",
  },
  {
    id: "integracoes",
    group: "system",
    slug: "integracoes",
    label: "Integrações",
    icon: Plug,
    description: "Estado das conexões externas. Mostra só status, nunca segredos.",
    phase: 1,
    status: "Em desenvolvimento",
    roles: ALL_STAFF,
    dependencies: ["Variáveis de ambiente do servidor"],
    delivery:
      "Mostra o estado real da conexão com o Supabase. As demais integrações ainda não existem.",
  },
  {
    id: "configuracoes",
    group: "system",
    slug: "configuracoes",
    label: "Configurações",
    icon: Settings,
    description: "Usuários internos e papéis de acesso.",
    phase: 1,
    status: "Em desenvolvimento",
    roles: ["admin"],
    dependencies: ["Autenticação"],
    delivery:
      "Usuários e papéis já funcionam. Textos legais e parâmetros globais ainda não existem.",
  },
];

export function getModuleBySlug(slug: string): AdminModule | undefined {
  return ADMIN_MODULES.find((m) => m.slug === slug);
}

export function getModule(id: ModuleId): AdminModule {
  const found = ADMIN_MODULES.find((m) => m.id === id);
  if (!found) throw new Error(`Módulo desconhecido: ${id}`);
  return found;
}

export function canAccessModule(userRoles: readonly AppRole[], module: AdminModule): boolean {
  return hasAnyRole(userRoles, module.roles);
}

export function modulesForRoles(userRoles: readonly AppRole[]): AdminModule[] {
  return ADMIN_MODULES.filter((m) => canAccessModule(userRoles, m));
}

export type ModuleGroupSection = { id: ModuleGroup; label: string; modules: AdminModule[] };

export function groupModules(modules: readonly AdminModule[]): ModuleGroupSection[] {
  return MODULE_GROUPS.map(({ id, label }) => ({
    id,
    label,
    modules: modules.filter((m) => m.group === id),
  })).filter((section) => section.modules.length > 0);
}
