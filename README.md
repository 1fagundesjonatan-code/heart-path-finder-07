# The Self Map

Plataforma do The Self Institute: teste público de autoconhecimento (Eneagrama), captação de leads e painel administrativo (CRM, métricas, usuários e papéis) no mesmo app.

## Stack

- TanStack Start (React 19, Vite 8, nitro com preset `vercel`)
- Tailwind v4 + shadcn/ui
- Supabase (Postgres com RLS, Auth) via `@supabase/ssr`
- pnpm, Vitest, ESLint + Prettier
- Deploy na Vercel por GitHub Actions

## Começando

Requer Node 22 ou superior e pnpm (versão no campo `packageManager` do `package.json`, ativável com `corepack enable`).

```sh
pnpm install
cp .env.example .env   # preencha com os valores do projeto Supabase
pnpm dev
```

## Comandos

| Comando | O que faz |
|---------|-----------|
| `pnpm dev` | Servidor de desenvolvimento |
| `pnpm build` | Build de produção (saída em `.vercel/output`) |
| `pnpm preview` | Preview do build |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm format` | Prettier |

## Deploy

O pipeline `.github/workflows/pipeline.yml` roda typecheck, lint, test e build em todo PR para a `main`. O push na `main` publica em produção na Vercel.

Secrets do GitHub: `VERCEL_TOKEN` e `VERCEL_ORG_ID`. Variáveis de ambiente do app (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) são configuradas no projeto da Vercel.

## Documentação

- `docs/arquitetura/`: auditoria, arquitetura, módulos do admin e plano de execução
- `docs/adr/`: decisões arquiteturais
- `supabase/README.md`: banco, migrations e RLS
