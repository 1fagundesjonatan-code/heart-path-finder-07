-- =====================================================================
-- 0200 — CRM e aquisição
-- Depende de: 0100 (app_role, helpers, set_updated_at).
--
-- Modelo:
--   acquisition_channels 1─N campaigns 1─N landing_pages(opcional)
--   crm_contacts (pessoa; user_id opcional) 1─N crm_stage_history
--                                           1─N crm_interactions
--                                           N─N tags (crm_contact_tags)
--   marketing_spend: custo manual por dia/canal/campanha (base de CPL/CAC)
--
-- IMPORTANTE: a ORDEM dos valores de crm_stage é a ordem do funil. O código
-- compara estágios com < / > para "avançar só para frente". Nunca reordene;
-- novos estágios entram com ALTER TYPE ... ADD VALUE ... BEFORE/AFTER.
-- =====================================================================

do $$
begin
  create type public.crm_stage as enum (
    'visitor',
    'lead_captured',
    'lead_qualified',
    'signup_started',
    'signup_completed',
    'test_started',
    'test_completed',
    'result_viewed',
    'subscription_started',
    'active_customer',
    'recurring_customer',
    'churned',
    'reactivated'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- acquisition_channels (configurável; seed em 0600)
-- ---------------------------------------------------------------------
create table if not exists public.acquisition_channels (
  id           bigint generated always as identity primary key,
  code         text not null unique check (code ~ '^[a-z][a-z0-9_]{1,39}$'),
  name         text not null check (char_length(name) between 1 and 80),
  -- valores de utm_source que mapeiam para este canal (além do próprio code)
  utm_aliases  text[] not null default '{}',
  is_paid      boolean not null default false,
  is_active    boolean not null default true,
  sort_order   integer not null default 100,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

drop trigger if exists acquisition_channels_set_updated_at on public.acquisition_channels;
create trigger acquisition_channels_set_updated_at
  before update on public.acquisition_channels
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- campaigns
-- ---------------------------------------------------------------------
create table if not exists public.campaigns (
  id            bigint generated always as identity primary key,
  channel_id    bigint not null references public.acquisition_channels (id) on delete restrict,
  name          text not null check (char_length(name) between 1 and 120),
  utm_campaign  text check (utm_campaign is null or utm_campaign ~ '^[a-z0-9][a-z0-9_.\-]{0,99}$'),
  starts_on     date,
  ends_on       date,
  status        text not null default 'draft' check (status in ('draft', 'active', 'paused', 'ended')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint campaigns_dates_check check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists campaigns_channel_id_idx on public.campaigns (channel_id);
-- resolução de utm_campaign -> campanha (case-insensitive, única)
create unique index if not exists campaigns_utm_campaign_key
  on public.campaigns (lower(utm_campaign)) where utm_campaign is not null;

drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- landing_pages
-- ---------------------------------------------------------------------
create table if not exists public.landing_pages (
  id           bigint generated always as identity primary key,
  slug         text not null unique check (slug ~ '^[a-z0-9][a-z0-9_\-]{0,79}$'),
  name         text not null check (char_length(name) between 1 and 120),
  path         text check (path is null or (path like '/%' and char_length(path) <= 300)),
  campaign_id  bigint references public.campaigns (id) on delete set null,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists landing_pages_campaign_id_idx
  on public.landing_pages (campaign_id) where campaign_id is not null;

drop trigger if exists landing_pages_set_updated_at on public.landing_pages;
create trigger landing_pages_set_updated_at
  before update on public.landing_pages
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- crm_contacts: entidade única de pessoa (lead, usuário, cliente)
-- ---------------------------------------------------------------------
create table if not exists public.crm_contacts (
  id                  bigint generated always as identity primary key,
  -- cascade: apagar a conta (LGPD) apaga o contato e, em cascata, consents/interações/histórico
  user_id             uuid unique references auth.users (id) on delete cascade,
  full_name           text check (full_name is null or char_length(full_name) <= 120),
  -- sempre minúsculo e trimado (trigger abaixo); único quando preenchido
  email               text check (
                        email is null
                        or (char_length(email) <= 254 and email = lower(email) and position('@' in email) > 1)
                      ),
  phone               text check (phone is null or char_length(phone) <= 32),
  stage               public.crm_stage not null default 'lead_captured',

  -- primeiro toque (nunca sobrescrito depois de preenchido)
  first_touch_at          timestamptz,
  first_channel_id        bigint references public.acquisition_channels (id) on delete set null,
  first_campaign_id       bigint references public.campaigns (id) on delete set null,
  first_landing_page_id   bigint references public.landing_pages (id) on delete set null,
  first_utm_source        text check (char_length(first_utm_source) <= 200),
  first_utm_medium        text check (char_length(first_utm_medium) <= 200),
  first_utm_campaign      text check (char_length(first_utm_campaign) <= 200),
  first_utm_content       text check (char_length(first_utm_content) <= 200),
  first_utm_term          text check (char_length(first_utm_term) <= 200),

  -- último toque (atualizado a cada captura)
  last_touch_at           timestamptz,
  last_channel_id         bigint references public.acquisition_channels (id) on delete set null,
  last_campaign_id        bigint references public.campaigns (id) on delete set null,
  last_landing_page_id    bigint references public.landing_pages (id) on delete set null,
  last_utm_source         text check (char_length(last_utm_source) <= 200),
  last_utm_medium         text check (char_length(last_utm_medium) <= 200),
  last_utm_campaign       text check (char_length(last_utm_campaign) <= 200),
  last_utm_content        text check (char_length(last_utm_content) <= 200),
  last_utm_term           text check (char_length(last_utm_term) <= 200),

  last_interaction_at     timestamptz,
  notes                   text check (notes is null or char_length(notes) <= 4000),  -- nota administrativa (PII: fica fora do audit)
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint crm_contacts_identity_check check (num_nonnulls(email, phone, user_id) >= 1)
);

-- user_id: o UNIQUE da coluna já cria o índice da FK
create unique index if not exists crm_contacts_email_key
  on public.crm_contacts (email) where email is not null;
create index if not exists crm_contacts_phone_idx
  on public.crm_contacts (phone) where phone is not null;
create index if not exists crm_contacts_stage_idx on public.crm_contacts (stage);
create index if not exists crm_contacts_created_at_idx on public.crm_contacts (created_at desc);
create index if not exists crm_contacts_last_interaction_idx
  on public.crm_contacts (last_interaction_at desc nulls last);
-- FKs (parciais: a maioria dos contatos terá valor, mas não todos)
create index if not exists crm_contacts_first_channel_idx
  on public.crm_contacts (first_channel_id) where first_channel_id is not null;
create index if not exists crm_contacts_first_campaign_idx
  on public.crm_contacts (first_campaign_id) where first_campaign_id is not null;
create index if not exists crm_contacts_first_landing_idx
  on public.crm_contacts (first_landing_page_id) where first_landing_page_id is not null;
create index if not exists crm_contacts_last_channel_idx
  on public.crm_contacts (last_channel_id) where last_channel_id is not null;
create index if not exists crm_contacts_last_campaign_idx
  on public.crm_contacts (last_campaign_id) where last_campaign_id is not null;
create index if not exists crm_contacts_last_landing_idx
  on public.crm_contacts (last_landing_page_id) where last_landing_page_id is not null;

create or replace function public.crm_contacts_normalize()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.email := nullif(lower(btrim(new.email)), '');
  new.phone := nullif(btrim(new.phone), '');
  return new;
end;
$$;

drop trigger if exists crm_contacts_normalize on public.crm_contacts;
create trigger crm_contacts_normalize
  before insert or update of email, phone on public.crm_contacts
  for each row execute function public.crm_contacts_normalize();

drop trigger if exists crm_contacts_set_updated_at on public.crm_contacts;
create trigger crm_contacts_set_updated_at
  before update on public.crm_contacts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- crm_stage_history: preenchido por trigger (inclui mudanças manuais e via eventos)
-- ---------------------------------------------------------------------
create table if not exists public.crm_stage_history (
  id          bigint generated always as identity primary key,
  contact_id  bigint not null references public.crm_contacts (id) on delete cascade,
  from_stage  public.crm_stage,
  to_stage    public.crm_stage not null,
  changed_by  uuid references auth.users (id) on delete set null,  -- null = sistema/service role
  changed_at  timestamptz not null default now(),
  reason      text check (reason is null or char_length(reason) <= 300)
);

create index if not exists crm_stage_history_contact_idx
  on public.crm_stage_history (contact_id, changed_at);
-- métricas do dashboard: "quem entrou no estágio X no período"
create index if not exists crm_stage_history_stage_idx
  on public.crm_stage_history (to_stage, changed_at);
create index if not exists crm_stage_history_changed_by_idx
  on public.crm_stage_history (changed_by) where changed_by is not null;

create or replace function public.crm_contacts_log_stage()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.crm_stage_history (contact_id, from_stage, to_stage, changed_by)
    values (new.id, null, new.stage, auth.uid());
  elsif new.stage is distinct from old.stage then
    insert into public.crm_stage_history (contact_id, from_stage, to_stage, changed_by)
    values (new.id, old.stage, new.stage, auth.uid());
  end if;
  return null;
end;
$$;

revoke all on function public.crm_contacts_log_stage() from public, anon, authenticated;

drop trigger if exists crm_contacts_log_stage on public.crm_contacts;
create trigger crm_contacts_log_stage
  after insert or update of stage on public.crm_contacts
  for each row execute function public.crm_contacts_log_stage();

-- ---------------------------------------------------------------------
-- crm_interactions
-- ---------------------------------------------------------------------
create table if not exists public.crm_interactions (
  id               bigint generated always as identity primary key,
  contact_id       bigint not null references public.crm_contacts (id) on delete cascade,
  interaction_type text not null check (interaction_type in ('note', 'call', 'message', 'email', 'meeting', 'other')),
  channel          text check (channel is null or channel in ('whatsapp', 'email', 'phone', 'instagram_dm', 'in_person', 'other')),
  content          text not null check (char_length(content) between 1 and 2000),
  author_id        uuid references auth.users (id) on delete set null default auth.uid(),
  occurred_at      timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create index if not exists crm_interactions_contact_idx
  on public.crm_interactions (contact_id, occurred_at desc);
create index if not exists crm_interactions_author_idx
  on public.crm_interactions (author_id) where author_id is not null;

create or replace function public.crm_interactions_touch_contact()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.crm_contacts
     set last_interaction_at = greatest(coalesce(last_interaction_at, new.occurred_at), new.occurred_at)
   where id = new.contact_id;
  return null;
end;
$$;

revoke all on function public.crm_interactions_touch_contact() from public, anon, authenticated;

drop trigger if exists crm_interactions_touch_contact on public.crm_interactions;
create trigger crm_interactions_touch_contact
  after insert on public.crm_interactions
  for each row execute function public.crm_interactions_touch_contact();

-- ---------------------------------------------------------------------
-- tags
-- ---------------------------------------------------------------------
create table if not exists public.tags (
  id          bigint generated always as identity primary key,
  name        text not null check (char_length(name) between 1 and 40),
  color       text check (color is null or color ~ '^#[0-9a-fA-F]{6}$'),
  created_at  timestamptz not null default now()
);

create unique index if not exists tags_name_key on public.tags (lower(name));

create table if not exists public.crm_contact_tags (
  contact_id  bigint not null references public.crm_contacts (id) on delete cascade,
  tag_id      bigint not null references public.tags (id) on delete cascade,
  created_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  primary key (contact_id, tag_id)       -- índice cobre a FK contact_id
);

create index if not exists crm_contact_tags_tag_idx on public.crm_contact_tags (tag_id);
create index if not exists crm_contact_tags_created_by_idx
  on public.crm_contact_tags (created_by) where created_by is not null;

-- ---------------------------------------------------------------------
-- marketing_spend: lançamento manual (Fase 1) para CPL/CAC reais
-- ---------------------------------------------------------------------
create table if not exists public.marketing_spend (
  id           bigint generated always as identity primary key,
  spend_date   date not null,
  channel_id   bigint not null references public.acquisition_channels (id) on delete restrict,
  campaign_id  bigint references public.campaigns (id) on delete set null,
  amount       numeric(12, 2) not null check (amount >= 0),
  currency     text not null default 'BRL' check (currency ~ '^[A-Z]{3}$'),
  notes        text check (notes is null or char_length(notes) <= 500),
  created_by   uuid references auth.users (id) on delete set null default auth.uid(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists marketing_spend_date_idx on public.marketing_spend (spend_date);
create index if not exists marketing_spend_channel_idx on public.marketing_spend (channel_id, spend_date);
create index if not exists marketing_spend_campaign_idx
  on public.marketing_spend (campaign_id) where campaign_id is not null;
create index if not exists marketing_spend_created_by_idx
  on public.marketing_spend (created_by) where created_by is not null;

drop trigger if exists marketing_spend_set_updated_at on public.marketing_spend;
create trigger marketing_spend_set_updated_at
  before update on public.marketing_spend
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- current_contact_id(): contato do usuário logado.
-- Necessário porque o cliente NÃO tem SELECT em crm_contacts; policies de
-- consents etc. não podem fazer subquery direta nela (RLS devolveria vazio).
-- ---------------------------------------------------------------------
create or replace function public.current_contact_id()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select c.id from public.crm_contacts c where c.user_id = auth.uid();
$$;

revoke all on function public.current_contact_id() from public, anon;
grant execute on function public.current_contact_id() to authenticated;

-- ---------------------------------------------------------------------
-- Signup. DECISÃO (mais segura): o contato do CRM só é criado/vinculado
-- quando o e-mail está CONFIRMADO (email_confirmed_at não nulo). Antes disso
-- existe apenas profile + papel 'client' (sem dado de CRM). Assim ninguém herda
-- o contato/histórico de outra pessoa cadastrando o e-mail dela.
--   * on_auth_user_created: profile + papel; contato se já nasceu confirmado (OAuth).
--   * on_auth_user_confirmed: ao confirmar o e-mail, vincula/cria o contato.
-- Nunca deve falhar por conflito de e-mail (falhar bloquearia o cadastro).
-- ---------------------------------------------------------------------
create or replace function public.sync_user_contact(
  p_user_id uuid,
  p_email   text,
  p_meta    jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email      text := nullif(lower(btrim(p_email)), '');
  v_name       text := left(nullif(btrim(coalesce(p_meta ->> 'full_name', p_meta ->> 'name', '')), ''), 120);
  v_contact_id bigint;
begin
  -- idempotente: já tem contato
  if exists (select 1 from public.crm_contacts c where c.user_id = p_user_id) then
    return;
  end if;

  -- 1) lead existente com o mesmo e-mail e ainda sem usuário: vincula
  if v_email is not null then
    update public.crm_contacts c
       set user_id   = p_user_id,
           full_name = coalesce(c.full_name, v_name),
           stage     = case when c.stage < 'signup_completed' then 'signup_completed'::public.crm_stage else c.stage end,
           last_interaction_at = now()
     where c.email = v_email
       and c.user_id is null
    returning c.id into v_contact_id;
  end if;

  -- 2) senão cria contato novo com o e-mail
  if v_contact_id is null then
    insert into public.crm_contacts (user_id, email, full_name, stage, last_interaction_at)
    values (p_user_id, v_email, v_name, 'signup_completed', now())
    on conflict (email) where email is not null do nothing
    returning id into v_contact_id;
  end if;

  -- 3) e-mail pertence a contato de OUTRO usuário (caso raro): contato sem e-mail
  if v_contact_id is null then
    insert into public.crm_contacts (user_id, full_name, stage, last_interaction_at)
    values (p_user_id, v_name, 'signup_completed', now());
  end if;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    left(nullif(btrim(coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name', '')), ''), 120)
  )
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'client')
  on conflict (user_id, role) do nothing;

  if new.email_confirmed_at is not null then
    perform public.sync_user_contact(new.id, new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb));
  end if;

  return new;
end;
$$;

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.sync_user_contact(new.id, new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb));
  return new;
end;
$$;

revoke all on function public.sync_user_contact(uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.handle_user_confirmed() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.handle_user_confirmed();

-- ---------------------------------------------------------------------
-- RLS + grants
-- Matriz: admin = tudo | operator = contatos/interações |
--         marketing = contatos/leads/campanhas/gasto | finance = gasto/planos |
--         partner e client = nada aqui.
-- ---------------------------------------------------------------------

-- acquisition_channels / campaigns / landing_pages: staff lê; admin+marketing escrevem
alter table public.acquisition_channels enable row level security;
alter table public.campaigns            enable row level security;
alter table public.landing_pages        enable row level security;

revoke all on table public.acquisition_channels, public.campaigns, public.landing_pages from anon, authenticated;
grant select, insert, update, delete on table
  public.acquisition_channels, public.campaigns, public.landing_pages to authenticated;

drop policy if exists acquisition_channels_select on public.acquisition_channels;
create policy acquisition_channels_select on public.acquisition_channels
  for select to authenticated using ((select public.is_staff()));
drop policy if exists acquisition_channels_insert on public.acquisition_channels;
create policy acquisition_channels_insert on public.acquisition_channels
  for insert to authenticated
  with check ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])));
drop policy if exists acquisition_channels_update on public.acquisition_channels;
create policy acquisition_channels_update on public.acquisition_channels
  for update to authenticated
  using ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])))
  with check ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])));
