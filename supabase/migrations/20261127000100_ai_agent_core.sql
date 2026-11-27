-- =====================================================================
-- 0100 (2026-11-27): núcleo do agente de IA
-- Depende de: 20261124000100-000700 (is_staff, has_role, set_updated_at, audit_row_change).
--
--  * ai_agent_versions: snapshot da configuração do agente (persona, guias por
--    tipo, modelo). draft editável, active único, archived. Fora de draft é
--    imutável. Publicar e reverter só pela RPC ai_publish_agent_version (admin).
--  * ai_conversations / ai_messages: conversas do playground da equipe (canal
--    'playground'). Policies do canal 'app' (cliente) entram na migration da
--    Onda 6, junto com o consentimento.
--  * ai_usage: tokens e metadados de cada chamada, nunca conteúdo. Escrita só
--    por service_role (caso nomeado, ADR 0008).
--
-- Matriz: staff (admin e collaborator) lê e edita rascunho; só admin publica,
-- reverte e apaga rascunho. anon não tem acesso a nada.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- ai_agent_versions
-- ---------------------------------------------------------------------
create table public.ai_agent_versions (
  id                bigint generated always as identity primary key,
  version           integer not null unique check (version > 0),
  status            text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  label             text check (label is null or char_length(label) <= 80),
  persona           text not null check (char_length(persona) between 1 and 12000),
  -- {"1": "texto", ..., "9": "texto"}; só chaves 1..9 (jsonb - text[] remove as válidas)
  type_guides       jsonb not null default '{}'::jsonb
                      check (
                        jsonb_typeof(type_guides) = 'object'
                        and octet_length(type_guides::text) <= 60000
                        and (type_guides - array['1','2','3','4','5','6','7','8','9']) = '{}'::jsonb
                      ),
  model             text not null check (char_length(model) between 1 and 60),
  max_output_tokens integer not null default 800 check (max_output_tokens between 100 and 4000),
  knowledge_enabled boolean not null default true,
  created_by        uuid references auth.users (id) on delete set null,
  published_by      uuid references auth.users (id) on delete set null,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- no máximo uma versão ativa
create unique index ai_agent_versions_one_active
  on public.ai_agent_versions ((true)) where status = 'active';
create index ai_agent_versions_created_by_idx
  on public.ai_agent_versions (created_by) where created_by is not null;
create index ai_agent_versions_published_by_idx
  on public.ai_agent_versions (published_by) where published_by is not null;

create trigger ai_agent_versions_set_updated_at
  before update on public.ai_agent_versions
  for each row execute function public.set_updated_at();

-- Fora de draft o conteúdo é imutável; transições válidas:
-- draft -> active, active -> archived, archived -> active.
create function public.ai_agent_versions_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'draft' and (
       new.version           is distinct from old.version
    or new.persona           is distinct from old.persona
    or new.type_guides       is distinct from old.type_guides
    or new.model             is distinct from old.model
    or new.max_output_tokens is distinct from old.max_output_tokens
    or new.knowledge_enabled is distinct from old.knowledge_enabled
  ) then
    raise exception 'ai_agent_version_immutable' using errcode = '23514';
  end if;

  if new.status is distinct from old.status
     and not (
          (old.status = 'draft'    and new.status = 'active')
       or (old.status = 'active'   and new.status = 'archived')
       or (old.status = 'archived' and new.status = 'active')
     ) then
    raise exception 'ai_agent_version_invalid_transition' using errcode = '23514';
  end if;

  return new;
end;
$$;

revoke all on function public.ai_agent_versions_guard() from public, anon, authenticated;

create trigger ai_agent_versions_guard
  before update on public.ai_agent_versions
  for each row execute function public.ai_agent_versions_guard();

create trigger audit_ai_agent_versions
  after insert or update or delete on public.ai_agent_versions
  for each row execute function public.audit_row_change();

alter table public.ai_agent_versions enable row level security;

revoke all on table public.ai_agent_versions from anon, authenticated, service_role;
grant select, insert, delete on table public.ai_agent_versions to authenticated;
-- status e published_* só mudam pela RPC: update de coluna restrito
grant update (label, persona, type_guides, model, max_output_tokens, knowledge_enabled)
  on table public.ai_agent_versions to authenticated;

create policy ai_agent_versions_select on public.ai_agent_versions
  for select to authenticated
  using ((select public.is_staff()));

create policy ai_agent_versions_insert on public.ai_agent_versions
  for insert to authenticated
  with check (
    (select public.is_staff())
    and status = 'draft'
    and created_by = (select auth.uid())
    and published_by is null
    and published_at is null
  );

create policy ai_agent_versions_update on public.ai_agent_versions
  for update to authenticated
  using ((select public.is_staff()) and status = 'draft')
  with check ((select public.is_staff()) and status = 'draft');

create policy ai_agent_versions_delete on public.ai_agent_versions
  for delete to authenticated
  using ((select public.has_role('admin')) and status = 'draft');

-- Publica (draft -> active) ou reverte (archived -> active) numa transação.
-- A ativa atual vira archived antes, para respeitar o índice único parcial.
create function public.ai_publish_agent_version(p_version_id bigint)
returns public.ai_agent_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.ai_agent_versions;
  v_result public.ai_agent_versions;
begin
  if not public.has_role('admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_target
    from public.ai_agent_versions
   where id = p_version_id
   for update;

  if not found then
    raise exception 'version_not_found' using errcode = 'P0002';
  end if;
  if v_target.status = 'active' then
    raise exception 'version_already_active' using errcode = '22023';
  end if;

  update public.ai_agent_versions
     set status = 'archived'
   where status = 'active';

  update public.ai_agent_versions
     set status = 'active',
         published_by = auth.uid(),
         published_at = now()
   where id = p_version_id
   returning * into v_result;

  return v_result;
end;
$$;

revoke all on function public.ai_publish_agent_version(bigint) from public, anon;
grant execute on function public.ai_publish_agent_version(bigint) to authenticated;

-- ---------------------------------------------------------------------
-- ai_conversations
-- ---------------------------------------------------------------------
create table public.ai_conversations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  channel          text not null check (channel in ('playground', 'app')),
  agent_version_id bigint not null references public.ai_agent_versions (id) on delete restrict,
  simulated_type   smallint check (simulated_type between 1 and 9),
  title            text check (title is null or char_length(title) <= 120),
  created_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now(),
  constraint ai_conversations_sim_check check (channel = 'playground' or simulated_type is null)
);

create index ai_conversations_user_idx on public.ai_conversations (user_id, last_message_at desc);
create index ai_conversations_version_idx on public.ai_conversations (agent_version_id);

alter table public.ai_conversations enable row level security;

revoke all on table public.ai_conversations from anon, authenticated, service_role;
grant select, insert, delete on table public.ai_conversations to authenticated;
-- versão e tipo simulado são imutáveis (decisão A6): update só de título e ordenação
grant update (title, last_message_at) on table public.ai_conversations to authenticated;

-- teste da equipe no playground é visível à equipe; o resto só ao dono
create policy ai_conversations_select on public.ai_conversations
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (channel = 'playground' and (select public.is_staff()))
  );

