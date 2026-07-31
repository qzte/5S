<!--
  Auditoria 5S · Supermercados Kaizen — README
  Versão: 3.1.2 (Semantic Versioning — MAJOR.MINOR.PATCH)
  Repositório: https://github.com/qzte/5S
  Nota: este ficheiro é documentação. Não altera comportamento, formato de dados
        nem API, pelo que acompanha a versão do código em vez de a incrementar.
-->

# Auditoria 5S · Supermercados Kaizen

**Versão 3.1.2** · [Changelog](CHANGELOG.md) · [Semantic Versioning](https://semver.org/lang/pt-BR/)

Lista de verificação 5S para supermercados, em aplicação web de **ficheiro único**:
auditoria, histórico, análise, relatório imprimível em PDF e editor de perguntas.
Funciona **100 % offline**, instalável como PWA, e **nenhum dado sai do dispositivo**.

- **Aplicação:** https://qzte.github.io/5S/
- **Código:** https://github.com/qzte/5S

## Índice

- [Funcionalidades](#funcionalidades)
- [Instalação e utilização](#instalação-e-utilização)
- [Modelo de pontuação](#modelo-de-pontuação)
- [Limiares por pergunta](#limiares-por-pergunta)
- [Dados e privacidade](#dados-e-privacidade)
- [Importação de Excel](#importação-de-excel)
- [Estrutura do repositório](#estrutura-do-repositório)
- [Testes](#testes)
- [Segurança](#segurança)
- [Versionamento](#versionamento)
- [Licença](#licença)

## Funcionalidades

| Vista | O que faz |
| --- | --- |
| **Nova auditoria** | 19 itens (3 deles por amostra), nota calculada em tempo real, cabeçalho com serviço, data, Picking, Repositor, Verificador e observação. |
| **Histórico** | Todas as auditorias guardadas, por serviço e data. |
| **Análise** | Evolução da nota, comparação entre serviços, radar por pilar 5S e radar por responsável — em SVG/canvas nativos, sem bibliotecas de gráficos. |
| **Relatório** | Três folhas imprimíveis: resumo com radares e histórico do serviço, grelha completa dos itens, e recomendações por responsável com foto e texto. |
| **Configuração** | Serviços, exportação/importação JSON, importação de Excel e editor de perguntas (PIN). |

## Instalação e utilização

Não há passo de compilação nem dependências a instalar.

1. Abra https://qzte.github.io/5S/ no telemóvel ou no computador.
2. No telemóvel, use *Adicionar ao ecrã principal* para instalar como aplicação.
3. Depois da primeira visita funciona sem rede: o service worker guarda a aplicação em cache.

Para correr localmente basta servir a pasta por HTTP (o service worker não funciona
em `file://`):

```bash
python3 -m http.server 8000
# abrir http://localhost:8000
```

## Modelo de pontuação

Cada item recebe uma classificação, e cada classificação vale pontos:

| Classificação | Pontos |
| --- | --- |
| Mau | 0 |
| Com oportunidade | 2 |
| Excelente | 5,25 |

A nota final é a percentagem entre os pontos obtidos e o máximo possível
(todos os itens Excelente). Os pilares 5S e os responsáveis são normalizados
cada um pelo seu próprio número de itens, pelo que um eixo com 3 itens não é
penalizado face a um com 6.

**As notas já gravadas nunca são recalculadas.** As classificações (`scores`)
são guardadas com a auditoria, o que garante que uma alteração posterior aos
limiares não reescreve o passado.

## Limiares por pergunta

Cada pergunta tem três limiares nomeados, editáveis no editor, que marcam o
valor **a partir do qual** cada classificação se aplica:

- `t1` — a partir daqui a resposta é **Mau**
- `t2` — a partir daqui é **Com oportunidade**
- `t3` — a partir daqui é **Excelente**

O sentido depende do tipo de resposta. Nas **contagens** e nas **amostras** menos
é melhor, logo a ordem natural é `T3 ≤ T2 ≤ T1`; em **escala** e **elementos**
mais é melhor, e a ordem é `T1 ≤ T2 ≤ T3`. Mudar o tipo de resposta recalcula os limiares em vez de
os manter, porque o mesmo trio de números lê-se ao contrário.

Três classes contíguas têm apenas duas fronteiras: um dos três limiares é sempre
`0` e não tem grau de liberdade. Aparece no editor **bloqueado e assinalado como
fixo** — deixá-lo editável daria a ilusão de um controlo sem efeito.

Todas as perguntas mostram um ícone **i** com o tipo de resposta, o intervalo
aceite (ou o alvo sugerido) e o mapeamento resposta → classificação.

## Perguntas de amostra

Nas perguntas do tipo `amostra` audita-se um número fixo de unidades e conta-se
quantas não estão conformes. Os limiares `t1`/`t2` são **percentagens do alvo**,
não contagens, e o alvo efectivo é escolhido em cada auditoria, no campo
*Auditados*. Os cortes acompanham o alvo sem serem reescritos: com `t1 = 40 %`,
auditar 10 kanbans coloca *Mau* em 4; auditar 20 coloca-o em 8.

A pergunta guarda um alvo **sugerido** (`tgt`), que apenas pré-preenche o
formulário. Sem alvo não há denominador: o item fica por responder e sai do
denominador da nota, em vez de receber um zero.

As perguntas 3, 18 e 19 usam este tipo, com alvo sugerido de 10 kanbans.

## Dados e privacidade

Tudo vive em `localStorage`, apenas no dispositivo. Não há servidor, conta,
telemetria nem recursos externos.

| Chave | Conteúdo |
| --- | --- |
| `audits` | Auditorias gravadas |
| `services` | Serviços / supermercados |
| `people` | Repositores e Picking |
| `itemsCfg` | Perguntas e limiares personalizados |

**Faça exportações regulares.** Limpar os dados do navegador apaga tudo sem
possibilidade de recuperação. A exportação JSON inclui auditorias, serviços,
pessoas e perguntas; a importação permite **Fundir** (sem duplicar, por
`id` ou serviço+data) ou **Substituir**.

As fotografias das recomendações são a única excepção: vivem em memória enquanto
a vista Relatório está aberta e **nunca** são escritas em `localStorage` nem
exportadas. Fecha-se a vista, perdem-se — por opção, para não esgotar a quota.

## Importação de Excel

Aceita `.xlsx`, `.xls` e `.csv`, processados localmente pelo SheetJS embutido no
próprio ficheiro:

- Folha **Serviços** — colunas `Código` e `Descrição`.
- Folha **Repositor** ou **Picking** — coluna `Nome` (e opcionalmente `Código`).

As folhas são reconhecidas pelo nome; num ficheiro de folha única aplica-se a
deteção pelas colunas.

## Estrutura do repositório

```
index.html         Aplicação completa: HTML, CSS, JS e SheetJS embutido
manifest.json      Manifesto PWA
sw.js              Service worker — cache offline versionada, com allowlist
CHANGELOG.md       Histórico de versões (Keep a Changelog)
SECURITY.md        Relatório da auditoria de segurança (3.1.1)
tests/harness.js   Extrai as funções puras do index.html para teste em Node
tests/*.test.js    Testes unitários (node:test)
tests/smoke.mjs    Smoke test de browser (Playwright)
```

`index.html` é deliberadamente um ficheiro único: é o que permite instalar,
copiar e usar a aplicação sem infraestrutura. O custo é um ficheiro grande e o
`'unsafe-inline'` em `script-src` da CSP.

## Testes

`harness.js` localiza cada função pura dentro do `index.html`, avalia-a num
contexto `vm` isolado e expõe-na ao teste. Os testes exercitam assim o **código
real** em produção, sem cópia paralela e sem DOM.

```bash
node --test tests/*.test.js
```

O ponto crítico coberto é a migração de limiares: as classificações são
verificadas valor a valor sobre a totalidade das combinações pergunta × resposta
do modelo base, nos três formatos (1.x, 2.0.0, 3.0.0).

> `harness.js` faz `require` de `../index.html`, pelo que tem de estar numa
> subpasta (`tests/`). Até 3.1.0 os ficheiros estavam na raiz e a suite não
> corria de todo; foram movidos em 3.1.1.

## Segurança

Auditoria OWASP Top 10 aplicada na versão 1.4.0:

- Todo o texto do utilizador passa por `esc()` antes de ser interpolado em HTML.
- Zero handlers inline (`onclick` e afins); apenas `addEventListener` com
  `data-attributes`.
- CSP com `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`,
  `connect-src 'self'`.
- Service worker limitado a uma allowlist da própria origem, contra
  envenenamento da cache.
- Sem CDN: `referrer` não é enviado e a aplicação é offline de facto.
- Mitigação da CVE-2023-30533 (SheetJS 0.18.5): `Object.prototype` é congelado
  durante o parsing de Excel.
- Porta de entrada única para dados de ficheiro: `sanitizeAudit()` para
  auditorias e `sanitizeItems()` para perguntas — usada tanto pelo editor como
  pela importação de histórico (3.1.1).

Revisão completa em [SECURITY.md](SECURITY.md), incluindo o que **não** está
mitigado. Dois pontos a reter:

- `frame-ancestors` numa CSP em `<meta>` é **ignorado pelos browsers**: só
  funciona em cabeçalho HTTP, que o GitHub Pages não permite definir. A
  directiva fica na CSP para quando for servida por cabeçalho; entretanto, uma
  guarda em JS no `<head>` recusa mostrar a aplicação dentro de uma moldura
  (3.1.2).
- O `localStorage` pertence à **origem**, não ao caminho: em
  `qzte.github.io`, qualquer outra página publicada na mesma conta lê e escreve
  os dados desta aplicação. Para isolamento real seria preciso um domínio
  próprio.

**O PIN do editor não é um controlo de segurança.** O código é público num
ficheiro estático; qualquer pessoa o pode ler. Protege apenas contra alterações
acidentais.

## Versionamento

O projecto segue [Semantic Versioning](https://semver.org/lang/pt-BR/). A versão
está declarada em quatro pontos, que têm de coincidir:

| Local | Campo |
| --- | --- |
| `index.html` | Cabeçalho e `APP_VERSION` |
| `sw.js` | `APP_VERSION` (dá o nome à cache) |
| `manifest.json` | `version` e `description` |
| `CHANGELOG.md` | Entrada da versão |

- **MAJOR** — altera o formato de dados de forma que uma versão anterior não
  leia (ex.: 2.0.0 e 3.0.0, ambas por mudança na semântica dos limiares).
- **MINOR** — funcionalidade nova, compatível.
- **PATCH** — correcções sem alteração de contrato.

Ficheiros exportados por uma versão MAJOR anterior continuam a importar; o
inverso não é garantido.

## Licença

Ver [LICENSE](LICENSE) no repositório.
