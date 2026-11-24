// Toda a copy da landing. Textos entre colchetes são placeholders pendentes (ver
// docs/design/landing-direction.md, seção 9) e bloqueiam a publicação via content.test.ts.

export const TEST_ROUTE = "/eneagrama";

export type Emphasized = { before: string; emphasis: string; after: string };
export type FeatureStatus = "available" | "soon";
export type ScreenId = "result" | "quiz" | "chat" | "kanban" | "pomodoro" | "professionals";

export const nav = [
  { id: "como-funciona", label: "Como funciona" },
  { id: "recursos", label: "Recursos" },
  { id: "profissionais", label: "Profissionais" },
  { id: "planos", label: "Planos" },
  { id: "faq", label: "FAQ" },
] as const;

export const cta = {
  primary: "Fazer o teste gratuito",
  compact: "Fazer o teste",
  login: "Entrar",
};

export const hero = {
  eyebrow: "Autoconhecimento com método",
  title: {
    before: "Entenda como você funciona. Depois, ",
    emphasis: "use isso",
    after: " no seu dia.",
  } satisfies Emphasized,
  lead: "O The Self Map começa com um teste de Eneagrama gratuito e continua com um mentor de IA, tarefas, foco e, quando você quiser, profissionais de verdade.",
  secondary: "Ver como funciona",
  meta: ["162 afirmações", "de 15 a 25 minutos", "resultado na hora"],
  notice: "Ferramenta de reflexão. Não é diagnóstico nem substitui acompanhamento profissional.",
  chatPreview: "Por que eu adio conversas difíceis mesmo sabendo que vão me aliviar?",
};

export const problem = {
  eyebrow: "O ponto de partida",
  title: "Você pensa bastante sobre si. Quase nunca com método.",
  items: [
    {
      title: "Os mesmos padrões voltam.",
      body: "Na rotina, no trabalho, nas relações. Sem um mapa, cada repetição parece coincidência.",
    },
    {
      title: "As anotações ficam espalhadas.",
      body: "Insights num caderno, tarefas em outro app, metas num documento. Nada conversa entre si.",
    },
    {
      title: "Autoconhecimento e acompanhamento vivem separados.",
      body: "O que você descobre sozinho raramente chega inteiro até a sessão com um profissional.",
    },
  ],
};

export const howItWorks = {
  eyebrow: "Como funciona",
  title: "Três passos, do mapa à prática.",
  steps: [
    {
      number: "01",
      title: "Responda o teste.",
      // O teste ainda não salva progresso, então a frase "pode pausar e continuar" foi retirada.
      body: "162 afirmações, na sua velocidade, em cerca de 15 a 25 minutos. Gratuito.",
      screen: "quiz",
    },
    {
      number: "02",
      title: "Leia o seu mapa.",
      body: "Seu tipo, as asas e as direções de estresse e segurança, explicados em linguagem direta, com a pontuação de todos os nove tipos.",
      screen: "result",
    },
    {
      number: "03",
      title: "Aplique no dia a dia.",
      body: "Converse com o mentor de IA, organize tarefas, foque com o pomodoro e, se quiser, compartilhe seu mapa com um profissional.",
      screen: "chat",
    },
  ] satisfies { number: string; title: string; body: string; screen: ScreenId }[],
};

export type FeatureBlock = {
  id: string;
  name: string;
  status: FeatureStatus;
  title: string;
  body: string;
  items: string[];
  note?: string;
  screen: ScreenId;
};

