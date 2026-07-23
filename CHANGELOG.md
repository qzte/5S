# Changelog

Todas as alterações relevantes deste projeto são registadas neste ficheiro.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

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

[1.5.0]: https://github.com/qzte/5S/releases/tag/v1.5.0
[1.4.0]: https://github.com/qzte/5S/releases/tag/v1.4.0
[1.3.0]: https://github.com/qzte/5S/releases/tag/v1.3.0
[1.2.0]: https://github.com/qzte/5S/releases/tag/v1.2.0
[1.1.1]: https://github.com/qzte/5S/releases/tag/v1.1.1
[1.1.0]: https://github.com/qzte/5S/releases/tag/v1.1.0
[1.0.0]: https://github.com/qzte/5S/releases/tag/v1.0.0
