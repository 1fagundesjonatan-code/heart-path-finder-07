# Banco de dados — The Self Map

PostgreSQL 15+ (Supabase). Fase 1: fundação, CRM, aquisição, eventos, consentimento (LGPD), avaliações, planos (apenas configuração) e funções de métricas do dashboard.

## Como aplicar

As migrations estão em `supabase/migrations/` e devem rodar **nesta ordem** (o prefixo de data já garante):

| #   | Arquivo                                      | Conteúdo                                                                   |
| --- | -------------------------------------------- | -------------------------------------------------------------------------- |
| 1   | `20261124000100_foundation_roles_profiles`   | enum `app_role`, `profiles`, `user_roles`, `has_role`/`has_any_role`/`is_staff` |
| 2   | `20261124000200_crm_acquisition`             | canais, campanhas, landing pages, `crm_contacts`, histórico, interações, tags, `marketing_spend`, trigger de signup |
| 3   | `20261124000300_events_consents_assessments` | `event_types`, `events`, `consents`, `assessments`, `assessment_results`, `capture_lead()`, `track_event()` |
| 4   | `20261124000400_plans_audit`                 | `plans`, `audit_log` + triggers de auditoria                               |
| 5   | `20261124000500_admin_metrics_functions`     | `admin_dashboard_metrics`, `admin_funnel`, `admin_new_users_series`        |
| 6   | `20261124000600_seed_catalogs`               | seed de canais de aquisição e tipos de evento                              |

**Com Supabase CLI** (recomendado):

```bash
supabase link --project-ref <ref>
supabase db push
```

**Sem CLI:** abra o SQL Editor do projeto e execute cada arquivo, na ordem acima, um por vez. Todos são idempotentes (`if not exists`, `drop ... if exists`, `on conflict do nothing`); rodar de novo é seguro.

Depois de aplicar, regenere os tipos (o `types.ts` atual foi escrito à mão):

```bash
supabase gen types typescript --project-id <ref> --schema public > src/integrations/supabase/types.ts
```

Os tipos de retorno das RPCs que devolvem `jsonb` ficam em `src/integrations/supabase/rpc-types.ts` (não são sobrescritos pela geração).

### Configuração no painel do Supabase

- **Fase 1: cadastro público DESLIGADO** (Authentication → Sign In / Providers → desmarcar "Allow new users to sign up"). Contas de equipe são criadas no painel (Authentication → Users → Add user / Invite). O app ainda não tem fluxo de cliente com conta.
- **Authentication → Providers → Email → "Confirm email" LIGADO.** O contato do CRM só é criado/vinculado quando `email_confirmed_at` está preenchido (trigger `on_auth_user_confirmed`). Antes disso a conta tem apenas `profiles` e o papel `client`. Assim ninguém herda o contato de outra pessoa cadastrando o e-mail dela. Usuário criado já confirmado (convite/painel, OAuth) ganha o contato na criação.
- **Variável de servidor** `SUPABASE_SERVICE_ROLE_KEY` (nunca no bundle do cliente, nunca com prefixo `VITE_`). Usada só nas server functions que chamam `capture_lead` e `track_event`.
- Schema `public` exposto pela API (padrão). Nada precisa ser exposto além disso.

## Como promover o primeiro admin

O usuário se cadastra normalmente (recebe o papel `client`). Depois, no SQL Editor (roda como `postgres`, ignora RLS):

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'seu-email@exemplo.com'   -- troque pelo e-mail real
on conflict (user_id, role) do nothing;
```

Daí em diante o admin concede/revoga papéis pelo painel (`user_roles` aceita insert/delete só de admin). Nunca há caminho para o usuário se auto-promover: não existe policy de escrita em `user_roles` para não-admin, e o papel não vive em `profiles`.

O último admin não pode ser removido: o trigger `user_roles_protect_last_admin` levanta `last_admin` (P0001), inclusive ao apagar a conta dele. Para trocar de admin, promova o novo antes de remover o antigo. `granted_by` é sempre preenchido pelo banco com o chamador (nulo no SQL Editor).

## Modelo (resumo)

```
auth.users 1─1 profiles
auth.users 1─N user_roles
auth.users 1─0..1 crm_contacts ─┬─N crm_stage_history
                                ├─N crm_interactions
                                ├─N crm_contact_tags ─N tags
                                ├─N consents
                                ├─N assessments 1─1 assessment_results
                                └─N events (set null ao apagar)
