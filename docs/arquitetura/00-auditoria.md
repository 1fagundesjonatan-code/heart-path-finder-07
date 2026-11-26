# 00 — Auditoria do estado atual

Data: 2026-11-24. Base: leitura direta de `src/routes/index.tsx`, `src/routes/__root.tsx`, `src/data/enneagram.ts`, `src/server.ts`, `src/start.ts`, `src/router.tsx`, `vite.config.ts`, `package.json`, `.gitignore`. Nada foi executado: `node_modules` não está instalado nesta máquina, então build/lint não foram rodados.

## 1. O que existe

| Item | Estado | Detalhe |
|---|---|---|
| Stack | Funcional (lida de `package.json`) | TanStack Start 1.167, Router 1.168, React 19.2, Vite 8, Tailwind 4.2, shadcn (46 componentes em `src/components/ui/`), recharts 2.15, react-hook-form 7, zod 3.24, TanStack Query 5, sonner |
| Build/deploy | Vite explícito + Vercel | `vite.config.ts` declara tanstackStart (server entry `src/server.ts`), react, tailwind, tsconfig-paths e nitro com preset `vercel`. Deploy por GitHub Actions (`.github/workflows/pipeline.yml`) |
| SSR error wrapper | Funcional | `src/server.ts` + `src/start.ts` (request middleware) devolvem HTML de erro em 500; `src/lib/error-capture.ts` guarda o erro original porque o h3 engole o throw |
| Rotas | 1 rota de página | `/` (`index.tsx`, 578 linhas) + `__root.tsx`. `routeTree.gen.ts` é gerado |
| Teste de Eneagrama | Funcional ponta a ponta no cliente | 162 afirmações Likert 1–5 (`src/data/enneagram.ts`), 9 tipos com textos, fluxo intro → quiz → resultado (barras + radar top-3 por dimensão C/M/E) |
| Persistência, auth, backend, analytics, captura de lead | Não existe | Nada sai do navegador. Fechou a aba, perdeu o resultado |
| Testes, CI | Não existe | Nenhum arquivo de teste, nenhum workflow |
| Ambiente | Incompleto | `node_modules` ausente; gerenciador pnpm (`pnpm-lock.yaml`, campo `packageManager`) |

## 2. Dados do instrumento (verificado por contagem)

- 162 itens = 9 tipos x 18. Cada tipo tem 6 itens por dimensão (C, M, E), **exceto o Tipo 6: C=5, M=6, E=7**. Impacto: no radar por dimensão o Tipo 6 não é comparável; a normalização `soma / (n*5)` compensa a contagem, mas dimensões com 5–7 itens são ruidosas.
- Ordem das perguntas é fixa (`order`), igual para todos. Bom para reprodutibilidade. Os `id` não são sequenciais (ex.: 102, 20, 98), o que é ok: usar `id` como chave estável ao persistir.
- `Question.type` e `types` usam `number`, não união `1..9`. Frouxo, não quebra.
- Não existe versão do instrumento. Ao persistir respostas é obrigatório gravar `instrument_version`, senão qualquer ajuste de texto/pontuação invalida o histórico.

## 3. Problemas encontrados

Severidade: A = corrigir antes de coletar dados reais; M = corrigir na Fase 1/2; B = baixa.

### 3.1 Funcionais

