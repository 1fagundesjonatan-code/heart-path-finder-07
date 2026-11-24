-- =====================================================================
-- 0300 — Eventos, consentimentos (LGPD), avaliações e captura anônima
-- Depende de: 0100, 0200.
--
-- DECISÃO — captura anônima (site público sem login):
--   As tabelas NÃO têm policy nem grant para anon. A entrada pública passa
--   por server function (TanStack Start) usando a service role, que chama
--   as funções capture_lead() / track_event() abaixo. Essas funções:
--     * são EXECUTE-only para service_role (anon/authenticated não chamam);
--     * validam e limitam toda a entrada;
--     * fazem tudo atômico (contato + consentimento + evento + estágio).
--   Rate limit / anti-bot ficam no server function (o banco não vê IP).
--
-- DECISÃO — test_answer:
--   NÃO há evento por resposta (162 por teste = ~160x de escrita sem valor
--   analítico). As respostas vão em assessments.answers ao concluir; o
--   abandono é medido por test_progress (marcos 25/50/75%).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Catálogo de eventos (extensível sem ALTER de CHECK numa tabela grande)
-- ---------------------------------------------------------------------
create table if not exists public.event_types (
  name             text primary key check (name ~ '^[a-z][a-z0-9_]{1,59}$'),
  description      text,
  -- estágio do CRM que este evento promove (só avança, nunca regride)
  funnel_stage     public.crm_stage,
  -- posição no funil de admin_funnel(); null = não é etapa do funil
  funnel_order     smallint,
  -- se o evento atualiza crm_contacts.last_interaction_at
  touches_contact  boolean not null default true,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);

create unique index if not exists event_types_funnel_order_key
  on public.event_types (funnel_order) where funnel_order is not null;

-- ---------------------------------------------------------------------
-- events: append-only (revoke de UPDATE/DELETE; sem trigger — FKs "set null"
-- executam como dono da tabela, então apagar contato/usuário continua OK)
-- ---------------------------------------------------------------------
create table if not exists public.events (
  id               bigint generated always as identity primary key,
  occurred_at      timestamptz not null default now(),
  event_name       text not null references public.event_types (name) on update cascade on delete restrict,
  contact_id       bigint references public.crm_contacts (id) on delete set null,
  user_id          uuid references auth.users (id) on delete set null,
  anonymous_id     text check (anonymous_id is null or char_length(anonymous_id) <= 64),
  session_id       text check (session_id is null or char_length(session_id) <= 64),
  channel_id       bigint references public.acquisition_channels (id) on delete set null,
  campaign_id      bigint references public.campaigns (id) on delete set null,
  landing_page_id  bigint references public.landing_pages (id) on delete set null,
  utm_source       text check (char_length(utm_source) <= 200),
  utm_medium       text check (char_length(utm_medium) <= 200),
  utm_campaign     text check (char_length(utm_campaign) <= 200),
  utm_content      text check (char_length(utm_content) <= 200),
  utm_term         text check (char_length(utm_term) <= 200),
  properties       jsonb not null default '{}'::jsonb
                     check (jsonb_typeof(properties) = 'object' and octet_length(properties::text) <= 4096)
  -- sem CHECK de "ao menos um ator": o ON DELETE SET NULL das FKs poderia
  -- violá-lo e bloquear a exclusão de contato/usuário. Validado em track_event().
);

-- contagens do dashboard/funil por evento e período
create index if not exists events_name_occurred_idx on public.events (event_name, occurred_at);
-- varredura temporal barata (tabela só cresce em ordem de tempo => alta correlação)
create index if not exists events_occurred_brin on public.events using brin (occurred_at);
-- linha do tempo do contato + suporte ao ON DELETE SET NULL
create index if not exists events_contact_idx
  on public.events (contact_id, occurred_at) where contact_id is not null;
create index if not exists events_user_idx
  on public.events (user_id, occurred_at) where user_id is not null;
create index if not exists events_anonymous_idx
  on public.events (anonymous_id, occurred_at) where anonymous_id is not null;
create index if not exists events_channel_idx
  on public.events (channel_id) where channel_id is not null;
create index if not exists events_campaign_idx
  on public.events (campaign_id) where campaign_id is not null;
create index if not exists events_landing_idx
  on public.events (landing_page_id) where landing_page_id is not null;