acquisition_channels 1─N campaigns 1─N landing_pages
acquisition_channels/campaigns 1─N marketing_spend
event_types 1─N events        plans (isolada)        audit_log (isolada)
```

### Decisões que o frontend precisa saber

- **Captura pública não toca o banco com anon.** `anon` não tem grant nem policy nas tabelas (única exceção: leitura de `plans` ativos, pois preço é público). O site chama uma **server function** que usa a service role e executa `capture_lead()` / `track_event()`. Essas funções só têm `EXECUTE` para `service_role`. O rate limit e o anti-bot (ex.: Turnstile/honeypot) ficam na server function, pois o banco não enxerga o IP.
- **Não existe evento por resposta do teste.** São 162 respostas por teste; um evento por resposta multiplicaria a escrita por ~160 sem valor analítico. As respostas vão em `assessments.answers` ao concluir. Para medir abandono use `test_progress` com `properties: {"percent": 25 | 50 | 75}`.
- **Estágio do CRM só avança por evento.** Eventos com `funnel_stage` no catálogo (`event_types`) promovem o estágio do contato (nunca regridem). Estágios `lead_qualified`, `active_customer`, `recurring_customer`, `churned`, `reactivated` são manuais (painel) ou virão com billing. Toda mudança gera linha em `crm_stage_history`.
- **Atribuição:** `capture_lead`/`track_event` resolvem canal, campanha e landing a partir de `utm_*` e do slug da landing: campanha por `utm_campaign` (traz o canal), senão canal por `utm_source` (código ou alias), senão `other`; sem UTM e sem landing, fica `null` (acesso direto). Para tráfego pago de Instagram/Meta, cadastre a campanha com seu `utm_campaign`, senão `utm_source=instagram` cai em orgânico.
- **Métricas respeitam o papel.** `admin_dashboard_metrics` devolve `null` e lista em `restricted` o que o papel não vê: leads/conversão só para admin/operator/marketing; gasto, CPL e CAC só para admin/marketing/finance. `admin_funnel` é só admin/operator/marketing.
- **Cliente não lê `crm_contacts`.** Ele vê só o próprio profile, assessments, resultados e consentimentos. Ele pode registrar/revogar consentimentos (insert em `consents`; é um ledger, cada decisão é uma linha, o estado vigente é a mais recente).
- **Resultado do teste:** o cliente vê o próprio. Admin/operator só veem resultados individuais se o dono tem consentimento vigente `enneagram_profile_share`. Marketing/finance nunca veem resultado individual; para eles, só agregados via funções.
- **Escrita de assessments é do servidor** (service role): criar na abertura do teste (`status = 'in_progress'`), concluir com `answers`, `completed_at` e inserir `assessment_results`. O dashboard conta `tests_started`/`tests_completed` a partir dessa tabela. Teste feito anônimo grava `anonymous_id`; vincular a `user_id` depois do login é uma atualização feita pelo servidor.
- **Funil (`admin_funnel`) é por etapa, não coorte estrita.** O visitante anônimo de `page_view` e o mesmo lead, já com `contact_id`, contam como atores distintos. Para coorte de leads use `leads_captured` / `leads_converted` / `lead_to_customer_rate` de `admin_dashboard_metrics`.

## LGPD

- **Minimização:** não guardamos IP nem user-agent em `consents`. A evidência é contato + tipo + versão do documento + `granted` + data + origem.
- **Direito de exclusão:** apagar o usuário em `auth.users` apaga em cascata `profiles`, `user_roles`, `crm_contacts` (e com ele `consents`, interações, histórico, tags) e `assessments`/`assessment_results`. Em `events` o `user_id`/`contact_id` viram `null` (o evento anonimizado permanece para estatística). `audit_log` não tem FK e nunca guarda e-mail, telefone, nome nem conteúdo de interação (colunas de PII são redigidas: registra só `{"changed": true}`).
- **Lead sem conta:** para apagar, `delete from public.crm_contacts where email = '<email>';` (cascata nas tabelas filhas, `events` anonimizados).
- Papéis e funções `security definer` usam `set search_path = ''`.

## Para validar ao aplicar

Estas migrations foram executadas em um Postgres de teste (PGlite, Postgres em WASM, com stub do schema `auth` e dos papéis `anon`/`authenticated`/`service_role`): aplicam sem erro, reaplicam sem erro, e os cenários de RLS/captura/métricas abaixo passaram. Não foram executadas contra o projeto Supabase real. Confirme lá:

1. `select * from public.capture_lead('teste@exemplo.com')` com a service role retorna `contact_id` e `is_new`; com anon dá `permission denied`.
2. Usuário novo cria `profiles` e `user_roles` (`client`); o `crm_contacts` só aparece quando o e-mail é confirmado (se o e-mail é de um lead existente, vincula o mesmo contato e não duplica).
3. Com um usuário `client`: `select * from crm_contacts` retorna vazio; `insert into user_roles` falha por RLS; `admin_dashboard_metrics` levanta `forbidden`.
4. Com o admin promovido: `select public.admin_dashboard_metrics(now() - interval '7 days', now())` retorna o JSON; `admin_funnel` e `admin_new_users_series(..., 'day')` retornam linhas.
5. O trigger em `auth.users` (`on_auth_user_created`) existe e está habilitado. O Supabase permite criá-lo pela migration; se o projeto bloquear, crie pelo SQL Editor como `postgres`.
6. Advisors do Supabase (Database → Advisors → Security/Performance): sem "RLS disabled" e sem "function search path mutable".

## Planejado (NÃO criado ainda)

Só desenho. Cada bloco vira uma migration própria, quando a fase começar. Convenções: `bigint identity`, `timestamptz`, RLS em tudo, FKs indexadas.

### Fase 2 — Mentor de IA

```text
ai_agents        id, code unique, name, description, is_active
prompt_versions  id, agent_id → ai_agents, version int, system_prompt text, model text,
                 params jsonb, status ('draft'|'active'|'archived'), created_by, created_at
                 unique (agent_id, version); no máximo 1 'active' por agente (índice parcial único)
