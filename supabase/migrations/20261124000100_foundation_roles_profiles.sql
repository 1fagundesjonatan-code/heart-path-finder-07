-- =====================================================================
-- 0100 — Fundação: papéis, perfis e helpers de RLS
-- Postgres 15+ (Supabase). Depende de: schema auth (Supabase Auth).
--
-- Regras desta camada:
--  * Papel NUNCA fica em profiles; fica em user_roles.
--  * Usuário nunca se auto-promove: só admin escreve em user_roles
--    (e o trigger de signup, que roda como definer, dá 'client').
--  * Toda função security definer usa set search_path = '' e nomes
--    totalmente qualificados.
--  * anon não recebe nenhum grant nas tabelas do app (exceção: plans, 0400).
-- =====================================================================

-- ---------------------------------------------------------------------
-- Enum de papéis
-- ---------------------------------------------------------------------
do $$
begin
  create type public.app_role as enum (
    'admin', 'operator', 'marketing', 'finance', 'partner', 'client'
  );
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------
-- Trigger genérico de updated_at
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- profiles: 1:1 com auth.users (dados de conta, não de CRM)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text check (full_name is null or char_length(full_name) <= 120),
  avatar_url  text check (avatar_url is null or char_length(avatar_url) <= 2048),
  locale      text not null default 'pt-BR' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  timezone    text not null default 'America/Sao_Paulo' check (char_length(timezone) <= 64),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- dashboard: new_users / total_users filtram por created_at
create index if not exists profiles_created_at_idx on public.profiles (created_at);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- user_roles: papéis por usuário (N:N via linhas)
-- ---------------------------------------------------------------------
create table if not exists public.user_roles (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) on delete cascade,
  role        public.app_role not null,
  granted_by  uuid references auth.users (id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  constraint user_roles_user_role_key unique (user_id, role)   -- índice cobre a FK user_id
);

create index if not exists user_roles_granted_by_idx
  on public.user_roles (granted_by) where granted_by is not null;

-- granted_by é sempre o chamador autenticado (valor enviado pelo cliente é ignorado).
-- Null quando não há JWT (SQL Editor, trigger de signup).
create or replace function public.user_roles_set_granted_by()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.granted_by := auth.uid();
  return new;
end;
$$;

-- Nunca deixar o sistema sem admin: bloqueia delete/troca do último papel 'admin'
-- (inclui a cascata de apagar a conta do último admin e a auto-remoção).
-- À prova de corrida: toda transação que mexe em admin trava as linhas de admin
-- (FOR UPDATE) antes de contar; a segunda espera a primeira e reavalia com a
-- linha já removida (READ COMMITTED).
create or replace function public.user_roles_protect_last_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'admin'
     and (tg_op = 'DELETE' or new.role <> 'admin' or new.user_id <> old.user_id) then
    perform 1 from public.user_roles ur where ur.role = 'admin' for update;
    if not exists (
      select 1 from public.user_roles ur where ur.role = 'admin' and ur.id <> old.id
    ) then
      raise exception 'last_admin' using errcode = 'P0001';
    end if;
  end if;
  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

revoke all on function public.user_roles_set_granted_by() from public, anon, authenticated;
revoke all on function public.user_roles_protect_last_admin() from public, anon, authenticated;

drop trigger if exists user_roles_set_granted_by on public.user_roles;
create trigger user_roles_set_granted_by
  before insert on public.user_roles
  for each row execute function public.user_roles_set_granted_by();

drop trigger if exists user_roles_protect_last_admin on public.user_roles;
create trigger user_roles_protect_last_admin
  before update or delete on public.user_roles
  for each row execute function public.user_roles_protect_last_admin();

-- ---------------------------------------------------------------------
-- Helpers de autorização (security definer: leem user_roles sem RLS,
-- evitando recursão nas policies). Sempre baseados em auth.uid().
-- ---------------------------------------------------------------------
create or replace function public.has_role(p_role public.app_role)
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

create or replace function public.has_any_role(p_roles public.app_role[])
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
  select public.has_any_role(
    array['admin', 'operator', 'marketing', 'finance']::public.app_role[]
  );
$$;

-- Policies são avaliadas com o papel do chamador: authenticated precisa de EXECUTE.
-- anon não chama (não há policy para anon fora de plans).
revoke all on function public.has_role(public.app_role) from public, anon;
revoke all on function public.has_any_role(public.app_role[]) from public, anon;
revoke all on function public.is_staff() from public, anon;
grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.has_any_role(public.app_role[]) to authenticated;
grant execute on function public.is_staff() to authenticated;

-- ---------------------------------------------------------------------
-- RLS: profiles
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;

revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
-- cliente edita só campos de exibição; id/created_at ficam travados por grant de coluna
grant update (full_name, avatar_url, locale, timezone) on table public.profiles to authenticated;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.has_any_role(array['admin', 'operator']::public.app_role[]))
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- INSERT/DELETE em profiles: nenhum (criado pelo trigger de signup; removido em cascata).

-- ---------------------------------------------------------------------
-- RLS: user_roles — só admin escreve; usuário lê os próprios papéis
-- ---------------------------------------------------------------------
alter table public.user_roles enable row level security;

revoke all on table public.user_roles from anon, authenticated;
grant select, insert, delete on table public.user_roles to authenticated;

drop policy if exists user_roles_select on public.user_roles;
create policy user_roles_select on public.user_roles
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select public.has_role('admin'))
  );

drop policy if exists user_roles_insert_admin on public.user_roles;
create policy user_roles_insert_admin on public.user_roles
  for insert to authenticated
  with check ((select public.has_role('admin')));

drop policy if exists user_roles_delete_admin on public.user_roles;
create policy user_roles_delete_admin on public.user_roles
  for delete to authenticated
  using ((select public.has_role('admin')));

-- UPDATE em user_roles: sem policy/grant (troca de papel = delete + insert, auditável).
-- Último admin: o trigger user_roles_protect_last_admin levanta 'last_admin' (P0001).
