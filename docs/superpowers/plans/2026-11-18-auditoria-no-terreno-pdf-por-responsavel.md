# Auditoria completa no telemóvel e PDF por responsável — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fazer a auditoria inteira no telemóvel — nomes por responsável, acção e prazo em cada pergunta a melhorar, finalizar com verificação — e gerar o PDF novo, por responsável, da maqueta aprovada.

**Architecture:** Tudo continua no `index.html` único (SPA). A lógica nova fica em funções puras testáveis pelo `tests/harness.js` (`sanitizePresentes`, `acoesDoFormulario`, `faltasParaFinalizar`, `gruposPdf`); a parte de DOM liga-as. O PDF da auditoria é desenhado a partir de uma vista escondida própria (`#view-pdf`), com o mesmo html2canvas + jsPDF de hoje. Um script gera o ficheiro HTML único de teste.

**Tech Stack:** HTML/CSS/JS sem framework; `node --test` + `tests/harness.js`; Playwright (smoke tests); html2canvas 1.4.1 e jsPDF 4.2.1 em `vendor/`.

**Spec:** `docs/superpowers/specs/2026-11-18-auditoria-no-terreno-pdf-por-responsavel-design.md` · Maqueta: https://claude.ai/artifact/2v6e8U1Lw3VBHesQ4WCMmG (versão 3)

## Global Constraints

- Versão nova: **4.8.0**, igual em `index.html` (`APP_VERSION`), `sw.js`, `manifest.json` e `README.md` («**Versão 4.8.0**»): o job `versao` da CI confere.
- Português europeu pré-AO, como o resto da app («acção», «actualizar»).
- Toda a interpolação de dados do utilizador passa por `esc()`; todo o texto escrito passa por `clean(v, máx)`.
- Nomes: `clean(…,120)`. Acção: `clean(…,300)`. Datas: `AAAA-MM-DD`.
- Gravar nunca é bloqueado por foto, nota ou acção em falta; só finalizar.
- Faixas da nota: Crítico abaixo de 50, Com oportunidade de 50 a 79, Excelente 80 ou mais (`badge()` existente).
- Ordem dos grupos no PDF: `["U","P","R","U+R","M"]`, depois os outros códigos de `RESP` pela ordem da lista.
- Nada vai para a `main`: o PR #90 fica em rascunho até o utilizador testar.
- Cada smoke test novo corre na CI, num passo com `timeout-minutes` ≤ 10 (`tests/ci.test.js` confere).

## Review Focus

1. **Auditorias antigas** (com `pick`/`repo`, sem `presentes`, sem acções com `item`, sem `notas`): o relatório, o PDF e a edição continuam a funcionar e a mostrar os nomes antigos. → testes na Task 1 e na Task 4.
2. **Responsáveis acrescentados na Configuração**, fora dos cinco de origem: aparecem no formulário, na tabela e no fim da grelha do PDF. → teste na Task 4.
3. **Responsável sem perguntas na auditoria** (`byResp` com `n: 0`): não aparece no PDF nem nos radares. → teste na Task 4.
4. **Rascunho reposto depois de fechar a app**, incluindo acções e prazos, e perguntas que mudaram entretanto (a acção perde-se sem rebentar). → teste na Task 2.
5. **Pergunta editada de Mau para Excelente** com acção aberta ligada: a acção sai; se já estava feita, fica. → teste na Task 2.

---

### Task 1: Quem está presente, por responsável

**Files:**
- Modify: `index.html` — cabeçalho do formulário (linhas ~469-474), `montarRascunho`/`lerRascunho` (~1265-1302), `preencherForm` (~1729), `colherFormulario` (~1910), `guardarRascunho`/`aplicarRascunho` (~1955-2005), `linhasExcel` (~2681), `openReport` (~3083), `sanitizeAudit` (~4721)
- Create: `tests/presentes.test.js`
- Modify: `tests/evidencias.test.js` e `tests/rascunho.test.js` só se as asserções de forma do rascunho mudarem

