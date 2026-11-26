# The Self Map: direção de design da landing page de venda

Autora: Lais (UX/UI). Data: 2026-11-24. Status: spec pronta pra implementar. Nenhum código de produção foi alterado.

Escopo: LP B2C de venda do app The Self Map (assinatura), com uma seção secundária "Sou profissional". O manifesto do The Self Institute foi usado só pra calibrar tom (sério, sem promessa milagrosa, sem urgência falsa). Nenhuma frase, seção ou assinatura dele aparece na LP. A copy abaixo é original e focada no benefício pro usuário.

---

## 1. Análise UX do ponto de partida

| Problema | Impacto |
|----------|---------|
| A rota `/` hoje é o teste direto, sem explicar o produto | Quem chega por anúncio ou indicação não sabe que existe chat, tarefas, foco e profissionais. Só vê um quiz de 162 itens. |
| Eyebrows em `text-primary` (ouro) a 11px sobre branco | Contraste do ouro `oklch(0.72 0.13 85)` sobre branco fica em torno de 2.3:1. Reprova WCAG AA. |
| Cards de passo iguais em `grid md:grid-cols-3` (intro do teste) | É exatamente o padrão "cara de IA" que o dono rejeitou. Não repetir na LP. |
| Aviso de não diagnóstico só no rodapé do teste | Em produto de saúde mental, o aviso e o CVV 188 precisam estar visíveis fora do rodapé (lição do Zenklub). |

Decisão de rotas: a LP passa a viver em `/`. O teste move pra `/eneagrama` (rota já citada pelo dono). Todo CTA primário da LP aponta pra `/eneagrama`.

---

## 2. Referências pesquisadas

Método: leitura estruturada das páginas (WebFetch) mais captura de tela e extração de fonte, tamanho e cor computados no navegador. Screenshots em `docs/design/references/` (meia resolução, só pra consulta). Linear não foi usado: o navegador redirecionou pra um workspace logado. Alma, BetterHelp, Vittude e Psicologia Viva não foram verificados com captura, então não entram na decisão.

| # | Referência | URL | Pegar | Evitar |
|---|-----------|-----|-------|--------|
| 1 | Oura | https://ouraring.com | Tipografia editorial: display serifada leve (Editorial New 80px peso 300 no h1, 68px peso 400 no h2) com sans humanista (Akkurat) no resto. Fundo creme quente `#F7F1E8`, texto `#4A4741`, nunca preto puro sobre branco puro. Hero com um único objeto, muito ar. Rótulos pequenos em caixa alta. Prova de valor com nota de rodapé honesta ("pesquisa com N membros, autorrelato"). | Faixa promocional de topo, headline com blur decorativo, depoimentos agrupados por feature em carrossel. |
| 2 | Stoic | https://www.getstoic.com | Hero em um painel grande arredondado dividido ao meio: imagem monocromática de um lado, texto do outro (esquerda alinhada, não centralizado). Fundo cinza muito claro `#F1F2F3`, texto `#2A2A2A`. Seção de privacidade com destaque próprio. Links "Pesquisa" em cada benefício. | Grid de 6 tiles de features, banner de consentimento ocupando o hero, depender só de selo de loja como CTA. |
| 3 | Sunsama | https://www.sunsama.com | Screenshot real e grande do produto logo no hero, sem moldura decorativa. Blocos de feature alternados com rótulo, título e uma frase. Bloco "problema x solução" curto. Comparação objetiva. Headline em fragmentos curtos com quebra de linha intencional. | Linguagem de caos e palavrão, faixa de logos de empresas, carrossel de depoimentos, X vermelho e check verde ícones. |
| 4 | Things | https://culturedcode.com/things/ | Copy direta que descreve o produto em uma frase sem adjetivo. Prova por prêmio específico, não por número. Muito espaço em branco, uma coluna estreita. | Hero centralizado com ícone gigante, único ponto de entrada em vídeo. |
| 5 | Zenklub | https://www.zenklub.com.br | Estrutura de marketplace de profissionais: diretório por categoria (psicólogos, psicanalistas, terapeutas, coaches) e entrada separada "Para especialistas". Rodapé com registro profissional da empresa. Display Sora 44.8px peso 400 (leve, geométrica). | Percentuais sem metodologia, stack repetido de CTAs, foto de stock com sorriso, aviso de crise escondido no rodapé, trust de especialistas sem explicar verificação. |
| 6 | RISE Science | https://www.risescience.com | Celular que sangra pra fora do quadro no hero, texto em coluna estreita à esquerda. Tira numerada de 5 passos ("Comece pela sua biologia" até "Sinta resultados reais"). Bloco "duas leis da ciência do sono" como argumento de método. | Esfera de gradiente roxo e laranja, h1 de 102px peso 700, selo de loja repetido a cada seção, nota de 5 estrelas com contagem. |
| 7 | Headspace | https://www.headspace.com | Entrada por intenção ("que tipo de headspace você procura"), usada aqui só como inspiração pro seletor de dúvida no FAQ. | Banner de desconto, tag "Don't miss out", mascote e gradiente laranja-rosa, urgência. Anti-referência de marca. |
| 8 | Finch | https://finchcare.com | Nada visual. Útil só como contraste. | Ilustração infantil, gamificação de bichinho, headline em contorno. Infantiliza um produto que precisa de seriedade. |