drop policy if exists acquisition_channels_delete on public.acquisition_channels;
create policy acquisition_channels_delete on public.acquisition_channels
  for delete to authenticated using ((select public.has_role('admin')));

drop policy if exists campaigns_select on public.campaigns;
create policy campaigns_select on public.campaigns
  for select to authenticated using ((select public.is_staff()));
drop policy if exists campaigns_insert on public.campaigns;
create policy campaigns_insert on public.campaigns
  for insert to authenticated
  with check ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])));
drop policy if exists campaigns_update on public.campaigns;
create policy campaigns_update on public.campaigns
  for update to authenticated
  using ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])))
  with check ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])));
drop policy if exists campaigns_delete on public.campaigns;
create policy campaigns_delete on public.campaigns
  for delete to authenticated using ((select public.has_role('admin')));

drop policy if exists landing_pages_select on public.landing_pages;
create policy landing_pages_select on public.landing_pages
  for select to authenticated using ((select public.is_staff()));
drop policy if exists landing_pages_insert on public.landing_pages;
create policy landing_pages_insert on public.landing_pages
  for insert to authenticated
  with check ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])));
drop policy if exists landing_pages_update on public.landing_pages;
create policy landing_pages_update on public.landing_pages
  for update to authenticated
  using ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])))
  with check ((select public.has_any_role(array['admin', 'marketing']::public.app_role[])));