**Interfaces:**
- Produces: `sanitizePresentes(x) -> {[código]: string} | undefined` (só códigos com `isResp`, nomes `clean(…,120)`, vazios fora; `undefined` se não ficar nenhum). `textoPresentes(a) -> string`: «Utilizadores: Ana · Picking: Bruno» pela ordem de `RESP`; sem `presentes`, «Picking: X · Repositor: Y» como hoje; «» se nada. O registo da auditoria ganha `presentes`; o formulário deixa de gravar `pick`/`repo`.

- [ ] **Step 1: Escrever os testes que falham** em `tests/presentes.test.js` (harness com `sanitizePresentes`, `textoPresentes`, `sanitizeAudit`, `montarRascunho`, `lerRascunho`, `linhasExcel` e dependências):
  - `sanitizePresentes({U:" Ana ",P:"",X:"Zé",M:"<b>Rui</b>"})` → `{U:"Ana",M:…limpo}`; `X` cai (não é responsável); `sanitizePresentes({})`, `null`, `"x"`, `[]` → `undefined`.
  - `sanitizeAudit({...válida, presentes:{U:"Ana"}}).presentes` → `{U:"Ana"}`; sem `presentes` → `undefined`; `pick`/`repo` antigos continuam a passar.
  - `textoPresentes({presentes:{P:"Bruno",U:"Ana"}})` → `"Utilizadores: Ana · Picking: Bruno"`; `textoPresentes({pick:"X",repo:"Y"})` → `"Picking: X · Repositor: Y"`; `textoPresentes({})` → `""`.
  - Rascunho: `lerRascunho(montarRascunho({presentes:{U:"Ana"}},IT,[],[],agora,[]),IT).presentes` → `{U:"Ana"}`; um rascunho só com um nome presente não é `null`.
  - `linhasExcel([a])` tem a coluna `"Presente: Utilizadores"` com `"Ana"`, e continua a ter `"Picking"`, `"Repositor"`.
- [ ] **Step 2: Correr e ver falhar** — `node --test tests/presentes.test.js` → FAIL (`sanitizePresentes is not a function`).
- [ ] **Step 3: Implementar** `sanitizePresentes` e `textoPresentes` junto de `sanitizeAudit`; `presentes:sanitizePresentes(x.presentes)` em `sanitizeAudit`; `cab.presentes` em `montarRascunho` (conta para «há algo a guardar») e em `lerRascunho`; colunas `"Presente: "+RESP[k]` em `linhasExcel` para cada código de `RESP`.
- [ ] **Step 4: Formulário.** Trocar os campos `#f-pick` e `#f-repo` por um contentor `#f-presentes` com um `<input list="dl-people" data-presente="<código>">` por código de `RESP`, rótulo `RESP[k]`, desenhado em `renderForm()` (a lista de responsáveis pode ter mudado). `colherFormulario()` devolve `presentes` e deixa de devolver `pick`/`repo` (assim `aplicarEdicao` preserva os antigos). `preencherForm`, `guardarRascunho`, `aplicarRascunho` e `refreshForm` passam a tratar `data-presente`. Os nomes entram em `people` onde hoje entram `pick`/`repo`/`verif` (procurar onde `people` é actualizado ao gravar). `openReport` usa `textoPresentes(a)` + «Verificador: …».
- [ ] **Step 5: Correr tudo** — `node --test tests/*.test.js` → PASS; `node tests/smoke-rascunho.mjs` e `node tests/smoke-edicao.mjs` com o servidor de teste (ver `.github/workflows/ci.yml`, passo que arranca o servidor na porta 8765) → sem falhas; ajustar os smoke tests que preenchiam `#f-pick`/`#f-repo` para `[data-presente]`.
- [ ] **Step 6: Commit** — `git commit -m "Nomes por responsável no início da auditoria (presentes)"`