Síntese do que aparece nas melhores (Oura, Stoic, Sunsama): hero alinhado à esquerda, produto real em vez de ilustração, uma só cor viva (ou nenhuma), serifa leve pra display, microcopy sóbria. O que aparece nas piores: gradientes, mascote, urgência, grid uniforme.

---

## 3. Conceito visual

**O mapa como objeto editorial.** A LP se comporta como uma publicação impressa de autoconhecimento: coluna de leitura estreita, serifa leve em corpo grande, filetes finos (hairlines) em vez de cards, seções que alternam papel branco e tinta preta, e o ouro usado como uma marca de caneta (sublinhado, ponto, preenchimento de botão), nunca como atmosfera. As telas reais do app (resultado do teste, conversa, tarefas) são o único "ilustrativo". A LP é seca de propósito: o produto é o argumento.

Três linhas pra o dev guardar:
1. Branco e tinta alternados, ouro só em preenchimento ou marca fina.
2. Texto grande em serifa leve, tudo alinhado à esquerda, assimetria 5/7 colunas.
3. Telas reais do app em moldura de aparelho, zero stock, zero ilustração decorativa.

---

## 4. Tokens

### 4.1 Paleta (mantida, sem cor nova)

Fonte da verdade: `src/styles.css`. Não alterar valores existentes. Papéis por proporção de área da página:

| Token | Valor | Papel | Proporção |
|-------|-------|-------|-----------|
| `--background` | `oklch(1 0 0)` | Seções claras (hero, como funciona, FAQ) | ~55% |
| `--foreground` (tinta) | `oklch(0.14 0 0)` | Texto, e fundo das seções escuras (problema, privacidade, CTA final) | ~35% (texto + seções escuras) |
| `--primary` (ouro) | `oklch(0.72 0.13 85)` | Botão primário, sublinhado de ênfase, marcador de item ativo, ponto de status | ~5% |
| `--gold-light` | `oklch(0.84 0.1 85)` | Texto de ênfase sobre fundo tinta, hover do botão primário | ~2% |
| `--muted-foreground` | `oklch(0.52 0 0)` | Texto secundário em fundo claro | 
| `--border` | `oklch(0.14 0 0 / 12%)` | Hairlines | 
| `--secondary` / `--muted` | `oklch(0.96 0 0)` | Fundo de bloco de produto (atrás do device), faixas | ~3% |

Regras de contraste (calculadas, validar com ferramenta antes do merge):
- Ouro como cor de TEXTO só sobre fundo tinta (`--foreground`). Sobre branco o ouro nunca é texto. Eyebrows em fundo claro usam `text-foreground/70` com um traço de ouro de 24x2px antes.
- Texto sobre botão ouro: `--primary-foreground` (tinta). Razão aproximada 8:1.
- Sobre fundo tinta: texto corrido `oklch(0.86 0 0)`, secundário `oklch(0.7 0 0)` (mesmos valores do `.dark`, ~8:1).

### 4.2 Tokens novos (apenas utilitários, mesma paleta)

Adicionar em `src/styles.css` dentro de `@layer utilities` ou como classes de seção:

```css
.section-ink {
  background: var(--foreground);
  color: oklch(0.92 0 0);
  --muted-foreground: oklch(0.7 0 0);
  --border: oklch(1 0 0 / 14%);
}
.mark-gold {
  background-image: linear-gradient(var(--primary), var(--primary));
  background-repeat: no-repeat;
  background-position: 0 92%;
  background-size: 100% 0.12em;
}
.section-ink .mark-gold { background-image: linear-gradient(var(--gold-light), var(--gold-light)); }
```

`.mark-gold` é o sublinhado de ênfase (substitui o `text-primary` em palavra do h1 atual, que reprova contraste em fundo branco).

### 4.3 Tipografia

Manter Fraunces (display) e Inter (UI). Refino: Fraunces passa a ser usado em peso leve com eixo óptico, e itálico pra ênfase. Atualizar o link do Google Fonts em `src/routes/__root.tsx`:

```
family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=Inter:wght@400;500;600
```

Ajuste global em `h1, h2, h3`: `font-variation-settings: "opsz" 144, "SOFT" 0;` apenas nos displays (`.display`). Em h3 menores deixar opsz automático.

