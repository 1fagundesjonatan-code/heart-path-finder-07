-- =====================================================================
-- 0700: modelo de quatro papéis (admin, collaborator, partner, client)
-- Depende de: 0100-0600.
--
--  * operator vira collaborator; marketing e finance deixam de existir.
--  * collaborator acessa todo o painel (is_staff = admin ou collaborator),
--    mas NÃO concede nem revoga papéis e NÃO escreve em plans.
--  * Só admin: user_roles (escrita), event_types (escrita), plans (escrita),
--    delete de entidades de CRM/aquisição e audit_log (leitura).
--  * service_role passa a ter só o que o servidor usa (ver seção 6).
--
-- Postgres não remove valor de enum: o tipo é recriado. Para isso as policies
-- e funções que dependem dele são derrubadas e recriadas na mesma transação.
-- Reaplicar é seguro (a recriação do tipo só roda se ainda há valores antigos).
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. Policies que dependem de has_role/has_any_role/app_role
-- ---------------------------------------------------------------------
drop policy if exists profiles_select on public.profiles;
drop policy if exists user_roles_select on public.user_roles;
drop policy if exists user_roles_insert_admin on public.user_roles;
drop policy if exists user_roles_delete_admin on public.user_roles;

drop policy if exists acquisition_channels_insert on public.acquisition_channels;
drop policy if exists acquisition_channels_update on public.acquisition_channels;
drop policy if exists acquisition_channels_delete on public.acquisition_channels;
drop policy if exists campaigns_insert on public.campaigns;
drop policy if exists campaigns_update on public.campaigns;
drop policy if exists campaigns_delete on public.campaigns;
drop policy if exists landing_pages_insert on public.landing_pages;
drop policy if exists landing_pages_update on public.landing_pages;
drop policy if exists landing_pages_delete on public.landing_pages;

drop policy if exists crm_contacts_select on public.crm_contacts;
drop policy if exists crm_contacts_insert on public.crm_contacts;
drop policy if exists crm_contacts_update on public.crm_contacts;
drop policy if exists crm_contacts_delete on public.crm_contacts;
drop policy if exists crm_stage_history_select on public.crm_stage_history;
drop policy if exists crm_interactions_select on public.crm_interactions;
drop policy if exists crm_interactions_insert on public.crm_interactions;
drop policy if exists crm_interactions_update on public.crm_interactions;
drop policy if exists crm_interactions_delete on public.crm_interactions;
drop policy if exists tags_select on public.tags;
drop policy if exists tags_insert on public.tags;
drop policy if exists tags_update on public.tags;
drop policy if exists tags_delete on public.tags;
drop policy if exists crm_contact_tags_select on public.crm_contact_tags;
drop policy if exists crm_contact_tags_insert on public.crm_contact_tags;
drop policy if exists crm_contact_tags_delete on public.crm_contact_tags;
drop policy if exists marketing_spend_select on public.marketing_spend;
drop policy if exists marketing_spend_insert on public.marketing_spend;
drop policy if exists marketing_spend_update on public.marketing_spend;
drop policy if exists marketing_spend_delete on public.marketing_spend;

drop policy if exists event_types_insert on public.event_types;
drop policy if exists event_types_update on public.event_types;
drop policy if exists events_select on public.events;
drop policy if exists consents_select on public.consents;
drop policy if exists assessments_select_staff_with_consent on public.assessments;

drop policy if exists plans_insert on public.plans;
drop policy if exists plans_update on public.plans;
drop policy if exists plans_delete on public.plans;
drop policy if exists audit_log_select_admin on public.audit_log;

-- ---------------------------------------------------------------------
-- 2. Recria o tipo e migra user_roles
-- ---------------------------------------------------------------------
drop function if exists public.has_role(public.app_role);
drop function if exists public.has_any_role(public.app_role[]);

