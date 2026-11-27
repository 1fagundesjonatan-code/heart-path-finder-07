-- =====================================================================
-- 0400 (2026-11-27): cadastro de profissionais (papel partner)
-- Depende de: 20261124000100-000700 (is_staff, has_role, set_updated_at,
-- audit_row_change) e 20261127000100.
--
--  * professionals: ficha 1:1 com auth.users (registro CRP/CRM, especialidades,
--    bio, verificação e estado do convite).
--  * Nasce só pela RPC admin_register_professional (admin): ela atribui o papel
--    partner e cria a ficha na mesma transação. service_role NÃO ganha INSERT em
--    user_roles; a escalada de papel passa por uma função security definer que
--    checa has_role('admin') com o JWT de quem chama.
--  * Matriz: staff (admin e collaborator) lê e edita a ficha; só admin convida
--    (RPC) e só admin altera a verificação; partner lê só a própria linha.
--    verified_by/verified_at são gravados por trigger (não falsificáveis).
--  * Convite aceito: trigger em auth.users grava invite_accepted_at quando o
--    e-mail é confirmado.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- audit_row_change: tabelas sem coluna id (PK = user_id) passam a registrar
-- entity_id. Corpo idêntico ao original, só muda a origem de v_id.
-- ---------------------------------------------------------------------
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
    v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'user_id');
    v_diff := to_jsonb(new) - v_redact;
  elsif tg_op = 'DELETE' then
    v_id := coalesce(to_jsonb(old) ->> 'id', to_jsonb(old) ->> 'user_id');
    v_diff := to_jsonb(old) - v_redact;
  else
    v_id := coalesce(to_jsonb(new) ->> 'id', to_jsonb(new) ->> 'user_id');
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

-- ---------------------------------------------------------------------
-- professionals
-- ---------------------------------------------------------------------
create table public.professionals (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  full_name            text not null check (char_length(full_name) between 1 and 120),
  registry_council     text not null check (registry_council in ('CRP', 'CRM', 'OTHER')),
  registry_number      text not null check (registry_number ~ '^[0-9A-Za-z./-]{1,20}$'),
  registry_state       text not null check (registry_state ~ '^[A-Z]{2}$'),
  specialties          text[] not null default '{}' check (cardinality(specialties) <= 10),
  bio                  text check (bio is null or char_length(bio) <= 2000),
  verification_status  text not null default 'pending' check (verification_status in ('pending', 'verified', 'rejected')),
  verification_note    text check (verification_note is null or char_length(verification_note) <= 500),
  verified_by          uuid references auth.users (id) on delete set null,
  verified_at          timestamptz,
  invited_by           uuid references auth.users (id) on delete set null,
  invite_accepted_at   timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint professionals_registry_key unique (registry_council, registry_state, registry_number),
  constraint professionals_verification_check check (
    (verification_status = 'pending') = (verified_at is null)
  )
);

create index professionals_verified_by_idx
  on public.professionals (verified_by) where verified_by is not null;
create index professionals_invited_by_idx
  on public.professionals (invited_by) where invited_by is not null;
-- listagem do admin (cursor por criação)
create index professionals_created_at_idx on public.professionals (created_at desc, user_id);

create trigger professionals_set_updated_at
  before update on public.professionals
  for each row execute function public.set_updated_at();

-- Normaliza o registro (unicidade sem diferença de caixa) e protege a verificação:
--  * só admin muda verification_status (sem JWT, ex.: SQL direto, passa);
--  * verified_by/verified_at são sempre do chamador e do momento da mudança;
--  * alterar o registro de um profissional verificado volta a ficha para pending.
create function public.professionals_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.registry_number := upper(btrim(new.registry_number));
  new.registry_state  := upper(btrim(new.registry_state));

  if tg_op = 'UPDATE' then
    if new.verification_status = old.verification_status then
      if old.verification_status = 'verified'
         and (   new.registry_council is distinct from old.registry_council
              or new.registry_number  is distinct from old.registry_number
              or new.registry_state   is distinct from old.registry_state) then
        new.verification_status := 'pending';
        new.verified_by := null;
        new.verified_at := null;
      else
        new.verified_by := old.verified_by;
        new.verified_at := old.verified_at;
      end if;
    else
      if auth.uid() is not null and not public.has_role('admin') then
        raise exception 'forbidden' using errcode = '42501';
      end if;
      if new.verification_status = 'pending' then
        new.verified_by := null;
        new.verified_at := null;
      else
        new.verified_by := auth.uid();
        new.verified_at := now();
      end if;
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.professionals_guard() from public, anon, authenticated;

