# ADR 0007: Dados sensíveis de autoconhecimento separados, com consentimento explícito

- Status: aceito
- Data: 2026-11-24

## Contexto
Resultado do teste, respostas, conversas e memórias do Mentor revelam traços psicológicos e podem revelar saúde mental, que a LGPD trata como sensível (art. 5, II; art. 11). A equipe precisa de métricas, mas não deve ler conteúdo íntimo livremente. O produto não é serviço clínico.

## Decisão
1. **Tabelas separadas** para: resultado/respostas do quiz, conversas, resumos, memórias e embeddings, isoladas dos dados cadastrais do CRM, com RLS própria.
2. **Consentimento explícito e granular**, registrado em tabela append-only (finalidade, versão do texto, data, origem, revogação); checkbox não pré-marcado; categorias sensíveis exigem opt-in próprio. Sem consentimento, o dado não é gravado ligado à pessoa.
3. **Staff vê agregados** (contagens, distribuições, médias). Nenhum papel lê respostas, conversas ou memórias individuais por padrão.
4. **Acesso individual excepcional** só por `admin`, com motivo, e sempre em `audit_log`; revisão de conteúdo sinalizado por segurança segue o mesmo rito.
5. **Controle do titular**: ver, corrigir, exportar, excluir (em cascata, inclusive embeddings) e revogar.
6. Retenção por categoria definida e validada com jurídico antes do lançamento da respectiva fase.
7. O Mentor IA não oferece diagnóstico nem tratamento; aviso permanente e protocolo de crise.

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| Tudo em `crm_contacts`/`profiles` | Mistura dado comum e sensível; RLS e exclusão ficam frágeis |
| Staff com acesso total "para suporte" | Risco jurídico e de confiança; suporte usa agregados ou acesso auditado |
| Consentimento único genérico | Não atende finalidade específica nem granularidade |

## Consequências
- (+) Superfície de risco menor, exclusão e portabilidade viáveis, argumento forte de confiança.
- (-) Mais tabelas e joins; suporte sem leitura livre exige ferramenta de acesso excepcional auditado.
- (-) Definições jurídicas (base legal, retenção, operadores) ficam como **Necessita validação**.
