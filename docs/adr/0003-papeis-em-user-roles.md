# ADR 0003: Papéis em `user_roles` com `has_role()` / `is_staff()`

- Status: aceito
- Data: 2026-11-24

## Contexto
Há quatro papéis: admin (dono), collaborator (equipe interna), partner (profissional) e client. Um usuário pode acumular papéis (ex.: colaborador que também é cliente). O modelo inicial tinha seis (operator, marketing, finance a mais); foi reduzido na migration 0700 porque não há equipe para ocupar funções separadas. A autorização precisa valer no banco (RLS) e no servidor.

## Decisão
Tabela `user_roles` (usuário, papel) com enum de papéis. Funções `has_role(uid, role)` e `is_staff()` (admin e collaborator) usadas nas policies RLS e consultadas pelo middleware do servidor. **Sem coluna `role` em `profiles`.** Atribuição e remoção só via ação de admin (collaborator não concede nem revoga papéis) e registradas em `audit_log`. Matriz papel × módulo em arquivo único (`shared/roles.ts`), com o banco testado contra a mesma matriz. Primeiro admin criado por seed/script, nunca por rota pública.

Decisões de acesso: collaborator acessa todo o painel exceto Configurações, lê planos e métricas, mas só admin altera planos e catálogo de eventos e apaga entidades de CRM/aquisição. `service_role` não escreve em `user_roles`.

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| Coluna `role` em `profiles` | Um papel só; o próprio usuário pode ter permissão de editar `profiles`, abrindo escalonamento de privilégio |
| Claims de papel no JWT apenas | Papel desatualizado até o refresh do token; revogação lenta. Pode ser otimização futura, com a tabela como fonte da verdade |
| Papéis fixos no código | Sem auditoria nem gestão pela interface |
| Manter operator, marketing e finance | Funções sem pessoa para ocupá-las; matriz maior para testar sem ganho |

## Consequências
- (+) Múltiplos papéis, revogação imediata, auditoria.
- (+) Funções reutilizadas em todas as policies; mudança de matriz em um lugar.
- (-) Funções usadas em RLS precisam ser `security definer` com `search_path` fixo e performáticas (usar `(select auth.uid())`); exigem teste e revisão do data-engineer.
- (-) Duas representações da matriz (TypeScript e SQL): mitigado por testes de policy por papel.
