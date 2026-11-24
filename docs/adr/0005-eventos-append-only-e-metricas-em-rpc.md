# ADR 0005: Tabela `events` append-only e métricas em funções SQL (RPC)

- Status: aceito
- Data: 2026-11-24

## Contexto
Dashboard e analytics precisam de funil e séries temporais confiáveis. Hoje o teste não registra nada. Agregar no cliente com linhas brutas é lento, inconsistente e expõe dados demais.

## Decisão
1. Registrar eventos do funil em `events` **append-only** (nome de lista fechada, `occurred_at`, `anon_id`, `contact_id` opcional, `properties` jsonb pequeno sem PII, UTM, `instrument_version`). Nenhum UPDATE/DELETE concedido; inserção só pelo servidor.
2. Métricas calculadas por funções SQL (RPC) parametrizadas por período, juntando `events` e tabelas de domínio. O cliente só recebe agregados. Funções protegidas por papel.
3. Rollups/materialização só quando o volume medido exigir (evolução em camadas).

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| Ferramenta de analytics externa (GA, PostHog) como fonte única | Não cruza com CRM/assinatura; dado fora do controle; pode complementar depois |
| Contadores incrementados em tabelas | Perde histórico e não permite recalcular/corrigir definições |
| Agregação no cliente | Lenta, difícil de testar, exige expor linhas |

## Consequências
- (+) Fonte única da verdade, recalculável, auditável e testável com seed.
- (+) Novas métricas = nova função, sem mudar coleta.
- (-) Lógica de negócio em SQL: versionar em migrations e cobrir com testes.
- (-) Volume alto exigirá índices, particionamento ou rollups; medir antes.
- (-) Eventos anônimos só se ligam a pessoa após consentimento do lead.
