# ADR 0006: Métrica sem fonte aparece como "Necessita integração"

- Status: aceito
- Data: 2026-11-24

## Contexto
O dono exige que nada fictício pareça funcionar. MRR, churn, receita, custo de IA e marketplace não têm fonte de dados na Fase 1. Mostrar zero, traço ou número de exemplo enganaria a gestão.

## Decisão
1. Todo módulo e todo cartão usa um dos rótulos: **Implementado, Em desenvolvimento, Planejado, Necessita integração, Necessita validação**, definidos num registro único (`shared/module-status.ts`).
2. Métrica sem fonte renderiza `MetricUnavailable` com o texto "Necessita integração", sem número.
3. Período sem dados reais mostra "sem dados no período", distinto de zero.
4. CAC e CPL: na Fase 1 apenas **CPL**, calculado com `marketing_spend` lançado manualmente; CAC permanece "Necessita integração" até existirem clientes pagantes (Fase 5).
5. Mudar um rótulo é um commit explícito e revisado.

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| Dados de demonstração (mock) no dashboard | Viola a regra do dono; risco de decisão com número falso |
| Ocultar cartões sem dado | Esconde o roadmap e a lacuna de integração |
| Mostrar zero | Zero parece medição real |

## Consequências
- (+) Honestidade; dashboard serve de mapa do que falta.
- (+) Cada integração futura troca um cartão de "Necessita integração" por número real.
- (-) Dashboard parece "vazio" no início; é intencional e deve ser comunicado.
