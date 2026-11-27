-- RLS e invariantes de professionals (migration 20261127000400).
-- Roda inteiro em uma transação e termina em ROLLBACK: não deixa dados.
-- Uso: supabase db query --db-url "$DATABASE_URL" -f supabase/tests/professionals_rls.test.sql
-- Cada caso emite NOTICE 'PASS ...'; qualquer falha aborta com exceção 'FAIL ...'.

begin;

-- usuários de teste: admin, collaborator, client, dois convidados (pro1 pendente, pro2 confirmado)
insert into auth.users (id, email, aud, role, raw_user_meta_data, email_confirmed_at)
values
  ('b0000000-0000-0000-0000-000000000001', 'p-admin@test.invalid',  'authenticated', 'authenticated', '{"full_name":"P Admin"}',  now()),
  ('b0000000-0000-0000-0000-000000000002', 'p-collab@test.invalid', 'authenticated', 'authenticated', '{"full_name":"P Collab"}', now()),
  ('b0000000-0000-0000-0000-000000000003', 'p-client@test.invalid', 'authenticated', 'authenticated', '{"full_name":"P Client"}', now()),
  ('b0000000-0000-0000-0000-000000000011', 'p-pro1@test.invalid',   'authenticated', 'authenticated', '{"full_name":"Pro Um"}',   null),
  ('b0000000-0000-0000-0000-000000000012', 'p-pro2@test.invalid',   'authenticated', 'authenticated', '{"full_name":"Pro Dois"}', now());

insert into public.user_roles (user_id, role) values
  ('b0000000-0000-0000-0000-000000000001', 'admin'),
  ('b0000000-0000-0000-0000-000000000002', 'collaborator')
on conflict (user_id, role) do nothing;

-- 1. anon não executa a RPC nem lê a tabela
do $$
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    perform public.admin_register_professional('b0000000-0000-0000-0000-000000000011', 'X', 'CRP', '1', 'SP');
    raise exception 'FAIL anon executou admin_register_professional';
  exception when insufficient_privilege then
    raise notice 'PASS anon sem execute na RPC';
  end;
  begin
    perform count(*) from public.professionals;
    raise exception 'FAIL anon leu professionals';
  exception when insufficient_privilege then
    raise notice 'PASS anon sem select em professionals';
  end;
  reset role;
end $$;

-- 2. collaborator e client não registram profissional
do $$
declare u text;
begin
  foreach u in array array['b0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000003'] loop
    perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', u), true);
    set local role authenticated;
    begin
      perform public.admin_register_professional('b0000000-0000-0000-0000-000000000011', 'X', 'CRP', '1', 'SP');
      raise exception 'FAIL % registrou profissional', u;
    exception when insufficient_privilege then
      raise notice 'PASS % nao registra profissional', u;
    end;
    reset role;
  end loop;
end $$;

-- 3. admin registra: partner atribuído, invited_by/granted_by do admin, normalização
do $$
declare r public.professionals; v_granted uuid; v_has_partner boolean;
begin
  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  set local role authenticated;

  select * into r from public.admin_register_professional(
    'b0000000-0000-0000-0000-000000000011', 'Pro Um', 'CRP', ' 06/1234-a ', 'sp', array['ansiedade'], 'bio');
  if r.invited_by <> 'b0000000-0000-0000-0000-000000000001' then raise exception 'FAIL invited_by errado'; end if;
  if r.registry_number <> '06/1234-A' or r.registry_state <> 'SP' then raise exception 'FAIL registro nao normalizado: % %', r.registry_number, r.registry_state; end if;
  if r.verification_status <> 'pending' or r.verified_at is not null then raise exception 'FAIL nasceu verificado'; end if;
  if r.invite_accepted_at is not null then raise exception 'FAIL convite pendente marcado como aceito'; end if;
  raise notice 'PASS admin registra profissional (pendente, normalizado)';

  select * into r from public.admin_register_professional(
    'b0000000-0000-0000-0000-000000000012', 'Pro Dois', 'CRM', '9999', 'RJ');
  if r.invite_accepted_at is null then raise exception 'FAIL usuario ja confirmado nao marcou aceite'; end if;
  raise notice 'PASS usuario ja confirmado nasce com convite aceito';

  reset role;

  select exists (select 1 from public.user_roles where user_id = 'b0000000-0000-0000-0000-000000000011' and role = 'partner'),
         (select granted_by from public.user_roles where user_id = 'b0000000-0000-0000-0000-000000000011' and role = 'partner')
    into v_has_partner, v_granted;
  if not v_has_partner then raise exception 'FAIL papel partner nao atribuido'; end if;
  if v_granted <> 'b0000000-0000-0000-0000-000000000001' then raise exception 'FAIL granted_by nao e o admin'; end if;
  raise notice 'PASS partner atribuido com granted_by = admin';

  if not exists (
    select 1 from public.audit_log
     where entity_table = 'professionals' and entity_id = 'b0000000-0000-0000-0000-000000000011' and action = 'insert'
       and not (diff ? 'full_name')
  ) then raise exception 'FAIL auditoria de professionals ausente ou com nome em claro'; end if;
  raise notice 'PASS auditoria com entity_id e nome redigido';
