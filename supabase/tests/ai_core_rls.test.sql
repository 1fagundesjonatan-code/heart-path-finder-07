-- RLS e invariantes do núcleo do agente (migration 20261127000100).
-- Roda inteiro em uma transação e termina em ROLLBACK: não deixa dados.
-- Uso: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/ai_core_rls.test.sql
-- Cada caso emite NOTICE 'PASS ...'; qualquer falha aborta com exceção 'FAIL ...'.

begin;

-- usuários de teste (como postgres): admin, collaborator, dois clients
insert into auth.users (id, email, aud, role, raw_user_meta_data)
values
  ('a0000000-0000-0000-0000-000000000001', 'rls-admin@test.invalid',   'authenticated', 'authenticated', '{"full_name":"RLS Admin"}'),
  ('a0000000-0000-0000-0000-000000000002', 'rls-collab@test.invalid',  'authenticated', 'authenticated', '{"full_name":"RLS Collab"}'),
  ('a0000000-0000-0000-0000-000000000003', 'rls-client1@test.invalid', 'authenticated', 'authenticated', '{"full_name":"RLS Client 1"}'),
  ('a0000000-0000-0000-0000-000000000004', 'rls-client2@test.invalid', 'authenticated', 'authenticated', '{"full_name":"RLS Client 2"}');

insert into public.user_roles (user_id, role) values
  ('a0000000-0000-0000-0000-000000000001', 'admin'),
  ('a0000000-0000-0000-0000-000000000002', 'collaborator'),
  ('a0000000-0000-0000-0000-000000000003', 'client'),
  ('a0000000-0000-0000-0000-000000000004', 'client')
on conflict (user_id, role) do nothing;

-- 1. anon: nenhuma das quatro tabelas
do $$
declare t text;
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  foreach t in array array['ai_agent_versions', 'ai_conversations', 'ai_messages', 'ai_usage'] loop
    begin
      execute format('select count(*) from public.%I', t);
      raise exception 'FAIL anon leu %', t;
    exception when insufficient_privilege then
      raise notice 'PASS anon sem select em %', t;
    end;
  end loop;
  begin
    perform public.ai_publish_agent_version(1);
    raise exception 'FAIL anon executou RPC de publicar';
  exception when insufficient_privilege then
    raise notice 'PASS anon sem execute na RPC de publicar';
  end;
  reset role;
end $$;

-- 2. client: sem acesso a versões, uso e criação de conversa de playground
do $$
declare n bigint;
begin
  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
  set local role authenticated;

  select count(*) into n from public.ai_agent_versions;
  if n <> 0 then raise exception 'FAIL client viu versoes'; end if;
  select count(*) into n from public.ai_usage;
  if n <> 0 then raise exception 'FAIL client viu uso'; end if;
  raise notice 'PASS client nao le versoes nem uso';

  begin
    insert into public.ai_agent_versions (version, persona, model, created_by)
    values (900, 'x', 'm', 'a0000000-0000-0000-0000-000000000003');
    raise exception 'FAIL client criou versao';
  exception when insufficient_privilege then
    raise notice 'PASS client nao cria versao';
  end;

  begin
    perform public.ai_publish_agent_version(1);
    raise exception 'FAIL client publicou';
  exception when insufficient_privilege then
    raise notice 'PASS client nao publica';
  end;
  reset role;
end $$;

-- 3. collaborator: cria e edita rascunho, não publica, não apaga, não força status
do $$
declare
  v_id bigint;
  v_rows integer;
