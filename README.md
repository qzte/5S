# Auditoria 5S · Supermercados Kaizen

**Versão 1.5.0** · [Semantic Versioning](https://semver.org/lang/pt-BR/) (MAJOR.MINOR.PATCH)

Aplicação web (PWA) de auditoria 5S para supermercados. Funciona 100% offline, num único ficheiro `index.html`, sem servidor e sem base de dados — todos os dados ficam guardados localmente no dispositivo (`localStorage`).

Repositório: <https://github.com/qzte/5S>

## Funcionalidades

- **Nova auditoria** — 19 perguntas por omissão, organizadas pelos 5 pilares, com nota automática em tempo real e campos Picking, Repositor e Verificador.
- **Histórico** — lista de auditorias guardadas por serviço e data.
- **Análise** — evolução da nota, comparação entre serviços e radares médios por pilar e por responsável.
- **Relatório** — dois gráficos radar, tabela de pontuação, grelha completa dos 19 itens e vista para impressão / exportação em PDF através do browser.
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
   git commit -m "feat(scoring): pontuacao ponderada 0/2/5.25 e radares por pilar e responsavel (v1.5.0)"
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

As auditorias gravadas em versões anteriores continuam a abrir: a nota é recalculada a partir
dos níveis 0/1/2 já guardados, aplicando a nova ponderação. Os relatórios antigos passam
portanto a apresentar percentagens ligeiramente diferentes das que mostravam na v1.4.0, por
efeito da ponderação — os dados em si não são alterados.

A versão está declarada em quatro sítios, que devem ser atualizados em conjunto: comentário no topo de `index.html`, constante `APP_VERSION` no `index.html`, campos `version`/`description` do `manifest.json` e constante `APP_VERSION` do `sw.js`. Alterar a versão no `sw.js` é obrigatório, porque é o que invalida a cache dos utilizadores.

## Modelo de pontuação

A aplicação reproduz o cálculo da folha de cálculo original (`Auditoria_Cir_B__11B_.xlsx`).
Cada item é classificado em três níveis, com pesos diferentes:

| Avaliação | Pontos | Coluna no Excel |
|---|---|---|
| Mau | 0 | `F` |
| Com oportunidade | 2 | `G` |
| Excelente | 5,25 | `H` |

A nota de um conjunto de itens é `soma dos pontos ÷ (nº de itens × 5,25)`. O denominador é
**dinâmico**: cada pilar e cada responsável normaliza pelo seu próprio número de itens, tal
como as fórmulas `O4:O8` e `Y4:Y7` da folha. Por exemplo, Normalização tem 3 itens e os
restantes pilares têm 4.

**Diferença conhecida face ao Excel.** A folha calcula a nota global com `E23 = SUM(F23:H23)/100`,
ou seja, divide por 100 fixo. Como o máximo real são 19 × 5,25 = 99,75 pontos, a folha
subavalia ligeiramente: os dados da Cirurgia B (11B) dão 81,5 % no Excel e 82 % na aplicação.
A aplicação usa o denominador exacto para que a escala continue correcta quando o editor de
perguntas altera o número de itens. Para replicar o comportamento literal da folha, substituir
o denominador de `pctOf()` por `100`.

Os dois gráficos radar correspondem aos dois `RadarChart` da folha: um por pilar 5S
(`K4:K8` / `O4:O8`) e outro por responsável (`S4:V7` / `Y4:Y7`). São gerados em SVG nativo,
sem bibliotecas, pelo que funcionam offline e na impressão.

## Dados e privacidade

Nada é enviado para servidores. Desde a versão 1.4.0 a aplicação não carrega **nenhum** recurso externo (o CDN do Google Fonts foi removido e as fontes passaram a ser as do sistema), pelo que não há sequer pedidos de rede a terceiros. Os dados residem apenas no browser do dispositivo; limpar os dados do site apaga o histórico. Utilize a exportação JSON como cópia de segurança.

## Segurança

A versão 1.4.0 resultou de uma auditoria de segurança (OWASP Top 10). Notas para quem mantiver o código:

- **Escapar sempre.** Qualquer dado que venha do utilizador ou de um ficheiro importado tem de passar por `esc()` antes de entrar em `innerHTML`/`insertAdjacentHTML`. Isto inclui perguntas, temas, serviços, pessoas, datas e nomes.
- **Sem handlers inline.** Não usar `onclick=`, `oninput=` nem afins no HTML gerado. Ligar sempre por `addEventListener` com `data-*`, como no código actual. Nunca serializar objectos para dentro de atributos HTML.
- **O código do editor não é segurança.** Estando o código-fonte público, o valor é legível por qualquer pessoa. Serve apenas para evitar alterações acidentais. Controlo de acesso a sério exigiria servidor.
- **SheetJS 0.18.5** está embutido e é afectado pela CVE-2023-30533 (prototype pollution). Existe uma mitigação em `importExcel()` que congela `Object.prototype` durante o parsing. Ao actualizar o SheetJS para 0.20.2 ou superior, essa mitigação pode ser removida.
- **Service worker:** a cache só aceita recursos da própria origem constantes da allowlist `ASSETS`. Ao acrescentar ficheiros novos, adicioná-los a essa lista.

## Licença

MIT — ver [LICENSE](LICENSE).
