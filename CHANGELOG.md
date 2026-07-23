# Changelog

Todas as alterações relevantes deste projeto são registadas neste ficheiro.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.7.0] — 2026-07-23

Recomendações por responsável no relatório e histórico do serviço na folha 1.

### Adicionado

- **Recomendações por área de responsabilidade** (nova folha 3 do PDF): um bloco
  por cada uma das quatro responsabilidades já existentes — Utilizadores,
  Manutenção, Reposição, e Utilizador e Repositor — com uma nota de texto e uma
  fotografia. Dois blocos por linha.
  - O **texto é guardado** com a auditoria (campo opcional `recs`), sobrevive ao
    histórico e à exportação JSON.
  - A **fotografia é efémera**: vive apenas em memória enquanto a vista Relatório
    está aberta e é descartada ao sair. Nunca entra em `localStorage` nem na
    exportação, pelo que não consome quota de armazenamento.
  - As imagens são reduzidas a 640 px de largura e recodificadas em JPEG 0,75
    através de `<canvas>`, para não penalizar a renderização de impressão.
  - A folha 3 só é gerada quando existe pelo menos um texto ou fotografia; sem
    conteúdo, o relatório mantém-se com duas folhas.
- **Histórico do serviço na folha 1**: gráfico de barras verticais com as últimas
  6 auditorias ao mesmo serviço, por ordem cronológica, com data (`dd/mm`) e
  percentagem. Desenhado em SVG nativo — e não em `<canvas>` — para imprimir
  nítido e não depender da largura do ecrã no momento do render. O bloco não é
  desenhado quando não há auditorias anteriores ao serviço.

### Corrigido

- `sanitizeAudit()` descartava silenciosamente campos desconhecidos na importação
  de JSON. As recomendações passam a ser preservadas, normalizadas para as quatro
  chaves conhecidas e limpas com `clean()`; quaisquer outras chaves são ignoradas.
- A `description` do `manifest.json` estava desactualizada (indicava 1.5.0 na
  versão 1.6.0). Passa a acompanhar a versão.

### Alterado

- Radares da folha 1 reduzidos de 320 px para 290 px, para acomodar o bloco de
  histórico. A medição em modo de impressão confirma 701 px ocupados de 1047 px
  úteis numa A4 retrato com margens de 10 mm.

### Notas

- Sem alterações ao modelo de pontuação. As auditorias guardadas em versões
  anteriores abrem sem alteração da nota e sem o campo `recs`, que é opcional.
- Verificado em browser: o PDF gera exactamente 3 folhas, nenhuma transborda, e
  nenhuma fotografia é escrita em `localStorage`.

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