### Task 2: A acção e o prazo dentro da pergunta

**Files:**
- Modify: `index.html` — `renderForm` (caixa `.evid`, ~1606-1615, e ligações), estado do formulário (~1791), `mostrarEvid`, `refreshForm`, `colherFormulario`, `montarRascunho`/`lerRascunho`, `guardarRascunho`/`aplicarRascunho`, `preencherForm`, handler de `btn-save` (~2037)
- Create: `tests/acoes-formulario.test.js`
- Modify: `tests/smoke-evidencias.mjs` (acção no formulário)

**Interfaces:**
- Consumes: `sanitizeAcoes`, `hojeISO`, `itemsOf`.
- Produces: estado `acaoVals: {[i]: {texto, prazo}}`. `acoesDoFormulario(antes, IT, scores, vals, data) -> acoes[]`, pura: para cada `i` com `scores[i]` 0 ou 1 e `vals[i].texto` não vazio, actualiza `texto` e `prazo` da **primeira** acção de `antes` com `item === IT[i].n`, ou acrescenta `{r: IT[i].r, texto, prazo, estado:"aberta", criadaEm: data, item: IT[i].n}`; com texto vazio, tira essa primeira acção se estiver aberta; para `i` Excelente, tira as acções **abertas** com `item === IT[i].n`; acções sem `item` e feitas ficam; o resultado passa por `sanitizeAcoes`. `acaoDoItem(acoes, n) -> {texto, prazo}` (a primeira com esse `item`, ou vazios) para preencher o formulário em edição. Rascunho: `montarRascunho(campos, IT, raw, tgts, agora, notas, acoes)` com `acoes[i] = {texto, prazo}`; `lerRascunho` devolve `acoes` alinhado com `IT` pela assinatura, como `notas`.

- [ ] **Step 1: Testes que falham** em `tests/acoes-formulario.test.js`:
  - auditoria nova: `acoesDoFormulario([], IT, [2,0,1], {1:{texto:"Arrumar",prazo:"2026-11-27"}, 2:{texto:"Limpar",prazo:""}}, "2026-11-18")` → duas acções, com `item` = `IT[1].n` e `IT[2].n`, `r` da pergunta, `estado:"aberta"`, `criadaEm:"2026-11-18"`, a segunda com `prazo:""`.
  - pergunta Excelente com texto escrito → não cria acção.
  - edição: `antes` com `{id:5,item:IT[1].n,texto:"velho",estado:"aberta"}` e `vals[1].texto="novo"` → mesma `id:5`, `texto:"novo"`; uma segunda acção do mesmo item, criada no relatório, fica intacta.
  - **(Review Focus 5)** `antes` com acção aberta e outra feita para `IT[1].n`, `scores[1]=2` → sai a aberta, fica a feita.
  - texto apagado em edição → a primeira acção aberta desse item sai.
  - acção sem `item` em `antes` → fica.
  - **(Review Focus 4)** `lerRascunho(montarRascunho({},IT,[0],[],agora,[],[{texto:"A",prazo:"2026-12-01"}]),IT).acoes[0]` → `{texto:"A",prazo:"2026-12-01"}`; com a pergunta 0 retirada de `IT` na leitura → sem erro, a acção não aparece noutra pergunta; texto `clean(…,300)`, prazo inválido → `""`.