do $$
begin
  if exists (
    select 1 from pg_enum
    where enumtypid = 'public.app_role'::regtype
      and enumlabel in ('operator', 'marketing', 'finance')
  ) then
    -- marketing/finance não têm destino automático: falha alto em vez de rebaixar ou apagar acesso
    if exists (select 1 from public.user_roles where role::text in ('marketing', 'finance')) then
      raise exception 'user_roles ainda tem marketing/finance: reatribua antes de migrar';
    end if;

    alter type public.app_role rename to app_role_old;
    create type public.app_role as enum ('admin', 'collaborator', 'partner', 'client');

    alter table public.user_roles
      alter column role type public.app_role
      using (case role::text when 'operator' then 'collaborator' else role::text end)::public.app_role;

    drop type public.app_role_old;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- 3. Helpers de autorização
-- ---------------------------------------------------------------------
create function public.has_role(p_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = p_role
  );
$$;

create function public.has_any_role(p_roles public.app_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any (p_roles)
  );
$$;

-- staff = quem acessa o painel administrativo (partner e client ficam de fora)
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.has_any_role(array['admin', 'collaborator']::public.app_role[]);
$$;

revoke all on function public.has_role(public.app_role) from public, anon;
revoke all on function public.has_any_role(public.app_role[]) from public, anon;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.has_any_role(public.app_role[]) to authenticated;
grant execute on function public.is_staff() to authenticated;

-- ---------------------------------------------------------------------
-- 4. Policies (is_staff() = admin ou collaborator)
-- ---------------------------------------------------------------------

-- profiles / user_roles: só admin mexe em papéis
create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_staff()));

create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.has_role('admin')));
create policy user_roles_insert_admin on public.user_roles
  for insert to authenticated
  with check ((select public.has_role('admin')));
create policy user_roles_delete_admin on public.user_roles
  for delete to authenticated
  using ((select public.has_role('admin')));

-- acquisition_channels / campaigns / landing_pages: staff escreve, admin apaga
create policy acquisition_channels_insert on public.acquisition_channels
  for insert to authenticated with check ((select public.is_staff()));
create policy acquisition_channels_update on public.acquisition_channels
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy acquisition_channels_delete on public.acquisition_channels
  for delete to authenticated using ((select public.has_role('admin')));

create policy campaigns_insert on public.campaigns
  for insert to authenticated with check ((select public.is_staff()));
create policy campaigns_update on public.campaigns
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy campaigns_delete on public.campaigns
  for delete to authenticated using ((select public.has_role('admin')));

create policy landing_pages_insert on public.landing_pages
  for insert to authenticated with check ((select public.is_staff()));
create policy landing_pages_update on public.landing_pages
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy landing_pages_delete on public.landing_pages
  for delete to authenticated using ((select public.has_role('admin')));

-- CRM: staff lê e escreve; apagar contato (exclusão LGPD) só admin
create policy crm_contacts_select on public.crm_contacts
  for select to authenticated using ((select public.is_staff()));
create policy crm_contacts_insert on public.crm_contacts
  for insert to authenticated with check ((select public.is_staff()));
create policy crm_contacts_update on public.crm_contacts
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy crm_contacts_delete on public.crm_contacts
  for delete to authenticated using ((select public.has_role('admin')));

create policy crm_stage_history_select on public.crm_stage_history
  for select to authenticated using ((select public.is_staff()));

-- interações: editar/apagar só admin ou o autor
create policy crm_interactions_select on public.crm_interactions
  for select to authenticated using ((select public.is_staff()));
create policy crm_interactions_insert on public.crm_interactions
  for insert to authenticated
  with check ((select public.is_staff()) and author_id = (select auth.uid()));
create policy crm_interactions_update on public.crm_interactions
  for update to authenticated
  using (
    (select public.is_staff())
    and ((select public.has_role('admin')) or author_id = (select auth.uid()))
  )
  with check (
    (select public.is_staff())
    and ((select public.has_role('admin')) or author_id = (select auth.uid()))
  );
create policy crm_interactions_delete on public.crm_interactions
  for delete to authenticated
  using (
    (select public.is_staff())
    and ((select public.has_role('admin')) or author_id = (select auth.uid()))
  );

