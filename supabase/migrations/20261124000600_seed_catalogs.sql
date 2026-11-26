-- =====================================================================
-- 0600 — Seeds de catálogo: canais de aquisição e tipos de evento
-- Idempotente (ON CONFLICT DO NOTHING): rodar de novo não altera ajustes
-- feitos depois pelo painel.
-- Planos NÃO são semeados: preço/limites são decisão de negócio.
-- =====================================================================

insert into public.acquisition_channels (code, name, utm_aliases, is_paid, sort_order) values
  ('instagram',    'Instagram',        array['ig', 'instagram_bio', 'instagram_story'],  false, 10),
  ('meta_ads',     'Meta Ads',         array['facebook', 'fb', 'meta'],                   true,  20),
  ('google_ads',   'Google Ads',       array['google', 'adwords'],                        true,  30),
  ('tiktok',       'TikTok',           array['tt'],                                       false, 40),
  ('youtube',      'YouTube',          array['yt'],                                       false, 50),
  ('whatsapp',     'WhatsApp',         array['wa', 'zap'],                                false, 60),
  ('referral',     'Indicação',        array['indicacao'],                                false, 70),
  ('influencer',   'Influenciador',    array['influenciador'],                            true,  80),
  ('organic',      'Orgânico / busca', array['seo', 'direct'],                            false, 90),
  ('landing_page', 'Landing page',     array[]::text[],                                   false, 100),
  ('other',        'Outro',            array[]::text[],                                   false, 999)
on conflict (code) do nothing;

-- funnel_order: etapa de admin_funnel (ordem crescente).
-- funnel_stage: estágio do CRM que o evento promove (só avança).
-- test_answer NÃO existe de propósito (ver 0300); abandono = test_progress.
insert into public.event_types (name, description, funnel_stage, funnel_order, touches_contact) values
  ('page_view',            'Visita a uma página pública',                         null,                   10, false),
  ('lead_captured',        'E-mail/telefone capturado em formulário',             'lead_captured',        20, true),
  ('signup_started',       'Abriu o cadastro de conta',                           'signup_started',       30, true),
  ('signup_completed',     'Conta criada',                                        'signup_completed',     40, true),
  ('test_started',         'Iniciou um teste',                                    'test_started',         50, true),
  ('test_progress',        'Marco de progresso do teste (properties.percent: 25/50/75)', null,            null, false),
  ('test_completed',       'Concluiu um teste',                                   'test_completed',       60, true),
  ('result_viewed',        'Viu o resultado do teste',                            'result_viewed',        70, true),
  ('mentor_first_message', 'Primeira mensagem ao mentor de IA (Fase 2)',          null,                   80, true),
  ('subscription_started', 'Assinatura iniciada (Fase 5)',                        'subscription_started', 90, true)
on conflict (name) do nothing;