end $$;

-- 4. validações da RPC
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  set local role authenticated;

  begin
    perform public.admin_register_professional('b0000000-0000-0000-0000-000000000002', 'X', 'CRP', '1', 'SP');
    raise exception 'FAIL registrou collaborator como profissional';
  exception when sqlstate '22023' then
    raise notice 'PASS equipe nao vira profissional';
  end;

  begin
    perform public.admin_register_professional('b0000000-0000-0000-0000-000000000011', 'X', 'CRP', '7', 'SP');
    raise exception 'FAIL registrou duas vezes';
  exception when sqlstate '22023' then
    raise notice 'PASS profissional ja registrado rejeitado';
  end;

  begin
    perform public.admin_register_professional('b0000000-0000-0000-0000-000000000099', 'X', 'CRP', '7', 'SP');
    raise exception 'FAIL usuario inexistente aceito';
  exception when sqlstate 'P0002' then
    raise notice 'PASS usuario inexistente rejeitado';
  end;

  -- registro duplicado (mesmo conselho/UF/numero, caixa diferente) em outro usuario
  begin
    perform public.admin_register_professional('b0000000-0000-0000-0000-000000000003', 'Dup', 'CRP', '06/1234-a', 'SP');
    raise exception 'FAIL registro duplicado aceito';
  exception when unique_violation then
    raise notice 'PASS registro duplicado rejeitado (professionals_registry_key)';
  end;

  -- a falha acima nao deixa partner para tras (subtransacao desfeita)
  reset role;
  if exists (select 1 from public.user_roles where user_id = 'b0000000-0000-0000-0000-000000000003' and role = 'partner') then
    raise exception 'FAIL papel partner vazou apos falha';
  end if;
  raise notice 'PASS falha na RPC e atomica';
end $$;

-- 5. visibilidade: partner só a própria linha; staff todas; client nenhuma
do $$
declare n bigint;
begin
  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.professionals;
  if n <> 1 then raise exception 'FAIL partner viu % fichas', n; end if;
  if not exists (select 1 from public.professionals where user_id = 'b0000000-0000-0000-0000-000000000011') then
    raise exception 'FAIL partner nao viu a propria ficha';
  end if;
  raise notice 'PASS partner le so a propria ficha';

  -- partner não edita a própria ficha (escrita do partner é fase futura)
  update public.professionals set bio = 'hack' where user_id = 'b0000000-0000-0000-0000-000000000011';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL partner editou a propria ficha'; end if;
  raise notice 'PASS partner nao edita a ficha';
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.professionals;
  if n <> 0 then raise exception 'FAIL client viu % fichas', n; end if;
  raise notice 'PASS client nao le fichas';
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.professionals;
  if n <> 2 then raise exception 'FAIL collaborator viu % fichas (esperado 2)', n; end if;
  raise notice 'PASS collaborator le todas as fichas';
  reset role;
end $$;