-- Trigger: eventos de funil promovem o estágio e marcam a interação.
create or replace function public.events_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_stage   public.crm_stage;
  v_touches boolean;
begin
  if new.contact_id is null then
    return null;
  end if;

  select t.funnel_stage, t.touches_contact
    into v_stage, v_touches
    from public.event_types t
   where t.name = new.event_name;

  if v_stage is null and not coalesce(v_touches, false) then
    return null;
  end if;

  update public.crm_contacts c
     set last_interaction_at = case when coalesce(v_touches, false) then new.occurred_at else c.last_interaction_at end,
         stage = case
                   when v_stage is not null and c.stage < v_stage then v_stage
                   else c.stage
                 end
   where c.id = new.contact_id;

  return null;
end;
$$;

revoke all on function public.events_after_insert() from public, anon, authenticated;

drop trigger if exists events_after_insert on public.events;
create trigger events_after_insert
  after insert on public.events
  for each row execute function public.events_after_insert();

-- ---------------------------------------------------------------------
-- consents: ledger append-only (cada concessão/revogação é uma linha;
-- o estado atual é a linha mais recente por contato+tipo).
--
-- LGPD / minimização: NÃO guardamos IP nem user-agent. A evidência de
-- consentimento é: contato + tipo + versão do documento + granted + data +
-- origem (source). Para lead anônimo o contato (e-mail) já identifica.
-- Se jurídico exigir IP no futuro, adicionar coluna ip_hash (HMAC com
-- segredo), nunca IP cru.
-- ---------------------------------------------------------------------
do $$
begin
  create type public.consent_type as enum (
    'terms', 'privacy', 'marketing', 'ai_memory', 'enneagram_profile_share'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.consents (
  id                bigint generated always as identity primary key,
  contact_id        bigint not null references public.crm_contacts (id) on delete cascade,
  consent_type      public.consent_type not null,
  document_version  text not null check (char_length(document_version) between 1 and 40),
  granted           boolean not null,
  source            text check (source is null or char_length(source) <= 50),
  created_at        timestamptz not null default now()
);

-- cobre a FK contact_id e a consulta "último consentimento por tipo"
create index if not exists consents_contact_type_idx
  on public.consents (contact_id, consent_type, created_at desc, id desc);

-- Consentimento vigente? (usado nas policies de staff sobre resultados)
create or replace function public.has_active_consent(
  p_contact_id bigint,
  p_type public.consent_type
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select c.granted
    from public.consents c
    where c.contact_id = p_contact_id
      and c.consent_type = p_type
    order by c.created_at desc, c.id desc
    limit 1
  ), false);
$$;

revoke all on function public.has_active_consent(bigint, public.consent_type) from public, anon;
grant execute on function public.has_active_consent(bigint, public.consent_type) to authenticated;

-- ---------------------------------------------------------------------
-- assessments (genérico para qualquer instrumento) + assessment_results
-- ---------------------------------------------------------------------
create table if not exists public.assessments (
  id              bigint generated always as identity primary key,
  user_id         uuid references auth.users (id) on delete cascade,
  contact_id      bigint references public.crm_contacts (id) on delete cascade,
  anonymous_id    text check (anonymous_id is null or char_length(anonymous_id) <= 64),
  instrument      text not null check (instrument ~ '^[a-z][a-z0-9_]{1,59}$'),   -- ex.: 'enneagram_likert_v1'
  status          text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  started_at      timestamptz not null default now(),
  completed_at    timestamptz,
  answered_count  smallint not null default 0 check (answered_count >= 0),
  -- respostas brutas, só ao concluir. Formato livre por instrumento
  -- (enneagram: [[questionId, valor], ...]) — dado sensível: mesma regra de acesso do resultado.
  answers         jsonb check (answers is null or octet_length(answers::text) <= 65536),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint assessments_owner_check check (num_nonnulls(user_id, contact_id, anonymous_id) >= 1),
  constraint assessments_completed_check check (status <> 'completed' or completed_at is not null)
);

create index if not exists assessments_user_idx
  on public.assessments (user_id, started_at desc) where user_id is not null;
create index if not exists assessments_contact_idx
  on public.assessments (contact_id) where contact_id is not null;
create index if not exists assessments_anonymous_idx
  on public.assessments (anonymous_id) where anonymous_id is not null;
create index if not exists assessments_started_at_idx on public.assessments (started_at);
create index if not exists assessments_completed_at_idx
  on public.assessments (completed_at) where completed_at is not null;

