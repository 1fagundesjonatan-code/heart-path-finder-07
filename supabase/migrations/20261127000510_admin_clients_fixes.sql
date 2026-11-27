-- =====================================================================
-- 0510 (2026-11-27): correções da revisão de 000500
--  * admin_list_clients: busca por e-mail passa a ignorar maiúsculas (o termo já
--    era minúsculo, o e-mail não).
--  * admin_client_ai_summary: deixa de ser chamável direto. Sem o filtro de
--    papéis, qualquer staff lia o resumo de IA de outro staff/profissional. Só
--    admin_client_detail (security definer, que já filtra para clientes) a usa.
-- =====================================================================

begin;

create or replace function public.admin_list_clients(
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
       or position(v_search in lower(coalesce(c.email, ''))) > 0
     )
   order by c.id desc
   limit v_limit;
end;
$$;

revoke execute on function public.admin_client_ai_summary(uuid) from authenticated;

commit;