| Uso | Mobile (375) | md (768) | lg (1280) | Peso | Line-height | Tracking |
|-----|-------------|----------|-----------|------|-------------|----------|
| Display (h1 hero) | 40px | 60px | 80px | Fraunces 300 | 1.04 | -0.02em |
| h2 de seção | 32px | 44px | 56px | Fraunces 300 | 1.08 | -0.015em |
| h3 de feature | 24px | 28px | 32px | Fraunces 400 | 1.15 | -0.01em |
| Lead (subtítulo) | 18px | 20px | 20px | Inter 400 | 1.55 | 0 |
| Corpo | 17px | 17px | 18px | Inter 400 | 1.65 | 0 |
| Eyebrow | 12px | 12px | 12px | Inter 500, caixa alta | 1.2 | 0.16em |
| Meta, legenda | 14px | 14px | 14px | Inter 400 | 1.5 | 0 |
| Botão | 15px | 15px | 15px | Inter 500 | 1 | 0.01em (sem caixa alta, diferente do teste) |

Regras: `text-wrap: balance` em h1/h2/h3, `text-wrap: pretty` em parágrafos. Ênfase de palavra no display: `<em>` em itálico Fraunces 300 + `.mark-gold`. Máximo 1 ênfase por título. Números de plano e métricas: `font-variant-numeric: tabular-nums`. Largura máxima de parágrafo 62ch.

Nota: o botão da LP usa caixa mista (não `uppercase tracking-[0.16em]` do teste). Ao implementar, unificar o botão do teste depois pra não conviver dois estilos (decisão "sem backward compat", mexer no teste fica pra PR separado).

### 4.4 Grid, espaço e forma

| Item | Valor |
|------|-------|
| Container | `max-w-[1200px]`, padding lateral 20px (mobile), 32px (md), 48px (lg) |
| Grid | 12 colunas, gap 20px mobile, 32px md+. Hero e features em 5/7 (texto/produto). Leitura em 6 colunas centrais no problema. |
| Ritmo vertical de seção | `py-20` mobile, `py-28` md, `py-36` lg. Entre elementos dentro da seção, escala 8/16/24/40/64. |
| Radius | Manter `--radius: 0.75rem`. Cartão de produto (device) `rounded-[2.5rem]` externo, tela `rounded-[2rem]` (concêntrico: externo = interno + bezel 8px). Botões `rounded-full` (igual ao teste). Elementos de texto, sem card. |
| Bordas e sombra | Hairline `1px border-border`. Sombra só no device: `0 1px 2px oklch(0.14 0 0 / 8%), 0 24px 48px -12px oklch(0.14 0 0 / 22%)`. Nunca borda e sombra no mesmo bloco de texto. |
| Hit area | Mínimo 44x44px em todo botão, link de nav e item de acordeão |

### 4.5 Imagem e mockup

- Telas reais do app dentro de `DeviceFrame` (CSS puro, sem imagem): bezel 8px `oklch(0.14 0 0)`, notch discreto, tela 390x844 renderizada em `<img>` com `width`/`height` explícitos, `loading="lazy"` (exceto hero, `fetchpriority="high"`), formato AVIF/WebP, `outline: 1px solid rgb(0 0 0 / 0.1); outline-offset: -1px`.
- Capturas são feitas do próprio app em ambiente local com dados de exemplo fictícios (nome "Ana", sem foto de pessoa real). Resultado do teste e quiz existem hoje. Chat, kanban, pomodoro e profissionais ainda não têm tela: ver seção 7 (pendências) e a regra da etiqueta de status (seção 5.4).
- Zero foto de banco de imagem. Se o Jonatan fornecer fotos reais de profissionais parceiros, usar em preto e branco com `grayscale` e tratamento único (ver pendências).
- Desktop: um segundo recorte horizontal (janela de navegador sem chrome, 1200x760) pra tela de kanban e profissionais, porque são telas de trabalho.

### 4.6 Ícones

Lucide, stroke 1.5, 20px, somente quando acompanham ação (seta do CTA, chevron do FAQ, cadeado na privacidade). Zero ícone decorativo em bloco de feature. O número do passo em serifa grande substitui ícone.

### 4.7 Motion

| Elemento | Comportamento |
|----------|--------------|
| Entrada de seção | Uma vez, ao 15% visível: `opacity 0 to 1` + `translateY(12px) to 0`, 400ms `cubic-bezier(.2,.7,.2,1)`. Filhos em stagger de 60ms, máximo 4. Via `IntersectionObserver` (sem lib). |
| Header | Ao rolar 8px: ganha `border-b` e `bg-background/90` com `backdrop-blur-sm`. Transição só de `border-color` e `background-color`, 200ms. |
| Botão primário | Seta desloca 4px no hover (já usado no teste), `scale(0.97)` no press, 150ms. Nunca `transition: all`. |
| Troca da tela do device (features) | Crossfade de 250ms entre imagens empilhadas. |
| Sublinhado `.mark-gold` | Desenha da esquerda pra direita uma vez, 600ms, atraso de 300ms, só no hero. |
| Reduced motion | `@media (prefers-reduced-motion: reduce)`: sem translate, sem sublinhado animado (já desenhado), troca de tela instantânea. Tudo visível sem JS. |
| Proibido | Parallax, elementos flutuando, marquee de logos, contadores animados, cursor customizado, confete. |

