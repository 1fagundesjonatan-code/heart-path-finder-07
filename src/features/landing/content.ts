// Toda a copy da landing. Textos entre colchetes são placeholders pendentes (ver
// docs/design/landing-direction.md, seção 9) e bloqueiam a publicação via content.test.ts.

// Pré-lançamento: todo CTA leva pro grupo da lista de espera no WhatsApp.
export const WAITLIST_URL = "[link do grupo do WhatsApp]";

export type Emphasized = { before: string; emphasis: string; after: string };
export type FeatureStatus = "available" | "soon";
export type ScreenId = "result" | "quiz" | "chat" | "kanban" | "pomodoro" | "professionals";

export const nav = [
  { id: "recursos", label: "Recursos" },
  { id: "como-funciona", label: "Como funciona" },
  { id: "lancamento", label: "Lançamento" },
  { id: "faq", label: "FAQ" },
] as const;

export const cta = {
  primary: "Entrar na lista de espera",
  compact: "Lista de espera",
};

export const hero = {
  eyebrow: "Lista de espera aberta",
  title: {
    before: "Entenda como você funciona. Depois, ",
    emphasis: "use isso",
    after: " no seu dia a dia.",
  } satisfies Emphasized,
  lead: "O The Self Map junta teste de Eneagrama, mentor de IA, tarefas e foco num app só. Entre no grupo da lista de espera e receba o acesso antes da abertura.",
  secondary: "Ver como funciona",
  meta: ["Grupo no WhatsApp", "acesso antecipado", "gratuito pra entrar"],
  notice: "Ferramenta de reflexão. Não é diagnóstico nem substitui acompanhamento profissional.",
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
  closingCta: "Quero acesso antecipado",
  blocks: [
    {
      id: "teste",
      name: "Teste de Eneagrama",
      status: "soon",
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
      name: "Terapeutas e psicólogos",
      status: "soon",
      title: "Em breve: converse com terapeutas e psicólogos.",
      body: "Quando quiser ir além da reflexão, encontre um profissional, veja a formação de cada um e agende pelo app. Você escolhe se compartilha o seu mapa e o que ele pode ver.",
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

export const launch = {
  eyebrow: "Em breve",
  title: "O app ainda não abriu. Quem está na lista entra primeiro.",
  lead: "Estamos finalizando o The Self Map. Quem entra no grupo da lista de espera no WhatsApp recebe o acesso antes da abertura e é avisado primeiro a cada novidade.",
  itemsTitle: "O que chega no lançamento",
  items: [
    "Teste de Eneagrama completo, com tipo, asas e direções",
    "Mentor de IA com o seu mapa como contexto",
    "Tarefas em kanban",
    "Foco com pomodoro",
    "Compartilhar o mapa com profissionais",
  ],
  cta: "Garantir acesso antecipado",
};

export const faq = {
  title: "Perguntas frequentes",
  intro:
    "Ainda com dúvida? Entre no grupo da lista de espera: é por lá que avisamos tudo primeiro.",
  items: [
    {
      id: "lista-de-espera",
      question: "Como funciona a lista de espera?",
      answer:
        "Você entra num grupo no WhatsApp. Lá avisamos primeiro quando o app abrir, e quem está no grupo recebe o acesso antes. Sair é só deixar o grupo.",
    },
    {
      id: "teste-gratuito",
      question: "O teste vai ser gratuito?",
      answer: "Sim. O teste de Eneagrama completo, com o resultado, não vai ter custo.",
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
    before: "O mapa abre em breve. ",
    emphasis: "Chegue primeiro.",
    after: "",
  } satisfies Emphasized,
  body: "Entre no grupo da lista de espera no WhatsApp e receba o acesso antes da abertura.",
  launchLink: "Ver o que chega no lançamento",
};

// shortcut: rotas legais ainda não existem (pendência 7).
export const pendingRoutes = {
  privacy: "/privacidade",
  terms: "/termos",
};

export const footer = {
  tagline: "Autoconhecimento com método.",
  company: "Um produto do The Self Institute.",
  columns: [
    {
      title: "Produto",
      links: [
        { label: "Lista de espera", href: WAITLIST_URL },
        { label: "Recursos", href: "/#recursos" },
        { label: "Lançamento", href: "/#lancamento" },
        { label: "FAQ", href: "/#faq" },
      ],
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
  instagram: { handle: "@theself.map", href: "https://www.instagram.com/theself.map/" },
};

export const landingContent = {
  nav,
  cta,
  hero,
  problem,
  howItWorks,
  features,
  privacy,
  launch,
  faq,
  finalCta,
  footer,
};