drop policy if exists landing_pages_delete on public.landing_pages;
create policy landing_pages_delete on public.landing_pages
  for delete to authenticated using ((select public.has_role('admin')));

-- crm_contacts: admin/operator/marketing. Grants de coluna impedem staff de
-- escrever user_id (vínculo com conta) e campos de atribuição calculados.
alter table public.crm_contacts enable row level security;

revoke all on table public.crm_contacts from anon, authenticated;
grant select on table public.crm_contacts to authenticated;
grant insert (full_name, email, phone, stage, notes,
              first_channel_id, first_campaign_id, first_landing_page_id)
  on table public.crm_contacts to authenticated;
grant update (full_name, email, phone, stage, notes)
  on table public.crm_contacts to authenticated;
grant delete on table public.crm_contacts to authenticated;

drop policy if exists crm_contacts_select on public.crm_contacts;
create policy crm_contacts_select on public.crm_contacts
  for select to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists crm_contacts_insert on public.crm_contacts;
create policy crm_contacts_insert on public.crm_contacts
  for insert to authenticated
  with check ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists crm_contacts_update on public.crm_contacts;
create policy crm_contacts_update on public.crm_contacts
  for update to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])))
  with check ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists crm_contacts_delete on public.crm_contacts;
create policy crm_contacts_delete on public.crm_contacts
  for delete to authenticated using ((select public.has_role('admin')));