---

## 5. Arquitetura da LP, seção por seção (mobile-first)

Convenções: copy em pt-BR, sem travessão. Textos entre colchetes são placeholders. Todos os CTAs primários: "Fazer o teste gratuito" para `/eneagrama`.

Estrutura de pastas sugerida (nomes em inglês):

```
src/features/landing/
  components/
    site-header.tsx   hero.tsx   problem.tsx   how-it-works.tsx
    feature-story.tsx   privacy.tsx   professionals.tsx
    plans.tsx   faq.tsx   final-cta.tsx   site-footer.tsx
    device-frame.tsx   section-header.tsx   status-pill.tsx   reveal.tsx
  content.ts          (toda a copy e dados de FAQ/planos em um arquivo tipado)
src/routes/index.tsx (LP)   src/routes/eneagrama.tsx (teste)
```

### 5.1 Header

Objetivo: orientar e oferecer o CTA em qualquer ponto.

- Mobile: logo à esquerda (círculo "S" + "The Self Map", reutilizar `SiteHeader` do teste como base), botão "Fazer o teste" (compacto, 44px de altura) e botão menu. Menu abre `Sheet` (shadcn já instalado) com links em Fraunces 28px, CTA no fim.
- Desktop (lg): logo, nav centrada: Como funciona, Recursos, Profissionais, Planos, FAQ. À direita: "Entrar" (ghost) e "Fazer o teste gratuito" (primário).
- Sticky, altura 64px (mobile) e 72px (desktop). Links âncora com `scroll-margin-top` igual à altura. Skip link já existente (`#conteudo`).
- Acessibilidade: `<nav aria-label="Principal">`, item ativo com `aria-current="location"`, menu mobile com foco preso e Esc fecha.

### 5.2 Hero

Objetivo: dizer o que é, pra quem é e levar ao teste, em 5 segundos.

Layout mobile: coluna única. Eyebrow, h1, lead, CTA, micro-linha, e logo abaixo o device recortado na base (sangra fora da dobra, cerca de 70% visível). Desktop: grid 12, texto nas colunas 1 a 5, device nas colunas 7 a 12, alinhados pelo topo da linha de base do h1, o device ultrapassa a borda direita do container em 48px. Fundo branco, sem gradiente. Um bloco `--secondary` de 70% da altura atrás do device (retângulo plano, sem blur).

Copy:
- Eyebrow: `Autoconhecimento com método`
- H1: `Entenda como você funciona. Depois, *use isso* no seu dia.` (ênfase "use isso" com itálico e `.mark-gold`)
- Lead: `O The Self Map começa com um teste de Eneagrama gratuito e continua com um mentor de IA, tarefas, foco e, quando você quiser, profissionais de verdade.`
- CTA primário: `Fazer o teste gratuito` (seta)
- CTA secundário (link de texto com sublinhado fino): `Ver como funciona`
- Micro-linha: `162 afirmações · de 15 a 25 minutos · resultado na hora`
- Aviso discreto abaixo, 14px, filete de ouro à esquerda: `Ferramenta de reflexão. Não é diagnóstico nem substitui acompanhamento profissional.` (reaproveitar `NonDiagnosticNotice`)

Visual: screenshot real da tela de resultado do teste (distribuição por tipo) no device. Sobre o canto inferior esquerdo do device, um recorte de mensagem do chat (cartão `bg-card`, hairline, 2 linhas) sobreposto em 24px, pra sinalizar que há mais que o teste. Sem ilustração, sem estrela, sem selo de loja.

Acessibilidade: h1 único da página; imagens com `alt` descritivo ("Tela de resultado do teste mostrando a distribuição de pontuação pelos nove tipos"); o recorte do chat é decorativo (`alt=""`).

### 5.3 Problema

Objetivo: nomear a dor com precisão, sem dramatizar.

Fundo `section-ink`. Layout: desktop 12 colunas, título nas colunas 1 a 5 (sticky `top-28`), três afirmações nas colunas 7 a 12 separadas por hairlines. Mobile: título e depois as afirmações empilhadas.

Copy:
- Eyebrow: `O ponto de partida`
- H2: `Você pensa bastante sobre si. Quase nunca com método.`
- Afirmação 1 (h3): `Os mesmos padrões voltam.` Texto: `Na rotina, no trabalho, nas relações. Sem um mapa, cada repetição parece coincidência.`
- Afirmação 2: `As anotações ficam espalhadas.` Texto: `Insights num caderno, tarefas em outro app, metas num documento. Nada conversa entre si.`
- Afirmação 3: `Autoconhecimento e acompanhamento vivem separados.` Texto: `O que você descobre sozinho raramente chega inteiro até a sessão com um profissional.`

Visual: nenhum. É a única seção sem produto, pra dar respiro (a tipografia faz o trabalho). Sem ícones, sem X vermelho.

