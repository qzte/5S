<!--
  Auditoria 5S · Supermercados Kaizen — README
  Versão: 3.5.1 (Semantic Versioning — MAJOR.MINOR.PATCH)
  Repositório: https://github.com/qzte/5S
  Nota: este ficheiro é documentação. Não altera comportamento, formato de dados
        nem API, pelo que acompanha a versão do código em vez de a incrementar.
-->

# Auditoria 5S · Supermercados Kaizen

**Versão 3.5.1** · [Changelog](CHANGELOG.md) · [Semantic Versioning](https://semver.org/lang/pt-BR/)

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
- [Responsáveis](#responsáveis)
- [Editar auditorias anteriores](#editar-auditorias-anteriores)
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
| **Histórico** | Todas as auditorias guardadas, por serviço e data, com edição e remoção (ambas sob PIN). |
| **Análise** | Evolução da nota, comparação entre serviços, radar por pilar 5S e radar por responsável — em SVG/canvas nativos, sem bibliotecas de gráficos. |
| **Relatório** | Três folhas imprimíveis: resumo com radares e histórico do serviço, grelha completa dos itens, e recomendações por responsável com foto e texto. |
| **Configuração** | Serviços, responsáveis, exportação/importação JSON, importação de Excel e editor de perguntas (PIN). |

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

### Não vejo o campo *Auditados*

A aplicação lê sempre as perguntas guardadas no dispositivo, e só usa as de
origem quando não há nenhumas gravadas. Quem tenha aberto o editor e carregado
em *Guardar* antes da versão 3.1.0 ficou com as perguntas 3, 18 e 19 como
contagens simples — sem alvo, e por isso sem o campo. A migração de tipos **não**
é automática: reescrever o tipo em silêncio mudaria a classificação de
auditorias já feitas.

Desde 3.1.3, a aplicação propõe a conversão uma vez no arranque e, se for
adiada, deixa um cartão em *Configuração* com o botão **Converter agora**. A
conversão preserva o enunciado, o tema, o pilar e o responsável, e não toca nas
auditorias já gravadas — cada uma guarda as suas próprias perguntas. Em
alternativa, o editor permite mudar o tipo pergunta a pergunta, ou repor as
perguntas originais.

## Responsáveis

Quem responde por cada pergunta. São os eixos do radar *Por responsável* e os
blocos de recomendações do relatório, e editam-se em *Configuração →
Responsáveis* (3.5.0). De origem são cinco: Utilizadores, Manutenção, Reposição,
Utilizador e Repositor, e Picking.

| Regra | Porquê |
| --- | --- |
| O **código** fixa-se ao criar e não muda | É a chave por que cada pergunta guarda o seu responsável (`r`); mudá-lo desligaria as perguntas que o referenciam. |
| O **nome** pode ser corrigido sempre | É só o que se lê; nada o referencia. |
| Um responsável **em uso não sai** | A mensagem diz onde está o uso — perguntas do checklist, auditorias gravadas, ou uma recomendação já escrita. Reatribua primeiro, no editor de perguntas e em cada auditoria pelo botão *Editar*. |
| A lista é um **rascunho até Guardar** | E Guardar pede o código de acesso, como o editor de perguntas. |
| Acrescentar fica **no fim** | A ordem da lista é a ordem dos eixos do radar; acrescentar no meio deslocaria os que já lá estavam. |

A exportação JSON leva a lista consigo e a importação trá-la: *Substituir* fica
com a do ficheiro, *Fundir* acrescenta o que falta e mantém os nomes de casa.
Sem isto, um ficheiro de um dispositivo com responsáveis próprios era lido com
os de quem importa, e as perguntas dele mudavam de dono em silêncio.

## Editar auditorias anteriores

No Histórico, **Editar** reabre a auditoria no formulário com tudo preenchido;
Guardar substitui o registo em vez de criar um segundo. O mesmo botão existe no
fim do relatório.

Ambos **pedem o código de acesso** — o mesmo do editor de perguntas, e pedido a
cada vez. Reescrever uma auditoria gravada é uma alteração ao histórico, e a
protecção que aqui interessa é contra o toque distraído: o código é público (ver
[Segurança](#segurança)) e nunca foi um controlo de segurança.

Em edição, o responsável de cada pergunta deixa de ser texto fixo e passa a ser
um **selector** (3.4.0): é o que permite reatribuir o passado depois de
acrescentar um responsável ao modelo, em vez de deixar as auditorias antigas
presas à atribuição do dia em que foram feitas. A mudança fica **só naquela
auditoria** — o checklist em vigor não é tocado, e para o alterar continua a
haver o editor de perguntas. As classificações não mexem: muda o eixo do radar
e o bloco de recomendações a que a pergunta pertence, não o que lhe foi
respondido.

**Apagar** pede o mesmo código, depois da confirmação (3.3.1). É a alteração
mais definitiva de todas: não há como anular, e sem uma exportação o que se
perde não está em mais lado nenhum.

A edição corre sobre as **perguntas gravadas com essa auditoria**, não sobre as
actuais: se o editor de perguntas mudou entretanto, cada resposta continua a
pertencer à pergunta que a originou, e os limiares que reclassificam um valor
reescrito são os que a classificaram da primeira vez. As recomendações por
responsável mantêm-se.

Uma auditoria antiga que não tenha guardado as suas perguntas e cujo número de
respostas não coincida com o das perguntas actuais **não é editável** — não há
como saber a que pergunta pertence cada resposta.

## Dados e privacidade

Tudo vive em `localStorage`, apenas no dispositivo. Não há servidor, conta,
telemetria nem recursos externos.

| Chave | Conteúdo |
| --- | --- |
| `audits` | Auditorias gravadas |
| `services` | Serviços / supermercados |
| `people` | Repositores e Picking |
| `itemsCfg` | Perguntas e limiares personalizados |
| `resps` | Responsáveis (código e nome), pela ordem dos eixos do radar |

**Faça exportações regulares.** Limpar os dados do navegador apaga tudo sem
possibilidade de recuperação. A exportação JSON inclui auditorias, serviços,
pessoas e perguntas; a importação permite **Fundir** (sem duplicar, por
`id` ou serviço+data) ou **Substituir** — este último pede o código de acesso,
por apagar todo o histórico de uma vez (3.5.1).

O armazenamento do navegador é finito (~5 MB por origem). Se encher, gravar
falha com um aviso explícito, o formulário **não** é limpo e nada do que já
estava guardado se perde; a saída é exportar e apagar auditorias antigas.

As fotografias das recomendações são a única excepção: vivem em memória enquanto
a vista Relatório está aberta e **nunca** são escritas em `localStorage` nem
exportadas. Fecha-se a vista, perdem-se — por opção, para não esgotar a quota.

## Importação de Excel

O cabeçalho é procurado nas primeiras 15 linhas e é a linha que identificar
**mais** colunas — uma linha de título antes dos rótulos (`Relatório de
serviços`) não a engana, ainda que contenha a palavra "serviços".

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
SECURITY.md        Relatórios das auditorias de segurança (3.1.0 e 3.5.0)
tests/harness.js   Extrai as funções puras do index.html para teste em Node
tests/*.test.js    Testes unitários (node:test)
tests/smoke*.mjs   Smoke tests de browser (Playwright)
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

Os smoke tests de browser correm à parte, com a aplicação servida por HTTP
(`python3 -m http.server 8765`) e o Playwright instalado:

```bash
node tests/smoke.mjs               # perguntas de amostra
node tests/smoke-edicao.mjs        # edição de auditorias anteriores
node tests/smoke-responsaveis.mjs  # responsáveis editáveis
```

O ponto crítico coberto é a migração de limiares: as classificações são
verificadas valor a valor sobre a totalidade das combinações pergunta × resposta
do modelo base, nos três formatos (1.x, 2.0.0, 3.0.0).

> `harness.js` faz `require` de `../index.html`, pelo que tem de estar numa
> subpasta (`tests/`). Até 3.1.0 os ficheiros estavam na raiz e a suite não
> corria de todo; foram movidos em 3.1.1.

### Integração contínua

`.github/workflows/ci.yml` corre em cada push para `main` e em cada pull
request, com três verificações independentes:

| Verificação | O que corre |
| --- | --- |
| Testes unitários | `node --test tests/*.test.js` |
| Smoke tests de browser | `tests/smoke.mjs` e `tests/smoke-edicao.mjs`, com a aplicação servida em `127.0.0.1:8765` |
| Coerência da versão | A versão de `manifest.json`, `index.html`, `sw.js` e `README.md` tem de ser a mesma |

O Playwright está fixo em `1.56.0`: a versão do pacote e a do Chromium que
descarrega andam ao par, e uma actualização silenciosa do browser é a forma
mais comum de um smoke test passar a falhar sem que o `index.html` tenha
mudado. A verificação da versão existe porque o `sw.js` usa `APP_VERSION` como
nome da cache — uma divergência faz o browser servir a versão antiga sem
qualquer aviso.

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
- SheetJS embutido em **0.20.3**, que corrige a CVE-2023-30533 (prototype
  pollution) e a CVE-2024-22363 (ReDoS). Atenção ao actualizar: a biblioteca
  sai apenas de `cdn.sheetjs.com`, porque o pacote `xlsx` no npm ficou
  congelado em 0.18.5 (3.1.2).
- Porta de entrada única para dados de ficheiro: `sanitizeAudit()` para
  auditorias, `sanitizeItems()` para perguntas e `sanitizeResps()` para
  responsáveis — usada tanto pelo editor como pela importação de histórico
  (3.1.1, 3.5.0).
- Leitura de índices de objecto sempre com `hasOwnProperty`, agora que o código
  do responsável é escrito pelo utilizador: `isResp()` para as perguntas e
  `recTexto()` para as recomendações (3.1.1, 3.5.1).
- O que vem do `localStorage` é validado na FORMA e não só no parse, e gravar
  deixou de poder falhar em silêncio quando o armazenamento enche (3.5.1).

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

**O PIN do editor — pedido também para editar e para apagar uma auditoria
gravada, e para substituir todo o histórico numa importação — não é um controlo
de segurança.** O código é público num
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