begin
  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;

  insert into public.ai_agent_versions (version, persona, model, created_by)
  values (1, 'persona v1', 'model-x', 'a0000000-0000-0000-0000-000000000002')
  returning id into v_id;
  raise notice 'PASS collaborator cria rascunho';

  update public.ai_agent_versions set persona = 'persona v1 editada' where id = v_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'FAIL collaborator nao editou rascunho'; end if;
  raise notice 'PASS collaborator edita rascunho';

  begin
    insert into public.ai_agent_versions (version, persona, model, status, created_by)
    values (2, 'x', 'm', 'active', 'a0000000-0000-0000-0000-000000000002');
    raise exception 'FAIL collaborator criou versao ativa';
  exception when insufficient_privilege then
    raise notice 'PASS collaborator nao cria versao ativa direto';
  end;

  begin
    update public.ai_agent_versions set status = 'active' where id = v_id;
    raise exception 'FAIL collaborator mudou status direto';
  exception when insufficient_privilege then
    raise notice 'PASS collaborator nao muda status (grant de coluna)';
  end;

  begin
    perform public.ai_publish_agent_version(v_id);
    raise exception 'FAIL collaborator publicou';
  exception when insufficient_privilege then
    raise notice 'PASS collaborator nao publica (RPC 42501)';
  end;

  delete from public.ai_agent_versions where id = v_id;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FAIL collaborator apagou rascunho'; end if;
  raise notice 'PASS collaborator nao apaga rascunho';

  begin
    insert into public.ai_agent_versions (version, persona, model, type_guides, created_by)
    values (3, 'x', 'm', '{"10":"fora"}', 'a0000000-0000-0000-0000-000000000002');
    raise exception 'FAIL type_guides aceitou chave 10';
  exception when check_violation then
    raise notice 'PASS type_guides rejeita chave fora de 1..9';
  end;
  reset role;
end $$;

-- 4. admin: publica, reverte, atômico, uma ativa só, imutabilidade, delete de rascunho
do $$
declare
  v1 bigint;
  v2 bigint;
  v_active integer;
  v_rows integer;
  r public.ai_agent_versions;
begin
  select id into v1 from public.ai_agent_versions where version = 1;

  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  set local role authenticated;

  insert into public.ai_agent_versions (version, persona, model, created_by)
  values (2, 'persona v2', 'model-x', 'a0000000-0000-0000-0000-000000000001')
  returning id into v2;

  r := public.ai_publish_agent_version(v1);
  if r.status <> 'active' or r.published_by <> 'a0000000-0000-0000-0000-000000000001' or r.published_at is null then
    raise exception 'FAIL admin nao publicou v1 corretamente';
  end if;
  raise notice 'PASS admin publica v1 (draft -> active, published_by/at)';

  r := public.ai_publish_agent_version(v2);
  select count(*) into v_active from public.ai_agent_versions where status = 'active';
  if v_active <> 1 or r.id <> v2 then raise exception 'FAIL publicar v2 deixou % ativas', v_active; end if;
  if (select status from public.ai_agent_versions where id = v1) <> 'archived' then
    raise exception 'FAIL v1 nao foi arquivada';
  end if;
  raise notice 'PASS publicar v2 arquiva v1 e mantém uma ativa';

  r := public.ai_publish_agent_version(v1);
  if r.status <> 'active' or (select status from public.ai_agent_versions where id = v2) <> 'archived' then
    raise exception 'FAIL reverter para v1 falhou';
  end if;
  raise notice 'PASS reverter archived -> active troca a ativa';

  begin
    perform public.ai_publish_agent_version(v1);
    raise exception 'FAIL publicar versao ja ativa passou';
  exception when invalid_parameter_value then
    raise notice 'PASS publicar versao ja ativa e rejeitado';
  end;

  begin
    perform public.ai_publish_agent_version(-1);
    raise exception 'FAIL publicar inexistente passou';
  exception when no_data_found then
    raise notice 'PASS publicar inexistente e rejeitado';
  end;

  update public.ai_agent_versions set persona = 'mudou' where id = v1;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FAIL admin editou versao ativa'; end if;
  update public.ai_agent_versions set persona = 'mudou' where id = v2;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FAIL admin editou versao arquivada'; end if;
  raise notice 'PASS versao ativa/arquivada nao e editavel via RLS';

  delete from public.ai_agent_versions where id = v1;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FAIL admin apagou versao ativa'; end if;
  raise notice 'PASS admin nao apaga versao ativa';

  insert into public.ai_agent_versions (version, persona, model, created_by)
  values (3, 'rascunho', 'm', 'a0000000-0000-0000-0000-000000000001');
  delete from public.ai_agent_versions where version = 3;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'FAIL admin nao apagou rascunho'; end if;
  raise notice 'PASS admin apaga rascunho';

  -- audit_log legível ao admin, com actor
  if (select count(*) from public.audit_log
       where entity_table = 'ai_agent_versions'
         and actor_id = 'a0000000-0000-0000-0000-000000000001') < 5 then
    raise exception 'FAIL audit_log nao registrou mudancas de versoes';
  end if;
  raise notice 'PASS audit_log registra insert/update/delete de ai_agent_versions';
  reset role;