- [ ] **Step 2: Ver falhar** — `node --test tests/acoes-formulario.test.js` → FAIL.
- [ ] **Step 3: Implementar** `acoesDoFormulario`, `acaoDoItem` e as mudanças ao rascunho.
- [ ] **Step 4: Formulário.** Na caixa `.evid` de cada pergunta, a seguir à nota: `<input data-acao="i" maxlength="300" placeholder="Acção: o que fazer">` e `<input type="date" data-prazo="i">`, com `aria-label` «Pergunta N: acção» / «Pergunta N: prazo». A nota passa a «Nota: o que se viu». `oninput` grava em `acaoVals` e chama `guardarRascunho()`. `refreshForm` limpa `acaoVals`. `preencherForm` usa `acaoDoItem(a.acoes, it.n)`. No `btn-save`: `dados.acoes = acoesDoFormulario(editId!=null ? (auditoria).acoes||[] : [], IT, dados.scores, acaoVals, dados.date)`.
- [ ] **Step 5: Smoke.** Em `tests/smoke-evidencias.mjs`: numa pergunta Mau, escrever acção e prazo, gravar → o relatório mostra a acção no plano com o responsável da pergunta e «Pergunta nº N»; editar e mudar o texto → a mesma acção, texto novo. Correr `node tests/smoke-evidencias.mjs` → sem falhas.
- [ ] **Step 6: Correr tudo** — `node --test tests/*.test.js` → PASS.
- [ ] **Step 7: Commit** — `git commit -m "Acção e prazo dentro de cada pergunta a melhorar"`

### Task 3: Finalizar com verificação, e o cartão por finalizar

**Files:**
- Modify: `index.html` — `finalizarAuditoria` (~3677), `renderPosAuditoria` ramo `porFinalizar` (~3407-3423)
- Create: `tests/finalizar.test.js`
- Modify: `tests/smoke-terreno.mjs` (finalizar com e sem faltas)

**Interfaces:**
- Consumes: `acoes` com `item` (Task 2), `notas`, `itemsOf`, `carregarEvidAudit(id) -> Promise<Map<i,url>>`, `caixa`, `confirmar`, `editAudit`, `enviarParaPC`.
- Produces: `faltasParaFinalizar(a, comFoto) -> [{n, t, faltas: string[]}]` (`comFoto`: `Set` de índices com foto). Por pergunta com score 0 ou 1, `faltas` contém, por esta ordem e com este texto: `"sem acção"` (nenhuma acção desta auditoria com `item === n`), `"acção sem prazo"` (há acção, nenhuma com prazo), `"sem foto nem nota"`. Só entram as perguntas com alguma falta.

- [ ] **Step 1: Testes que falham** em `tests/finalizar.test.js`: tudo completo → `[]`; Excelentes ignoradas; foto sem nota → ok; nota sem foto → ok; nem foto nem nota → `"sem foto nem nota"`; acção sem prazo → `"acção sem prazo"`; sem acção → `["sem acção","sem foto nem nota"]` quando falta tudo; auditoria antiga sem `notas` nem `acoes` → lista todas as Mau/Oportunidade com `"sem acção"` e `"sem foto nem nota"` sem rebentar.
- [ ] **Step 2: Ver falhar** — `node --test tests/finalizar.test.js` → FAIL.
- [ ] **Step 3: Implementar** `faltasParaFinalizar`.
- [ ] **Step 4: Ligar.** `finalizarAuditoria(id)` passa a `async`: lê as fotos com `carregarEvidAudit(id)`; se houver faltas, `caixa({titulo:"Falta completar", texto: "Para finalizar, cada pergunta a melhorar precisa de acção com prazo e de foto ou nota.\n\n" + linhas "Nº 7 Caixas: sem acção, sem foto nem nota", botoes:[{v:null,label:"Cancelar",cls:"ghost"},{v:"pc",label:"Enviar para o PC",cls:"ghost"},{v:"ed",label:"Completar agora",def:true}]})` → `"ed"` chama `editAudit(a)`, `"pc"` chama `enviarParaPC(a)` (pelo `ocupado` do cartão); sem faltas, `confirmar("Finalizar a auditoria a "+a.service+" de "+dataCurta(a.date)+"? Depois de finalizada, editar pede o código de acesso.",{titulo:"Finalizar auditoria",sim:"Finalizar"})` e só então grava como hoje.
- [ ] **Step 5: Cartão.** No ramo `porFinalizar`: primeiro passo **Finalizar auditoria** (botão principal, sem `ghost`), com «Com tudo completo: acção com prazo e foto ou nota em cada pergunta a melhorar.»; segundo passo «Não deu para acabar aqui?» com **Enviar para o PC** (`ghost`), mantendo o «✓ Enviada …» quando já foi. Os ids `pa-fim` e `pa-pc` mantêm-se.
- [ ] **Step 6: Smoke.** Em `tests/smoke-terreno.mjs`: no PC, finalizar uma auditoria com uma pergunta Mau sem acção → aparece «Falta completar» com «Nº … sem acção»; «Completar agora» abre o formulário em edição sem pedir código; escrever a acção e o prazo, guardar, finalizar → confirmação, e o cartão passa ao PDF. `tests/dialogos.mjs` responde às caixas pelo título. Correr `node tests/smoke-terreno.mjs` → sem falhas.
- [ ] **Step 7: Commit** — `git commit -m "Finalizar só com acção, prazo e foto ou nota; finalizar primeiro no cartão"`

