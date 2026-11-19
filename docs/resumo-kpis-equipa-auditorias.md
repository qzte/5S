# Resumo de KPIs e métricas — equipa de auditorias (para reanálise)

Data: 2026-11-19 · Base: `KPIS.md` (v4.8.0) e código de `index.html`.
Estado: **proposta para discussão**. Nada foi implementado.

## 1. Contexto e decisões da conversa

1. Hoje só se mede o **número de auditorias**. Isso premeia a quantidade e não a qualidade nem o efeito.
2. Há dois tipos de serviço: **internos** (mais fáceis) e **externos** (mais difíceis). Contar tudo como 1 favorece os internos.
3. A equipa de auditorias **só é responsável pela Manutenção**. O resultado da equipa é, portanto, o eixo Manutenção (5 perguntas de origem), não a nota global dos serviços.
4. O campo **Verificador** (`verif`) já identifica o auditor em cada auditoria; `finalizada` guarda a data de finalização; `presentes` guarda quem esteve presente (4.8.0).

## 2. O que a app já mede (resumo)

| Nível | Métricas existentes | Onde |
| --- | --- | --- |
| Auditoria | Nota 0–100, faixa (≥80 / 50–79 / <50), contagens por classe, nota por pilar e por responsável | Formulário, relatório, histórico |
| Comparação | Variação face à auditoria anterior, seguimento pergunta a pergunta | Histórico, relatório |
| Ano | Média total, média por serviço, serviços por faixa, dispersão, reincidências, serviços sem auditoria, objectivo, ritmo, projecção, cobertura interno/externo | Análise → Indicadores do ano |
| Mês | Média e variação, por serviço, pilar, responsável, perguntas que mais falharam, acções | Análise → Relatório mensal |
| Acções | Em aberto, em atraso, feitas em 30 dias, tempo de fecho, idade, eficácia (global), dentro do prazo | Separador Acções |
| Operação | Cópias pendentes, espaço ocupado | Avisos, Configuração |

## 3. Propostas — equipa de auditores (esforço e qualidade)

### 5 imediatos (dados já existentes)

| # | KPI | Fórmula | O que revela |
| --- | --- | --- | --- |
| A1 | Auditorias por auditor vs. plano | feitas ÷ objectivo atribuído, por `verif` | Carga real e contribuição de cada um |
| A2 | Taxa de finalização | finalizadas ÷ gravadas; dias entre auditoria e `finalizada` | Se o trabalho é fechado (PDF, envio, cópia) |
| A3 | Completude de evidência | % de perguntas Mau/Oportunidade com foto/nota, acção e prazo (`faltasParaFinalizar()`) | Qualidade do registo |
| A4 | Acções criadas e fechadas por auditor | acções por auditoria, tempo de fecho, % dentro do prazo | Seguimento; auditoria superficial |
| A5 | Cobertura de serviços auditados | serviços distintos auditados ÷ atribuídos; dias sem auditoria | Evita auditar sempre os mesmos |

### 5 para o futuro

| # | KPI | Condição |
| --- | --- | --- |
| A6 | Calibração entre auditores (diferença de nota no mesmo serviço) | Auditorias cruzadas planeadas |
| A7 | Eficácia das acções por auditor | Volume e n mínimo |
| A8 | Reincidência nos serviços de cada auditor | Histórico acumulado |
| A9 | Tempo por auditoria | Registar hora de início (campo novo) |
| A10 | Qualidade do registo por revisão de um segundo auditor | Processo de revisão |

## 4. Propostas — equilíbrio interno / externo

Princípio: dois objectivos, ritmo por tipo e esforço ponderado.

### 5 imediatos

| # | KPI | Fórmula |
| --- | --- | --- |
| E1 | Objectivo e ritmo por tipo | Secção 4 do `KPIS.md` (esperadas, desvio, projecção, ritmo necessário) calculada para internas e externas |
| E2 | Auditorias ponderadas | Σ peso do tipo (ex.: interna 1, externa 3; pesos a decidir) |
| E3 | Cobertura por tipo e externos há mais tempo sem auditoria | `pctPorAuditar` em internos e externos como KPI principal |
| E4 | Mix interno/externo | % de externas no total vs. % prevista no plano |
| E5 | Mix por auditor | internas e externas por `verif` |