### 5.4 Como funciona (3 passos)

Objetivo: mostrar o caminho curto e a razão do teste ser gratuito.

Layout: tira horizontal no desktop (3 colunas ligadas por um filete de 1px com um ponto de 8px ouro sobre cada número), vertical no mobile com o filete à esquerda. Números 01, 02, 03 em Fraunces 300, 64px, cor tinta, com barra de ouro 3px abaixo. Cada passo tem um recorte de tela real (sem moldura de aparelho, só `rounded-xl` com hairline).

Copy:
- Eyebrow: `Como funciona`
- H2: `Três passos, do mapa à prática.`
- 01 `Responda o teste.` `162 afirmações, na sua velocidade, em cerca de 15 a 25 minutos. Gratuito. Você pode pausar e continuar.` (confirmar se pausar é suportado, ver pendências) Visual: tela do quiz (existe).
- 02 `Leia o seu mapa.` `Seu tipo, as asas e as direções de estresse e segurança, explicados em linguagem direta, com a pontuação de todos os nove tipos.` Visual: tela de resultado (existe).
- 03 `Aplique no dia a dia.` `Converse com o mentor de IA, organize tarefas, foque com o pomodoro e, se quiser, compartilhe seu mapa com um profissional.` Visual: composição de chat e kanban (mock até existir).
- CTA ao fim, alinhado à esquerda: `Fazer o teste gratuito`

### 5.5 Recursos (layout não-grid: "história fixa")

Objetivo: mostrar cada função como parte de um fluxo, não como lista de cards.

Mecânica no desktop (lg+): duas colunas. Coluna esquerda (cols 1 a 5) rola com 5 blocos de texto, cada um com altura de aproximadamente 70vh. Coluna direita (cols 7 a 12) é um `DeviceFrame` sticky (`top-24`) cuja tela troca em crossfade conforme o bloco ativo (IntersectionObserver com `rootMargin: -40% 0px -40% 0px`). Bloco ativo: texto em opacidade 100%, inativos em 45%; marcador à esquerda do bloco ativo, `border-l-2 border-primary`.

Mobile e reduced motion: sem sticky. Cada bloco é empilhado com sua própria tela logo abaixo do texto (device recortado na base). Zero JS necessário nesse modo.

Cada bloco: etiqueta de status (`StatusPill`), h3 serifa, parágrafo de 2 a 3 linhas, lista curta de 2 itens com ponto de ouro, e nenhum ícone.

`StatusPill`: texto 12px caixa alta. "Disponível" = fundo `--primary`, texto tinta. "Em breve" = contorno hairline, texto `muted-foreground`, sem data. Só pode haver "Em breve" pra o que de fato está no roadmap (ver pendências).

Eyebrow da seção: `O que tem dentro`. H2: `Um lugar só pro que você descobre e pro que você faz com isso.`

Blocos:

1. Teste de Eneagrama (`Disponível`)
   - h3: `Um teste que leva a sério o seu tempo.`
   - Texto: `162 afirmações respondidas em escala de 1 a 5, com resultado completo: tipo, asas, direções de estresse e segurança e pontuação dos nove tipos.`
   - Itens: `Gratuito, sempre.` (confirmar) / `Resultado na hora, sem esperar e-mail.`
   - Tela: resultado do teste (existe).

2. Mentor de IA (`[Disponível | Em breve]`)
   - h3: `Converse com alguém que já leu o seu mapa.`
   - Texto: `Pergunte por que você reage de determinado jeito, peça um exercício pra semana ou organize uma decisão difícil. O mentor usa o seu resultado como contexto.`
   - Itens: `Responde em linguagem simples.` / `Diz quando o assunto pede um profissional.`
   - Linha de aviso (14px): `A IA não faz diagnóstico nem substitui terapia.`
   - Tela: conversa com 3 mensagens (mock).

3. Tarefas em kanban (`[status]`)
   - h3: `Transforme o que você descobriu em ações.`
   - Texto: `Colunas simples pra organizar o que importa. Ligue cada tarefa a um objetivo do seu mapa pra não perder o fio.` (confirmar se existe o vínculo tarefa e mapa, senão remover a segunda frase)
   - Itens: `Arrastar e soltar.` / `Funciona bem no celular.`
   - Tela: board com 3 colunas (mock). Desktop usa recorte horizontal.

4. Foco com pomodoro (`[status]`)
   - h3: `Tempo de foco com pausas de verdade.`
   - Texto: `Ciclos de foco e descanso ligados às suas tarefas, com registro simples de quanto você praticou na semana.`
   - Itens: `Sessões de 25 minutos, ajustáveis.` / `Histórico semanal.`
   - Tela: cronômetro grande com tarefa atual (mock).

