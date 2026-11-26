# ADR 0004: `crm_contacts` como entidade única de pessoa

- Status: aceito
- Data: 2026-11-24

## Contexto
Lead e cliente são a mesma pessoa em momentos diferentes do funil. Tabelas separadas duplicam dados, quebram o histórico quando o lead vira cliente e complicam métricas de conversão.

## Decisão
Uma tabela `crm_contacts` representa a pessoa. `user_id` é nulo até a criação da conta. **Lead = contato em estágio inicial**, não uma entidade. Guardar estágio atual e histórico de estágios (quem, quando). E-mail normalizado e único. Origem e UTM ficam no contato. Leads e Clientes no admin são visões filtradas (`user_id is null` / `not null`, estágio). Consentimentos em tabela própria ligada ao contato. Estágios iniciais definidos por migration (sem CRUD de estágios na Fase 1).

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| Tabelas `leads` e `customers` | Duplicação, junção na conversão, métricas inconsistentes |
| Usar só `profiles` (auth) | Lead não tem conta; perderia a captura antes do cadastro |
| CRM externo (HubSpot etc.) | Custo e integração antes de validar o processo; pode vir na Fase 4 como destino de sincronização |

## Consequências
- (+) Uma pessoa, uma linha, um histórico; conversão lead→cliente é mudança de estágio e preenchimento de `user_id`.
- (-) Vincular contato a conta exige regra de merge (mesmo e-mail verificado); definida em E5/E6 com cuidado para não ligar pessoas erradas.
- (-) Direito de exclusão atinge um registro central; precisa de fluxo de anonimização que preserve agregados.
