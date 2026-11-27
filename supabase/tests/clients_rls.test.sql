-- admin_list_clients, admin_client_detail e admin_client_ai_summary (migration 20261127000500).
-- Roda inteiro em uma transação e termina em ROLLBACK: não deixa dados.
-- Uso: supabase db query --db-url "$DATABASE_URL" -f supabase/tests/clients_rls.test.sql
-- Cada caso emite NOTICE 'PASS ...'; qualquer falha aborta com exceção 'FAIL ...'.

begin;

-- usuários confirmados: o trigger cria perfil, papel client e contato (inclusive para equipe e profissional, R11)
insert into auth.users (id, email, aud, role, raw_user_meta_data, email_confirmed_at)
values
  ('c0000000-0000-0000-0000-000000000001', 'c-admin@test.invalid',   'authenticated', 'authenticated', '{"full_name":"C Admin"}',   now()),
  ('c0000000-0000-0000-0000-000000000002', 'c-collab@test.invalid',  'authenticated', 'authenticated', '{"full_name":"C Collab"}',  now()),
  ('c0000000-0000-0000-0000-000000000003', 'c-partner@test.invalid', 'authenticated', 'authenticated', '{"full_name":"C Partner"}', now()),
  ('c0000000-0000-0000-0000-000000000011', 'c-alice@test.invalid',   'authenticated', 'authenticated', '{"full_name":"Alice Cliente"}', now()),
  ('c0000000-0000-0000-0000-000000000012', 'c-bruno@test.invalid',   'authenticated', 'authenticated', '{"full_name":"Bruno Cliente"}', now()),
  ('c0000000-0000-0000-0000-000000000013', 'c-carla@test.invalid',   'authenticated', 'authenticated', '{"full_name":"Carla Cliente"}', now());

insert into public.user_roles (user_id, role) values
  ('c0000000-0000-0000-0000-000000000001', 'admin'),
  ('c0000000-0000-0000-0000-000000000002', 'collaborator'),
  ('c0000000-0000-0000-0000-000000000003', 'partner')
on conflict (user_id, role) do nothing;

-- Alice: teste concluído (tipo 4) COM consentimento de compartilhar; Bruno: teste concluído (tipo 7) SEM consentimento
do $$
declare
  v_alice  bigint := (select id from public.crm_contacts where user_id = 'c0000000-0000-0000-0000-000000000011');
  v_bruno  bigint := (select id from public.crm_contacts where user_id = 'c0000000-0000-0000-0000-000000000012');
  v_a_id   bigint;
  v_b_id   bigint;
  v_conv   uuid;
begin
  if v_alice is null or v_bruno is null then raise exception 'FAIL contatos nao criados pelo trigger'; end if;

  insert into public.consents (contact_id, consent_type, document_version, granted)
  values (v_alice, 'enneagram_profile_share', 'v1', true),
         (v_alice, 'marketing', 'v1', true),
         (v_alice, 'marketing', 'v2', false),
         (v_bruno, 'enneagram_profile_share', 'v1', true),
         (v_bruno, 'enneagram_profile_share', 'v1', false);

  insert into public.assessments (user_id, contact_id, instrument, status, completed_at)
  values ('c0000000-0000-0000-0000-000000000011', v_alice, 'enneagram_likert_v1', 'completed', now()) returning id into v_a_id;
  insert into public.assessments (user_id, contact_id, instrument, status, completed_at)
  values ('c0000000-0000-0000-0000-000000000012', v_bruno, 'enneagram_likert_v1', 'completed', now()) returning id into v_b_id;
  insert into public.assessment_results (assessment_id, scores, primary_type)
  values (v_a_id, '{"4": 90}', '4'), (v_b_id, '{"7": 90}', '7');

  -- Alice: conversa do canal app (conteúdo que nunca deve sair) e uso de tokens
  insert into public.ai_agent_versions (version, persona, model, status)
  values (9001, 'persona de teste', 'test-model', 'draft');
  insert into public.ai_conversations (user_id, channel, agent_version_id, title)
  values ('c0000000-0000-0000-0000-000000000011', 'app',
          (select id from public.ai_agent_versions where version = 9001), 'segredo-da-alice')
  returning id into v_conv;
  insert into public.ai_messages (id, conversation_id, role, parts)
  values ('m1', v_conv, 'user', '[{"type":"text","text":"conteudo-privado-da-alice"}]'),
         ('m2', v_conv, 'assistant', '[{"type":"text","text":"resposta-privada"}]');
  insert into public.ai_usage (user_id, conversation_id, feature, model, input_tokens, output_tokens, status)
  values ('c0000000-0000-0000-0000-000000000011', v_conv, 'chat', 'test-model', 100, 40, 'ok');