create policy tags_select on public.tags
  for select to authenticated using ((select public.is_staff()));
create policy tags_insert on public.tags
  for insert to authenticated with check ((select public.is_staff()));
create policy tags_update on public.tags
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy tags_delete on public.tags
  for delete to authenticated using ((select public.has_role('admin')));

create policy crm_contact_tags_select on public.crm_contact_tags
  for select to authenticated using ((select public.is_staff()));
create policy crm_contact_tags_insert on public.crm_contact_tags
  for insert to authenticated with check ((select public.is_staff()));
create policy crm_contact_tags_delete on public.crm_contact_tags
  for delete to authenticated using ((select public.is_staff()));

-- gasto de marketing: lançamento manual por staff (módulo Marketing)
create policy marketing_spend_select on public.marketing_spend
  for select to authenticated using ((select public.is_staff()));
create policy marketing_spend_insert on public.marketing_spend
  for insert to authenticated with check ((select public.is_staff()));
create policy marketing_spend_update on public.marketing_spend
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy marketing_spend_delete on public.marketing_spend
  for delete to authenticated using ((select public.is_staff()));

-- catálogo de eventos: staff lê (event_types_select já existe), admin escreve
create policy event_types_insert on public.event_types
  for insert to authenticated with check ((select public.has_role('admin')));
create policy event_types_update on public.event_types
  for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));

create policy events_select on public.events
  for select to authenticated using ((select public.is_staff()));

create policy consents_select on public.consents
  for select to authenticated
  using (contact_id = (select public.current_contact_id()) or (select public.is_staff()));

-- resultado individual do teste: staff só com consentimento vigente do dono
create policy assessments_select_staff_with_consent on public.assessments
  for select to authenticated
  using (
    contact_id is not null
    and (select public.is_staff())
    and (select public.has_active_consent(contact_id, 'enneagram_profile_share'))
  );

-- planos: staff lê (plans_select_staff), só admin altera (preço é decisão de negócio)
create policy plans_insert on public.plans
  for insert to authenticated with check ((select public.has_role('admin')));
create policy plans_update on public.plans
  for update to authenticated
  using ((select public.has_role('admin'))) with check ((select public.has_role('admin')));
create policy plans_delete on public.plans
  for delete to authenticated using ((select public.has_role('admin')));

create policy audit_log_select_admin on public.audit_log
  for select to authenticated using ((select public.has_role('admin')));