export const features = {
  eyebrow: "O que tem dentro",
  title: "Um lugar só pro que você descobre e pro que você faz com isso.",
  closingCta: "Começar pelo teste gratuito",
  blocks: [
    {
      id: "teste",
      name: "Teste de Eneagrama",
      status: "available",
      title: "Um teste que leva a sério o seu tempo.",
      body: "162 afirmações respondidas em escala de 1 a 5, com resultado completo: tipo, asas, direções de estresse e segurança e pontuação dos nove tipos.",
      items: ["Gratuito, sempre. [Confirmar]", "Resultado na hora, sem esperar e-mail."],
      screen: "result",
    },
    {
      id: "mentor",
      name: "Mentor de IA",
      status: "soon",
      title: "Converse com alguém que já leu o seu mapa.",
      body: "Pergunte por que você reage de determinado jeito, peça um exercício pra semana ou organize uma decisão difícil. O mentor usa o seu resultado como contexto.",
      items: ["Responde em linguagem simples.", "Diz quando o assunto pede um profissional."],
      note: "A IA não faz diagnóstico nem substitui terapia.",
      screen: "chat",
    },
    {
      id: "tarefas",
      name: "Tarefas em kanban",
      status: "soon",
      title: "Transforme o que você descobriu em ações.",
      body: "Colunas simples pra organizar o que importa.",
      items: ["Arrastar e soltar.", "Funciona bem no celular."],
      screen: "kanban",
    },
    {
      id: "foco",
      name: "Foco com pomodoro",
      status: "soon",
      title: "Tempo de foco com pausas de verdade.",
      body: "Ciclos de foco e descanso ligados às suas tarefas, com registro simples de quanto você praticou na semana.",
      items: ["Sessões de 25 minutos, ajustáveis.", "Histórico semanal."],
      screen: "pomodoro",
    },
    {
      id: "especialistas",
      name: "Profissionais",
      status: "soon",
      title: "Quando for hora, fale com quem estudou pra isso.",
      body: "Encontre terapeutas e psicólogos, veja a formação de cada um e agende. Você escolhe se compartilha o seu mapa e o que ele pode ver.",
      items: ["Você controla o que é compartilhado."],
      screen: "professionals",
    },
  ] satisfies FeatureBlock[],
};

export const statusLabel: Record<FeatureStatus, string> = {
  available: "Disponível",
  soon: "Em breve",
};

export const privacy = {
  eyebrow: "Privacidade e método",
  title: "Seus dados são seus. Quem vê o quê, você decide.",
  items: [
    {
      term: "Compartilhar é uma escolha.",
      detail: "Um profissional só acessa o que você libera, e você pode revogar quando quiser.",
    },
    {
      term: "Dados tratados conforme a LGPD.",
      detail: "[Texto legal a definir com o jurídico: base legal, retenção, exclusão sob pedido.]",
    },
    {
      term: "Reflexão, não diagnóstico.",
      detail:
        "O Eneagrama é um modelo de autoconhecimento. Ele não identifica transtornos e não substitui avaliação clínica.",
    },
    {
      term: "De onde vem o método.",
      detail:
        "[Texto do Jonatan: origem do Eneagrama usado, como o teste foi construído e revisado, referências.]",
    },
  ],
  policyLink: "Ler a política de privacidade",
};

export const professionals = {
  eyebrow: "Para profissionais",
  title: "Atenda com mais contexto desde a primeira sessão.",
  body: "No The Self Map, o seu cliente chega com o mapa pronto e escolhe compartilhar com você. Você vê o que ele liberou e organiza a sua agenda no mesmo lugar.",
  items: [
    "Acesso ao que o cliente compartilha, e nada além disso.",
    "Agenda integrada ao perfil do cliente.",
    "Seu perfil e a sua abordagem visíveis no diretório.",
  ],
  cta: "Quero ser profissional parceiro",
  note: "[Critérios de entrada e verificação do registro a definir.]",
};

export type BillingCycle = "monthly" | "yearly";

export const plans = {
  eyebrow: "Planos",
  title: "Comece grátis. Assine quando fizer sentido.",
  billingLabel: "Cobrança",
  cycles: [
    { value: "monthly", label: "Mensal" },
    { value: "yearly", label: "Anual" },
  ] satisfies { value: BillingCycle; label: string }[],
  free: {
    name: "Gratuito",
    price: "R$ 0",
    items: [
      "Teste de Eneagrama completo",
      "Resultado com tipo, asas e direções",
      "[Limite de uso do chat de IA, a definir]",
    ],
  },
  subscription: {
    name: "Assinatura",
    price: { monthly: "[R$ XX]", yearly: "[R$ XX]" } satisfies Record<BillingCycle, string>,
    period: { monthly: "/mês", yearly: "/ano" } satisfies Record<BillingCycle, string>,
    items: [
      "Mentor de IA com o seu mapa como contexto [limites a definir]",
      "Tarefas em kanban",
      "Foco com pomodoro",
      "Compartilhar o mapa com profissionais",
      "[Outros itens a definir]",
    ],
    cta: "Assinar [texto final a definir]",
  },
  note: "[Política de cancelamento e reembolso a definir.] Consultas com profissionais são cobradas à parte pelo valor de cada profissional.",
};