end $$;

-- 1. anon e client não executam as funções
do $$
declare f text;
begin
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  begin
    perform * from public.admin_list_clients();
    raise exception 'FAIL anon listou clientes';
  exception when insufficient_privilege then
    raise notice 'PASS anon sem execute em admin_list_clients';
  end;
  reset role;

  perform set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000011","role":"authenticated"}', true);
  set local role authenticated;
  begin
    perform * from public.admin_list_clients();
    raise exception 'FAIL client listou clientes';
  exception when insufficient_privilege then
    raise notice 'PASS client nao lista clientes';
  end;
  begin
    perform public.admin_client_detail('c0000000-0000-0000-0000-000000000012');
    raise exception 'FAIL client abriu ficha de outro';
  exception when insufficient_privilege then
    raise notice 'PASS client nao abre ficha';
  end;
  begin
    perform * from public.admin_client_ai_summary('c0000000-0000-0000-0000-000000000011');
    raise exception 'FAIL client leu resumo de IA';
  exception when insufficient_privilege then
    raise notice 'PASS client nao le resumo de IA';
  end;
  reset role;
end $$;

-- 2. partner (profissional) não vê clientes (fase 5 ainda não liberou)
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
  set local role authenticated;
  begin
    perform * from public.admin_list_clients();
    raise exception 'FAIL partner listou clientes';
  exception when insufficient_privilege then
    raise notice 'PASS partner nao lista clientes';
  end;
  begin
    perform public.admin_client_detail('c0000000-0000-0000-0000-000000000011');
    raise exception 'FAIL partner abriu ficha';
  exception when insufficient_privilege then
    raise notice 'PASS partner nao abre ficha';
  end;
  reset role;
end $$;

-- 3. staff lista: só clientes (sem admin, collaborator, partner), tipo só com consentimento
do $$
declare
  u text;
  n bigint;
  r record;
begin
  foreach u in array array['c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'] loop
    perform set_config('request.jwt.claims', format('{"sub":"%s","role":"authenticated"}', u), true);
    set local role authenticated;

    select count(*) into n from public.admin_list_clients()
     where user_id in ('c0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000003');
    if n <> 0 then raise exception 'FAIL % viu % usuarios da equipe/profissionais na lista', u, n; end if;

    select count(*) into n from public.admin_list_clients()
     where user_id in ('c0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000013');
    if n <> 3 then raise exception 'FAIL % viu % dos 3 clientes', u, n; end if;

    select * into r from public.admin_list_clients('c-alice@');
    if r.user_id <> 'c0000000-0000-0000-0000-000000000011' or r.primary_type <> '4' then
      raise exception 'FAIL tipo da Alice (com consentimento) ausente: %', r.primary_type;
    end if;
    select * into r from public.admin_list_clients('c-bruno@');
    if r.user_id <> 'c0000000-0000-0000-0000-000000000012' or r.primary_type is not null then
      raise exception 'FAIL tipo do Bruno (consentimento revogado) vazou: %', r.primary_type;
    end if;
    select * into r from public.admin_list_clients('c-carla@');
    if r.user_id <> 'c0000000-0000-0000-0000-000000000013' or r.primary_type is not null then
      raise exception 'FAIL busca por e-mail ou Carla sem teste';
    end if;
    raise notice 'PASS % lista so clientes e respeita consentimento', u;
    reset role;
  end loop;
end $$;

-- 3b. busca por e-mail ignora maiúsculas; resumo de IA só via ficha (execute revogado)
do $$
begin
  perform set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;
  if (select count(*) from public.admin_list_clients('C-ALICE@TEST')) <> 1 then
    raise exception 'FAIL busca por e-mail com maiusculas nao achou';
  end if;
  raise notice 'PASS busca por e-mail case-insensitive';
  begin
    perform * from public.admin_client_ai_summary('c0000000-0000-0000-0000-000000000001');
    raise exception 'FAIL staff chamou resumo de IA direto';
  exception when insufficient_privilege then
    raise notice 'PASS staff nao chama resumo de IA direto';
  end;
  reset role;
