# The Self Map (The Self Institute)

Plataforma do The Self Institute: teste público de autoconhecimento (Eneagrama, sem caráter de diagnóstico), captação de leads/CRM e painel administrativo (17 módulos planejados) no mesmo app. Repositório da conta do cliente (`1fagundesjonatan-code`).

## Stack

- TanStack Start (React 19, Vite 8) com nitro, preset `vercel` (saída em `.vercel/output`)
- Tailwind v4 + shadcn/ui (style `new-york`)
- Supabase: Postgres com RLS, Auth, via `@supabase/ssr` (projeto próprio, staging e prod)
- Zod nas fronteiras, TanStack Query, react-hook-form
- pnpm, Vitest, ESLint + Prettier
- Deploy: Vercel via GitHub Actions (`.github/workflows/pipeline.yml`)

## Estrutura

```
src/
├── routes/                 # Rotas TanStack (finas): /, /entrar, /admin/*
├── features/               # Módulos por contexto: admin-shell, auth, dashboard, eneagrama, users
├── shared/                 # Papéis e regras compartilhadas
├── integrations/supabase/  # Clientes (browser, request, admin), env, tipos gerados
├── components/ hooks/ lib/ data/
├── server.ts               # Entry SSR com wrapper de erro
└── router.tsx / start.ts
supabase/migrations/        # Único lugar de SQL
docs/adr/ docs/arquitetura/ # Decisões e arquitetura
```

## Variáveis de ambiente

Ver `.env.example` (nomes sem valores).

| Variável | Escopo |
|----------|--------|
| `VITE_SUPABASE_URL` | Pública (bundle) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Pública (bundle), protegida por RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Segredo, somente servidor |

No GitHub (secrets do repositório): `VERCEL_TOKEN`, `VERCEL_ORG_ID`. As variáveis do app ficam no projeto da Vercel. O build não exige as variáveis (são validadas em runtime).

## Comandos

```sh
pnpm dev         # desenvolvimento
pnpm build       # build de produção (.vercel/output)
pnpm test        # vitest run
pnpm lint        # eslint
pnpm typecheck   # tsc --noEmit
```

## Decisões

- Supabase próprio e gerenciado por nós, migrations versionadas (ADR 0002).
- Admin no mesmo app que o site público (ADR 0001).
- Deploy na Vercel por GitHub Actions: PR roda quality gates, push na `main` publica em produção.
- Repositório do cliente: push e PR só quando combinado com o responsável; nunca push direto na `main`.
- Versões de `@tanstack/react-router`, `@tanstack/react-start` e `@tanstack/router-plugin` fixadas (exatas): versões mais novas mudaram a API de server functions (`inputValidator`). Atualizar de forma deliberada.
- `pnpm-workspace.yaml` desliga o build script do esbuild (`allowBuilds`), necessário para `pnpm install --frozen-lockfile` passar no pnpm 11.
- `src/routeTree.gen.ts` e `src/integrations/supabase/types.ts` são gerados: não editar à mão.
- Identificadores em inglês; textos de UI em pt-BR.