drop trigger if exists assessments_set_updated_at on public.assessments;
create trigger assessments_set_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

create table if not exists public.assessment_results (
  id               bigint generated always as identity primary key,
  assessment_id    bigint not null unique references public.assessments (id) on delete cascade,
  -- enneagram: {"1": 62.5, "2": 40.1, ...} (0-100 por tipo)
  scores           jsonb not null check (jsonb_typeof(scores) = 'object'),
  -- enneagram: '1'..'9'. text para servir a outros instrumentos.
  primary_type     text not null check (primary_type ~ '^[A-Za-z0-9_\-]{1,40}$'),
  scoring_version  text check (scoring_version is null or char_length(scoring_version) <= 40),
  computed_at      timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RLS + grants
-- ---------------------------------------------------------------------

-- event_types: staff lê; admin gerencia
alter table public.event_types enable row level security;
revoke all on table public.event_types from anon, authenticated;
grant select, insert, update on table public.event_types to authenticated;

drop policy if exists event_types_select on public.event_types;
create policy event_types_select on public.event_types
  for select to authenticated using ((select public.is_staff()));
drop policy if exists event_types_insert on public.event_types;
create policy event_types_insert on public.event_types
  for insert to authenticated with check ((select public.has_role('admin')));
drop policy if exists event_types_update on public.event_types;
create policy event_types_update on public.event_types
  for update to authenticated
  using ((select public.has_role('admin')))
  with check ((select public.has_role('admin')));

-- events: staff de CRM lê; NINGUÉM escreve via API (só service role / funções definer)
alter table public.events enable row level security;
revoke all on table public.events from anon, authenticated, service_role;
grant select on table public.events to authenticated;
grant select, insert on table public.events to service_role;   -- append-only

drop policy if exists events_select on public.events;
create policy events_select on public.events
  for select to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));

-- consents: cliente lê e registra os próprios; sem UPDATE/DELETE (ledger)
alter table public.consents enable row level security;
revoke all on table public.consents from anon, authenticated, service_role;
grant select, insert on table public.consents to authenticated, service_role;

drop policy if exists consents_select on public.consents;
create policy consents_select on public.consents
  for select to authenticated
  using (
    contact_id = (select public.current_contact_id())
    or (select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[]))
  );
drop policy if exists consents_insert_own on public.consents;
create policy consents_insert_own on public.consents
  for insert to authenticated
  with check (contact_id = (select public.current_contact_id()));

-- assessments: cliente vê os próprios. Admin/operator só com consentimento
-- 'enneagram_profile_share' do dono (marketing/finance nunca veem resultado individual). Escrita: só server (service role).
alter table public.assessments enable row level security;
revoke all on table public.assessments from anon, authenticated;
grant select on table public.assessments to authenticated;

drop policy if exists assessments_select_own on public.assessments;
create policy assessments_select_own on public.assessments
  for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists assessments_select_staff_with_consent on public.assessments;
create policy assessments_select_staff_with_consent on public.assessments
  for select to authenticated
  using (
    contact_id is not null
    and (select public.has_any_role(array['admin', 'operator']::public.app_role[]))
    and (select public.has_active_consent(contact_id, 'enneagram_profile_share'))
  );

-- assessment_results herda a visibilidade do pai: a subquery abaixo passa pela
-- RLS de assessments com o papel do chamador (dono OU staff com consentimento).
alter table public.assessment_results enable row level security;
revoke all on table public.assessment_results from anon, authenticated;
grant select on table public.assessment_results to authenticated;

drop policy if exists assessment_results_select on public.assessment_results;
create policy assessment_results_select on public.assessment_results
  for select to authenticated
  using (
    exists (
      select 1 from public.assessments a where a.id = assessment_results.assessment_id
    )
  );

-- ---------------------------------------------------------------------
-- Helpers internos de validação/atribuição (não expostos)
-- ---------------------------------------------------------------------
create or replace function public.assert_json_object(
  p_value jsonb,
  p_max_bytes integer,
  p_label text
)
returns void
language plpgsql
immutable
set search_path = ''
as $$
begin
  if p_value is null
     or jsonb_typeof(p_value) <> 'object'
     or octet_length(p_value::text) > p_max_bytes then
    raise exception 'invalid_%', p_label using errcode = '22023';
  end if;
end;
$$;