5. Profissionais (`[status]`)
   - h3: `Quando for hora, fale com quem estudou pra isso.`
   - Texto: `Encontre terapeutas e psicólogos, veja a formação de cada um e agende. Você escolhe se compartilha o seu mapa e o que ele pode ver.`
   - Itens: `Registro profissional conferido.` (somente se a verificação existir) / `Você controla o que é compartilhado.`
   - Tela: lista de profissionais com nome, registro (CRP) e abordagem, SEM foto de pessoa real até haver autorização (usar iniciais em círculo).

Após o bloco 5, CTA: `Começar pelo teste gratuito`.

### 5.6 Privacidade e método

Objetivo: transformar medo (dados sensíveis de saúde mental) em decisão informada.

Fundo `section-ink`. Layout: título nas colunas 1 a 5, lista de definição (`<dl>`) nas colunas 7 a 12 com hairlines. Mobile empilhado. Sem ícones; um cadeado Lucide 20px somente ao lado do eyebrow.

Copy:
- Eyebrow: `Privacidade e método`
- H2: `Seus dados são seus. Quem vê o quê, você decide.`
- Item 1: `Compartilhar é uma escolha.` `Um profissional só acessa o que você libera, e você pode revogar quando quiser.`
- Item 2: `Dados tratados conforme a LGPD.` `[Texto legal a definir com o jurídico: base legal, retenção, exclusão sob pedido.]`
- Item 3: `Reflexão, não diagnóstico.` `O Eneagrama é um modelo de autoconhecimento. Ele não identifica transtornos e não substitui avaliação clínica.`
- Item 4: `De onde vem o método.` `[Texto do Jonatan: origem do Eneagrama usado, como o teste foi construído e revisado, referências.]`
- Link discreto: `Ler a política de privacidade` (placeholder de rota)

Sem números inventados e sem selo que não exista (nada de "certificado", "aprovado por").

### 5.7 Sou profissional

Objetivo: captar terapeutas e psicólogos sem desviar o fluxo B2C (seção secundária, claramente separada).

Fundo `--secondary` (cinza claro), numa faixa com `border-y`. Layout: texto nas colunas 1 a 6, à direita um recorte de tela horizontal (lista de clientes que compartilharam dados, com nomes fictícios) numa janela de navegador sem decoração. Mobile: texto e depois o recorte.

Copy:
- Eyebrow: `Para profissionais`
- H2: `Atenda com mais contexto desde a primeira sessão.`
- Texto: `No The Self Map, o seu cliente chega com o mapa pronto e escolhe compartilhar com você. Você vê o que ele liberou e organiza a sua agenda no mesmo lugar.`
- Lista de 3 itens em linhas com hairline (sem ícone):
  - `Acesso ao que o cliente compartilha, e nada além disso.`
  - `Agenda integrada ao perfil do cliente.`
  - `Seu perfil e a sua abordagem visíveis no diretório.`
- CTA (secundário, outline): `Quero ser profissional parceiro` para um formulário de interesse (nome, registro profissional, e-mail). Sem login, sem preço.
- Nota 14px: `[Critérios de entrada e verificação do registro a definir.]`

### 5.8 Planos (somente estrutura, preços placeholder)

Objetivo: deixar claro o que é grátis e o que é assinatura, sem forçar escolha.

Não usar 3 cartões iguais. Duas colunas desiguais: `Gratuito` (cols 1 a 5) e `Assinatura` (cols 6 a 12). A assinatura tem fundo tinta (`section-ink` dentro de um bloco `rounded-2xl`, o único bloco em cartão da página), o gratuito é só texto com hairline. Mobile: empilhados, assinatura primeiro? Não: gratuito primeiro (entrada), assinatura depois.

Interruptor mensal/anual: `ToggleGroup` (shadcn) com rótulo `Cobrança`. Desconto anual: só exibir se o Jonatan definir (preço riscado só com preço de tabela real).

Copy e dados (todos marcados):
- Eyebrow: `Planos`
- H2: `Comece grátis. Assine quando fizer sentido.`
- Gratuito: preço `R$ 0`. Lista: `Teste de Eneagrama completo` / `Resultado com tipo, asas e direções` / `[Limite de uso do chat de IA, a definir]`. CTA: `Fazer o teste gratuito`.
- Assinatura: preço `[R$ XX]/mês` e `[R$ XX]/ano` (placeholder, o Jonatan define). Lista: `Mentor de IA com o seu mapa como contexto [limites a definir]` / `Tarefas em kanban` / `Foco com pomodoro` / `Compartilhar o mapa com profissionais` / `[Outros itens a definir]`. CTA: `Assinar [texto final a definir]`.
- Nota abaixo: `[Política de cancelamento e reembolso a definir.] Consultas com profissionais são cobradas à parte pelo valor de cada profissional.` (confirmar o modelo de cobrança do marketplace)
- Etiqueta visível só no ambiente de desenvolvimento: `PLACEHOLDER` (remover antes de publicar).

Regras: sem selo "mais popular" (não há dado), sem contagem regressiva, sem "últimas vagas".

### 5.9 FAQ

Objetivo: remover as últimas objeções e reforçar o aviso de saúde.