end $$;

-- 4. cursor: páginas sem repetição nem buraco, ordem id desc
do $$
declare
  v_all   bigint[];
  v_paged bigint[] := '{}';
  v_after bigint := null;
  v_page  bigint[];
begin
  perform set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000001","role":"authenticated"}', true);
  set local role authenticated;

  select array_agg(contact_id order by contact_id desc) into v_all
    from (select contact_id from public.admin_list_clients(null, null, 6) order by contact_id desc) t;
  for i in 1..3 loop
    select array_agg(contact_id order by contact_id desc) into v_page from public.admin_list_clients(null, v_after, 2);
    exit when v_page is null;
    v_paged := v_paged || v_page;
    v_after := v_page[array_upper(v_page, 1)];
  end loop;
  if v_paged is distinct from v_all then raise exception 'FAIL paginacao divergente: % vs %', v_paged, v_all; end if;
  raise notice 'PASS paginacao por cursor percorre todos sem repetir';

  -- limites do p_limit são saneados, busca com curinga não casa tudo
  if (select count(*) from public.admin_list_clients(null, null, 0)) <> 1 then raise exception 'FAIL limit 0 nao virou 1'; end if;
  if (select count(*) from public.admin_list_clients('%', null, 100)) <> 0 then raise exception 'FAIL curinga %% casou registros'; end if;
  raise notice 'PASS p_limit saneado e busca literal';
  reset role;
end $$;

-- 5. ficha: tipo só com consentimento, consentimento vigente, atividade; sem conteúdo de IA
do $$
declare d jsonb;
begin
  perform set_config('request.jwt.claims', '{"sub":"c0000000-0000-0000-0000-000000000002","role":"authenticated"}', true);
  set local role authenticated;

  d := public.admin_client_detail('c0000000-0000-0000-0000-000000000011');
  if (d -> 'enneagram' ->> 'primary_type') <> '4' or (d ->> 'enneagram_shared')::boolean is not true then
    raise exception 'FAIL ficha da Alice sem tipo: %', d -> 'enneagram';
  end if;
  if (select count(*) from jsonb_array_elements(d -> 'consents') c where c ->> 'consent_type' = 'marketing') <> 1
     or (select (c ->> 'granted')::boolean from jsonb_array_elements(d -> 'consents') c where c ->> 'consent_type' = 'marketing') is not false then
    raise exception 'FAIL consentimento vigente de marketing incorreto: %', d -> 'consents';
  end if;
  if (d -> 'ai' ->> 'conversations')::int <> 1 or (d -> 'ai' ->> 'messages')::int <> 2
     or (d -> 'ai' ->> 'input_tokens')::int <> 100 or (d -> 'ai' ->> 'output_tokens')::int <> 40 then
    raise exception 'FAIL resumo de IA incorreto: %', d -> 'ai';
  end if;
  if d::text like '%conteudo-privado%' or d::text like '%segredo-da-alice%' or d::text like '%resposta-privada%' then
    raise exception 'FAIL ficha vazou conteudo de conversa';
  end if;
  raise notice 'PASS ficha da Alice: tipo, consentimento vigente, contagens de IA, sem conteudo';

  d := public.admin_client_detail('c0000000-0000-0000-0000-000000000012');
  if d -> 'enneagram' <> 'null'::jsonb or (d ->> 'enneagram_shared')::boolean is not false or d::text like '%"7"%' then
    raise exception 'FAIL ficha do Bruno vazou tipo sem consentimento: %', d;
  end if;
  raise notice 'PASS ficha do Bruno sem tipo (consentimento revogado)';

  begin
    perform public.admin_client_detail('c0000000-0000-0000-0000-000000000003');
    raise exception 'FAIL ficha de profissional aberta como cliente';
  exception when sqlstate 'P0002' then
    raise notice 'PASS ficha recusa profissional';
  end;
  begin
    perform public.admin_client_detail('c0000000-0000-0000-0000-000000000001');
    raise exception 'FAIL ficha de admin aberta como cliente';
  exception when sqlstate 'P0002' then
    raise notice 'PASS ficha recusa equipe (e resumo de IA de staff nao sai por aqui)';
  end;
  reset role;
end $$;

rollback;