### Task 4: O PDF novo, por responsável

**Files:**
- Modify: `index.html` — CSS novo `.pdf-*` (junto do `@media print`), contentor `<div id="view-pdf" aria-hidden="true">` fora de vista, funções novas junto de `pdfDoRelatorio` (~4265), chamadas em `renderPosAuditoria` (~3447 e ~3451)
- Create: `tests/pdf-grupos.test.js`
- Modify: `tests/smoke-pdf-paginas.mjs`, `tests/smoke-pdf-fotos.mjs` (passam a exercitar `pdfDaAuditoria`; o caso de `pdfDoRelatorio` do relatório no ecrã continua coberto num teste)

**Interfaces:**
- Consumes: `byPillar(a)`, `byResp(a)`, `radarSVG(dados, cor)`, `badge(p)`, `total(a)`, `anteriorDe(a, lista)`, `acoesPendentes(lista, svc, hoje, a)`, `obsOf(a,it,i)`, `textoPresentes`, `estadoAcao`, `carregarEvidAudit(id)`, `carregarPdf()`, `modoImpressao`, `svgParaImagem`.
- Produces: `ORDEM_PDF = ["U","P","R","U+R","M"]`. `gruposPdf(a) -> [{r, nome, presente, nota, total, falhas:[{i, it, s, obs, nota, acoes}], excelentes, outras}]` — um grupo por responsável com perguntas na auditoria, pela `ORDEM_PDF` e depois os restantes por ordem de `RESP`; `falhas` só score 0/1, por número; `acoes` = acções desta auditoria com `item === it.n`; `outras` = acções desta auditoria do responsável `r` sem `item`; `nota` = `pctOf` das perguntas do grupo. `pdfHTML(a, lista, fotos, hoje) -> string` (folha de resumo + grelha, como a maqueta v3). `pdfDaAuditoria(a) -> Promise<Blob>`.

- [ ] **Step 1: Testes que falham** em `tests/pdf-grupos.test.js`:
  - ordem: auditoria com perguntas dos 5 de origem → `["U","P","R","U+R","M"]`.
  - **(Review Focus 2)** com `RESP` acrescentado de um código `"Q"` e uma pergunta dele → `"Q"` no fim.
  - **(Review Focus 3)** um responsável sem perguntas na auditoria não tem grupo.
  - falhas só Mau/Oportunidade, `excelentes` conta as restantes, `nota` igual a `byResp(a)` para esse responsável.
  - `acoes` ligadas pelo `item`; acção sem `item` do responsável `M` vai para `outras` de `M`.
  - **(Review Focus 1)** auditoria antiga (sem `items`, sem `notas`, sem `acoes`, com `pick`) → grupos sem erro, `nota:""`, `acoes:[]`, e `pdfHTML` contém «Picking: …».
  - `pdfHTML` não tem «assinatura»/«Verificador ____»; tem os dois radares (`"Por pilar 5S"`, `"Por responsável"`) e, numa auditoria toda Excelente, «Todas as perguntas deste responsável ficaram Excelentes».
