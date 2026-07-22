# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/).
Este projeto segue [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [1.3.0] — 2026-07-22

### Adicionado
- `manifest.json` — manifesto PWA com nome, cores, ecrã de arranque e ícones; a aplicação passa a ser instalável no telemóvel.
- `sw.js` — service worker com cache versionada; funcionamento offline completo.
- Ícones da aplicação em 192×192, 512×512 e 512×512 *maskable*.
- Ficheiros de repositório: `README.md`, `CHANGELOG.md`, `LICENSE`, `.gitignore`.
- Workflow `.github/workflows/deploy.yml` para publicação automática no GitHub Pages.

### Alterado
- Caminhos do manifesto e do service worker passaram a ser relativos (`./`), para o site funcionar num subdiretório do GitHub Pages.
- Comentário de cabeçalho do `index.html` passa a indicar o repositório.

## [1.2.0]

### Adicionado
- Exportação e importação do histórico de análise em JSON: cópia de segurança completa (auditorias, serviços, pessoas e perguntas), com modos *Fundir* e *Substituir*, validação do ficheiro e deduplicação por `id` e por `serviço+data`.

## [1.1.1]

### Corrigido
- SheetJS passou a estar embutido no ficheiro: importação de Excel 100% offline, sem dependência de CDN.

## [1.1.0]

### Adicionado
- Importação de ficheiro Excel (`.xlsx`, `.xls`, `.csv`) com serviços e repositores/picking.
- Listas de sugestão (`datalist`) nos campos Repositor e Verificador.
- Versão visível na aplicação.

## [1.0.0]

### Adicionado
- Versão inicial: auditoria, histórico, análise, relatório/PDF e editor de perguntas protegido por PIN.

[1.3.0]: https://github.com/qzte/5S/releases/tag/v1.3.0
[1.2.0]: https://github.com/qzte/5S/releases/tag/v1.2.0
[1.1.1]: https://github.com/qzte/5S/releases/tag/v1.1.1
[1.1.0]: https://github.com/qzte/5S/releases/tag/v1.1.0
[1.0.0]: https://github.com/qzte/5S/releases/tag/v1.0.0