conversations    id, user_id → auth.users, agent_id, prompt_version_id, title,
                 status, created_at, last_message_at     idx (user_id, last_message_at desc)
messages         id, conversation_id → conversations, role ('user'|'assistant'|'system'|'tool'),
                 content text, tokens_in int, tokens_out int, created_at   idx (conversation_id, id)
ai_usage         id, user_id, conversation_id, message_id, model, tokens_in, tokens_out,
                 cost numeric(12,6), currency, occurred_at   idx (user_id, occurred_at), (occurred_at)
```

RLS: o cliente lê/escreve só as próprias conversas e mensagens. Staff só lê `ai_usage` agregado. Alimenta `ai_conversations`, `ai_tokens` e `ai_cost` do dashboard (hoje `unavailable`). O consentimento `ai_memory` já existe em `consents`.

### Fase 3 — Memória e jornada

```text
memories     id, user_id, kind ('fact'|'preference'|'insight'), content text,
             embedding vector(1536), source_message_id, importance smallint,
             created_at, expires_at
             extension pgvector; índice hnsw (embedding vector_cosine_ops); idx (user_id)
summaries    id, user_id, conversation_id, period_start, period_end, content text
journeys     id, user_id, title, status, started_at, ended_at
goals        id, user_id, journey_id, title, description, status, due_on
exercises    id, code, title, instructions, instrument_ref (opcional)
user_exercises id, user_id, exercise_id, journey_id, status, response jsonb, completed_at
```

RLS: dono lê/escreve; staff nunca lê conteúdo. Toda leitura de `memories` exige `has_active_consent(contact, 'ai_memory')`. Apagar usuário apaga tudo em cascata.

### Fase 5 — Assinaturas e pagamentos

```text
subscriptions   id, user_id, plan_id → plans, status ('trialing'|'active'|'past_due'|'canceled'|'expired'),
                provider ('stripe'|'mercadopago'...), provider_subscription_id unique,
                current_period_start, current_period_end, cancel_at_period_end bool,
                canceled_at, created_at
