# Changelog

Todas as alterações relevantes deste projeto são registadas neste ficheiro.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [3.0.0] — 2026-07-24

Três limiares nomeados por classificação, editáveis por pergunta.

### Alterado (DISRUPTIVO)

- **Os cortes anónimos `t1`/`t2` de 2.0.0 dão lugar a três limiares nomeados**,
  cada um a marcar o valor a partir do qual a respectiva classificação se aplica:
  - `t1` — a partir daqui a resposta é **Mau**
  - `t2` — a partir daqui a resposta é **Com oportunidade**
  - `t3` — a partir daqui a resposta é **Excelente**
- **"A partir de" segue o sentido da escala.** Nas contagens, em que menos é
  melhor, as classes estendem-se para baixo e a ordem natural é `T3 ≤ T2 ≤ T1`.
  Nos tipos em que mais é melhor (`elem`, `scale`), estendem-se para cima e a
  ordem é `T1 ≤ T2 ≤ T3`. O mesmo trio de números lê-se ao contrário conforme o
  tipo, e é por isso que mudar o tipo de resposta no editor recalcula os
  limiares em vez de os manter.
- **Ficheiros JSON de perguntas exportados por 2.0.0 continuam a importar**, mas
  os exportados por 3.0.0 não são legíveis por 2.0.0, que procura dois cortes
  com outra semântica. Daí o incremento de MAJOR.

### Adicionado

- **Editor**: os três limiares aparecem lado a lado, rotulados com a
  classificação a que pertencem, além dos campos já existentes para o texto da
  pergunta e o tipo de resposta.
- **`fixedKey()`**: identifica qual dos três limiares não tem grau de liberdade.
- **`TKEYS`**: ordem canónica dos limiares, partilhada pelo editor e pela
  validação, para que não haja divergência entre o que se mostra e o que se
  valida.

### O terceiro limiar

Três classes contíguas têm apenas **duas** fronteiras. O terceiro limiar não tem
grau de liberdade: é sempre `0`, o extremo inferior da escala. Qual dos três o é
depende do sentido — `T3` (Excelente) nas contagens, `T1` (Mau) nos restantes.

Mantém-se no modelo e visível no editor por ser o vocabulário pedido, mas é
apresentado **bloqueado e assinalado como fixo**, com o motivo no próprio campo.
Deixá-lo editável daria a ilusão de um controlo sem efeito sobre a pontuação.

### Migração

Automática e sem acção do utilizador. `normItem()` distingue os três formatos
pela presença dos campos: `t3` indica 3.0.0; `t1`+`t2` sem `t3` indica 2.0.0,
cuja semântica de cortes é reetiquetada; `mau` indica 1.x.

As classificações são preservadas valor a valor em todos os caminhos, o que é
verificado por teste sobre a totalidade das combinações pergunta × resposta do
modelo base. As notas das auditorias já gravadas não mudam: `scores` é guardado
com a auditoria e nunca recalculado.

### Notas

Sem alterações ao modelo de ponderação (0 / 2 / 5,25 pontos), ao formato das
auditorias em `localStorage` nem à exportação de auditorias.

## [2.0.0] — 2026-07-24

Limiares de classificação livres por pergunta, definidos no editor.

### Alterado (DISRUPTIVO)

- **O campo `mau` foi removido do modelo de perguntas** e substituído por dois
  cortes explícitos, `t1` e `t2`, com `0 ≤ t1 < t2 ≤ max`. O antigo `mau` era um
  limiar único e existia apenas nas perguntas de contagem; os restantes tipos
  tinham a regra soldada no código (`elem`: só `max` era Excelente; `scale`: a
  resposta era a própria pontuação). Passa a ser possível definir os dois cortes
  em qualquer um dos três tipos.
- **`classify()` deixou de ter ramos por tipo.** A classificação resulta agora do
  sentido da escala (`DIR`) e dos dois cortes:
  - `count` (menos é melhor): `n ≥ t2` → Mau · `t1 ≤ n < t2` → Com oportunidade ·
    `n < t1` → Excelente
  - `elem` e `scale` (mais é melhor): `n ≥ t2` → Excelente ·
    `t1 ≤ n < t2` → Com oportunidade · `n < t1` → Mau
- **`scale` deixou de estar presa a `max = 2`.** Sem limiares explícitos continua
  a ser a escala clássica 0/1/2; com limiares, aceita qualquer amplitude
  (por exemplo 0–5 com cortes em 2 e 4).
