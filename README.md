# Auditoria 5S · Supermercados Kaizen

**Versão 1.3.0** · [Semantic Versioning](https://semver.org/lang/pt-BR/) (MAJOR.MINOR.PATCH)

Aplicação web (PWA) de auditoria 5S para supermercados. Funciona 100% offline, num único ficheiro `index.html`, sem servidor e sem base de dados — todos os dados ficam guardados localmente no dispositivo (`localStorage`).

Repositório: <https://github.com/qzte/5S>

## Funcionalidades

- **Nova auditoria** — 19 perguntas por omissão, organizadas pelos 5 pilares, com nota automática em tempo real.
- **Histórico** — lista de auditorias guardadas por serviço e data.
- **Análise** — evolução da nota, comparação entre serviços e pontos críticos.
- **Relatório** — vista para impressão / exportação em PDF através do browser.
- **Importação de Excel** — `.xlsx`, `.xls` e `.csv` com serviços e repositores (SheetJS embutido, sem CDN).
- **Cópia de segurança** — exportação e importação do histórico em JSON, com modos *Fundir* e *Substituir*.
- **Editor de perguntas** — protegido por PIN de administrador; permite criar, editar, remover, exportar e repor perguntas.
- **PWA** — instalável no telemóvel e utilizável sem ligação à internet.

## Publicar no GitHub Pages

1. Envie os ficheiros para o repositório:

   ```bash
   git clone https://github.com/qzte/5S.git
   cd 5S
   # copiar aqui os ficheiros gerados
   git add .
   git commit -m "feat: PWA completa e publicação no GitHub Pages (v1.3.0)"
   git push origin main
   ```

2. Em **Settings → Pages**, defina a origem como **GitHub Actions** (o workflow `.github/workflows/deploy.yml` já está incluído).

3. A aplicação fica disponível em `https://qzte.github.io/5S/`.

Todos os caminhos são relativos (`./`), pelo que o site funciona corretamente num subdiretório.

## Estrutura

```
.
├── index.html                  # Aplicação completa (HTML + CSS + JS + SheetJS)
├── manifest.json               # Manifesto PWA
├── sw.js                       # Service worker (cache offline versionada)
├── icons/                      # Ícones 192, 512 e 512 maskable
├── .github/workflows/deploy.yml
├── CHANGELOG.md
├── LICENSE
├── .gitignore
└── README.md
```

## Utilização local

Abrir `index.html` diretamente no browser já funciona. Para testar a PWA (service worker exige HTTP):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Versionamento

O projeto segue Semantic Versioning:

- **MAJOR** — alterações incompatíveis (por exemplo, formato do histórico que quebre importações antigas).
- **MINOR** — novas funcionalidades compatíveis com as versões anteriores.
- **PATCH** — correções de erros sem alteração de comportamento.

A versão está declarada em quatro sítios, que devem ser atualizados em conjunto: comentário no topo de `index.html`, constante `APP_VERSION` no `index.html`, campos `version`/`description` do `manifest.json` e constante `APP_VERSION` do `sw.js`. Alterar a versão no `sw.js` é obrigatório, porque é o que invalida a cache dos utilizadores.

## Dados e privacidade

Nada é enviado para servidores. Os dados residem apenas no browser do dispositivo; limpar os dados do site apaga o histórico. Utilize a exportação JSON como cópia de segurança.

## Licença

MIT — ver [LICENSE](LICENSE).