end $$;

-- 5. invariantes no nível do banco (postgres, sem RLS)
do $$
declare v1 bigint;
begin
  select id into v1 from public.ai_agent_versions where status = 'active';

  begin
    update public.ai_agent_versions set persona = 'burla' where id = v1;
    raise exception 'FAIL trigger permitiu editar versao ativa';
  exception when check_violation then
    raise notice 'PASS trigger bloqueia conteudo de versao nao-draft (mesmo como postgres)';
  end;

  begin
    update public.ai_agent_versions set status = 'draft' where id = v1;
    raise exception 'FAIL trigger permitiu active -> draft';
  exception when check_violation then
    raise notice 'PASS trigger bloqueia transicao invalida';
  end;

  begin
    insert into public.ai_agent_versions (version, persona, model, status)
    values (50, 'segunda ativa', 'm', 'active');
    raise exception 'FAIL indice permitiu segunda ativa';
  exception when unique_violation then
    raise notice 'PASS indice parcial impede duas ativas';
  end;
end $$;

-- 6. conversas e mensagens
do $$
declare
  v_ver bigint;
  v_conv uuid;
  v_conv_k1 uuid := 'c0000000-0000-0000-0000-000000000001';
  v_conv_k2 uuid := 'c0000000-0000-0000-0000-000000000002';
  n bigint;
  v_rows integer;
