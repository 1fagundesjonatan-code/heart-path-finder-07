-- =====================================================================
-- 0400 — Planos (só configuração, sem cobrança) e auditoria
-- Depende de: 0100-0300.
-- Assinaturas, pagamentos, cupons, webhooks: NÃO existem ainda (ver supabase/README.md).
-- =====================================================================

-- ---------------------------------------------------------------------
-- plans
-- ---------------------------------------------------------------------
create table if not exists public.plans (
  id                bigint generated always as identity primary key,
  code              text not null unique check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  name              text not null check (char_length(name) between 1 and 80),
  description       text check (description is null or char_length(description) <= 500),
  price             numeric(12, 2) not null check (price >= 0),
  currency          text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  billing_interval  text not null check (billing_interval in ('monthly', 'quarterly', 'yearly', 'one_time')),
  -- limites de uso por plano (ex.: {"ai_messages_per_month": 200}); validado pelo app
  limits            jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object'),
  is_active         boolean not null default true,
  sort_order        integer not null default 100,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists plans_active_sort_idx on public.plans (sort_order) where is_active;

drop trigger if exists plans_set_updated_at on public.plans;
create trigger plans_set_updated_at
  before update on public.plans
  for each row execute function public.set_updated_at();

alter table public.plans enable row level security;

revoke all on table public.plans from anon, authenticated;
grant select on table public.plans to anon;             -- preço é informação pública (página de planos)
grant select, insert, update, delete on table public.plans to authenticated;

-- visitantes e clientes veem só planos ativos; staff vê todos
drop policy if exists plans_select_public on public.plans;
create policy plans_select_public on public.plans
  for select to anon, authenticated
  using (is_active);

drop policy if exists plans_select_staff on public.plans;
create policy plans_select_staff on public.plans
  for select to authenticated
  using ((select public.is_staff()));

drop policy if exists plans_insert on public.plans;
create policy plans_insert on public.plans
  for insert to authenticated
  with check ((select public.has_any_role(array['admin', 'finance']::public.app_role[])));
drop policy if exists plans_update on public.plans;
create policy plans_update on public.plans
  for update to authenticated
  using ((select public.has_any_role(array['admin', 'finance']::public.app_role[])))
  with check ((select public.has_any_role(array['admin', 'finance']::public.app_role[])));
drop policy if exists plans_delete on public.plans;
create policy plans_delete on public.plans
  for delete to authenticated
  using ((select public.has_role('admin')));

-- ---------------------------------------------------------------------
-- audit_log: append-only; só admin lê
-- Sem FK para auth.users de propósito: a trilha sobrevive à exclusão do ator.
-- ---------------------------------------------------------------------
create table if not exists public.audit_log (
  id            bigint generated always as identity primary key,
  at            timestamptz not null default now(),
  actor_id      uuid,                        -- null = service role / SQL direto / trigger de sistema
  action        text not null check (action in ('insert', 'update', 'delete')),
  entity_table  text not null,
  entity_id     text,
  diff          jsonb
);

create index if not exists audit_log_entity_idx on public.audit_log (entity_table, entity_id, at desc);
create index if not exists audit_log_at_idx on public.audit_log (at desc);
create index if not exists audit_log_actor_idx on public.audit_log (actor_id, at desc) where actor_id is not null;

alter table public.audit_log enable row level security;

revoke all on table public.audit_log from anon, authenticated, service_role;
grant select on table public.audit_log to authenticated;
grant select on table public.audit_log to service_role;

drop policy if exists audit_log_select_admin on public.audit_log;
create policy audit_log_select_admin on public.audit_log
  for select to authenticated
  using ((select public.has_role('admin')));

-- Trigger genérico. Argumentos do trigger = colunas com PII a REDIGIR
-- (registra só que mudaram, nunca o valor). Toda tabela auditada precisa de coluna id.
--   insert/delete: guarda a linha sem as colunas redigidas
--   update:        guarda {coluna: {old, new}} só do que mudou
-- Ignora updated_at e last_interaction_at; update sem diff relevante não gera linha
-- (evita ruído do caminho quente de eventos).
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_redact  text[] := coalesce(tg_argv, '{}'::text[]);   -- sem argumentos o TG_ARGV pode vir null
  v_ignore  constant text[] := array['updated_at', 'last_interaction_at'];
  v_diff    jsonb;
  v_id      text;
begin
  if tg_op = 'INSERT' then
    v_id := to_jsonb(new) ->> 'id';
    v_diff := to_jsonb(new) - v_redact;
  elsif tg_op = 'DELETE' then
    v_id := to_jsonb(old) ->> 'id';
    v_diff := to_jsonb(old) - v_redact;
  else
    v_id := to_jsonb(new) ->> 'id';
    select jsonb_object_agg(
             n.key,
             case
               when n.key = any (v_redact) then jsonb_build_object('changed', true)
               else jsonb_build_object('old', o.value, 'new', n.value)
             end
           )
      into v_diff
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o on o.key = n.key
     where n.value is distinct from o.value
       and n.key <> all (v_ignore);

    if v_diff is null then
      return null;
    end if;
  end if;

  insert into public.audit_log (actor_id, action, entity_table, entity_id, diff)
  values (auth.uid(), lower(tg_op), tg_table_name, v_id, v_diff);

  return null;
end;
$$;

revoke all on function public.audit_row_change() from public, anon, authenticated;

-- tabelas auditadas (CRM sensível, papéis, dinheiro, preços)
drop trigger if exists audit_user_roles on public.user_roles;
create trigger audit_user_roles
  after insert or update or delete on public.user_roles
  for each row execute function public.audit_row_change();

drop trigger if exists audit_crm_contacts on public.crm_contacts;
create trigger audit_crm_contacts
  after insert or update or delete on public.crm_contacts
  for each row execute function public.audit_row_change('email', 'phone', 'full_name', 'notes');

drop trigger if exists audit_crm_interactions on public.crm_interactions;
create trigger audit_crm_interactions
  after insert or update or delete on public.crm_interactions
  for each row execute function public.audit_row_change('content');

drop trigger if exists audit_marketing_spend on public.marketing_spend;
create trigger audit_marketing_spend
  after insert or update or delete on public.marketing_spend
  for each row execute function public.audit_row_change();

drop trigger if exists audit_plans on public.plans;
create trigger audit_plans
  after insert or update or delete on public.plans
  for each row execute function public.audit_row_change();