- **A tooltip de parâmetros passa a ser gerada em todas as perguntas**, incluindo
  as de contagem. Em 1.8.0 era omitida nas contagens porque a regra se deduzia do
  enunciado; com cortes livres isso deixou de ser verdade.

### Adicionado

- **Editor de perguntas**: dois campos de limiar por pergunta, com o rótulo a
  indicar que fronteira cada um representa no sentido da escala em causa. O
  intervalo de cada classificação é mostrado por baixo e actualiza-se em directo.
- **`edValidate()`**: validação da lista antes de guardar. Rejeita lista vazia,
  perguntas sem texto, valor máximo inválido, limiares negativos, limiares acima
  do valor máximo e cortes cruzados (`t1 > t2`). Os erros aparecem por pergunta
  durante a edição e bloqueiam o botão Guardar.
- **Cortes iguais (`t1 = t2`) são aceites**: descrevem uma pergunta binária, com
  apenas as duas classes extremas. O editor assinala-o com uma nota, sem impedir
  a gravação. A pergunta 8 do modelo base ("artigos em rutura mal identificados")
  sempre funcionou assim — tinha `mau: 1`, pelo que 0 era Excelente e qualquer
  valor acima era Mau. A validação apenas tornou visível uma característica que
  já existia; nenhuma classificação mudou.
- **`normItem()`**: porta de entrada única para perguntas, aplicada em
  `loadItems()`, `edImport()` e `sanitizeAudit()`. Satura os cortes no intervalo
  válido, corrige cortes cruzados e migra o formato antigo. É idempotente.
- **`ruleOf()`**: descrição textual dos intervalos das três classes, partilhada
  entre a tooltip da auditoria e o editor, para manter uma só fonte de verdade
  sobre a pontuação.
- **Mudar o tipo de resposta no editor recalcula os cortes.** Trocar entre um
  tipo em que menos é melhor e outro em que mais é melhor inverte o sentido da
  escala; manter os cortes anteriores produziria uma regra invertida e
  silenciosamente errada.

### Migração

A conversão é automática e não requer acção do utilizador:

- As perguntas guardadas em `localStorage` (`itemsCfg`) e as embebidas em
  auditorias antigas são migradas ao serem carregadas. `localStorage` só é
  reescrito no formato novo quando se guarda no editor.
- Os cortes gerados na migração reproduzem **exactamente** a classificação
  anterior, resposta a resposta: `count` fica com `t1 = 1` e `t2 = mau`; `elem`
  com `t1 = 1` e `t2 = max`; `scale` com `t1 = 1` e `t2 = 2`.
- **As notas das auditorias já gravadas não mudam.** O campo `scores` é guardado
  com a auditoria e nunca é recalculado; a migração toca apenas na definição das
  perguntas.
- Ficheiros JSON de perguntas exportados por versões 1.x continuam a importar:
  `edImport()` passa cada pergunta por `normItem()`.
- Ficheiros JSON exportados por 2.0.0 **não são legíveis por versões 1.x**, que
  procuram o campo `mau` e o encontram ausente. Daí o incremento de MAJOR.

### Notas

Sem alterações ao modelo de ponderação (0 / 2 / 5,25 pontos), ao formato das
auditorias em `localStorage` nem à exportação de auditorias.

## [1.8.0] — 2026-07-24

Tooltip com os parâmetros nas perguntas de resposta não-contagem.

### Adicionado

- **Tooltip de parâmetros na auditoria**: as perguntas cujo tipo de resposta é
  diferente de `count` (contagem) — actualmente `scale` e `elem` — passam a
  mostrar um ícone **i** a seguir ao enunciado. Ao ser accionado, abre um painel
  com o **tipo de resposta** (Escala / Elementos), o **intervalo aceite**
  (`0` a `max`) e o **mapeamento resposta → classificação** (Mau, Com
  oportunidade, Excelente).
- Nas perguntas de contagem o ícone não é gerado: a regra já está explícita no
  enunciado (`Nº de ...`) e o limiar é específico de cada item.
- Construída com `<details>`/`<summary>` nativos, pelo que funciona por toque em
  telemóvel, é navegável por teclado e não depende de listeners de JavaScript.
- O texto da regra é derivado do mesmo contrato de `classify()`, evitando duas
  fontes de verdade sobre a pontuação.