create trigger professionals_guard
  before insert or update on public.professionals
  for each row execute function public.professionals_guard();

-- nome é PII (redigido); registro profissional é dado público de conselho
create trigger audit_professionals
  after insert or update or delete on public.professionals
  for each row execute function public.audit_row_change('full_name');

-- convite aceito = e-mail confirmado
create function public.professionals_mark_invite_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.professionals
     set invite_accepted_at = now()
   where user_id = new.id
     and invite_accepted_at is null;
  return new;
end;
$$;

revoke all on function public.professionals_mark_invite_accepted() from public, anon, authenticated;

create trigger on_auth_user_confirmed_professional
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.professionals_mark_invite_accepted();

-- ---------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------
alter table public.professionals enable row level security;

revoke all on table public.professionals from anon, authenticated, service_role;
grant select on table public.professionals to authenticated;
-- sem INSERT/DELETE: a ficha nasce pela RPC. user_id, invited_by, invite_accepted_at e
-- verified_* não são editáveis diretamente.
grant update (
  full_name, registry_council, registry_number, registry_state,
  specialties, bio, verification_status, verification_note
) on table public.professionals to authenticated;

create policy professionals_select on public.professionals
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));

create policy professionals_update on public.professionals
  for update to authenticated
  using ((select public.is_staff()))
  with check ((select public.is_staff()));

-- ---------------------------------------------------------------------
-- admin_register_professional: chamada pelo servidor DEPOIS de
-- auth.admin.inviteUserByEmail, com o cliente Supabase do JWT do admin
-- (nunca com a service role). Atribui partner e cria a ficha atomicamente.
-- Se falhar (ex.: registro duplicado, constraint professionals_registry_key),
-- o chamador remove o usuário recém-convidado via auth.admin.deleteUser.
-- ---------------------------------------------------------------------
create function public.admin_register_professional(
  p_user_id          uuid,
  p_full_name        text,
  p_registry_council text,
  p_registry_number  text,
  p_registry_state   text,
  p_specialties      text[] default '{}',
  p_bio              text   default null
)
returns public.professionals
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_confirmed_at timestamptz;
  v_result       public.professionals;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select u.email_confirmed_at into v_confirmed_at
    from auth.users u
   where u.id = p_user_id;
  if not found then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;

  -- nunca rebaixa/mistura equipe: admin e collaborator não viram profissional
  if exists (
    select 1 from public.user_roles ur
     where ur.user_id = p_user_id and ur.role in ('admin', 'collaborator')
  ) then
    raise exception 'user_is_staff' using errcode = '22023';
  end if;

  if exists (select 1 from public.professionals p where p.user_id = p_user_id) then
    raise exception 'already_professional' using errcode = '22023';
  end if;

  insert into public.user_roles (user_id, role)
  values (p_user_id, 'partner')
  on conflict (user_id, role) do nothing;

  insert into public.professionals (
    user_id, full_name, registry_council, registry_number, registry_state,
    specialties, bio, invited_by, invite_accepted_at
  )
  values (
    p_user_id, p_full_name, p_registry_council, p_registry_number, p_registry_state,
    coalesce(p_specialties, '{}'), p_bio, auth.uid(), v_confirmed_at
  )
  returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_register_professional(uuid, text, text, text, text, text[], text)
  from public, anon, service_role;
grant execute on function public.admin_register_professional(uuid, text, text, text, text, text[], text)
  to authenticated;

commit;