-- ---------------------------------------------------------------------
-- 5. Métricas do dashboard (0500): só os gates de papel mudam.
-- Admin e collaborator veem tudo; restricted continua no contrato do JSON.
-- ---------------------------------------------------------------------
create or replace function public.admin_dashboard_metrics(
  p_from                 timestamptz,
  p_to                   timestamptz,
  p_currency             text    default 'BRL',
  p_active_window_days   integer default 30
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_tz                 constant text := 'America/Sao_Paulo';
  v_from_date          date;
  v_to_date            date;
  v_total_users        bigint;
  v_new_users          bigint;
  v_active_users       bigint;
  v_leads              bigint;
  v_leads_converted    bigint;
  v_leads_customers    bigint;
  v_new_customers      bigint;
  v_tests_started      bigint;
  v_tests_started_done bigint;
  v_tests_completed    bigint;
  v_spend              numeric(14, 2);
  v_spend_rows         bigint;
  v_spend_rows_other   bigint;
  v_can_leads          boolean;
  v_can_spend          boolean;
  v_restricted         text[] := '{}';
  v_core               jsonb;
  v_unavailable        jsonb;
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_can_leads := public.has_any_role(array['admin', 'collaborator']::public.app_role[]);
  v_can_spend := public.has_any_role(array['admin', 'collaborator']::public.app_role[]);
  if p_from is null or p_to is null or p_from >= p_to then
    raise exception 'invalid_period' using errcode = '22023';
  end if;
  if p_currency is null or p_currency !~ '^[A-Z]{3}$' then
    raise exception 'invalid_currency' using errcode = '22023';
  end if;
  if p_active_window_days is null or p_active_window_days not between 1 and 365 then
    raise exception 'invalid_active_window_days' using errcode = '22023';
  end if;

  v_from_date := (p_from at time zone v_tz)::date;
  v_to_date   := ((p_to - interval '1 microsecond') at time zone v_tz)::date;

  -- usuários
  select count(*),
         count(*) filter (where p.created_at >= p_from)
    into v_total_users, v_new_users
    from public.profiles p
   where p.created_at < p_to;

  select count(distinct e.user_id)
    into v_active_users
    from public.events e
   where e.user_id is not null
     and e.occurred_at >= greatest(p_from, p_to - make_interval(days => p_active_window_days))
     and e.occurred_at <  p_to;

  -- leads (coorte do período) e conversão
  with cohort as (
    select distinct e.contact_id
      from public.events e
     where e.event_name = 'lead_captured'
       and e.contact_id is not null
       and e.occurred_at >= p_from
       and e.occurred_at <  p_to
  )
  select count(*),
         count(*) filter (where s.converted),
         count(*) filter (where s.customer)
    into v_leads, v_leads_converted, v_leads_customers
    from cohort c
    cross join lateral (
      select coalesce(bool_or(h.to_stage >= 'signup_completed'), false) as converted,
             coalesce(bool_or(h.to_stage = 'subscription_started'), false) as customer
        from public.crm_stage_history h
       where h.contact_id = c.contact_id
         and h.changed_at < p_to
    ) s;

  select count(distinct h.contact_id)
    into v_new_customers
    from public.crm_stage_history h
   where h.to_stage = 'subscription_started'
     and h.changed_at >= p_from
     and h.changed_at <  p_to;

  -- testes
  select count(*) filter (where a.started_at >= p_from and a.started_at < p_to),
         count(*) filter (where a.started_at >= p_from and a.started_at < p_to and a.status = 'completed'),
         count(*) filter (where a.status = 'completed' and a.completed_at >= p_from and a.completed_at < p_to)
    into v_tests_started, v_tests_started_done, v_tests_completed
    from public.assessments a
   where (a.started_at >= p_from and a.started_at < p_to)
      or (a.completed_at >= p_from and a.completed_at < p_to);

  -- gasto de marketing
  select coalesce(sum(m.amount) filter (where m.currency = p_currency), 0),
         count(*) filter (where m.currency = p_currency),
         count(*) filter (where m.currency <> p_currency)
    into v_spend, v_spend_rows, v_spend_rows_other
    from public.marketing_spend m
   where m.spend_date >= v_from_date
     and m.spend_date <= v_to_date;

  v_core := jsonb_build_object(
    'period', jsonb_build_object('from', p_from, 'to', p_to),
    'active_window_days', p_active_window_days,
    'currency', p_currency,
    'total_users', v_total_users,
    'active_users', v_active_users,
    'new_users', v_new_users,
    'leads_captured', v_leads,
    'leads_converted', v_leads_converted,
    'lead_to_customer_rate',
      case when v_leads > 0 then round(v_leads_customers::numeric / v_leads, 4) end,
    'new_customers', v_new_customers,
    'tests_started', v_tests_started,
    'tests_completed', v_tests_completed,
    'test_completion_rate',
      case when v_tests_started > 0 then round(v_tests_started_done::numeric / v_tests_started, 4) end,
    'marketing_spend', v_spend,
    'spend_rows_other_currency', v_spend_rows_other,
    'cpl',
      case when v_leads > 0 and v_spend_rows > 0 then round(v_spend / v_leads, 2) end,
    'cac',
      case when v_new_customers > 0 and v_spend_rows > 0 then round(v_spend / v_new_customers, 2) end
  );

  -- aplica a matriz de papéis (calcula tudo, mascara o que o papel não pode ver)
  if not v_can_leads then
    v_restricted := v_restricted || array['leads_captured', 'leads_converted', 'lead_to_customer_rate', 'new_customers'];
  end if;
  if not v_can_spend then
    v_restricted := v_restricted || array['marketing_spend', 'spend_rows_other_currency', 'cpl', 'cac'];
  end if;

  v_core := v_core
    || coalesce(
         (select jsonb_object_agg(k, 'null'::jsonb) from unnest(v_restricted) as k),
         '{}'::jsonb
       )
    || jsonb_build_object(
         'restricted', jsonb_build_object('reason', 'role', 'metrics', to_jsonb(v_restricted))
       );

  -- sem fonte hoje (billing, IA e marketplace são fases futuras)
  v_unavailable := jsonb_build_object(
    'mrr', null,
    'revenue', null,
    'arpu', null,
    'churn', null,
    'retention', null,
    'active_subscriptions', null,
    'ai_conversations', null,
    'ai_tokens', null,
    'ai_cost', null,
    'marketplace_revenue', null,
    'commission', null,
    'unavailable', jsonb_build_object(
      'reason', 'requires_integration',
      'metrics', jsonb_build_array(
        'mrr', 'revenue', 'arpu', 'churn', 'retention', 'active_subscriptions',
        'ai_conversations', 'ai_tokens', 'ai_cost', 'marketplace_revenue', 'commission'
      )
    )
  );

  return v_core || v_unavailable;
end;
$$;

create or replace function public.admin_funnel(
  p_from timestamptz,
  p_to   timestamptz
)
returns table (
  step                     text,
  step_order               integer,
  unique_actors            bigint,
  total_events             bigint,
  conversion_from_previous numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_from >= p_to then
    raise exception 'invalid_period' using errcode = '22023';
  end if;

  return query
  with steps as (
    select t.name as s_name, t.funnel_order as s_order
      from public.event_types t
     where t.funnel_order is not null
  ),
  counts as (
    select e.event_name as c_name,
           count(distinct coalesce('c:' || e.contact_id::text, 'u:' || e.user_id::text, 'a:' || e.anonymous_id)) as c_actors,
           count(*) as c_total
      from public.events e
     where e.occurred_at >= p_from
       and e.occurred_at <  p_to
       and e.event_name in (select s.s_name from steps s)
     group by e.event_name
  ),
  joined as (
    select s.s_name, s.s_order,
           coalesce(c.c_actors, 0) as j_actors,
           coalesce(c.c_total, 0)  as j_total
      from steps s
      left join counts c on c.c_name = s.s_name
  )
  select j.s_name,
         j.s_order::integer,
         j.j_actors,
         j.j_total,
         case
           when lag(j.j_actors) over (order by j.s_order) > 0
             then round(j.j_actors::numeric / lag(j.j_actors) over (order by j.s_order), 4)
         end
    from joined j
   order by j.s_order;
end;
$$;

-- ---------------------------------------------------------------------
-- 6. service_role: menor privilégio
-- O default do projeto dá TRUNCATE/REFERENCES/TRIGGER a service_role em toda
-- tabela nova e nenhum DML. Zera e concede só o que o servidor usa:
--  * capture_lead()/track_event(): EXECUTE (0300). São security definer e
--    gravam como dono, sem precisar de grant de tabela;
--  * events e consents: select + insert (append-only);
--  * audit_log: select;
--  * assessments (criar, concluir, vincular ao usuário) e assessment_results
--    (inserir ao concluir): a escrita do teste é do servidor (README);
--  * auth.admin.* (listar usuários) usa a API do Auth, sem grant de tabela.
-- user_roles NÃO é gravável por service_role: papel só muda por admin
-- autenticado (granted_by e auditoria dependem do JWT) ou como postgres.
-- ---------------------------------------------------------------------
revoke all on all tables in schema public from service_role;
grant select, insert on table public.events to service_role;
grant select, insert on table public.consents to service_role;
grant select on table public.audit_log to service_role;
grant select, insert, update on table public.assessments to service_role;
grant select, insert on table public.assessment_results to service_role;

-- Tabelas futuras nascem sem acesso: cada migration concede o que precisa.
-- (o projeto tem um default global e outro no schema public: zera os dois)
alter default privileges for role postgres
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;

commit;
