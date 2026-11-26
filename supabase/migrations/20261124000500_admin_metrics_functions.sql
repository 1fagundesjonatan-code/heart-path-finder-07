-- =====================================================================
-- 0500 — Funções de métricas do dashboard administrativo
-- Depende de: 0100-0400.
--
-- Todas: security definer, search_path = '', checam o papel e levantam
-- 42501 'forbidden' caso contrário. Matriz por papel:
--   admin_dashboard_metrics  qualquer staff; campos restritos por papel (ver abaixo)
--   admin_funnel             admin | operator | marketing
--   admin_new_users_series   qualquer staff Período semiaberto [p_from, p_to).
-- Fuso de negócio fixo: America/Sao_Paulo (datas de gasto e buckets).
-- Chamar com o JWT do usuário logado (service role NÃO passa: não é staff).
-- =====================================================================

-- ---------------------------------------------------------------------
-- admin_dashboard_metrics
--
-- Definições:
--  total_users     perfis criados antes de p_to.
--  new_users       perfis criados em [p_from, p_to).
--  active_users    usuários distintos com >=1 evento (com user_id) em
--                  [max(p_from, p_to - p_active_window_days), p_to).
--  leads_captured  contatos distintos com evento lead_captured no período (coorte).
--  leads_converted dessa coorte, quem já chegou a signup_completed ou além (até p_to).
--  lead_to_customer_rate  coorte que já chegou a subscription_started / total da coorte
--                  (razão 0..1; null se coorte vazia).
--  new_customers   contatos que entraram em subscription_started no período.
--  tests_started   assessments iniciados no período (todas as instrumentos).
--  tests_completed assessments concluídos no período (completed_at).
--  test_completion_rate  dos iniciados no período, quantos estão 'completed' (0..1).
--  marketing_spend soma de marketing_spend na moeda p_currency; linhas em outra
--                  moeda NÃO são somadas (contadas em spend_rows_other_currency).
--  cpl             spend / leads_captured; null se não há lead ou não há gasto lançado.
--  cac             spend / new_customers; null se não há cliente pagante novo
--                  (ou sem gasto lançado). Enquanto não existir cobrança, new_customers
--                  só sobe se alguém mover o estágio manualmente => cac fica null.
-- Métricas sem fonte de dados retornam null e são listadas em `unavailable`.
--
-- Restrição por papel (null + listadas em `restricted: {reason:'role', metrics:[...]}`):
--  * leads_captured, leads_converted, lead_to_customer_rate, new_customers:
--      só admin | operator | marketing.
--  * marketing_spend, spend_rows_other_currency, cpl, cac:
--      só admin | marketing | finance.
--  total_users, active_users, new_users, tests_*: qualquer staff.
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
  v_can_leads := public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[]);
  v_can_spend := public.has_any_role(array['admin', 'marketing', 'finance']::public.app_role[]);
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

-- ---------------------------------------------------------------------
-- admin_funnel: usuários/atores únicos e total de eventos por etapa.
-- Etapas = event_types com funnel_order (configurável no catálogo).
-- Ator = contato, senão usuário, senão anonymous_id. Contagem é POR ETAPA
-- (volume do período), não uma coorte estrita: o visitante anônimo de page_view
-- e o mesmo lead (já com contact_id) aparecem como atores distintos.
-- ---------------------------------------------------------------------
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
  if not public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[]) then
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
-- admin_new_users_series: novos usuários por bucket, sem buracos
-- (buckets sem cadastro vêm com 0). p_bucket: 'day' | 'week' | 'month'.
-- bucket_start = início do bucket no fuso America/Sao_Paulo, como timestamptz.
-- ---------------------------------------------------------------------
create or replace function public.admin_new_users_series(
  p_from   timestamptz,
  p_to     timestamptz,
  p_bucket text default 'day'
)
returns table (
  bucket_start timestamptz,
  new_users    bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_tz constant text := 'America/Sao_Paulo';
  v_step interval;
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_from >= p_to then
    raise exception 'invalid_period' using errcode = '22023';
  end if;
  if p_bucket is null or p_bucket not in ('day', 'week', 'month') then
    raise exception 'invalid_bucket' using errcode = '22023';
  end if;

  v_step := ('1 ' || p_bucket)::interval;

  return query
  with grid as (
    select g.b
      from generate_series(
             date_trunc(p_bucket, p_from at time zone v_tz),
             date_trunc(p_bucket, (p_to - interval '1 microsecond') at time zone v_tz),
             v_step
           ) as g(b)
  ),
  counts as (
    select date_trunc(p_bucket, p.created_at at time zone v_tz) as b, count(*) as n
      from public.profiles p
     where p.created_at >= p_from
       and p.created_at <  p_to
     group by 1
  )
  select (grid.b at time zone v_tz)::timestamptz,
         coalesce(counts.n, 0)::bigint
    from grid
    left join counts on counts.b = grid.b
   order by grid.b;
end;
$$;

-- só usuários logados chamam (a checagem de staff é interna)
revoke all on function public.admin_dashboard_metrics(timestamptz, timestamptz, text, integer)
  from public, anon;
revoke all on function public.admin_funnel(timestamptz, timestamptz) from public, anon;
revoke all on function public.admin_new_users_series(timestamptz, timestamptz, text) from public, anon;
grant execute on function public.admin_dashboard_metrics(timestamptz, timestamptz, text, integer) to authenticated;
grant execute on function public.admin_funnel(timestamptz, timestamptz) to authenticated;
grant execute on function public.admin_new_users_series(timestamptz, timestamptz, text) to authenticated;