payments        id, subscription_id, user_id, amount numeric(12,2), currency, status,
                provider_payment_id unique, paid_at, refunded_at, created_at
coupons         id, code unique (lower), kind ('percent'|'amount'), value numeric, max_redemptions,
                redeemed_count, valid_from, valid_until, plan_id (opcional), is_active
coupon_redemptions id, coupon_id, user_id, subscription_id, redeemed_at   unique (coupon_id, user_id)
webhook_events  id, provider, provider_event_id, event_type, payload jsonb, received_at,
                processed_at, error text    unique (provider, provider_event_id)  -- idempotência
```

Passa a alimentar `mrr`, `revenue`, `arpu`, `churn`, `retention`, `active_subscriptions`. Quando existir: `cac` e `lead_to_customer_rate` passam a ter clientes pagantes reais (hoje derivam do estágio `subscription_started`); um trigger em `subscriptions` move o estágio do contato (`subscription_started` → `active_customer` → `recurring_customer`/`churned`/`reactivated`). Escrita só por webhook (service role). Cliente lê as próprias assinaturas e pagamentos; finance lê tudo.

### Fase 6 — Marketplace de profissionais

```text
professionals       id, user_id unique, display_name, bio, specialties text[], status
                    ('pending'|'approved'|'suspended'), approved_by, created_at
availability        id, professional_id, weekday smallint, starts_at time, ends_at time, timezone
                    (ou slots materializados: starts_at/ends_at timestamptz + exclusion constraint btree_gist)
sessions            id, professional_id, client_user_id, starts_at, ends_at,
                    status ('scheduled'|'completed'|'canceled'|'no_show'), price numeric(12,2),
                    currency, meeting_url, created_at     idx (professional_id, starts_at), (client_user_id)
transactions        id, session_id, gross numeric(12,2), commission numeric(12,2),
                    net_to_professional numeric(12,2), currency, status, created_at
payouts             id, professional_id, amount numeric(12,2), currency, status,
                    period_start, period_end, paid_at, provider_transfer_id
commission_rules    id, professional_id (null = regra padrão), percent numeric(5,2),
                    valid_from, valid_until
```

Usa o papel `partner` (profissional) já existente em `app_role`: lê só as próprias sessões, disponibilidade e repasses. Alimenta `marketplace_revenue` e `commission`. O profissional só vê dados do cliente com consentimento explícito (novo valor em `consent_type`, ex.: `professional_share`, via `alter type ... add value`).

## Trade-offs

| Escolha                                       | Ganho                                                          | Custo                                                                 |
| --------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| Captura via service role + funções, sem anon  | Superfície de ataque mínima, validação e atomicidade no banco  | Exige server function e a chave de serviço no servidor                |
| Catálogo `event_types` em vez de CHECK        | Novo evento sem ALTER numa tabela grande; mapeia estágio/funil | Um lookup de PK por insert (barato)                                   |
| `events` append-only por GRANT, sem trigger   | FKs `set null` continuam funcionando (LGPD)                    | `postgres`/SQL Editor ainda consegue alterar (é o esperado)           |
| Sem `test_answer` por resposta                | ~160x menos escrita                                            | Sem análise por pergunta em tempo real (dá para derivar de `answers`) |
| Consentimento como ledger, sem IP             | Minimização LGPD, histórico auditável                          | Estado vigente exige "última linha por tipo" (índice cobre)           |
| Cascata ao apagar usuário                     | Exclusão LGPD simples e completa                               | Lead que vira usuário e depois apaga a conta some das métricas        |
| `bigint identity` nos IDs internos            | Menor e mais rápido que UUID                                   | IDs sequenciais; por isso nada disso é exposto sem RLS                |