begin
  select id into v_ver from public.ai_agent_versions where status = 'active';

  -- conversas do canal app existem só por service role/postgres nesta onda
  insert into public.ai_conversations (id, user_id, channel, agent_version_id)
  values (v_conv_k1, 'a0000000-0000-0000-0000-000000000003', 'app', v_ver),
         (v_conv_k2, 'a0000000-0000-0000-0000-000000000004', 'app', v_ver);

  -- collaborator cria conversa de playground
  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;
  insert into public.ai_conversations (user_id, channel, agent_version_id, simulated_type, title)
  values ('a0000000-0000-0000-0000-000000000002', 'playground', v_ver, 4, 'teste')
  returning id into v_conv;
  raise notice 'PASS staff cria conversa de playground';

  begin
    insert into public.ai_conversations (user_id, channel, agent_version_id)
    values ('a0000000-0000-0000-0000-000000000001', 'playground', v_ver);
    raise exception 'FAIL staff criou conversa em nome de outro';
  exception when insufficient_privilege then
    raise notice 'PASS nao cria conversa em nome de outro usuario';
  end;

  begin
    insert into public.ai_conversations (user_id, channel, agent_version_id)
    values ('a0000000-0000-0000-0000-000000000002', 'app', v_ver);
    raise exception 'FAIL staff criou conversa canal app';
  exception when insufficient_privilege then
    raise notice 'PASS canal app nao e criavel por authenticated';
  end;

  begin
    update public.ai_conversations set agent_version_id = v_ver where id = v_conv;
    raise exception 'FAIL dono trocou versao da conversa';
  exception when insufficient_privilege then
    raise notice 'PASS versao da conversa e imutavel (grant de coluna)';
  end;

  update public.ai_conversations set title = 'novo titulo' where id = v_conv;
  get diagnostics v_rows = row_count;
  if v_rows <> 1 then raise exception 'FAIL dono nao renomeou conversa'; end if;
  raise notice 'PASS dono renomeia conversa';

  insert into public.ai_messages (id, conversation_id, role, parts)
  values ('msg-1', v_conv, 'user', '[{"type":"text","text":"oi"}]');
  raise notice 'PASS dono insere mensagem';

  select count(*) into n from public.ai_conversations where channel = 'app';
  if n <> 0 then raise exception 'FAIL staff viu conversa do canal app'; end if;
  raise notice 'PASS staff nao ve conversa de cliente (canal app)';
  reset role;

  -- admin (staff) lê a conversa e as mensagens do colega, mas não escreve nelas
  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.ai_conversations where id = v_conv;
  if n <> 1 then raise exception 'FAIL staff nao ve playground do colega'; end if;
  select count(*) into n from public.ai_messages where conversation_id = v_conv;
  if n <> 1 then raise exception 'FAIL staff nao ve mensagens do colega'; end if;
  raise notice 'PASS staff le playground e mensagens do colega';

  begin
    insert into public.ai_messages (id, conversation_id, role, parts)
    values ('msg-intruso', v_conv, 'user', '[]');
    raise exception 'FAIL staff escreveu na conversa do colega';
  exception when insufficient_privilege then
    raise notice 'PASS staff nao escreve na conversa do colega';
  end;

  update public.ai_conversations set title = 'sequestro' where id = v_conv;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FAIL staff renomeou conversa do colega'; end if;
  delete from public.ai_conversations where id = v_conv;
  get diagnostics v_rows = row_count;
  if v_rows <> 0 then raise exception 'FAIL staff apagou conversa do colega'; end if;
  raise notice 'PASS update/delete de conversa so pelo dono';
  reset role;

  -- client1: só a própria conversa
  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.ai_conversations;
  if n <> 1 then raise exception 'FAIL client1 viu % conversas', n; end if;
  if not exists (select 1 from public.ai_conversations where id = v_conv_k1) then
    raise exception 'FAIL client1 nao viu a propria';
  end if;
  select count(*) into n from public.ai_messages;
  if n <> 0 then raise exception 'FAIL client1 viu mensagens alheias'; end if;
  raise notice 'PASS client ve so a propria conversa e nenhuma mensagem alheia';

  begin
    delete from public.ai_messages where id = 'msg-1';
    raise exception 'FAIL client apagou mensagem';
  exception when insufficient_privilege then
    raise notice 'PASS ninguem apaga mensagem direto (sem grant de delete)';
  end;
  reset role;

  -- client2 não vê a do client1
  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000004","role":"authenticated"}', true);
  set local role authenticated;
  if exists (select 1 from public.ai_conversations where id = v_conv_k1) then
    raise exception 'FAIL client2 viu conversa do client1';
  end if;
  raise notice 'PASS client2 nao ve conversa do client1';
  reset role;
end $$;

-- 7. ai_usage: escrita só service_role, leitura só staff
do $$
declare
  n bigint;
  v_ver bigint;
begin
  select id into v_ver from public.ai_agent_versions where status = 'active';

  set local role service_role;
  insert into public.ai_usage (user_id, agent_version_id, feature, model, input_tokens, output_tokens, status)
  values ('a0000000-0000-0000-0000-000000000002', v_ver, 'chat', 'model-x', 120, 80, 'ok');
  raise notice 'PASS service_role insere uso';

  begin
    perform count(*) from public.ai_usage;
    raise exception 'FAIL service_role leu ai_usage';
  exception when insufficient_privilege then
    raise notice 'PASS service_role sem select em ai_usage (menor privilegio)';
  end;
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.ai_usage;
  if n <> 1 then raise exception 'FAIL staff nao leu uso'; end if;
  raise notice 'PASS staff le uso';

  begin
    insert into public.ai_usage (feature, model, status) values ('chat', 'm', 'ok');
    raise exception 'FAIL authenticated inseriu uso';
  exception when insufficient_privilege then
    raise notice 'PASS authenticated nao escreve uso';
  end;
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"a0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
  set local role authenticated;
  select count(*) into n from public.ai_usage;
  if n <> 0 then raise exception 'FAIL client leu uso'; end if;
  raise notice 'PASS client nao le uso';
  reset role;
end $$;

rollback;
