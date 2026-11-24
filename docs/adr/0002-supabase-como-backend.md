# ADR 0002: Supabase como backend

- Status: aceito
- Data: 2026-11-24

## Contexto
Não há backend nem persistência. Precisamos de banco relacional com RLS, autenticação, storage e, na Fase 3, busca vetorial. Hospedagem do app é a Vercel (nitro, preset `vercel`), com deploy por GitHub Actions.

## Decisão
Supabase: Postgres (RLS), Auth, Storage, Edge Functions **só se necessário**, `pgvector` na Fase 3. Cliente em `src/integrations/supabase/`: `client.ts` (browser), `server.ts` (cliente por request com JWT do usuário e cliente com service role), `types.ts` gerado. A service role existe só no servidor e só em casos nomeados (lead anônimo, evento anônimo, webhooks, jobs, `ai_usage`). SQL só via `supabase/migrations/` (data-engineer). Decisão: projeto Supabase próprio (staging e prod), região `sa-east-1`, para manter controle das migrations.

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| Postgres gerenciado + auth própria | Reimplementa auth, storage e RLS integrada |
| Firebase/Firestore | Modelo relacional e agregações (funil, financeiro) ficam piores; sem pgvector |
| Convex | Lock-in e sem RLS/SQL para métricas por RPC |

## Consequências
- (+) Auth, RLS, storage e vetor no mesmo lugar; SQL para métricas.
- (-) Dependência de um fornecedor; mitigada por ser Postgres padrão e migrations versionadas.
- (-) Cookies/SSR com `@supabase/ssr` e o runtime serverless da Vercel exigem validação ponta a ponta já na primeira entrega.
- (-) Versões do `@supabase/*` ficam fixadas no `pnpm-lock.yaml`; atualizar de forma deliberada.