- A tooltip é ocultada na impressão (`@media print`), para não interferir com o
  relatório em PDF.

### Corrigido

- O `CHANGELOG.md` continha **duas entradas `[1.7.0]` distintas e divergentes**
  (uma delas indicava 701 px de altura da folha 1, contra os 856 px medidos e
  registados no cabeçalho do `index.html`). Foi removida a entrada incorrecta e
  mantida a versão detalhada e coerente com o código.

### Notas

Sem alterações ao modelo de pontuação, ao formato guardado em `localStorage` nem
à exportação/importação JSON. Alteração exclusivamente de interface: auditorias
anteriores abrem sem qualquer diferença de nota.

## [1.7.0] — 2026-07-23

Recomendações por responsável no relatório e histórico do serviço na folha 1.

### Adicionado

- **Recomendações por responsável** (nova folha 3 do relatório): um bloco por
  cada uma das quatro responsabilidades já existentes na aplicação —
  Utilizadores, Manutenção, Reposição e Utilizador e Repositor — com foto e
  texto, dispostos dois por linha.
  - O **texto** é guardado com a auditoria (campo opcional `recs`), viaja na
    exportação JSON e mantém-se ao reabrir o relatório.
  - A **foto** é efémera: vive apenas em memória enquanto a vista Relatório
    está aberta e nunca é escrita em `localStorage` nem exportada. As imagens
    são reduzidas a 640 px de largura e recodificadas em JPEG 0,75 através de
    um `<canvas>`, para não sobrecarregar a renderização de impressão.
  - A folha 3 só é gerada quando existe conteúdo; sem recomendações o
    relatório mantém-se com duas folhas.
- **Histórico do serviço** na folha 1, por baixo dos dois radares: gráfico de
  barras verticais com as últimas 6 auditorias ao mesmo serviço, com data
  (`dd/mm`) e percentagem por barra. Desenhado em SVG nativo — e não em
  `<canvas>` como o gráfico da vista Análise — para imprimir sempre nítido e
  não depender da largura do ecrã no momento do render. Com menos de 6
  auditorias desenha as que existirem; sem histórico o bloco não aparece.

### Corrigido

- `sanitizeAudit()` descartava o campo `recs` na importação de JSON. O texto
  das recomendações passa agora por `recsOf()`, que normaliza para as quatro
  chaves conhecidas e aplica `clean()`, descartando chaves arbitrárias vindas
  do ficheiro importado.
- `manifest.json`: a `description` anunciava a versão 1.5.0 enquanto o campo
  `version` já ia em 1.6.0. Ambos passam a 1.7.0.

### Alterado

- Radares da folha 1 reduzidos de 320 px para 290 px, para acomodar o bloco de
  histórico. A altura da folha foi medida em impressão A4: 856 px de 1047 px
  utilizáveis, pelo que continua a caber uma única folha por bloco.

### Segurança

- O texto das recomendações é escapado com `esc()` em todas as interpolações,
  tal como o restante conteúdo introduzido pelo utilizador desde a v1.4.0.
- As fotos entram como data URI produzido localmente pelo próprio `<canvas>`,
  nunca a partir de texto externo.

### Notas

- Sem alterações ao modelo de pontuação. As auditorias guardadas em versões
  anteriores abrem sem alterações e as notas mantêm-se.

## [1.6.0] — 2026-07-23

Relatório em PDF com paginação fixa: uma única folha por bloco, duas por
relatório.

### Adicionado

- Regra `@page` A4 retrato com margens de 10 mm.
- O relatório passa a estar dividido em dois contentores `.page`:
  - **Página 1** — cabeçalho da nota e os dois gráficos radar, dispostos lado a
    lado, com as barras por pilar e por responsável junto ao respectivo radar.
  - **Página 2** — tabela de pontuação, grelha completa dos 19 itens e lista de
    itens a melhorar.

### Alterado

- Radares reduzidos de 300 px para 210 px na impressão, para que a página 1
  nunca transborde.
- Tipografia da página 2 compactada (tabelas a 0,62 rem, células a 2×4 px) para
  que os 19 itens caibam numa folha.
- As quebras de página deixam de ser automáticas: cada `.page` força
  `break-after`, excepto a última, evitando uma terceira folha em branco.

### Notas

- Sem alterações ao modelo de dados nem ao motor de pontuação. As auditorias
  guardadas mantêm-se válidas e as notas não mudam.