### 5 para o futuro

| # | KPI | Condição |
| --- | --- | --- |
| E6 | Esforço real por tipo (duração média) | Registar hora de início |
| E7 | Conclusão de externas planeadas (agendadas vs. realizadas) | Campo de agendamento |
| E8 | Custo por auditoria (deslocação, tempo) | Campo de custo |
| E9 | Eficácia e tempo de fecho das acções por tipo | Volume suficiente |
| E10 | Calibração das notas internas vs. externas | Comparação estatística |

## 5. Propostas — eixo Manutenção (resultado da equipa)

### 5 imediatos

| # | KPI | Fórmula |
| --- | --- | --- |
| M1 | Nota de Manutenção (média e tendência) | média do eixo Manutenção, por mês e ano |
| M2 | Nota de Manutenção por tipo | a mesma, em internos e externos |
| M3 | Perguntas de Manutenção que mais falham | «Perguntas que mais falham» filtrado ao eixo, com reincidência |
| M4 | Acções de Manutenção: abertas, em atraso, tempo de fecho | métricas de acções com responsável = Manutenção |
| M5 | Serviços com Manutenção Crítica | nota de Manutenção < 50 na última auditoria, por dias sem acção |

### 5 para o futuro

| # | KPI | Condição |
| --- | --- | --- |
| M6 | Eficácia das acções de Manutenção | Seguimento da pergunta na auditoria seguinte |
| M7 | Reincidência após acção feita | Cruzar `reincidencias()` com `feitaEm` |
| M8 | Tempo de resposta (detecção → conclusão) | Eventual separação pedido/execução |
| M9 | Custo e horas por intervenção, interna vs. externa | Campos novos |
| M10 | Nota de Manutenção com e sem Manutenção presente | Campo `presentes` (existe desde 4.8.0) e volume |

## 6. Como as três famílias se combinam

- **Actividade** (A, E2): estamos a fazer o trabalho, incluindo o difícil?
- **Qualidade do registo** (A2, A3): o trabalho está completo e fiável?
- **Resultado** (M): a Manutenção está a melhorar?

## 7. Riscos e cuidados

- **Escala da Manutenção.** Só 5 perguntas: uma pergunta mexe 10–20 pontos. Usar médias de vários meses e mostrar sempre o n.
- **Editor de perguntas.** Mudar as perguntas atribuídas à Manutenção muda a escala; notas gravadas não são recalculadas.
- **Conflito de interesses.** Se quem audita também é avaliado pela Manutenção, reforçar calibração e revisão por pares.
- **Verificador é texto livre.** «Ana» e «ana» contam como pessoas diferentes; normalizar antes de agregar por auditor.
- **Corte de 4.8.0.** Antes dela a finalização não exigia acção e evidência; comparar períodos mistura mudança de regra com mudança no terreno.
- **Tipo em falta.** Serviços sem tipo não entram em internos nem externos.
- **Pesos interno/externo.** Decisão da equipa; começar com 1 e 3 e ajustar com tempos medidos.
- **Poucos dados por pessoa.** Percentagens com poucas auditorias enganam; definir n mínimo.

## 8. Por validar (não verificado)

- Número de auditores e auditorias por auditor, para saber se os KPIs por pessoa têm amostra.
- Objectivos actuais, e proporção interna/externa do plano.
- Pesos de esforço a usar.
- Quais as 5 perguntas de Manutenção em uso e se foram alteradas.
- Se se pretende implementar na tab Análise (cartão «Manutenção» e vista por auditor) e em que ordem.

## 9. Sugestão de ordem de arranque

1. M1, M3, M4 (já existem filtráveis por responsável; menor custo).
2. E1 e E2 (dois objectivos e pesos; exige dois campos na Configuração).
3. A2 e A3 (finalização e completude).
4. Restantes imediatos; depois o futuro conforme dados disponíveis.