-- 6. collaborator edita a ficha, mas não concede papel, não convida e não verifica
do $$
declare n bigint;
begin
  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;

  update public.professionals
     set bio = 'nova bio', specialties = array['luto', 'tcc']
   where user_id = 'b0000000-0000-0000-0000-000000000011';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL collaborator nao editou a ficha'; end if;
  raise notice 'PASS collaborator edita a ficha';

  begin
    update public.professionals set verification_status = 'verified'
     where user_id = 'b0000000-0000-0000-0000-000000000011';
    raise exception 'FAIL collaborator verificou profissional';
  exception when insufficient_privilege then
    raise notice 'PASS collaborator nao altera verificacao';
  end;

  begin
    update public.professionals set verified_by = 'b0000000-0000-0000-0000-000000000002'
     where user_id = 'b0000000-0000-0000-0000-000000000011';
    raise exception 'FAIL collaborator escreveu verified_by';
  exception when insufficient_privilege then
    raise notice 'PASS verified_by nao e editavel';
  end;

  begin
    insert into public.user_roles (user_id, role) values ('b0000000-0000-0000-0000-000000000003', 'partner');
    raise exception 'FAIL collaborator concedeu papel';
  exception when insufficient_privilege then
    raise notice 'PASS collaborator nao concede papel';
  end;

  begin
    insert into public.professionals (user_id, full_name, registry_council, registry_number, registry_state)
    values ('b0000000-0000-0000-0000-000000000003', 'X', 'CRP', '55', 'SP');
    raise exception 'FAIL collaborator inseriu ficha direto';
  exception when insufficient_privilege then
    raise notice 'PASS insert direto em professionals negado';
  end;

  begin
    delete from public.professionals where user_id = 'b0000000-0000-0000-0000-000000000011';
    raise exception 'FAIL collaborator apagou ficha';
  exception when insufficient_privilege then
    raise notice 'PASS delete em professionals negado';
  end;
  reset role;
end $$;

-- 7. admin verifica (quem e quando); alterar o registro volta para pending
do $$
declare r public.professionals;
begin
  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  set local role authenticated;

  update public.professionals set verification_status = 'verified', verification_note = 'CRP conferido'
   where user_id = 'b0000000-0000-0000-0000-000000000011'
  returning * into r;
  if r.verified_by <> 'b0000000-0000-0000-0000-000000000001' or r.verified_at is null then
    raise exception 'FAIL verificacao nao gravou quem/quando';
  end if;
  raise notice 'PASS verificacao grava verified_by e verified_at';
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;
  update public.professionals set registry_number = '06/9999-A'
   where user_id = 'b0000000-0000-0000-0000-000000000011'
  returning * into r;
  if r.verification_status <> 'pending' or r.verified_at is not null or r.verified_by is not null then
    raise exception 'FAIL alterar registro nao voltou para pending';
  end if;
  raise notice 'PASS alterar registro de verificado volta para pending';

  -- editar bio de verificado (admin reverifica, collab edita bio) preserva a verificacao
  reset role;
  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  set local role authenticated;
  update public.professionals set verification_status = 'rejected'
   where user_id = 'b0000000-0000-0000-0000-000000000011' returning * into r;
  if r.verified_at is null then raise exception 'FAIL rejected sem verified_at'; end if;
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"b0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;
  update public.professionals set bio = 'outra' where user_id = 'b0000000-0000-0000-0000-000000000011'
  returning * into r;
  if r.verification_status <> 'rejected' or r.verified_by <> 'b0000000-0000-0000-0000-000000000001' then
    raise exception 'FAIL edicao comum alterou a verificacao';
  end if;
  raise notice 'PASS edicao comum preserva a verificacao';
  reset role;
end $$;

-- 8. convite aceito ao confirmar o e-mail
do $$
declare v timestamptz;
begin
  select invite_accepted_at into v from public.professionals where user_id = 'b0000000-0000-0000-0000-000000000011';
  if v is not null then raise exception 'FAIL convite ja aceito antes da confirmacao'; end if;
  update auth.users set email_confirmed_at = now() where id = 'b0000000-0000-0000-0000-000000000011';
  select invite_accepted_at into v from public.professionals where user_id = 'b0000000-0000-0000-0000-000000000011';
  if v is null then raise exception 'FAIL confirmacao nao marcou o convite como aceito'; end if;
  raise notice 'PASS confirmar e-mail marca o convite como aceito';
end $$;

rollback;