-- crm_stage_history: só leitura via API (escrita é do trigger)
alter table public.crm_stage_history enable row level security;
revoke all on table public.crm_stage_history from anon, authenticated;
grant select on table public.crm_stage_history to authenticated;

drop policy if exists crm_stage_history_select on public.crm_stage_history;
create policy crm_stage_history_select on public.crm_stage_history
  for select to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));

-- crm_interactions: ler/inserir staff de CRM; editar/apagar só admin ou o autor
alter table public.crm_interactions enable row level security;
revoke all on table public.crm_interactions from anon, authenticated;
grant select on table public.crm_interactions to authenticated;
grant insert (contact_id, interaction_type, channel, content, occurred_at)
  on table public.crm_interactions to authenticated;
grant update (interaction_type, channel, content, occurred_at)
  on table public.crm_interactions to authenticated;
grant delete on table public.crm_interactions to authenticated;

drop policy if exists crm_interactions_select on public.crm_interactions;
create policy crm_interactions_select on public.crm_interactions
  for select to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists crm_interactions_insert on public.crm_interactions;
create policy crm_interactions_insert on public.crm_interactions
  for insert to authenticated
  with check (
    (select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[]))
    and author_id = (select auth.uid())
  );
drop policy if exists crm_interactions_update on public.crm_interactions;
create policy crm_interactions_update on public.crm_interactions
  for update to authenticated
  using (
    (select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[]))
    and ((select public.has_role('admin')) or author_id = (select auth.uid()))
  )
  with check (
    (select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[]))
    and ((select public.has_role('admin')) or author_id = (select auth.uid()))
  );