-- Resolve canal/campanha/landing a partir de utm + slug.
-- Ordem: campanha por utm_campaign (traz o canal) -> canal por utm_source
-- (code ou alias) -> 'other' se veio utm_source desconhecido -> 'landing_page'
-- se só há landing -> null (acesso direto/sem atribuição).
create or replace function public.resolve_acquisition(
  p_utm jsonb,
  p_landing_slug text
)
returns table (o_channel_id bigint, o_campaign_id bigint, o_landing_page_id bigint)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_source   text := lower(nullif(btrim(p_utm ->> 'utm_source'), ''));
  v_campaign text := lower(nullif(btrim(p_utm ->> 'utm_campaign'), ''));
begin
  if p_landing_slug is not null then
    select lp.id into o_landing_page_id
      from public.landing_pages lp
     where lp.slug = lower(btrim(p_landing_slug)) and lp.is_active;
  end if;

  if v_campaign is not null then
    select c.id, c.channel_id into o_campaign_id, o_channel_id
      from public.campaigns c
     where lower(c.utm_campaign) = v_campaign;
  end if;

  if o_channel_id is null and v_source is not null then
    select ch.id into o_channel_id
      from public.acquisition_channels ch
     where ch.is_active
       and (ch.code = v_source or v_source = any (ch.utm_aliases))
     order by ch.sort_order, ch.id
     limit 1;

    if o_channel_id is null then
      select ch.id into o_channel_id from public.acquisition_channels ch where ch.code = 'other';
    end if;
  end if;

  if o_channel_id is null and o_landing_page_id is not null then
    select ch.id into o_channel_id from public.acquisition_channels ch where ch.code = 'landing_page';
  end if;

  return next;
end;
$$;

