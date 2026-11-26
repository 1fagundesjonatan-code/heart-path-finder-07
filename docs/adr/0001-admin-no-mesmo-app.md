# ADR 0001: Admin no mesmo app, rotas `/admin/*`

- Status: aceito
- Data: 2026-11-24

## Contexto
O produto precisa de um painel interno (17 módulos) além do site público e, depois, da área do cliente. O app é TanStack Start com deploy único na Vercel via nitro. Equipe pequena.

## Decisão
O admin vive no mesmo app, sob `/admin/*`, com uma layout route (`src/routes/admin.tsx`: guard + sidebar). Autorização validada **no servidor** (middleware das server functions, `createServerFn`) **e no banco** (RLS). Esconder menu ou checar no cliente é só UX. O layout é marcado `noindex` e bloqueado no `robots.txt`.

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| App separado (outro repo/deploy) | Dobra deploy, auth, CI e duplica UI/tipos; sem ganho real com a equipe atual |
| Subdomínio com o mesmo código | Complexidade de cookies/CORS sem benefício agora |
| Autorização só no cliente | Insegura por definição |

## Consequências
- (+) Um deploy, uma sessão, reuso de componentes shadcn e tipos.
- (+) Code-splitting por rota mantém o bundle público leve.
- (-) Superfície de ataque compartilhada: exige guard duplo e teste automatizado de que toda server function do admin declara papel.
- (-) Se o admin crescer a ponto de pedir ciclo de deploy próprio, será preciso extrair; a regra de "features não importam features" mantém essa extração viável.