- [ ] **Step 2: Ver falhar** — `node --test tests/pdf-grupos.test.js` → FAIL.
- [ ] **Step 3: Implementar `gruposPdf` e `pdfHTML`.** Estrutura e textos da maqueta v3: folha 1 (`.pdf-folha`) com serviço, data, `textoPresentes`/verificador, observação, nota grande (~76 px a 794 px de largura), faixa, diferença face à anterior («▲ 6 face a 21/10/26 (65)»), contagens, os dois `radarSVG`, tabela por responsável, acções em aberto anteriores, legenda da pontuação; grelha: um `.pdf-grupo-cab` por grupo (nome, presente, nota ~20 px, «N a melhorar · M Excelente(s)») e um `.pdf-item` por falha (linha + evidência com foto ou o texto «Sem foto» + plano de acção: texto, responsável, prazo, estado), e `.pdf-item` «Outras acções» quando houver. Cores e classes da app (`--red`, `--amber-bg`, …), sempre em claro.
- [ ] **Step 4: Implementar `pdfDaAuditoria(a)`.** Carrega o PDF (`carregarPdf`) e as fotos (`carregarEvidAudit`), escreve `pdfHTML` em `#view-pdf` (posição fora do ecrã, largura 794 px), e paginada assim: `.pdf-folha` começa folha nova; o cabeçalho do grupo vai colado ao primeiro `.pdf-item` (desenhados juntos); cada `.pdf-item` que não caiba no resto da folha passa inteiro para a seguinte; mais alto que uma folha → corta, como `pdfDoRelatorio`. Margens e escala de `pdfDoRelatorio` (extrair a parte comum para `pdfDeBlocos(blocos, opcoes)` em vez de a copiar). No fim, em cada folha, `doc.text` com «Auditoria 5S · <serviço> · <data>» em cima e «Folha X de Y» em baixo. Limpa `#view-pdf`. `renderPosAuditoria` passa a chamar `pdfDaAuditoria(a)` nos dois sítios.
- [ ] **Step 5: Smoke.** Em `tests/smoke-pdf-paginas.mjs`: auditoria com 7 perguntas a melhorar (como a maqueta: 3 Utilizadores, 1 Picking, 1 Reposição, 1 Utilizador e Repositor, 1 Manutenção), com acções e uma foto → `pdfDaAuditoria` dá 3 folhas; nenhum `.pdf-item` cortado entre folhas; o texto «Folha 3 de 3» existe. Em `tests/smoke-pdf-fotos.mjs`: a foto da evidência entra no PDF. Correr ambos → sem falhas.
- [ ] **Step 6: Olhar uma vez.** Com a auditoria de exemplo, tirar uma captura de `#view-pdf` (Playwright, antes de ser limpa) e compará-la com a maqueta v3; uma ronda de ajustes.
- [ ] **Step 7: Correr tudo** — `node --test tests/*.test.js` e `node tools/lint/lint.mjs` → PASS.
- [ ] **Step 8: Commit** — `git commit -m "PDF por responsável: radares e grelha com evidência e plano de acção"`

### Task 5: Ficheiro HTML único para o teste no PC

**Files:**
- Create: `scripts/teste-pc.mjs`, `tests/smoke-teste-pc.mjs`
- Modify: `.gitignore` (`teste/`), `.github/workflows/ci.yml` (passo do smoke novo, `timeout-minutes: 5`), `tests/ci.test.js` só se a contagem mínima de smoke tests tiver de subir

**Interfaces:**
- Produces: `node scripts/teste-pc.mjs` → `teste/Auditoria5S-teste.html` e imprime o caminho e o tamanho.

