<!--
  Auditoria 5S · Supermercados Kaizen — KPIs e métricas
  Referente à versão 4.5.1 do código.
  Nota: este ficheiro é documentação. Não altera comportamento, formato de dados
        nem API, pelo que acompanha a versão do código em vez de a incrementar.
-->

# KPIs e métricas da aplicação

Tudo o que a aplicação **mede, calcula e mostra**: o que é, a fórmula, onde
aparece, como se lê — e, no fim, uma [avaliação](#avaliação) do que cada
indicador vale e das suas limitações. As referências são às funções de
`index.html`; os valores dos exemplos foram calculados com o código real
(`tests/harness.js`).

## Índice

- [Mapa geral](#mapa-geral)
- [1. Métricas de uma auditoria](#1-métricas-de-uma-auditoria)
- [2. Comparação entre auditorias](#2-comparação-entre-auditorias)
- [3. Análise (filtrável)](#3-análise-filtrável)
- [4. Indicadores do ano](#4-indicadores-do-ano)
- [5. Relatório mensal](#5-relatório-mensal)
- [6. Plano de acção](#6-plano-de-acção)
- [7. Painel e-ink](#7-painel-e-ink)
- [8. Exportação para Excel](#8-exportação-para-excel)
- [9. Indicadores operacionais](#9-indicadores-operacionais)
- [Regras comuns a todos os cálculos](#regras-comuns-a-todos-os-cálculos)
- [Avaliação](#avaliação)

## Mapa geral

| Nível | Métricas | Função | Onde se vê |
| --- | --- | --- | --- |
| Pergunta | Classificação (Mau / Oportunidade / Excelente) | `classify()` | Formulário, relatório |
| Auditoria | Nota 0–100, faixa, contagens por classe, nota por pilar e por responsável | `pctOf()`, `total()`, `badge()`, `colTotals()`, `byPillar()`, `byResp()` | Formulário, relatório, histórico, mensagem de envio |
| Entre auditorias | Variação face à anterior, seguimento pergunta a pergunta | `anteriorDe()`, `seguimento()` | Histórico, relatório |
| Período (filtro) | Evolução, média por serviço, por pilar, por responsável | `seriesEvolucao()`, `renderStats()` | Análise |
| Ano | Média total, serviços abaixo da média, objectivo, ritmo, cobertura interno/externo | `kpisAnuais()` | Análise → *Indicadores do ano* |
| Mês | Média e variação, faixas, por serviço, pilares, responsáveis, piores perguntas, acções | `resumoMensal()` | Análise → *Relatório mensal* |
| Acções | Em aberto, em atraso, feitas em 30 dias | `estadoAcao()`, `resumoAcoes()`, `contaAcoes()` | Separador Acções, histórico, formulário |
| Painel | Últimos 30 dias, 12 meses, faixas por serviço, anual | `dadosPainel5s()`, `kpisPainel5s()`, `anualPainel5s()` | `5s.painel.json` |
| Operação | Cópias de segurança pendentes, espaço ocupado | `avisoBackup()`, `avisoFotos()`, `ocupacaoLocal()` | Avisos, Configuração |

## 1. Métricas de uma auditoria

### 1.1 Classificação de cada pergunta

Cada resposta numérica é convertida numa de três classes por `classify()`, com
os limiares `t1`/`t2`/`t3` da pergunta:

| Tipo | Sentido | Regra |
| --- | --- | --- |
| `count` (contagem) | menos é melhor | `n ≥ t1` → Mau · `n ≥ t2` → Oportunidade · senão Excelente |
| `amostra` | menos é melhor | igual, mas sobre a **percentagem** `não conformes ÷ auditados × 100` |
| `scale`, `elem` | mais é melhor | `n ≥ t3` → Excelente · `n ≥ t2` → Oportunidade · senão Mau |

Nas perguntas de origem, quase todas as contagens têm `t2 = 1`: **zero
ocorrências é Excelente, uma já é Oportunidade**. A pergunta 8 (rutura mal
identificada) tem `t1 = t2 = 1` e por isso não tem classe intermédia: zero é
Excelente, uma ou mais é Mau.

### 1.2 Nota da auditoria (0–100)

O indicador central; todos os outros derivam dele.

```
pontos: Mau = 0 · Com oportunidade = 2 · Excelente = 5,25
nota   = arredondar( soma dos pontos ÷ (nº de itens × 5,25) × 100 )
```

Os pesos reproduzem a folha de cálculo original (19 × 5,25 = 99,75 ≈ 100). O
denominador é o exacto, pelo que a escala se mantém se o editor mudar o número
de perguntas. Só se grava uma auditoria com todos os itens avaliados; a *nota
em directo* do formulário calcula-se sobre os itens já respondidos.

**Como se lê.** A escala não é linear: uma Oportunidade vale 38 % de um
Excelente (2 ÷ 5,25). Com os 19 itens, a partir de tudo Excelente:

| Itens que descem | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| para Oportunidade | 97 | 93 | 90 | 87 | 84 | 80 | 77 | 74 |
| para Mau | 95 | 89 | 84 | 79 | 74 | 68 | 63 | 58 |

Cada Oportunidade custa ≈ 3,3 pontos e cada Mau ≈ 5,3. Uma auditoria com
**tudo em Oportunidade dá 38** (faixa Crítico).

### 1.3 Faixa da nota

| Nota | Faixa | Cor |
| --- | --- | --- |
| ≥ 80 | Excelente | verde |
| 50 – 79 | Com oportunidade | âmbar |
| < 50 | Crítico | vermelho |

Os mesmos cortes em `badge()`, `barCls()` e `faixaNota()` — em etiquetas,
barras, filtro do Histórico, relatório mensal e painel. Com 19 itens, ficar em
Excelente admite até 6 Oportunidades ou 3 Maus.

### 1.4 Contagens por classe

`colTotals()`: quantos itens ficaram Mau, Oportunidade e Excelente, os pontos
de cada coluna, o total de pontos e o máximo. É o rodapé `F23:H23` da folha
original; aparece no relatório e na mensagem de envio («Mau: 2 · Com
oportunidade: 4 · Excelente: 13»).

### 1.5 Nota por pilar 5S

`byPillar()`: a mesma fórmula da nota, só com os itens de cada pilar
(denominador próprio). Nas perguntas de origem: Triagem 4 itens, Arrumação 4,
Limpeza 4, Normalização 3, Disciplina 4. É o radar *Por pilar* do relatório, e
o «pilar mais fraco» da mensagem de envio (o de menor nota, se < 100).

### 1.6 Nota por responsável

`byResp()`: idem, pelos itens atribuídos a cada responsável. De origem:
Utilizadores 8 itens, Manutenção 5, Utilizador e Repositor 3, Reposição 2,
Picking 1. Um responsável sem perguntas fica fora do radar (zero perguntas não
é zero por cento).

### 1.7 Itens a melhorar e evidências

Lista dos itens que não ficaram Excelente (`s < 2`), com o valor observado — a
base das recomendações e do botão *+ Acção*. Os itens em Mau ou Oportunidade
podem levar nota e foto de evidência.

## 2. Comparação entre auditorias

| Métrica | Cálculo | Onde |
| --- | --- | --- |
| **Variação (▲ / ▼ / =)** | nota − nota da auditoria imediatamente anterior **ao mesmo serviço**, em pontos. Procura no histórico inteiro, não só no que o filtro mostra | Histórico, mensagem de envio |
| **Seguimento** | Para cada pergunta que numa das duas auditorias não estava Excelente: *melhorou*, *piorou* ou *igual*, e os três totais. As perguntas emparelham-se por número + tipo + enunciado, não pela posição | Relatório (ecrã) |
| **Último resultado da pergunta** | A classe que a última auditoria ao serviço deu a cada pergunta, se não foi Excelente | Formulário |

A ordem cronológica é a data e, no mesmo dia, o `id` (instante de gravação).

## 3. Análise (filtrável)

Calculada sobre as auditorias que passam o filtro de **serviço** e **período**
(todo o histórico ou os últimos *n* meses). O texto «Com base em X de Y
auditoria(s)» diz o tamanho da amostra.

| Métrica | Cálculo |
| --- | --- |
| **Evolução da nota** | Uma linha por serviço, um ponto por auditoria (data × nota). Acima de 120 pontos, só linhas |
| **Comparação entre serviços** | Média das notas de cada serviço no período |
| **Por pilar 5S** (radar e barras) | Média, por pilar, das notas de pilar de cada auditoria |
| **Por responsável** (radar e barras) | Média, por responsável, das notas de responsável de cada auditoria; só os que têm perguntas |

## 4. Indicadores do ano

`kpisAnuais()`. De **todos os serviços**, no ano escolhido; não seguem os
filtros da Análise. No ano em curso contam de 1 de Janeiro até hoje.

| Indicador | Fórmula | Como se lê |
| --- | --- | --- |
| **Média total** | média das notas de todas as auditorias do ano | Nível 5S global. É por auditoria: um serviço auditado 3 vezes pesa 3 vezes |
| **Serviços não auditados** (4.5.0) | `serviços da lista sem auditoria no ano ÷ serviços da lista × 100`, e o número. Um serviço conta como auditado se uma auditoria do ano é a ele pelo nome exacto, pelo nome sem maiúsculas, acentos nem espaços a mais, ou pelo código «(…)» no fim do nome (4.5.1) | Complementar da cobertura. Inclui os sem tipo |
| **Dispersão** (4.5.0) | nota mais baixa e mais alta das auditorias do ano, com serviço e data | Mostra a amplitude que a média esconde |
| **Média por serviço** (4.4.0) | média das médias de cada serviço no ano | Cada serviço pesa o mesmo; aparece ao lado da média total |
| **Serviços por faixa** (4.4.0) | serviços com média no ano ≥ 80 (Excelente), 50–79 (Com oportunidade) e < 50 (Crítico) | Critério absoluto, a par do «abaixo da média» |
| **Há mais tempo sem auditoria** (4.4.0) | dias entre a última auditoria de cada serviço e hoje (`ultimaAuditoriaPorServico()`); os 5 piores, nunca auditados primeiro | Até hoje, sem o filtro do ano. Inclui os serviços da lista sem nenhuma auditoria |
| **Perguntas reincidentes** (4.4.0) | perguntas não Excelente em ≥ 2 auditorias seguidas ao mesmo serviço, até à última (`reincidencias()`); mostra as auditorias seguidas | Problemas que as acções não resolveram. Uma pergunta que falte numa auditoria, ou um Excelente, interrompe a sequência |
| **Serviços abaixo da média** | serviços com média no ano < média total; `diferença = média do serviço − média total`; do pior para o melhor, com as acções em aberto | Candidatos ao plano de acção. É relativo: há quase sempre alguém abaixo |
| **Objectivo anual** | `feitas ÷ objectivo × 100` e `faltam = objectivo − feitas` | Progresso do plano de auditorias |
| **Média semanal** | `feitas ÷ (dias decorridos ÷ 7)`, 1 casa decimal; ao lado `objectivo ÷ (dias do ano ÷ 7)` | Ritmo real contra o ritmo que o objectivo pede |
| **Face ao plano** | `desvio = feitas − esperadas`, com `esperadas = arredondar(objectivo × dias decorridos ÷ dias do ano)` | ≥ 0 *Em linha* · < 0 *Atrás do plano* · feitas ≥ objectivo *Objectivo cumprido* |
| **Projecção** | `feitas × dias do ano ÷ dias decorridos` | Onde se chega no fim do ano ao ritmo actual |
| **Ritmo necessário** | `faltam ÷ (dias que restam ÷ 7)` | Auditorias por semana para ainda cumprir |
| **Internos / externos auditados** | serviços da lista de cada tipo com ≥ 1 auditoria no ano ÷ todos os desse tipo, com os que faltam | Cobertura. Os sem tipo ficam de fora (a app diz quantos) ; desde 4.5.0 mostra também a % sem auditoria (`pctPorAuditar`) |

Exemplo, a 13 de Novembro de 2026 (dia 317 de 365), objectivo 120, 4
auditorias: esperadas 104, desvio −100 (*Atrás do plano*), 3 % do objectivo,
média semanal 0,1 contra 2,3 do plano, projecção 5, ritmo necessário 16,9 por
semana.

## 5. Relatório mensal

`resumoMensal()`. Um mês de todos os serviços; no mês em curso conta até hoje.

| Bloco | Métricas |
| --- | --- |
| **Cabeçalho** | Média do mês e faixa · nº de auditorias · serviços auditados · média e nº do mês anterior · diferença em pontos · auditorias por faixa (Excelente / Oportunidade / Crítico) |
| **Por serviço** | Nº de auditorias, média, última nota e variação da média face ao mês anterior. Do pior para o melhor; os da lista sem auditoria no fim |
| **Por pilar** | Média do mês por pilar e variação face ao mês anterior |
| **Por responsável** | Média do mês por responsável |
| **Perguntas que mais falharam** | As 5 com maior `falhas ÷ vezes` (falha = não Excelente); desempate por nº de Mau. Mostra vezes, falhas, Maus e serviços |
| **Plano de acção** | *Novas* (acções das auditorias do mês) · *Concluídas* (com `feitaEm` no mês) · *Em aberto* e *Em atraso* no fim do mês (ou hoje) |

Aqui, a média de um pilar ou responsável usa **só as auditorias que têm
perguntas nesse eixo** (`n > 0`).

## 6. Plano de acção

Estado de cada acção (`estadoAcao()`): **feita**; **atrasada** se aberta com
`prazo < hoje`; senão **aberta**. Uma acção sem prazo nunca fica em atraso.

| Métrica | Cálculo | Onde |
| --- | --- | --- |
| **Em aberto** | acções não feitas (atrasadas incluídas) | Resumo do separador Acções, painel |
| **Em atraso** | abertas com prazo passado | Resumo, número a vermelho no separador, painel |
| **Feitas em 30 dias** | `feitaEm` entre hoje − 29 e hoje | Resumo, painel |
| **Por auditoria** | abertas e atrasadas dessa auditoria (`contaAcoes()`) | Histórico |
| **Por serviço** | abertas de todas as auditorias ao serviço | *Abaixo da média*, formulário |
| **Em atraso no serviço** | as da auditoria + as que vinham de auditorias anteriores | Mensagem de envio |
| **Tempo médio de fecho** (4.4.0) | média dos dias entre a **criação da acção** (`criadaEm`; nas anteriores a 4.5.0, a data da auditoria) e `feitaEm`, nas acções feitas (`desempenhoAcoes()`) | Separador Acções |
| **Idade em aberto** (4.5.0) | média dos dias desde a criação, das acções em aberto; atraso médio das atrasadas; a mais antiga (`idadeAcoesAbertas()`) | Separador Acções |
| **Eficácia** (4.5.0) | das acções feitas, ligadas a uma pergunta, que não estava Excelente, e concluídas até à auditoria seguinte ao serviço: % em que a pergunta ficou Excelente nessa auditoria; mostra também as que melhoraram sem chegar lá (`eficaciaAcoes()`) | Separador Acções. A pergunta emparelha-se pela assinatura (número, tipo, enunciado) |
| **Dentro do prazo** (4.4.0) | acções feitas com prazo e `feitaEm ≤ prazo` ÷ acções feitas com prazo | Separador Acções |

## 7. Painel e-ink

`5s.painel.json`, recalculado a cada gravação e de hora a hora.

| Campo | Significado |
| --- | --- |
| `total`, `media`, `ultima` | Nº de auditorias, média e data da última — **de todo o histórico** |
| `pilares` | Média por pilar, de todo o histórico |
| `servicos` | Por serviço: última nota, data, nota anterior, nº de auditorias |
| `kpis.media30` / `n30` | Média e nº dos últimos 30 dias (hoje incluído) |
| `kpis.media30Ant` / `n30Ant` | O mesmo nos 30 dias anteriores — dá a tendência |
| `kpis.porMes` | 12 meses até ao corrente: média (`null` sem auditorias) e nº |
| `kpis.acoes` | `abertas`, `atrasadas`, `feitas30` |
| `kpis.responsaveis` | Média por responsável, de todo o histórico |
| `kpis.faixas` | Serviços por faixa, pela nota da **última** auditoria de cada um |
| `kpis.anual` | Os indicadores do ano corrente (secção 4), mais `pior`, `nAbaixo`, `porAuditar`, `nServicos`; `abaixo` com os 10 piores; desde 4.5.0, `naoAuditados` (`n`, `total`, `pct`) e `pctPorAuditar` em `internos` e `externos` |
| `kpis.acoesMaisAntiga` | (4.5.0) Serviço e dias da acção em aberto há mais tempo, ou `null` |

## 8. Exportação para Excel

Não calcula indicadores novos; entrega os dados para análise própria
(`linhasExcel()`):

- **Auditorias** — uma linha por auditoria: nota, classificação e uma coluna
  por pilar e por responsável.
- **Respostas** — uma linha por resposta: valor, auditados, classificação,
  pilar, responsável (formato de tabela dinâmica).
- **Acções** — uma linha por acção: responsável, prazo, estado, conclusão.

## 9. Indicadores operacionais

Sobre a saúde dos dados, não sobre o 5S.

| Indicador | Cálculo | Limite |
| --- | --- | --- |
| **Auditorias por copiar** | gravações e alterações desde a última cópia (`pend`) | Avisa com ≥ 5 pendentes ou cópia com ≥ 7 dias (havendo pendentes), ou se nunca houve cópia |
| **Fotos por copiar** | fotos novas ou trocadas desde a última cópia com fotos (`pendFotos`) | Idem |
| **Enviada / por enviar** | se a auditoria já foi partilhada | Histórico |
| **Espaço ocupado** | caracteres no `localStorage` face a 5 MB; total e quota da origem (`navigator.storage.estimate()`) | Configuração |

## Regras comuns a todos os cálculos

- **Arredondamento.** A nota é um inteiro. `avg()` devolve a média
  **arredondada às unidades**, e é calculada sobre notas já arredondadas. Só
  as médias semanais têm uma casa decimal.
- **Notas gravadas não são recalculadas.** Cada auditoria guarda as suas
  classificações e as suas perguntas; mudar limiares não reescreve o passado.
- **Datas** em `AAAA-MM-DD`, hora local; «hoje» limita o ano e o mês em curso.
- **Média = média de auditorias**, nunca de serviços, em todas as vistas.

## Avaliação

### O que está sólido

- **Uma só fonte de verdade.** A nota, os pilares e os responsáveis saem todos
  de `pctOf()`; as faixas usam os mesmos cortes em todo o lado. Não há dois
  números diferentes para a mesma coisa numa mesma vista.
- **Cobertura do ciclo PDCA.** Há indicadores de resultado (nota), de causa
  (pilar, responsável, perguntas que mais falham), de execução (objectivo,
  ritmo, cobertura) e de seguimento (acções, seguimento entre auditorias).
- **Normalização por eixo.** Um pilar com 3 itens não é penalizado face a um
  com 4.
- **Funções puras e testadas** (`indicadores`, `mensal`, `acoes`, `painel`,
  `historico`), e estabilidade histórica das notas.

### Limitações e riscos de leitura

Por ordem de impacto.

1. **Resolvida em 4.4.0 — eixos sem perguntas.** A Análise e o painel
   contavam como 0 % as auditorias sem perguntas de um responsável ou pilar
   (`mediaDoEixo()` passou a excluí-las, como o relatório mensal). As duas
   vistas já não divergem.
2. **Média total enviesada pela frequência (atenuada em 4.4.0).** Sendo por
   auditoria, um serviço bom auditado muitas vezes esconde um mau auditado uma
   vez (três auditorias a 100 e uma a 38 dão 85; a média dos dois serviços
   seria 69). A *média por serviço* aparece agora ao lado da média total.
3. **Responsáveis com poucos itens têm notas aos saltos.** *Picking* (1 item)
   só pode ter 0, 38 ou 100; *Reposição* (2 itens) tem seis valores
   possíveis. No radar, um único item decide o eixo — não comparar
   directamente com *Utilizadores* (8 itens).
4. **Escala exigente e não linear.** «Com oportunidade» em todos os itens dá
   38, na faixa *Crítico*; e nas contagens uma única ocorrência já tira o
   Excelente. É herança da folha original e é coerente, mas quem lê «38»
   tende a pensar em «muito mau» quando pode ser «tudo quase bem». Vale a
   pena explicar isto a quem recebe os relatórios.
5. **«Abaixo da média» é relativo (atenuada em 4.4.0).** Um serviço com 88
   aparece na lista se a média for 90; e com todos em 40 ninguém aparece. Os
   *serviços por faixa* dão agora o critério absoluto a par.
6. **Plano linear.** *Esperadas*, *projecção* e *ritmo necessário* assumem o
   mesmo número de auditorias em todas as semanas (sem férias nem paragens).
   Em Janeiro a projecção é muito instável (poucos dias no denominador), e em
   Agosto o estado tende a *Atrás do plano* sem que haja problema real.
7. **Arredondamentos em cadeia.** Médias de notas já arredondadas, de novo
   arredondadas, e diferenças entre elas: um erro de até ±1 ponto. Um serviço
   a 79,6 com a média a 80,4 fica «80 contra 80» e não entra em *abaixo da
   média*. Diferenças de 1 ponto não são sinal.
8. **Painel mistura horizontes.** `media`, `pilares` e `responsaveis` são de
   todo o histórico; `media30` de 30 dias; `anual` do ano; `faixas` usa a
   última auditoria de cada serviço, por muito antiga que seja (e de serviços
   já removidos da lista). Cada número está certo, mas não são comparáveis
   entre si.
9. **Resolvida em 4.5.0 — acções «novas» do mês.** Contam pela data de criação
   (`criadaEm`). Só as acções criadas desde a 4.5.0 a têm; nas anteriores,
   continua a valer a data da auditoria, pelo que o tempo de fecho e as
   «novas» dessas são uma aproximação.
10. **Cobertura só conta serviços da lista com tipo.** Auditorias a serviços
    removidos entram na média mas não na cobertura; os sem tipo não entram em
    interno nem externo.

### O que não se mede

- **Eficácia por serviço ou por responsável**: hoje é um só número global.
- **Acções sem ligação a uma pergunta** não entram na eficácia, e só se avalia
  a auditoria seguinte (não se segue a pergunta mais adiante).
- **Dispersão por serviço** e desvio-padrão das notas.
- **Reincidência após acção feita**: perguntas que voltam a falhar depois de
  uma acção concluída.
