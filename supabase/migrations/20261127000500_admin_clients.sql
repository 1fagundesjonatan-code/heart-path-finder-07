-- =====================================================================
-- 0500 (2026-11-27): lista e ficha de clientes do painel
-- Depende de: 20261124000100-000700, 20261127000100 e 20261127000400.
--
--  * admin_list_clients: clientes paginados por cursor (crm_contacts.id desc).
--    Exclui equipe (admin, collaborator) e profissionais (partner): o trigger de
--    confirmação cria contato e papel client para todo usuário confirmado
--    (risco R11 do plano), sem este filtro a equipe apareceria como cliente.
--  * admin_client_detail: ficha (contato, consentimentos, resultado do
--    Eneagrama, atividade e resumo de IA).
--  * admin_client_ai_summary: só contagens e datas, nunca conteúdo (ADR 0007).
--
-- As três são security definer com gate is_staff(): o collaborator não lê
-- user_roles de terceiros, então um security invoker não conseguiria aplicar o
-- filtro de papéis. O que a RLS faria é replicado de forma explícita: o tipo do
-- Eneagrama só sai com has_active_consent(..., 'enneagram_profile_share').
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- admin_list_clients
-- p_after: último contact_id da página anterior (null = primeira página).
-- p_limit: 1..100 (default 50). Para saber se há mais páginas, peça limit + 1.
-- ---------------------------------------------------------------------
create function public.admin_list_clients(
  p_search text    default null,
  p_after  bigint  default null,
  p_limit  integer default 50
)
returns table (
  contact_id              bigint,
  user_id                 uuid,
  full_name               text,
  email                   text,
  phone                   text,
  stage                   public.crm_stage,
  created_at              timestamptz,
  primary_type            text,
  assessment_completed_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_limit  constant integer := least(greatest(coalesce(p_limit, 50), 1), 100);
  v_search constant text    := nullif(lower(btrim(left(coalesce(p_search, ''), 100))), '');
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select c.id,
         c.user_id,
         coalesce(c.full_name, p.full_name),
         c.email,
         c.phone,
         c.stage,
         c.created_at,
         r.primary_type,
         r.completed_at
    from public.crm_contacts c
    left join public.profiles p on p.id = c.user_id
    left join lateral (
      select ar.primary_type, a.completed_at
        from public.assessments a
        join public.assessment_results ar on ar.assessment_id = a.id
       where a.contact_id = c.id
         and a.status = 'completed'
         and a.instrument like 'enneagram%'
         and public.has_active_consent(c.id, 'enneagram_profile_share')
       order by a.completed_at desc, a.id desc
       limit 1
    ) r on true
   where c.user_id is not null
     and not exists (
       select 1 from public.user_roles ur
        where ur.user_id = c.user_id
          and ur.role in ('admin', 'collaborator', 'partner')
     )
     and (p_after is null or c.id < p_after)
     and (
       v_search is null
       or position(v_search in lower(coalesce(c.full_name, p.full_name, ''))) > 0
       or position(v_search in coalesce(c.email, '')) > 0
     )
   order by c.id desc
   limit v_limit;
end;
$$;

-- ---------------------------------------------------------------------
-- admin_client_ai_summary: contagens e datas do canal 'app', nunca conteúdo
-- ---------------------------------------------------------------------
create function public.admin_client_ai_summary(p_user_id uuid)
returns table (
  conversations    bigint,
  messages         bigint,
  input_tokens     bigint,
  output_tokens    bigint,
  last_activity_at timestamptz
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

  return query
  select
    (select count(*) from public.ai_conversations c
      where c.user_id = p_user_id and c.channel = 'app'),
    (select count(*) from public.ai_messages m
       join public.ai_conversations c on c.id = m.conversation_id
      where c.user_id = p_user_id and c.channel = 'app'),
    (select coalesce(sum(u.input_tokens), 0)::bigint from public.ai_usage u
      where u.user_id = p_user_id),
    (select coalesce(sum(u.output_tokens), 0)::bigint from public.ai_usage u
      where u.user_id = p_user_id),
    greatest(
      (select max(c.last_message_at) from public.ai_conversations c
        where c.user_id = p_user_id and c.channel = 'app'),
      (select max(u.at) from public.ai_usage u where u.user_id = p_user_id)
    );
end;
$$;

-- ---------------------------------------------------------------------
-- admin_client_detail: ficha completa. P0002 'client_not_found' se o usuário
-- não existe como cliente (inclui equipe e profissionais, mesma regra da lista).
-- ---------------------------------------------------------------------
create function public.admin_client_detail(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_contact public.crm_contacts;
  v_name    text;
  v_shared  boolean;
begin
  if not public.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select c.* into v_contact
    from public.crm_contacts c
   where c.user_id = p_user_id
     and not exists (
       select 1 from public.user_roles ur
        where ur.user_id = c.user_id
          and ur.role in ('admin', 'collaborator', 'partner')
     );
  if not found then
    raise exception 'client_not_found' using errcode = 'P0002';
  end if;

  select p.full_name into v_name from public.profiles p where p.id = p_user_id;
  v_shared := public.has_active_consent(v_contact.id, 'enneagram_profile_share');

  return jsonb_build_object(
    'contact', jsonb_build_object(
      'id', v_contact.id,
      'user_id', v_contact.user_id,
      'full_name', coalesce(v_contact.full_name, v_name),
      'email', v_contact.email,
      'phone', v_contact.phone,
      'stage', v_contact.stage,
      'notes', v_contact.notes,
      'created_at', v_contact.created_at,
      'last_interaction_at', v_contact.last_interaction_at
    ),
    'enneagram_shared', v_shared,
    'enneagram', case when v_shared then (
      select jsonb_build_object(
               'primary_type', ar.primary_type,
               'scores', ar.scores,
               'scoring_version', ar.scoring_version,
               'completed_at', a.completed_at
             )
        from public.assessments a
        join public.assessment_results ar on ar.assessment_id = a.id
       where a.contact_id = v_contact.id
         and a.status = 'completed'
         and a.instrument like 'enneagram%'
       order by a.completed_at desc, a.id desc
       limit 1
    ) end,
    'consents', coalesce((
      select jsonb_agg(jsonb_build_object(
               'consent_type', l.consent_type,
               'granted', l.granted,
               'document_version', l.document_version,
               'at', l.created_at
             ) order by l.consent_type)
        from (
          select distinct on (k.consent_type) k.consent_type, k.granted, k.document_version, k.created_at
            from public.consents k
           where k.contact_id = v_contact.id
           order by k.consent_type, k.created_at desc, k.id desc
        ) l
    ), '[]'::jsonb),
    -- só nome e data: properties podem carregar dado livre
    'activity', coalesce((
      select jsonb_agg(jsonb_build_object('event_name', e.event_name, 'occurred_at', e.occurred_at)
                       order by e.occurred_at desc, e.id desc)
        from (
          select ev.id, ev.event_name, ev.occurred_at
            from public.events ev
           where ev.contact_id = v_contact.id
           order by ev.occurred_at desc, ev.id desc
           limit 20
        ) e
    ), '[]'::jsonb),
    'ai', (select to_jsonb(s) from public.admin_client_ai_summary(p_user_id) s)
  );
end;
$$;

revoke all on function public.admin_list_clients(text, bigint, integer) from public, anon, service_role;
revoke all on function public.admin_client_ai_summary(uuid) from public, anon, service_role;
revoke all on function public.admin_client_detail(uuid) from public, anon, service_role;
grant execute on function public.admin_list_clients(text, bigint, integer) to authenticated;
grant execute on function public.admin_client_ai_summary(uuid) to authenticated;
grant execute on function public.admin_client_detail(uuid) to authenticated;

commit;