create policy ai_conversations_insert on public.ai_conversations
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and channel = 'playground'
    and (select public.is_staff())
  );

create policy ai_conversations_update on public.ai_conversations
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy ai_conversations_delete on public.ai_conversations
  for delete to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- ai_messages (UIMessage do AI SDK, uma linha por mensagem)
-- ---------------------------------------------------------------------
create table public.ai_messages (
  id              text primary key check (char_length(id) between 1 and 64),
  conversation_id uuid not null references public.ai_conversations (id) on delete cascade,
  seq             bigint generated always as identity,
  role            text not null check (role in ('user', 'assistant')),
  parts           jsonb not null check (jsonb_typeof(parts) = 'array' and octet_length(parts::text) <= 200000),
  created_at      timestamptz not null default now()
);

create index ai_messages_conversation_idx on public.ai_messages (conversation_id, seq);

alter table public.ai_messages enable row level security;

revoke all on table public.ai_messages from anon, authenticated, service_role;
grant select, insert on table public.ai_messages to authenticated;
grant update (parts) on table public.ai_messages to authenticated;

-- lê quem enxerga a conversa (a RLS de ai_conversations já é aplicada no exists)
create policy ai_messages_select on public.ai_messages
  for select to authenticated
  using (
    exists (select 1 from public.ai_conversations c where c.id = conversation_id)
  );

-- escreve só o dono da conversa (equipe lê conversa alheia, mas não escreve nela)
create policy ai_messages_insert on public.ai_messages
  for insert to authenticated
  with check (
    exists (
      select 1 from public.ai_conversations c
       where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

create policy ai_messages_update on public.ai_messages
  for update to authenticated
  using (
    exists (
      select 1 from public.ai_conversations c
       where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.ai_conversations c
       where c.id = conversation_id and c.user_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- ai_usage (nunca guarda conteúdo)
-- ---------------------------------------------------------------------
create table public.ai_usage (
  id                  bigint generated always as identity primary key,
  at                  timestamptz not null default now(),
  user_id             uuid references auth.users (id) on delete set null,
  conversation_id     uuid references public.ai_conversations (id) on delete set null,
  agent_version_id    bigint references public.ai_agent_versions (id) on delete set null,
  feature             text not null check (feature in ('chat', 'embedding')),
  model               text not null check (char_length(model) between 1 and 60),
  input_tokens        integer not null default 0 check (input_tokens >= 0),
  output_tokens       integer not null default 0 check (output_tokens >= 0),
  cached_input_tokens integer not null default 0 check (cached_input_tokens >= 0),
  latency_ms          integer check (latency_ms is null or latency_ms >= 0),
  status              text not null check (status in ('ok', 'error', 'limit_blocked')),
  error_code          text check (error_code is null or char_length(error_code) <= 60),
  crisis_detected     boolean not null default false
);

create index ai_usage_at_idx on public.ai_usage (at desc);
create index ai_usage_user_at_idx on public.ai_usage (user_id, at desc) where user_id is not null;
create index ai_usage_conversation_idx on public.ai_usage (conversation_id) where conversation_id is not null;
create index ai_usage_version_idx on public.ai_usage (agent_version_id) where agent_version_id is not null;

alter table public.ai_usage enable row level security;

revoke all on table public.ai_usage from anon, authenticated, service_role;
grant select on table public.ai_usage to authenticated;
grant insert on table public.ai_usage to service_role;

create policy ai_usage_select on public.ai_usage
  for select to authenticated
  using ((select public.is_staff()));

commit;