Componente: `Accordion` (shadcn). Uma coluna de 7 colunas à direita no desktop, título à esquerda. Trigger com altura mínima 56px, chevron Lucide. Primeiro item aberto. `aria-expanded` e `aria-controls` já vêm do componente. Hash por pergunta pra link direto.

Copy:
- H2: `Perguntas frequentes`
- `O teste é gratuito de verdade?` `Sim. Você responde as 162 afirmações e vê o seu resultado completo sem pagar. [Confirmar se pede cadastro pra salvar o resultado.]`
- `Quanto tempo leva?` `De 15 a 25 minutos. Responda com calma: não há resposta certa.`
- `O resultado é um diagnóstico?` `Não. O Eneagrama é um modelo de reflexão sobre padrões de comportamento. Ele não identifica transtornos e não substitui avaliação com um profissional de saúde.`
- `A IA substitui um terapeuta?` `Não. O mentor ajuda você a refletir e a organizar ideias. Em temas que pedem acompanhamento, ele orienta a procurar um profissional.`
- `Quem pode ver as minhas respostas?` `Só você. Um profissional vê o seu mapa apenas se você compartilhar, e você pode retirar o acesso quando quiser.`
- `Como os profissionais são escolhidos?` `[Descrever o processo real de verificação de registro (CRP/CRM) e de entrada. Não publicar até existir.]`
- `Posso cancelar a assinatura?` `[Texto conforme a política definida pelo Jonatan.]`
- `Estou passando por um momento muito difícil. O que faço?` `O The Self Map não é um serviço de emergência. Se você pensa em se machucar, ligue 188 (CVV, 24 horas, gratuito) ou procure o pronto atendimento mais próximo.`

### 5.10 CTA final

Objetivo: último convite, com a menor fricção possível.

Fundo `section-ink`, `py-28` a `py-40`. Alinhado à esquerda, h2 em 56 a 72px.

Copy:
- H2: `O mapa começa com uma pergunta. *Responda a primeira.*`
- Texto: `162 afirmações, de 15 a 25 minutos, gratuito.`
- Botão primário grande (ouro, 56px de altura): `Fazer o teste gratuito`
- Link terciário: `Sou profissional`

### 5.11 Footer

Fundo claro, `border-t`. Mobile: coluna única, desktop 4 colunas.

- Coluna 1: logo "The Self Map" + frase curta `Autoconhecimento com método.` + `Um produto do The Self Institute.`
- Coluna 2 Produto: Teste, Recursos, Planos, FAQ.
- Coluna 3 Profissionais: Sou profissional, Diretório (se existir).
- Coluna 4 Legal: Termos de uso, Política de privacidade (placeholders).
- Faixa de segurança, visível e em destaque, antes do copyright: `Em crise ou com pensamentos de se machucar? Ligue 188 (CVV, 24 horas) ou procure o pronto atendimento mais próximo.` Link `tel:188`.
- Faixa final: aviso de não diagnóstico (`NonDiagnosticNotice short`), `@theself.mp` (Instagram), `© ano`.

---

## 6. Responsividade e acessibilidade (resumo executável)

Responsividade
- Mobile-first. Testar 375, 768 e 1440. Breakpoints `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
- Hero: 1 coluna até `lg`; 5/7 em `lg`. Device sempre com `max-w` e `aspect-ratio` fixos pra evitar layout shift.
- Features: sticky só em `lg+`. Abaixo, blocos empilhados.
- Planos: empilhados até `lg`.
- CTA primário sempre visível: header (desktop), hero, fim de "como funciona", fim de recursos, planos, CTA final. No mobile, barra fixa inferior opcional com `Fazer o teste gratuito` aparece após o hero sair da tela e some no CTA final (altura 56px, `safe-area-inset-bottom`).

Acessibilidade (WCAG 2.2 AA)
- Landmarks: `header`, `nav`, `main#conteudo`, `footer`; skip link; um único h1; h2 por seção, h3 por bloco.
- Contraste validado nas combinações da seção 4.1. Ouro nunca como texto sobre branco.
- Foco visível: outline 2px `--foreground` com offset 2px em fundo claro, `--gold-light` em fundo tinta.
- Teclado: menu mobile com foco preso e Esc; acordeão com setas; seção de features navegável por Tab sem depender do sticky.
- `prefers-reduced-motion` desliga toda a movimentação (seção 4.7).
- Imagens de produto com `alt` descritivo; recortes decorativos com `alt=""`.
- Alvos de toque de 44px; espaço de 8px entre alvos adjacentes.
- Aviso de não diagnóstico e CVV 188 em texto real, nunca só em imagem.
- `lang="pt-BR"`, `aria-live="polite"` apenas no toggle de preço (anuncia o novo valor).

---

## 7. FOMO, de forma honesta

A regra global da 2V pede FOMO, mas o tom da marca exclui urgência artificial. Aplicação permitida e verdadeira:

| Elemento | Uso | Condição |
|----------|-----|----------|
| CTA claro e repetido | Seis pontos de CTA ao teste gratuito | Sempre |
| Prova de valor | Telas reais do produto em todas as seções de recurso | Sempre |
| Credibilidade | Método, registro profissional conferido, LGPD, aviso de não diagnóstico | Só quando o fato existir |
| Progresso | Micro-linha "resultado na hora"; no teste, barra de progresso já existente | Sempre |
| Acesso antecipado | Etiqueta "Em breve" nas funções não lançadas | Só se estiverem no roadmap, sem data inventada |
| Prova social | Depoimentos reais com nome e consentimento, contagem de testes realizados | Só com dado real. Até lá, a seção não existe. |

Não usar: contagem regressiva, "restam X vagas", "N pessoas estão vendo isso agora", notificações falsas, preço riscado sem preço de tabela real, selo "mais popular".

---

## 8. Checklist de implementação

1. Mover o teste pra `src/routes/eneagrama.tsx` e criar a LP em `src/routes/index.tsx` (head com title e description novos, `og:image` com tela do resultado).
2. Atualizar link do Google Fonts (seção 4.3) e adicionar utilitários `.section-ink`, `.mark-gold` (seção 4.2). Não alterar os tokens existentes.
3. Criar `DeviceFrame`, `StatusPill`, `Reveal`, `SectionHeader` antes das seções.
4. Capturar as telas reais (resultado e quiz) com dados fictícios; exportar em AVIF/WebP em 2 densidades.
5. Montar as telas "mock" de chat, kanban, pomodoro e profissionais como componentes estáticos de apresentação, marcadas no código como prévia, e substituí-las por captura real quando as features existirem (sem camada de compatibilidade).
6. Toda a copy em `content.ts` tipado. Placeholders com prefixo visível `[` e teste que falha o build se algum `[` sobrar em produção (checagem simples por string no `content.ts` em `NODE_ENV=production`).
7. Lighthouse mobile: LCP < 2.5s (imagem do hero com `fetchpriority="high"`, fontes com `display=swap` e preload do Fraunces 300), CLS < 0.1, bundle da LP < 200KB gz.
8. Teste manual com teclado, leitor de tela e `prefers-reduced-motion`.

---

## 9. Pendências de conteúdo pro Jonatan

| # | Item | Por que bloqueia | Onde entra |
|---|------|------------------|-----------|
| 1 | Preços (mensal, anual), desconto anual, trial, política de cancelamento e reembolso | Seção de planos só tem estrutura | 5.8, FAQ |
| 2 | Quais funções existem no lançamento (IA, kanban, pomodoro, profissionais) e quais são "Em breve" | Define a etiqueta de status e o que pode ser capturado | 5.4, 5.5 |
| 3 | Modelo de cobrança das consultas com profissionais (dentro da assinatura ou à parte) | A nota dos planos afirma "à parte" | 5.8 |
| 4 | Depoimentos reais com nome, cargo e autorização por escrito | Sem isso não há prova social | Nova seção opcional após 5.5 |
| 5 | Fotos reais (profissionais parceiros, fundador) com autorização de uso | Evita banco de imagem | 5.7, 5.11 |
| 6 | Processo real de verificação de profissionais (CRP/CRM) e critérios de entrada | Afirmação de confiança precisa ser verdadeira | 5.5, 5.7, FAQ |
| 7 | Textos legais: termos de uso, política de privacidade, LGPD (base legal, retenção, exclusão), consentimento de compartilhamento com profissional | Jurídico | 5.6, 5.11 |
| 8 | Texto de método: de onde vem o teste de 162 afirmações, quem revisou, referências | Credibilidade da seção de ciência | 5.6 |
| 9 | O teste exige cadastro pra salvar o resultado? Dá pra pausar e continuar? | Altera a copy do hero, do passo 01 e do FAQ | 5.2, 5.4, FAQ |
| 10 | Existe vínculo entre tarefa e objetivo do mapa? A IA usa o resultado como contexto? | Copy de recursos promete isso | 5.5 |
| 11 | Domínio, e-mail de contato e canais oficiais (Instagram `@theself.mp`, outros) | Footer e meta tags | 5.11 |
| 12 | Formulário de profissionais: pra onde vai (lista de espera, CRM, e-mail) | CTA da seção profissional | 5.7 |
| 13 | Autorização pra usar o nome The Self Institute e o Jonatan no rodapé e na seção de método | Marca e direito de imagem | 5.11 |

---

## 10. Itens não verificados nesta pesquisa

- Fontes comerciais (Editorial New e Akkurat da Oura, Visuelt Pro da Stoic) não são usadas aqui. Fraunces leve cobre o papel editorial sem custo de licença.
- Capturas das referências estão em meia resolução e mostram só a dobra superior. As estruturas completas de seção vêm da leitura das páginas.
- Valores de contraste foram estimados a partir dos tokens `oklch`. Rodar um checador (por exemplo o do DevTools ou axe) nas combinações finais antes de fechar.