- [ ] **Step 1: Smoke que falha** `tests/smoke-teste-pc.mjs`: corre o script, abre `file://…/teste/Auditoria5S-teste.html`, confirma `document.title` começa por «[TESTE]», o aviso `#aviso-teste` visível, `navigator.serviceWorker.getRegistrations()` vazio, grava uma auditoria completa (serviço por `escolherServico`) e `await pdfDaAuditoria(a)` devolve um Blob `application/pdf` com mais de 10 KB, e `await carregarXlsx()` resolve. Sem erros na consola além de `frame-ancestors`.
- [ ] **Step 2: Ver falhar** — `node tests/smoke-teste-pc.mjs` → FAIL (script inexistente).
- [ ] **Step 3: Implementar `scripts/teste-pc.mjs`** (Node, sem dependências). A partir do `index.html`: inserir antes do primeiro `<script>` da app os conteúdos de `vendor/html2canvas.min.js`, `vendor/jspdf.umd.min.js` e `vendor/xlsx.full.min.js` em `<script>` inline (os carregadores já saem logo se `window.html2canvas && window.jspdf` / `window.XLSX` existem); retirar `<link rel="manifest">`; trocar `sw.register("./sw.js")` por uma promessa rejeitada silenciosa (o código à volta já trata da falha); prefixar o `<title>` com «[TESTE] »; acrescentar no topo do `<body>` `<div id="aviso-teste">Versão de teste <versão> — os dados ficam só neste ficheiro, à parte da app verdadeira.</div>` com estilo amarelo; embutir o guia (`guia.html`) não é preciso. O script falha (exit 1) se algum dos três ficheiros ou âncoras não for encontrado. Escapar `</script` dentro das bibliotecas (`<\/script`).
- [ ] **Step 4: Ver passar** — `node tests/smoke-teste-pc.mjs` → sem falhas. Acrescentar o passo à CI e correr `node --test tests/ci.test.js` → PASS.
- [ ] **Step 5: Commit** — `git commit -m "Ficheiro HTML único para testar a app no PC com duplo clique"`

### Task 6: Versão 4.8.0 e documentação

**Files:**
- Modify: `index.html` (`APP_VERSION`), `sw.js`, `manifest.json`, `README.md` (versão, *Funcionalidades*, *Depois da auditoria*, *Estrutura do repositório* com `scripts/teste-pc.mjs`, secção curta *Testar no PC*), `CHANGELOG.md` (4.8.0), `GUIA.md` + `guia.html` (`node scripts/guia.mjs`), `FLUXO.md` (fluxograma e ponto 3 resolvido)

- [ ] **Step 1:** Subir a versão nos quatro sítios; `CHANGELOG.md` com Added/Changed da 4.8.0 em linguagem de quem usa.
- [ ] **Step 2:** `GUIA.md` — *Fazer uma auditoria* (nomes por responsável; acção e prazo na pergunta), *Depois da auditoria* (finalizar primeiro, o que falta, enviar para o PC como alternativa), *O relatório* (tabela das folhas do PDF novo). Correr `node scripts/guia.mjs`.
- [ ] **Step 3:** `FLUXO.md` — o fluxograma com os campos novos e a verificação ao finalizar; ponto 3 marcado como resolvido em 4.8.0. Validar os dois blocos Mermaid num Chromium (como na criação do ficheiro).
- [ ] **Step 4: Verificação completa** — `node --test tests/*.test.js`, `node tools/lint/lint.mjs`, todos os `tests/smoke*.mjs` com o servidor de teste, e o bloco do job `versao` da CI corrido à mão → tudo verde.
- [ ] **Step 5: Commit e push** — `git commit -m "4.8.0: auditoria completa no telemóvel e PDF por responsável"`; `git push`; gerar `teste/Auditoria5S-teste.html` e enviá-lo ao utilizador na conversa. O PR #90 continua em rascunho.