drop policy if exists crm_interactions_delete on public.crm_interactions;
create policy crm_interactions_delete on public.crm_interactions
  for delete to authenticated
  using (
    (select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[]))
    and ((select public.has_role('admin')) or author_id = (select auth.uid()))
  );

-- tags / crm_contact_tags: staff de CRM
alter table public.tags enable row level security;
alter table public.crm_contact_tags enable row level security;
revoke all on table public.tags, public.crm_contact_tags from anon, authenticated;
grant select, insert, update, delete on table public.tags to authenticated;
grant select, insert, delete on table public.crm_contact_tags to authenticated;

drop policy if exists tags_select on public.tags;
create policy tags_select on public.tags
  for select to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists tags_insert on public.tags;
create policy tags_insert on public.tags
  for insert to authenticated
  with check ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists tags_update on public.tags;
create policy tags_update on public.tags
  for update to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])))
  with check ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists tags_delete on public.tags;
create policy tags_delete on public.tags
  for delete to authenticated using ((select public.has_role('admin')));

drop policy if exists crm_contact_tags_select on public.crm_contact_tags;
create policy crm_contact_tags_select on public.crm_contact_tags
  for select to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists crm_contact_tags_insert on public.crm_contact_tags;
create policy crm_contact_tags_insert on public.crm_contact_tags
  for insert to authenticated
  with check ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));