revoke all on function public.assert_json_object(jsonb, integer, text) from public, anon, authenticated;
revoke all on function public.resolve_acquisition(jsonb, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- capture_lead(): upsert de lead + consentimentos + evento, atômico.
-- Somente service_role. Erros: SQLSTATE 22023 com mensagem curta
-- (invalid_email, invalid_phone, invalid_anonymous_id, invalid_session_id,
--  invalid_utm, invalid_properties, invalid_consents, invalid_consent).
-- ---------------------------------------------------------------------
create or replace function public.capture_lead(
  p_email         text,
  p_full_name     text    default null,
  p_phone         text    default null,
  p_anonymous_id  text    default null,
  p_session_id    text    default null,
  p_landing_slug  text    default null,
  p_utm           jsonb   default '{}'::jsonb,
  p_consents      jsonb   default '[]'::jsonb,
  p_properties    jsonb   default '{}'::jsonb
)
returns table (contact_id bigint, is_new boolean)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_email      text := lower(btrim(coalesce(p_email, '')));
  v_name       text := left(nullif(btrim(regexp_replace(coalesce(p_full_name, ''), '[[:cntrl:]]+', ' ', 'g')), ''), 120);
  v_phone      text := nullif(btrim(coalesce(p_phone, '')), '');
  v_utm        jsonb := coalesce(p_utm, '{}'::jsonb);
  v_props      jsonb := coalesce(p_properties, '{}'::jsonb);
  v_consents   jsonb := coalesce(p_consents, '[]'::jsonb);
  v_source     text;
  v_medium     text;
  v_campaign   text;
  v_content    text;
  v_term       text;
  v_channel    bigint;
  v_camp       bigint;
  v_landing    bigint;
  v_contact_id bigint;
  v_is_new     boolean;
  v_has_touch  boolean;
  v_item       jsonb;
begin
  if char_length(v_email) > 254 or v_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  if v_phone is not null and v_phone !~ '^[-0-9+() .]{6,32}$' then
    raise exception 'invalid_phone' using errcode = '22023';
  end if;
  if p_anonymous_id is not null and p_anonymous_id !~ '^[A-Za-z0-9_.:-]{8,64}$' then
    raise exception 'invalid_anonymous_id' using errcode = '22023';
  end if;
  if p_session_id is not null and p_session_id !~ '^[A-Za-z0-9_.:-]{8,64}$' then
    raise exception 'invalid_session_id' using errcode = '22023';
  end if;
  perform public.assert_json_object(v_utm, 2000, 'utm');
  perform public.assert_json_object(v_props, 4096, 'properties');
  if jsonb_typeof(v_consents) <> 'array' or jsonb_array_length(v_consents) > 10 then
    raise exception 'invalid_consents' using errcode = '22023';
  end if;

  v_source   := left(nullif(btrim(v_utm ->> 'utm_source'), ''), 200);
  v_medium   := left(nullif(btrim(v_utm ->> 'utm_medium'), ''), 200);
  v_campaign := left(nullif(btrim(v_utm ->> 'utm_campaign'), ''), 200);
  v_content  := left(nullif(btrim(v_utm ->> 'utm_content'), ''), 200);
  v_term     := left(nullif(btrim(v_utm ->> 'utm_term'), ''), 200);

  select r.o_channel_id, r.o_campaign_id, r.o_landing_page_id
    into v_channel, v_camp, v_landing
    from public.resolve_acquisition(v_utm, p_landing_slug) r;

  v_has_touch := num_nonnulls(v_source, v_medium, v_campaign, v_content, v_term, v_channel, v_camp, v_landing) > 0;

  -- upsert por e-mail. Primeiro toque só na criação; último toque sempre.
  insert into public.crm_contacts as cc (
    email, full_name, phone, stage, last_interaction_at,
    first_touch_at, first_channel_id, first_campaign_id, first_landing_page_id,
    first_utm_source, first_utm_medium, first_utm_campaign, first_utm_content, first_utm_term,
    last_touch_at, last_channel_id, last_campaign_id, last_landing_page_id,
    last_utm_source, last_utm_medium, last_utm_campaign, last_utm_content, last_utm_term
  )
  values (
    v_email, v_name, v_phone, 'lead_captured', now(),
    now(), v_channel, v_camp, v_landing,
    v_source, v_medium, v_campaign, v_content, v_term,
    now(), v_channel, v_camp, v_landing,
    v_source, v_medium, v_campaign, v_content, v_term
  )
  on conflict (email) where email is not null do update set
    full_name = coalesce(cc.full_name, excluded.full_name),
    phone     = coalesce(cc.phone, excluded.phone),
    stage     = case when cc.stage < 'lead_captured' then 'lead_captured'::public.crm_stage else cc.stage end,
    last_interaction_at   = now(),
    -- último toque só muda se esta chamada traz atribuição (chamada "seca" não apaga a anterior)
    last_touch_at         = case when v_has_touch then now() else cc.last_touch_at end,
    last_channel_id       = case when v_has_touch then excluded.last_channel_id      else cc.last_channel_id end,
    last_campaign_id      = case when v_has_touch then excluded.last_campaign_id     else cc.last_campaign_id end,
    last_landing_page_id  = case when v_has_touch then excluded.last_landing_page_id else cc.last_landing_page_id end,
    last_utm_source       = case when v_has_touch then excluded.last_utm_source      else cc.last_utm_source end,
    last_utm_medium       = case when v_has_touch then excluded.last_utm_medium      else cc.last_utm_medium end,
    last_utm_campaign     = case when v_has_touch then excluded.last_utm_campaign    else cc.last_utm_campaign end,
    last_utm_content      = case when v_has_touch then excluded.last_utm_content     else cc.last_utm_content end,
    last_utm_term         = case when v_has_touch then excluded.last_utm_term        else cc.last_utm_term end
  returning cc.id, (xmax = 0) into v_contact_id, v_is_new;

  -- contato criado antes sem atribuição (ex.: via signup): este vira o primeiro toque
  update public.crm_contacts c
     set first_touch_at        = c.last_touch_at,
         first_channel_id      = c.last_channel_id,
         first_campaign_id     = c.last_campaign_id,
         first_landing_page_id = c.last_landing_page_id,
         first_utm_source      = c.last_utm_source,
         first_utm_medium      = c.last_utm_medium,
         first_utm_campaign    = c.last_utm_campaign,
         first_utm_content     = c.last_utm_content,
         first_utm_term        = c.last_utm_term
   where c.id = v_contact_id
     and c.first_touch_at is null;

  -- consentimentos: [{consent_type, document_version, granted}]
  for v_item in select e.value from jsonb_array_elements(v_consents) e loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item ->> 'document_version', '') = ''
       or (v_item ->> 'granted') is null
       or (v_item ->> 'granted') not in ('true', 'false') then
      raise exception 'invalid_consent' using errcode = '22023';
    end if;

    insert into public.consents (contact_id, consent_type, document_version, granted, source)
    values (
      v_contact_id,
      (v_item ->> 'consent_type')::public.consent_type,   -- valor fora do enum => 22P02
      left(v_item ->> 'document_version', 40),
      (v_item ->> 'granted')::boolean,
      'lead_capture'
    );
  end loop;

  insert into public.events (
    event_name, contact_id, anonymous_id, session_id,
    channel_id, campaign_id, landing_page_id,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, properties
  )
  values (
    'lead_captured', v_contact_id, p_anonymous_id, p_session_id,
    v_channel, v_camp, v_landing,
    v_source, v_medium, v_campaign, v_content, v_term, v_props
  );

  return query select v_contact_id, v_is_new;