| # | Local | Problema | Sev. |
|---|---|---|---|
| F1 | `index.tsx` (estado) | **Resultado não é salvo.** Nem localStorage, nem servidor. Bloqueia CRM, funil, Eneagrama AI e Mentor | A |
| F2 | `index.tsx:80-87` `choose` | `setTimeout` de 180 ms usa `idx` capturado em closure, sem cleanup. Dois cliques/teclas dentro de 180 ms: o segundo grava **na mesma pergunta** (o `current` ainda não mudou), sobrescrevendo a resposta anterior, e os dois timers fazem `setIdx(idx+1)` com o mesmo valor, então a UI avança só uma. O usuário acha que respondeu duas, respondeu uma. Timer também vaza se o componente desmontar | A |
| F3 | `index.tsx:90-103` | `useEffect` sem array de dependências: remove/adiciona o listener `keydown` em todo render. Funciona (o handler novo é sempre o atual), mas é desperdício e frágil. Além disso `e.repeat` não é ignorado: segurar a tecla "3" dispara `choose` repetidamente | M |
| F4 | `index.tsx:125` | `computeScores(answers)` roda em todo render do pai e devolve array novo; o `useMemo` de `Results` (deps incluem `ranking`) nunca memoiza de fato. Inofensivo hoje (162 itens), mas o padrão está errado | B |
| F5 | `index.tsx:39-61` | Pontuação: mínimo real é 20% (resposta 1 vale 1, não 0), mas o código comenta "0–100". A barra de um tipo totalmente rejeitado aparece em 20%. Sem item reverso: quem tende a concordar com tudo infla todos os tipos (viés de aquiescência). Sem tratamento de empate nem de "resultado inconclusivo" (top1 ≈ top2): sempre apresenta um tipo único com tom assertivo | M |
| F6 | `index.tsx:80`, `:127` | Reiniciar/voltar não confirma; é possível perder 162 respostas com um clique em "Refazer o teste" (sem persistência, sem confirmação) | M |
| F7 | `index.tsx:534` | "Imprimir / salvar PDF" usa `window.print()` sem CSS de impressão: o `::before` do `.grain` e botões saem na página. Sem PDF real | B |
| F8 | `__root.tsx:15-73`, `src/lib/error-page.ts` | 404, tela de erro e HTML de erro SSR em **inglês** ("Page not found", "This page didn't load"). `error-page.ts` tem `<html lang="en">`. `ErrorComponent` usa `console.error` direto | M |
| F9 | `__root.tsx:105` | `<html lang="en">` num site em pt-BR: leitores de tela leem com pronúncia errada e SEO de idioma incorreto | A |

### 3.2 Produto, marca e conteúdo

| # | Ponto | Observação | Sev. |
|---|---|---|---|
| P1 | **Nenhum aviso de "não é diagnóstico clínico"** em lugar algum (busca por "diagn/clínic/terapia/psic" em `src/routes` e `src/data` retornou vazio). É regra do dono. Precisa de texto na intro, no resultado e no rodapé | A |
| P2 | Intro: "O Eneagrama é um mapa antigo da alma" é afirmação histórica/espiritual não sustentada (o sistema moderno é do séc. XX). Trocar por linguagem que não prometa mais do que o teste entrega. **Texto de marca: confirmar com Jonatan** | M |
| P3 | Resultado usa verbos fortes: "Conheça quem você é", "revelar seu tipo". O teste é autorrelato sem validação psicométrica. Rotular status do instrumento como **Necessita validação** (ver doc 02, módulo Eneagrama) e suavizar a promessa | M |
| P4 | A marca/Instagram @theself.map evita citar "Eneagrama"; o produto (título, header, og:title, intro) cita 18+ vezes. **A confirmar**: a regra vale só para o Instagram ou também para o site? A resposta muda `<title>`, og, copy e nomes de rota (`/eneagrama`) | M |
| P5 | Subtipos são explicados no resultado mas **não medidos** (162 itens só cobrem tipo/asa/dimensões). "Asas", "estresse", "segurança" vêm de tabela estática por tipo, não do dado do usuário. Deve ficar claro na UI | M |
| P6 | Sem política de privacidade, termos, link de contato, consentimento ou identificação do controlador no rodapé. Obrigatório antes de coletar qualquer dado pessoal | A |

### 3.3 SEO e acessibilidade (WCAG 2.2 AA, regra global)

| # | Local | Problema | Sev. |
|---|---|---|---|
| A1 | `index.tsx:106,135` | `<Header/>` e `<Footer/>` estão **dentro** de `<main>`: perdem os landmarks `banner`/`contentinfo` | M |
| A2 | `Quiz` botões 1–5 | Sem semântica de grupo de opções (`radiogroup`/`radio` ou `aria-pressed`); a opção marcada só é distinguível por cor. Botões sem `type="button"` | A |
| A3 | `Quiz` progresso | Barra de progresso é `<div>` sem `role="progressbar"`/`aria-valuenow`; mudança de pergunta não é anunciada (`aria-live`); `scrollIntoView({behavior:"smooth"})` ignora `prefers-reduced-motion` | M |
| A4 | `index.tsx:90` | Atalhos de tecla única 1–5 e setas globais em `window`, sem forma de desligar: viola WCAG 2.1.4 (Character Key Shortcuts). Deve exigir foco no grupo de opções ou ser desativável | M |
| A5 | `index.tsx` inteiro | Zero ocorrências de `focus-visible`/`aria-*`. Botões customizados sem anel de foco visível próprio (só `--ring` do tema, não aplicado) | A |
| A6 | Textos `text-[11px]` com `text-muted-foreground` | Tamanho e contraste a verificar contra 4.5:1 (não medido nesta auditoria) | M |
| A7 | `Results` radar | O gráfico não tem alternativa textual; as barras acima cobrem os mesmos dados do tipo, mas o radar por dimensão não tem equivalente. Adicionar tabela/`aria-label` resumido | B |
| S1 | `__root.tsx:76-96` e `index.tsx:16-31` | `head` duplicado (título/descrição/og definidos na raiz e na rota). Falta `og:image`, `og:url`, `canonical`, `twitter:title/description`, `og:locale=pt_BR`. Raiz deveria ter só o genérico; cada rota seu título | M |
| S2 | Rotas futuras `/admin/*` | Precisam de `<meta name="robots" content="noindex">` e de bloqueio no `robots.txt` (não existe `public/robots.txt`) | A (quando criar admin) |
| S3 | `__root.tsx:87-95` | Fontes do Google Fonts carregadas de terceiros: envia IP do visitante ao Google (ponto LGPD) e depende de rede externa. Preferir self-host (`@fontsource-variable/fraunces`, `inter`) | M |