drop policy if exists crm_contact_tags_delete on public.crm_contact_tags;
create policy crm_contact_tags_delete on public.crm_contact_tags
  for delete to authenticated
  using ((select public.has_any_role(array['admin', 'operator', 'marketing']::public.app_role[])));

-- marketing_spend: admin, marketing e finance
alter table public.marketing_spend enable row level security;
revoke all on table public.marketing_spend from anon, authenticated;
grant select, delete on table public.marketing_spend to authenticated;
grant insert (spend_date, channel_id, campaign_id, amount, currency, notes)
  on table public.marketing_spend to authenticated;
grant update (spend_date, channel_id, campaign_id, amount, currency, notes)
  on table public.marketing_spend to authenticated;

drop policy if exists marketing_spend_select on public.marketing_spend;
create policy marketing_spend_select on public.marketing_spend
  for select to authenticated
  using ((select public.has_any_role(array['admin', 'marketing', 'finance']::public.app_role[])));
drop policy if exists marketing_spend_insert on public.marketing_spend;
create policy marketing_spend_insert on public.marketing_spend
  for insert to authenticated
  with check ((select public.has_any_role(array['admin', 'marketing', 'finance']::public.app_role[])));
drop policy if exists marketing_spend_update on public.marketing_spend;
create policy marketing_spend_update on public.marketing_spend
  for update to authenticated
  using ((select public.has_any_role(array['admin', 'marketing', 'finance']::public.app_role[])))
  with check ((select public.has_any_role(array['admin', 'marketing', 'finance']::public.app_role[])));
drop policy if exists marketing_spend_delete on public.marketing_spend;
create policy marketing_spend_delete on public.marketing_spend
  for delete to authenticated
  using ((select public.has_any_role(array['admin', 'marketing', 'finance']::public.app_role[])));