end;
$$;

-- ---------------------------------------------------------------------
-- track_event(): registra um evento. Somente service_role.
-- Exige ao menos um identificador (contact_id, user_id ou anonymous_id).
-- Se vier user_id sem contact_id, resolve o contato pelo vínculo.
-- Retorna o id do evento. Erros 22023: unknown_event, inactive_event,
-- missing_actor, invalid_anonymous_id, invalid_session_id, invalid_utm,
-- invalid_properties.
-- ---------------------------------------------------------------------
create or replace function public.track_event(
  p_event_name    text,
  p_anonymous_id  text    default null,
  p_session_id    text    default null,
  p_contact_id    bigint  default null,
  p_user_id       uuid    default null,
  p_landing_slug  text    default null,
  p_utm           jsonb   default '{}'::jsonb,
  p_properties    jsonb   default '{}'::jsonb
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_active   boolean;
  v_utm      jsonb := coalesce(p_utm, '{}'::jsonb);
  v_props    jsonb := coalesce(p_properties, '{}'::jsonb);
  v_contact  bigint := p_contact_id;
  v_channel  bigint;
  v_camp     bigint;
  v_landing  bigint;
  v_id       bigint;
begin
  select t.is_active into v_active from public.event_types t where t.name = p_event_name;
  if not found then
    raise exception 'unknown_event' using errcode = '22023';
  end if;
  if not v_active then
    raise exception 'inactive_event' using errcode = '22023';
  end if;

  if p_anonymous_id is not null and p_anonymous_id !~ '^[A-Za-z0-9_.:-]{8,64}$' then
    raise exception 'invalid_anonymous_id' using errcode = '22023';
  end if;
  if p_session_id is not null and p_session_id !~ '^[A-Za-z0-9_.:-]{8,64}$' then
    raise exception 'invalid_session_id' using errcode = '22023';
  end if;
  perform public.assert_json_object(v_utm, 2000, 'utm');
  perform public.assert_json_object(v_props, 4096, 'properties');

  if v_contact is null and p_user_id is not null then
    select c.id into v_contact from public.crm_contacts c where c.user_id = p_user_id;
  end if;
  if v_contact is null and p_user_id is null and p_anonymous_id is null then
    raise exception 'missing_actor' using errcode = '22023';
  end if;

  select r.o_channel_id, r.o_campaign_id, r.o_landing_page_id
    into v_channel, v_camp, v_landing
    from public.resolve_acquisition(v_utm, p_landing_slug) r;

  insert into public.events (
    event_name, contact_id, user_id, anonymous_id, session_id,
    channel_id, campaign_id, landing_page_id,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, properties
  )
  values (
    p_event_name, v_contact, p_user_id, p_anonymous_id, p_session_id,
    v_channel, v_camp, v_landing,
    left(nullif(btrim(v_utm ->> 'utm_source'), ''), 200),
    left(nullif(btrim(v_utm ->> 'utm_medium'), ''), 200),
    left(nullif(btrim(v_utm ->> 'utm_campaign'), ''), 200),
    left(nullif(btrim(v_utm ->> 'utm_content'), ''), 200),
    left(nullif(btrim(v_utm ->> 'utm_term'), ''), 200),
    v_props
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.capture_lead(text, text, text, text, text, text, jsonb, jsonb, jsonb)
  from public, anon, authenticated;
revoke all on function public.track_event(text, text, text, bigint, uuid, text, jsonb, jsonb)
  from public, anon, authenticated;
grant execute on function public.capture_lead(text, text, text, text, text, text, jsonb, jsonb, jsonb)
  to service_role;
grant execute on function public.track_event(text, text, text, bigint, uuid, text, jsonb, jsonb)
  to service_role;
