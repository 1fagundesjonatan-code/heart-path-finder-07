# ADR 0008: IA só no servidor, com registro de uso e custo por chamada

- Status: aceito
- Data: 2026-11-24

## Contexto
As Fases 2 e 3 chamam modelos de linguagem (e embeddings). Chave de API não pode ir ao navegador; custo precisa ser controlável por usuário, plano e feature; o provedor pode mudar.

## Decisão
1. Toda chamada ao modelo acontece no servidor (server function/rota de servidor), nunca no cliente. Chave só em variável de ambiente do servidor.
2. Camada fina em `src/integrations/ai/` com interface mínima (`complete`, `stream`, `embed`) e configuração central de modelo por feature (um arquivo). Modelo padrão: família Claude mais recente; não amarrar o código a um nome de modelo espalhado.
3. Cada chamada grava em `ai_usage`: feature, modelo, tokens de entrada/saída (e de cache, quando houver), custo estimado, latência, `user_id`, status/erro. Nunca registrar o conteúdo das mensagens ali.
4. Limites por usuário/plano e orçamento mensal global verificados **antes** da chamada; estouro devolve erro claro, não degrada silenciosamente.
5. Prompts versionados (módulo The Self AI); mudança de prompt é registrada.
6. Escolha do SDK (Anthropic SDK ou Vercel AI SDK) na primeira entrega da Fase 2, preferindo biblioteca consolidada a implementação própria; a interface acima isola a escolha.
7. Embeddings: o provedor Claude não oferece; provedor a decidir na Fase 3 (fixa a dimensão do vetor).

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| Chamar o provedor do navegador | Vaza a chave, sem controle de custo nem de conteúdo |
| Acoplar a um provedor sem camada | Troca de modelo/provedor vira refatoração ampla |
| Abstração grande multi-provedor desde já | Especulativa; a interface mínima basta |
| Sem registro de custo | Impossibilita limites por plano e a margem do negócio |

## Consequências
- (+) Segurança, custo visível, troca de modelo barata, base para limites por plano (Fase 5).
- (-) Latência extra de passar pelo servidor; streaming e tempo máximo de execução no runtime Cloudflare precisam de verificação na primeira entrega da Fase 2.
- (-) Escrita em `ai_usage` usa service role: caso nomeado e testado.