export const faq = {
  title: "Perguntas frequentes",
  items: [
    {
      id: "teste-gratuito",
      question: "O teste é gratuito de verdade?",
      answer:
        "Sim. Você responde as 162 afirmações e vê o seu resultado completo sem pagar. [Confirmar se pede cadastro pra salvar o resultado.]",
    },
    {
      id: "duracao",
      question: "Quanto tempo leva?",
      answer: "De 15 a 25 minutos. Responda com calma: não há resposta certa.",
    },
    {
      id: "diagnostico",
      question: "O resultado é um diagnóstico?",
      answer:
        "Não. O Eneagrama é um modelo de reflexão sobre padrões de comportamento. Ele não identifica transtornos e não substitui avaliação com um profissional de saúde.",
    },
    {
      id: "ia-terapeuta",
      question: "A IA substitui um terapeuta?",
      answer:
        "Não. O mentor ajuda você a refletir e a organizar ideias. Em temas que pedem acompanhamento, ele orienta a procurar um profissional.",
    },
    {
      id: "quem-ve",
      question: "Quem pode ver as minhas respostas?",
      answer:
        "Só você. Um profissional vê o seu mapa apenas se você compartilhar, e você pode retirar o acesso quando quiser.",
    },
    {
      id: "profissionais",
      question: "Como os profissionais são escolhidos?",
      answer:
        "[Descrever o processo real de verificação de registro (CRP/CRM) e de entrada. Não publicar até existir.]",
    },
    {
      id: "cancelar",
      question: "Posso cancelar a assinatura?",
      answer: "[Texto conforme a política definida pelo Jonatan.]",
    },
    {
      id: "momento-dificil",
      question: "Estou passando por um momento muito difícil. O que faço?",
      answer:
        "O The Self Map não é um serviço de emergência. Se você pensa em se machucar, ligue 188 (CVV, 24 horas, gratuito) ou procure o pronto atendimento mais próximo.",
    },
  ],
};

export const finalCta = {
  title: {
    before: "O mapa começa com uma pergunta. ",
    emphasis: "Responda a primeira.",
    after: "",
  } satisfies Emphasized,
  body: "162 afirmações, de 15 a 25 minutos, gratuito.",
  professionalLink: "Sou profissional",
};

// shortcut: rotas legais e formulário de profissionais ainda não existem (pendências 7 e 12).
export const pendingRoutes = {
  privacy: "/privacidade",
  terms: "/termos",
  professionalInterest: "/profissionais/interesse",
};

export const footer = {
  tagline: "Autoconhecimento com método.",
  company: "Um produto do The Self Institute.",
  columns: [
    {
      title: "Produto",
      links: [
        { label: "Teste", href: TEST_ROUTE },
        { label: "Recursos", href: "/#recursos" },
        { label: "Planos", href: "/#planos" },
        { label: "FAQ", href: "/#faq" },
      ],
    },
    {
      title: "Profissionais",
      links: [{ label: "Sou profissional", href: "/#profissionais" }],
    },
    {
      title: "Legal",
      links: [
        { label: "Termos de uso", href: pendingRoutes.terms },
        { label: "Política de privacidade", href: pendingRoutes.privacy },
      ],
    },
  ],
  crisis: {
    lead: "Em crise ou com pensamentos de se machucar?",
    action: "Ligue 188",
    rest: "(CVV, 24 horas) ou procure o pronto atendimento mais próximo.",
  },
  instagram: { handle: "@theself.mp", href: "https://www.instagram.com/theself.mp/" },
};

export const landingContent = {
  nav,
  cta,
  hero,
  problem,
  howItWorks,
  features,
  privacy,
  professionals,
  plans,
  faq,
  finalCta,
  footer,
};