### 3.4 Segurança e repositório

| # | Problema | Sev. |
|---|---|---|
| X1 | **`.gitignore` não ignora `.env`** (só `*.local`, `.dev.vars`). Antes de criar qualquer `.env`, adicionar `.env`, `.env.*` e `!.env.example`. Hoje basta um `git add .` para vazar a service role | A |
| X2 | Sem validação de entrada em nenhuma fronteira (não há fronteiras ainda). Toda server function nova nasce com schema zod | — |
| X3 | Sem rate limit/anti-bot: a captura de lead pública será o primeiro endpoint exposto e o alvo óbvio de spam | A (E6) |
| X4 | (Resolvido) A guarda de 24h do bun deixou de existir com a migração para pnpm | B |

### 3.5 Qualidade de engenharia

| # | Problema | Sev. |
|---|---|---|
| Q1 | `index.tsx` mistura rota, lógica de pontuação, 7 componentes de UI. Não é testável. A pontuação (`computeScores`) deve virar função pura em `src/features/eneagrama/` com testes | M |
| Q2 | Sem testes. Pontuação, RLS e funções de métricas exigem teste desde a primeira entrega (Vitest para unidade; testes SQL/pgTAP ou script de integração para RLS) | A |
| Q3 | Sem CI (lint + typecheck + build). Fica a cargo do devops; ver doc 03 | M |
| Q4 | `routeTree.gen.ts` versionado e gerado: conflitos de merge possíveis entre branches. Regra: nunca editar à mão; regenerar rodando `vite dev`/`build` | B |

## 4. Riscos técnicos da base

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Deploy de produção sai a cada push na `main`: commit quebrado derruba produção; migration aplicada antes/depois do código errado também | Alta | Alto | Migrations antes do código que as usa; compatibilidade só durante o intervalo do deploy (uma entrega); branch de trabalho + PR com pipeline verde antes do merge |
| Edição manual de arquivos gerados (`routeTree.gen.ts`, `src/integrations/supabase/types.ts`) | Média | Médio | Nunca editar à mão; regenerar pelo build e pelo CLI do Supabase |
| Runtime serverless da Vercel: limites de duração, memória e bundle das Functions afetam server functions, jobs de IA longos e SDKs | Média | Alto | Segredos via env do projeto na Vercel; testar server function de ponta a ponta no preview antes de depender; jobs longos (sumarização) fora do request, ver doc 01 |
| Coletar dados antes de ter privacidade/consentimento | Média | Alto (jurídico) | E5 só vai ao ar com política, checkbox de consentimento e texto de finalidade |
| Instrumento sem validação apresentado como resultado "verdadeiro" | Alta | Médio (reputação) | Aviso, status "Necessita validação", linguagem de hipótese |

## 5. Correções recomendadas antes/junto da Fase 1

Pequenas e independentes, entram na Entrega 0 do plano (doc 03):

1. `.gitignore` com `.env*`.
2. `lang="pt-BR"` em `__root.tsx` e `error-page.ts`; 404/erro em português.
3. Corrigir `choose` (ignorar entrada enquanto avança, timer limpo ou avanço síncrono) e `useEffect` com deps e `e.repeat`.
4. Aviso de não-diagnóstico na intro/resultado/rodapé (texto a aprovar pelo Jonatan).
5. Semântica do quiz (radiogroup, progressbar, foco visível), landmarks corretos.
6. Extrair pontuação para função pura com testes; versionar instrumento (`enneagram-v1`).
7. Self-host das fontes.