## [1.5.0] — 2026-07-23

Paridade com a folha de cálculo original (`Auditoria_Cir_B__11B_.xlsx`).

### Adicionado

- Motor de pontuação ponderada **0 / 2 / 5,25 pontos** (Mau / Com oportunidade /
  Excelente), idêntico às fórmulas `F23:H23` da folha.
- Denominadores dinâmicos por pilar e por responsável: cada eixo normaliza pelo
  seu próprio número de itens, replicando `O4:O8` e `Y4:Y7`.
- Dois gráficos **radar em SVG nativo**, sem dependências: por pilar 5S e por
  responsável, equivalentes aos dois `RadarChart` da folha. Presentes no
  relatório individual e, em média, na vista Análise.
- Campo **Picking** no cabeçalho da auditoria, a par de Repositor e Verificador.
- Campo **Nota / observação** por auditoria.
- Relatório com **grelha completa dos 19 itens** (e não apenas as não
  conformidades) e tabela de pontos por coluna de avaliação.
- Estilos de impressão dedicados: radares reduzidos e linhas de tabela que não
  se partem entre páginas.

### Alterado

- A nota global passa a ser `soma dos pontos ÷ (nº de itens × 5,25)`. Os
  relatórios de auditorias antigas passam a mostrar percentagens ligeiramente
  diferentes, por efeito da nova ponderação; os dados guardados não são alterados.

### Notas

- Diferença conhecida face ao Excel: a folha divide por `100` fixo, mas o máximo
  real são 99,75 pontos. Os dados da Cirurgia B (11B) dão 81,5 % no Excel e 82 %
  na aplicação. Ver a secção *Modelo de pontuação* do README.
- Compatibilidade retroactiva: auditorias gravadas na v1.4.0 e anteriores
  continuam a abrir, com a nota recalculada a partir dos níveis 0/1/2 guardados.

## [1.4.0]

Correcções de segurança na sequência de uma auditoria OWASP Top 10.

### Corrigido

- **[Crítico]** XSS armazenado: escape de HTML (`esc()`) em todas as
  interpolações de dados do utilizador.
- **[Alto]** Removidos todos os handlers inline (`onclick`/`oninput`/`onchange`),
  substituídos por `addEventListener` com `data-*`.
- **[Médio]** Adicionada Content-Security-Policy.
- **[Médio]** Service worker: cache restringida a uma allowlist da própria origem.
- **[Médio/Baixo]** Removido o CDN do Google Fonts — aplicação verdadeiramente
  100 % offline.
- **[Baixo]** Mitigação da CVE-2023-30533 (SheetJS 0.18.5, prototype pollution).

### Alterado

- O código do editor deixa de ser apresentado como controlo de segurança: passa a
  proteger apenas contra alterações acidentais.

## [1.3.0]

- PWA completa e publicação no GitHub Pages: `manifest.json` e `sw.js`, registo do
  service worker com caminho relativo, cache versionada e ficheiros de repositório.

## [1.2.0]

- Exportação e importação do histórico em JSON, com modos *Fundir* e *Substituir*,
  validação do ficheiro e deduplicação por `id` / serviço+data.

## [1.1.1]

- SheetJS embutido no ficheiro: importação de Excel 100 % offline, sem CDN.

## [1.1.0]

- Importação de ficheiro Excel (`.xlsx`/`.xls`/`.csv`) com Serviços e
  Repositores/Picking; listas de sugestão nos campos Repositor e Verificador.

## [1.0.0]

- Versão inicial: auditoria, histórico, análise, relatório/PDF e editor de
  perguntas protegido por código.

[1.7.0]: https://github.com/qzte/5S/releases/tag/v1.7.0
[1.6.0]: https://github.com/qzte/5S/releases/tag/v1.6.0
[1.5.0]: https://github.com/qzte/5S/releases/tag/v1.5.0
[1.4.0]: https://github.com/qzte/5S/releases/tag/v1.4.0
[1.3.0]: https://github.com/qzte/5S/releases/tag/v1.3.0
[1.2.0]: https://github.com/qzte/5S/releases/tag/v1.2.0
[1.1.1]: https://github.com/qzte/5S/releases/tag/v1.1.1
[1.1.0]: https://github.com/qzte/5S/releases/tag/v1.1.0
[1.0.0]: https://github.com/qzte/5S/releases/tag/v1.0.0
