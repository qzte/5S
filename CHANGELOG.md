# Changelog

Todas as alterações relevantes deste projeto são registadas neste ficheiro.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [3.27.0] — 2026-11-09

### Alterado

- **«Enviar para o PC» conta como cópia de segurança no telemóvel**, quando
  tudo o que lá mudou desde a última cópia já está no PC (a auditoria
  enviada, as acções fechadas no terreno e as que vieram do PC). Se ficou
  alguma auditoria por enviar, o lembrete continua. *Config → Dados* diz
  quando a última cópia foi pelo envio para o PC.
- Testes: `tudoNoPC()` em `tests/sincronizacao.test.js`; `smoke-terreno`
  verifica que o lembrete desaparece depois do envio.

## [3.26.0] — 2026-11-09

### Adicionado

- **Enviar para o telemóvel** (*Config → Dados*, no PC): a cópia sem fotos,
  que o telemóvel abre em *Histórico → Importar ficheiro* com *Actualizar*.
  Traz as auditorias finalizadas, as acções, as frequências, os emails dos
  serviços e as perguntas do PC; as auditorias que só existem no telemóvel
  ficam.
- **Email de cada serviço** (até 5 endereços), em *Config → Frequência das
  auditorias e email*. O cartão «Depois da auditoria» mostra-o e copia-o ao
  enviar por email; sem menu de partilha, o email abre já com ele. Vai nas
  cópias de segurança.
- **Libertar espaço no telemóvel**: apagar as fotos das auditorias enviadas
  para o PC e finalizadas lá. As auditorias ficam.
- Testes: `tests/sincronizacao.test.js`; `tests/smoke-terreno.mjs` cobre o
  email, o ficheiro para o telemóvel e a limpeza das fotos.

### Alterado

- O botão do Histórico chama-se *Importar ficheiro* (uma auditoria do
  telemóvel ou os dados do PC).
- Ao importar, as perguntas do ficheiro só são propostas se forem diferentes
  das actuais.

## [3.25.0] — 2026-11-09

### Adicionado

- **Auditar no telemóvel, finalizar no PC.** Uma auditoria nova fica **por
  finalizar**, e o cartão «Depois da auditoria» passa a ter, nessa fase, dois
  passos: *Enviar para o PC* e *Finalizar auditoria*. O PDF, o envio ao
  serviço e a cópia de segurança vêm depois de finalizada, por esta ordem.
- **Enviar para o PC**: um ficheiro só com essa auditoria e as suas fotos,
  pelo menu de partilha (para o email), com as acções fechadas no terreno.
- **Importar auditoria**, no Histórico: abre o ficheiro enviado do telemóvel
  (só funde, nunca substitui), fecha as acções feitas no terreno e abre o
  relatório da auditoria.
- O Histórico diz «por finalizar», e se já foi enviada para o PC.
- Testes: `tests/terreno.test.js` e `tests/smoke-terreno.mjs` (no CI).

### Alterado

- **Fundir actualiza.** Uma auditoria que já existe é substituída pela do
  ficheiro quando esta é mais recente (campo novo `alterada`), em vez de ser
  ignorada; as fotos dela também, se o ficheiro as trouxer. Assim a cópia do
  PC, importada no telemóvel, leva lá as auditorias finalizadas e as acções.
- Enquanto está por finalizar, *Editar auditoria* não pede o código de acesso.
- Os passos do cartão «Depois da auditoria» passam à ordem PDF, envio e cópia
  de segurança.

## [3.24.1] — 2026-11-08

### Segurança

- Revisão pelo OWASP Top 10 (`SECURITY.md`, pontos 25 a 27).
- As fotos passam por `esc()` no `src` das imagens: uma foto com aspas no
  armazenamento já não acrescenta atributos à página (ponto 25).
- A importação valida o valor de cada resposta (`raw`, só inteiros) e o id da
  auditoria (só inteiros positivos), para que as fotos não fiquem de fora da
  cópia de segurança (ponto 26).
- Testes: `tests/fotos-src.test.js` e casos novos em `tests/sanitize.test.js`.

## [3.24.0] — 2026-11-08

### Alterado

- **O passo 1 do «Depois da auditoria» partilha a cópia.** *Guardar cópia com
  fotos* passa a abrir o menu de partilha (Drive, OneDrive, email, Teams), para
  a cópia sair logo do telemóvel; no Chrome vai como `.txt`. Onde o browser não
  partilha ficheiros, descarrega-a, como até aqui.
- O botão de importar chama-se *Importar cópia de segurança (.json ou .txt)*:
  já aceitava o `.txt` desde 3.20.0, mas o nome dizia só JSON.

## [3.23.0] — 2026-11-08

### Adicionado

- **Depois da auditoria**: o relatório abre com os três passos que se seguem a
  gravar, e diz quais já foram feitos — *Guardar cópia com fotos*,
  *Descarregar PDF* e *Enviar por email* / *Enviar para o Teams*.
- **PDF criado pela app** (html2canvas 1.4.1 e jsPDF 4.2.1, MIT, em `vendor/`,
  com SRI, carregados só no primeiro PDF e guardados na cache offline): igual à
  impressão, sempre em claro, com o nome «Auditoria 5S - <serviço> - <data>».
- **Envio por email e para o Teams** pelo menu de partilha do sistema, com o
  PDF anexado e um resumo da auditoria. Sem partilha de ficheiros, descarrega o
  PDF e abre o email já escrito, ou copia o resumo para o Teams.
- O PDF e os envios ficam registados na auditoria (`envios`), também nas
  cópias de segurança; o Histórico mostra «enviada» ou «por enviar».
- Testes: `tests/envio.test.js` e `tests/smoke-envio.mjs` (no CI).

### Removido

- O `_headers` (cabeçalhos HTTP do Cloudflare Pages), apagado do repositório:
  o `publicar.sh`, o `scripts/csp.mjs` e os testes deixam de o usar. A CSP fica
  só no `<meta>`; a protecção contra molduras volta a ser a guarda em JS.

## [3.22.0] — 2026-11-08

### Corrigido

- **Data da auditoria em hora local.** O formulário punha a data de hoje em
  UTC: em Portugal, no horário de Verão, uma auditoria começada entre a
  meia-noite e a uma ficava com a data do dia anterior (e contava assim nos
  prazos e no relatório mensal). O mesmo nos nomes dos ficheiros exportados.
- **«Remover foto» só aparece com foto.** O estilo dos botões pequenos ganhava
  à classe que os esconde; passa a valer `.btn.hidden` para todos os botões.

### Adicionado

- **Nome do PDF.** Com um relatório aberto, o título da página — o nome que o
  browser propõe ao guardar o PDF — passa a ser «Auditoria 5S - <serviço> -
  <data>» ou «Relatório mensal 5S - <mês>», e volta ao da app ao sair.
- **Auditoria repetida.** Gravar outra auditoria ao mesmo serviço no mesmo dia
  pede confirmação, a dizer a nota da que já existe. Cancelar não perde o
  formulário.
- Testes: `tests/correcoes.test.js` e `tests/smoke-correcoes.mjs` (no CI).

## [3.21.0] — 2026-11-07

### Adicionado

- **Separador Acções**: o plano de acção de todos os serviços numa lista só.
  Resumo (em aberto, em atraso, feitas nos últimos 30 dias), filtros por
  estado, responsável e serviço, as em atraso primeiro. Marca-se como feita
  ali mesmo, e *Relatório* abre a auditoria de onde a acção veio. O separador
  mostra quantas acções estão em atraso.
- O teste de acessibilidade (axe-core, modo claro e escuro) passa também pelo
  relatório mensal e pelo separador Acções.
- Testes: `tests/lista-acoes.test.js`, e o `smoke-acoes` cobre o separador.

## [3.20.0] — 2026-11-07

### Adicionado

- **Relatório mensal** na Análise: escolhe-se o mês e abre um resumo de todos
  os serviços, pronto a imprimir em PDF em duas folhas — média do mês face ao
  anterior, auditorias por faixa, cada serviço (do pior para o melhor, com os
  não auditados no fim), pilares 5S e responsáveis, as cinco perguntas que mais
  falharam, o plano de acção (novas, concluídas, em aberto e em atraso no fim
  do mês) e os prazos das auditorias. No mês em curso, conta até hoje.
- **Partilhar cópia com fotos** em *Configuração → Dados*: a cópia com fotos
  vai para o menu de partilha do telemóvel (Web Share), para a Drive, o email
  ou outra app. Só aparece onde o browser partilha ficheiros. No Chrome vai
  como `.txt` (o Chrome não partilha `.json`), e a importação passa a aceitar
  `.txt`. Uma partilha concluída conta como cópia com fotos.
- Testes: `tests/mensal.test.js` e `tests/smoke-mensal.mjs`.

## [3.19.0] — 2026-11-07

### Adicionado

- **Código de acesso próprio do dispositivo** (*Configuração → Código de
  acesso*). O de origem é o mesmo em todas as instalações e lê-se no código-fonte; com um próprio, de 4
  a 8 algarismos, só quem o sabe abre a edição de auditorias, os responsáveis,
  o editor de perguntas e o «Substituir tudo». Mudar pede o código actual e o
  novo duas vezes; recusa o de origem, um algarismo repetido e as sequências.
  Guarda-se só um resumo com sal, fora das cópias de segurança. *Voltar ao
  código de origem* desfaz a escolha.
- **Espaço ocupado com as fotos.** *Configuração → Dados* mostrava só o
  `localStorage`; passa a mostrar também o total da app
  (`navigator.storage.estimate()`: fotos, cache offline) face à quota do
  browser, com aviso a partir de 80%.
- Testes: `tests/acesso.test.js` e `tests/smoke-acesso.mjs`.

## [3.18.0] — 2026-11-07

### Adicionado

- O **lembrete de cópia de segurança conta as fotos.** As fotos de evidência e
  das recomendações novas ou trocadas desde a última cópia *com fotos* ficam
  por copiar (`pendFotos`, `atFotos` na chave `backup`); a exportação normal,
  que não as leva, já não apaga esse aviso. O aviso aparece se nunca houve uma
  cópia com fotos, ou com 5 ou mais fotos por copiar, ou passados 7 dias, e o
  botão do aviso passa a ser *Exportar com fotos*. Na primeira abertura desta
  versão, as fotos já guardadas contam como por copiar. *Configuração → Dados*
  mostra também a data da última cópia com fotos.
- **Desfazer ao remover um serviço ou uma pessoa** na Configuração: a remoção é
  imediata e o aviso do fundo do ecrã oferece *Desfazer* durante 10 segundos,
  que repõe o nome no mesmo lugar da lista. A frequência de um serviço só sai
  quando o prazo acaba. Uma nova remoção (ou apagar uma auditoria) confirma a
  anterior.
- Testes: `tests/copias.test.js` e `tests/smoke-copias.mjs`.

### Alterado

- O *Desfazer* de apagar uma auditoria passa a usar o mesmo mecanismo genérico
  (`oferecerDesfazer`).

## [3.17.0] — 2026-11-07

A página da 5S no painel e-ink passa a ser a dos KPIs.

### Adicionado

- O `5s.painel.json` leva os **KPIs** em `dados.kpis` (`kpisPainel5s`): a média
  e o nº de auditorias dos últimos 30 dias e dos 30 antes, a média de cada um
  dos últimos 12 meses, os prazos dos serviços com frequência (em dia, a vencer,
  em atraso, nunca auditados, e a lista dos urgentes), as acções do plano
  (abertas, atrasadas, concluídas nos últimos 30 dias), a média por responsável
  e os serviços por faixa da última auditoria. O painel (qzte/e-ink_panel)
  desenha com eles a página «KPIs 5S», no lugar da página das auditorias; os
  campos de antes continuam lá.
- Testes dos KPIs em `tests/painel.test.js`; o `smoke-painel` confere que o
  ficheiro os leva.

### Alterado

- O ficheiro do painel volta a ser gravado também quando mudam os serviços ou
  as frequências (os prazos dependem deles), e é recalculado de hora a hora,
  porque os prazos e os «últimos 30 dias» mudam com o dia. O escritor só grava
  se os dados mudaram.

## [3.16.1] — 2026-11-06

### Alterado

- O guia de utilização deixa de mostrar o endereço do site: o primeiro passo
  passa a dizer só para instalar a app a partir do browser. Quem lê o guia já
  está dentro da app.

## [3.16.0] — 2026-11-06

O guia de utilização, escrito e dentro da app.

### Adicionado

- **Config → Ajuda**, com a ligação ao guia de utilização. É uma página da
  própria app (`guia.html`), gerada do `GUIA.md` por `scripts/guia.mjs` (um
  conversor de Markdown mínimo, sem dependências), sem scripts, com modo
  escuro, e em cache para abrir sem rede.
- `tests/guia.test.js` (o conversor, e `guia.html` em dia com o `GUIA.md`);
  o `smoke-offline` abre o guia da Config e sem rede, e o `smoke-a11y` passa-o
  pelo axe-core nos dois modos.

### Corrigido

- O service worker gravava qualquer página permitida na entrada do
  `index.html`. Com uma só página não se notava; com o guia, abri-lo punha o
  guia no lugar da app guardada, e sem rede a app abria o guia. Cada página
  fica agora na sua entrada.

### Documentação

- **`GUIA.md`**, o guia de utilização: fazer uma auditoria (rascunho, evidência,
  acções em aberto, prazos), ler o relatório, seguir o plano de acção, o
  Histórico e a Análise, cópias de segurança, configuração, offline e
  actualizações, e perguntas frequentes. O README continua a ser a
  documentação técnica, e passa a apontar para o guia.
- README: a tabela *Funcionalidades* passa a descrever o que entrou de 3.8.0 a
  3.15.0, e uma tabela nova, *Novidades de 3.8 a 3.15*, resume-o por tema; a
  estrutura do repositório e a descrição do lint ficam em dia.

## [3.15.0] — 2026-11-06

Rápida com anos de histórico, e o funcionamento offline e as actualizações
testados a sério.

### Alterado

- **Histórico** com 5 000 auditorias: de ~2,9 s para ~15 ms (telemóvel médio
  simulado). Desenha 50 cartões de cada vez, com *Mostrar mais*, e encontra a
  auditoria anterior de todas numa só passagem (`anterioresPorId`), em vez de
  percorrer a lista inteira para cada cartão.
- **Análise** com 5 000 auditorias: de ~0,8 s para ~50 ms. As métricas de cada
  auditoria (pilares e responsáveis) calculam-se uma vez e ficam em memória
  (`metricas`), recalculadas se a auditoria, os responsáveis ou as perguntas
  mudarem; o gráfico de evolução, acima de 120 pontos, fica só com as linhas e
  com uma descrição acessível resumida por serviço.

### Adicionado

- `tests/smoke-offline.mjs` (na CI), sobre a versão publicada: ficheiros em
  cache na instalação; sem rede, a app abre, grava e mostra o relatório; com o
  servidor a dar 404, ou desligado, abre a cópia em cache; uma actualização a
  sério (sw.js e index.html mudados no servidor) mostra o aviso, Recarregar
  passa para a versão nova sem perder a auditoria por terminar, a cache antiga
  é apagada, e sem rede abre a versão nova.
- `tests/desempenho.test.js`: a passagem única dá o mesmo que `anteriorDe()`
  para todas as auditorias, a descrição resume, a memória das métricas
  recalcula quando deve.

## [3.14.0] — 2026-11-06

A prova do que se viu, e uma cópia de segurança que não deixa nada para trás.

### Adicionado

- **Evidência por pergunta.** No formulário, cada pergunta classificada Mau ou
  Oportunidade ganha uma **nota** e uma **foto**. Fazem parte do rascunho
  (sobrevivem a um separador fechado) e podem ser trocadas ou removidas na
  edição. O relatório ganha a folha **Evidências** (só quando há alguma); a
  nota vai também para a exportação para Excel.
- **Exportar com fotos (JSON).** Uma cópia de segurança completa, com as fotos
  das recomendações e das evidências. Importá-la repõe as fotos, validadas uma a
  uma e com cada uma a acompanhar a sua auditoria (também ao fundir, quando o id
  muda). A exportação normal continua leve, sem fotos.
- `tests/evidencias.test.js` e `tests/smoke-evidencias.mjs` (na CI): nota e
  foto no formulário, rascunho, relatório e PDF, edição, e a ida e volta de uma
  cópia com fotos num dispositivo vazio.

### Alterado

- Apagar uma auditoria apaga também as suas fotos de evidência, e a limpeza de
  fotos órfãs (ao substituir o histórico) passa a conhecer as chaves novas e a
  deixar em paz as do rascunho.
- O relatório espera que as fotos de evidência acabadas de gravar estejam no
  disco antes de as ler.

## [3.13.0] — 2026-11-06

Saber o que falta auditar, e uma app que fala sempre com a mesma voz.

### Adicionado

- **Frequência das auditorias** por serviço (semanal, quinzenal, mensal,
  trimestral), em *Configuração*. O **Histórico** ganha o cartão *Prazos das
  auditorias* — em atraso, nunca auditados, a vencer, em dia —, com o botão
  **Auditar**; o separador mostra quantos serviços estão por auditar; o
  formulário avisa ao escolher o serviço. Vai na exportação JSON (`freqAud`).
- **Desfazer** depois de apagar uma auditoria, durante 10 segundos. As fotos só
  saem no fim do prazo, para desfazer as trazer também.
- `tests/prazos.test.js` e `tests/smoke-prazos.mjs` (na CI), que também
  confirma que nenhum diálogo nativo aparece.

### Alterado

- **Todos os avisos e confirmações** (36 `alert` e 14 `confirm`) passam para a
  caixa da própria app: modo escuro, leitores de ecrã, botões com o nome da
  acção. Ficam numa fila, uma de cada vez, pela ordem em que foram pedidas.
- **Apagar** uma auditoria deixa de pedir confirmação e código de acesso:
  apaga logo, com *Desfazer*. Editar, alterar os responsáveis e substituir o
  histórico continuam a pedir o código.
- Os smoke tests respondem à caixa da app (`tests/dialogos.mjs`, uma resposta
  por caixa).

### Corrigido

- A indicação "Na auditoria anterior" mostrava um travessão a mais quando a
  auditoria não tinha o valor gravado.

## [3.12.0] — 2026-11-06

O ciclo de melhoria fecha-se: do que está mal ao que foi feito.

### Adicionado

- **Plano de acção** em cada auditoria: acções com responsável, prazo e estado
  (aberta, em atraso, feita, com a data de conclusão), opcionalmente ligadas a
  uma pergunta. Criam-se no relatório, ou com **+ Acção** em cada item a
  melhorar, que já traz o responsável e o número da pergunta.
- O **formulário** de uma auditoria nova mostra as acções em aberto das
  auditorias anteriores ao mesmo serviço, para serem verificadas no terreno e
  marcadas como feitas.
- O **relatório** ganha uma 4.ª folha, *Plano de acção*, com as acções da
  auditoria e as que vinham em aberto de antes. Sem acções, continua com 3.
- O **Histórico** mostra quantas acções cada auditoria tem em aberto, e quantas
  em atraso.
- A **exportação para Excel** ganha a folha *Acções*.
- `tests/acoes.test.js` e `tests/smoke-acoes.mjs` (na CI, com contagem das
  folhas do PDF); o teste de acessibilidade passa a cobrir o plano.

### Alterado

- A importação traz o plano de cada auditoria, validado por `sanitizeAcoes()`.
- Um responsável com acções atribuídas deixa de poder ser removido.
- Os rótulos de estado (`.pill`) deixam de se partir em duas linhas.

## [3.11.0] — 2026-11-06

Espaço para o histórico inteiro, e arranque mais rápido.

### Alterado

- **As perguntas de cada auditoria são gravadas uma vez por conjunto.** Até
  aqui cada auditoria gravava a sua cópia das perguntas (~2,8 KB, quase sempre
  igual), e o armazenamento enchia por volta das 1 700 auditorias, muito antes
  do máximo previsto (5 000). Agora os conjuntos vão para `perguntasAud` e cada
  auditoria grava só a chave: 5 000 auditorias ocupam ~1,4 M caracteres, contra
  ~14 M. As auditorias antigas são convertidas no primeiro arranque. A gravação
  faz-se por uma ordem que nunca deixa auditorias gravadas sem as suas
  perguntas, mesmo que o armazenamento encha a meio. Em memória e na exportação
  JSON nada muda.
- **O SheetJS só é carregado quando é preciso** (importar ou exportar Excel),
  como ficheiro próprio, `vendor/xlsx.full.min.js`. Eram 952 KB dos 1,13 MB do
  `index.html`, lidos a cada arranque: num telemóvel médio, o arranque desce de
  ~690 ms para ~290 ms. Continua a funcionar offline (o service worker guarda-o
  em cache) e é carregado com `integrity` (SRI). O ficheiro é byte a byte o
  bloco que estava embutido, com o mesmo SHA-256 fixado.

### Adicionado

- `tests/armazenamento.test.js` e `tests/smoke-armazenamento.mjs` (na CI):
  conversão do formato antigo sem perder nada, cada auditoria com as suas
  perguntas, 5 000 auditorias a caber, e Excel sem rede.
- `tests/sheetjs.test.js` confirma que o SRI do carregador é o do ficheiro.

## [3.10.0] — 2026-11-06

Acessibilidade, modo escuro, CSP sem `'unsafe-inline'` na versão publicada, e
lint na CI.

### Adicionado

- **Modo escuro**, a seguir o do sistema (`prefers-color-scheme`), só no ecrã: a
  impressão continua clara.
- **CSP por hashes na versão publicada.** `scripts/csp.mjs`, chamado por
  `scripts/publicar.sh`, troca o `'unsafe-inline'` do `script-src` pelo SHA-256
  de cada `<script>` embutido. Um `<script>` injectado na página já não corre.
- **Lint** do JavaScript embutido (`tools/lint/lint.mjs`, ESLint com as regras
  de erro do `eslint:recommended`), na CI. Vive em `tools/lint/`, com
  `package.json` e lockfile próprios: a app continua sem dependências.
- `tests/smoke-csp.mjs` (a versão publicada arranca sem violações da CSP e
  bloqueia um `<script>` injectado) e `tests/smoke-a11y.mjs` (axe-core em todas
  as vistas, nos dois modos), ambos na CI.

### Alterado

- **Contraste (WCAG AA).** O cinzento do texto secundário passa de `#6d7a72`
  (4,49:1 sobre branco) a `#5f6b64`; o âmbar com texto e os botões laranja
  passam a tons que chegam a 4,5:1. As cores de marca ficam nas barras, bordas
  e linhas.
- O gráfico de **evolução** passa de `<canvas>` a SVG, como os outros: imprime
  nítido e acompanha o modo escuro.
- **Rótulos ligados aos campos**: cada `<label>` passa a nomear o campo que
  rotula (`ligarRotulos()`), também no formulário e no editor gerados pelo JS.
  As respostas, os botões de remover serviços e pessoas, e as secções (títulos
  `h2` para leitores de ecrã) ganham nome.

### Removido

- Código morto apontado pelo lint: a variável `MAX` e a função `hasRecs()`.

## [3.9.0] — 2026-11-06

Uso no dia a dia: encontrar auditorias, ler a evolução por serviço, fechar o
ciclo entre uma auditoria e a seguinte, e tirar os dados para fora da app.

### Adicionado

- **Histórico filtrável** por serviço, intervalo de datas e faixa de nota, com a
  contagem do que está à vista. Cada auditoria mostra a **variação** face à
  anterior ao mesmo serviço (▲ +5, ▼ -3), calculada sobre o histórico inteiro e
  não só sobre o que o filtro deixa ver.
- **Análise por serviço e período** (todo o histórico, ou os últimos 3, 6 ou 12
  meses), aplicados a todos os cartões da vista.
- **Seguimento entre auditorias.** No formulário, cada pergunta que a última
  auditoria ao serviço escolhido não deu como Excelente mostra o que lhe deu. No
  relatório, um cartão compara com a auditoria anterior: o que melhorou, o que se
  mantém por resolver e o que piorou. As perguntas são emparelhadas pelo número,
  tipo e enunciado, não pela posição.
- **Exportar para Excel** (`.xlsx`, folhas *Auditorias* e *Respostas*), com o
  SheetJS já embutido.
- `tests/historico.test.js`, `tests/smoke-historico.mjs` (também na CI) e
  `tests/dialogos.mjs`, que responde à caixa de diálogo nos smoke tests.

### Alterado

- O gráfico de **evolução** passa a ter uma linha por serviço, com legenda, e o
  eixo horizontal passa a ser o tempo. Até aqui era uma só linha com todas as
  auditorias de todos os serviços pela ordem: uma auditoria boa num serviço
  seguida de uma má noutro lia-se como uma queda. Ganha também uma descrição
  acessível (`aria-label`).
- As **fotos das recomendações** passam a ser guardadas no IndexedDB, por
  auditoria. Até aqui perdiam-se ao sair do Relatório. Continuam fora da
  exportação JSON.
- O **código de acesso** é pedido numa caixa própria, com campo de palavra-passe
  e teclado numérico; um código errado fica na mesma caixa para tentar de novo.
- A **importação** escolhe entre *Fundir* e *Substituir tudo* com dois botões,
  em vez de um `prompt()` onde se escrevia «F» ou «S».

## [3.8.0] — 2026-11-06

Protecção dos dados no dispositivo: a app é a única cópia das auditorias até
serem exportadas, e havia quatro formas de as perder sem aviso.

### Adicionado

- **Auditoria por terminar.** A auditoria nova é gravada em `rascunho` a cada
  alteração e reposta sozinha ao reabrir a app, com um cartão que diz quando foi
  guardada e permite descartá-la. As respostas são reconhecidas pela pergunta
  (número, tipo e enunciado), não só pela posição: se o editor mudar
  entretanto, nenhuma resposta passa para outra pergunta.
- Aviso do browser ao sair da página com a **edição** de uma auditoria gravada
  por guardar, ou quando o rascunho não pôde ser gravado (armazenamento cheio).
- **Armazenamento persistente:** pedido de `navigator.storage.persist()` quando
  há dados a proteger. *Configuração → Dados* mostra o estado, o espaço ocupado e
  a data da última cópia de segurança.
- **Lembrete de cópia de segurança** no topo da app: se nunca houve exportação,
  ou se há auditorias gravadas ou editadas por exportar há 7 dias ou mais, ou 5
  ou mais. Com *Exportar agora* e *Lembrar amanhã*.
- **Aviso de nova versão** quando um service worker novo passa a controlar a
  página, com *Recarregar agora*. Ao voltar à app, procura-se uma versão nova
  no máximo a cada 30 minutos.
- `tests/rascunho.test.js` e `tests/smoke-rascunho.mjs` (este também na CI).

### Corrigido

- Acrescentar ou remover um serviço ou uma pessoa na Configuração redesenhava o
  formulário e apagava as respostas já dadas à auditoria em curso.

## [3.7.0] — 2026-11-06

A app muda-se para o **Cloudflare Pages**. O GitHub Pages deixou de a publicar
quando o repositório passou a privado — no plano gratuito só publica
repositórios públicos —, e o endereço antigo dava 404.

### Adicionado

- `_headers`: os cabeçalhos HTTP que o Cloudflare envia — a CSP (igual à do
  `<meta>`), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS, e `no-cache` para o `sw.js`.
- `scripts/publicar.sh`: prepara `dist/` com só os ficheiros da app, para que o
  repositório inteiro não fique acessível pelo endereço dela.
- `tests/publicacao.test.js`: a CSP do cabeçalho e a do `<meta>` não podem
  divergir, e o que se publica é o que o service worker guarda em cache.
- README: configuração do Cloudflare Pages e como passar os dados do endereço
  antigo para o novo.

### Alterado

- O service worker passa a abrir a cópia em cache quando o servidor responde com
  **erro** (404, 5xx), e não só quando falta a rede. Era o que impedia, com o
  site em 404, de abrir a app e exportar os dados.

- CI: `actions/checkout` v7.0.1 e `actions/setup-node` v7.1.0, fixadas por
  SHA como antes. As v4 corriam em Node 20, descontinuado nos runners do
  GitHub, e cada execução avisava disso. O checkout passa a
  `persist-credentials: false`, porque nenhum job precisa do token depois.

### Segurança

- Endereço próprio: o `localStorage` e a licença da pasta do painel deixam de
  ser partilhados com os outros projectos de `qzte.github.io`, e a protecção
  contra molduras passa a ir em cabeçalho HTTP, onde funciona. Fecha os pontos
  4, 9 e 21 do [SECURITY.md](SECURITY.md).

## [3.6.2] — 2026-11-06

Retira do repositório os dados que identificavam pessoas e a unidade onde a app
é usada.

### Alterado

- O serviço sugerido numa instalação nova passa a ser `Serviço A (00001)`, um
  exemplo neutro, em vez do nome e do código de um serviço real; o mesmo no
  texto de exemplo do campo «Novo serviço». Quem já tem serviços gravados não vê
  diferença: o valor por omissão só se usa quando não há nenhum guardado.
- Os testes usam nomes de pessoas e de serviços fictícios em vez de nomes reais.
- Saem da documentação e dos comentários do código o nome da folha de cálculo
  original e o resultado de uma auditoria real que servia de exemplo.

## [3.6.1] — 2026-11-06

Correcções da terceira auditoria de segurança, à 3.6.0. Nenhum dos pontos é
explorável sem controlar outra página de `qzte.github.io`; três são de
integridade dos dados. Relatório em [SECURITY.md](SECURITY.md#revisão-de-360-2026-11-06).

### Adicionado

- **Deixar de gravar**, no cartão do painel e-ink: larga a pasta escolhida e
  esquece-a. Até aqui havia forma de escolher a pasta e nenhuma de a largar.

### Segurança

- **A licença da pasta do painel é da origem, não desta app** (documentado):
  qualquer página em `qzte.github.io` lê o *handle* guardado em IndexedDB e
  herda a licença de leitura e escrita sobre a pasta inteira. Recomenda-se uma
  pasta só com os ficheiros do painel.

### Corrigido

- **Exportar** já não falha em silêncio quando `itemsCfg` está estragado no
  armazenamento — o caso em que a cópia de segurança mais falta faz.
- **Guardar** exige a data. Uma auditoria sem data era gravada, aparecia no
  histórico e era descartada ao reimportar a cópia de segurança.
- Uma auditoria com forma errada no armazenamento já não deixa o Histórico e a
  Análise em branco nem pára a actualização do `5s.painel.json`: é descartada ao
  arrancar (`auditUsavel()`, testada em `tests/forma.test.js`).

## [3.6.0] — 2026-10-08

### Adicionado

- **Painel e-ink.** A app grava `5s.painel.json` numa pasta partilhada, escolhida em
  **Configuração → Painel e-ink**, para o painel e-ink (a app `painel.html` do repositório
  qzte/e-ink_panel) mostrar uma página com as auditorias 5S: nº de auditorias, média,
  média por pilar e a última auditoria de cada serviço, com a tendência face à anterior.
  Volta a gravar ~2 s depois de qualquer gravação de auditorias, perguntas ou
  responsáveis, e não regrava se nada mudou. Usa a File System Access API (Chrome/Edge):
  a escrita fica limitada à pasta escolhida e a um ficheiro de nome fixo; o ficheiro tem
  serviços e notas, não tem nomes de pessoas nem fotografias.
- `tests/painel.test.js` (o resumo, com as funções de pontuação da app) e
  `tests/smoke-painel.mjs` (escolher a pasta grava o ficheiro; gravar uma auditoria
  volta a gravá-lo).

## [3.5.2] — 2026-08-04

Fecha os três pontos que a auditoria da 3.5.0 tinha registado **sem** corrigir.
Nenhum deles era uma vulnerabilidade explorável; os três eram controlos em
falta. Relatório actualizado em [SECURITY.md](SECURITY.md).

### Segurança

- **O SheetJS embutido passa a ter integridade verificada.** A *versão* não
  precisou de mudar — `0.20.3` é a última publicada e não tem CVE por corrigir.
  O que faltava era poder confiar no que lá está: são 930 KB de código
  minificado dentro do `index.html`, sem `package.json` que o declare (logo
  invisível ao `npm audit`), sem registo público contra o qual comparar (o
  pacote `xlsx` no npm ficou congelado em 0.18.5) e ilegível a olho. Somado,
  isso queria dizer que **qualquer alteração ao bloco entrava no repositório sem
  que nada a assinalasse** — e a importação de Excel é a superfície de ficheiro
  mais poderosa da aplicação. `tests/sheetjs.test.js` fixa-o pelo SHA-256 e faz
  a CI falhar se mudar; o procedimento de actualização, incluindo a comparação
  com `cdn.sheetjs.com`, está no cabeçalho do ficheiro.

- **`clean()` passa a remover as marcas bidireccionais** (U+202E e afins) e os
  espaços de largura zero. O U+202E — a técnica do *Trojan Source* — inverte
  visualmente o texto que lhe segue sem deixar nada para ver, e o relatório é um
  documento que se imprime e se assina: quem o lê em papel não tem como detectar
  a inversão. Os juntores U+200C e U+200D ficam de fora de propósito, por serem
  legítimos em árabe, em escritas índicas e nos emoji.

- **E passa a ser aplicado ao texto escrito à mão**, que até aqui não passava
  por limpeza nenhuma: o serviço acrescentado em Configuração, os campos
  Picking/Repositor/Verificador/Observação da auditoria, e o enunciado e o tema
  no editor de perguntas. Só o texto *importado* era limpo — ou seja, o caminho
  menos provável dos quatro, e não os que encabeçam o relatório impresso. No
  editor a limpeza corre antes da validação, para que um enunciado feito só de
  caracteres invisíveis seja recusado em vez de guardado vazio.

- **As actions da CI passam a ser fixadas por SHA** em vez de por etiqueta. Uma
  etiqueta é móvel: quem controlar o repositório da action decide, sem que nada
  aqui mude, que código corre na CI que atesta cada alteração. Os SHA escolhidos
  são os que `v4` resolvia no momento, pelo que não muda o que corre — muda quem
  decide quando isso passa a ser outra coisa.

### Testes

- Onze testes novos (96 no total): `tests/texto.test.js` para a limpeza de
  caracteres invisíveis, incluindo a garantia de que os juntores legítimos e as
  sequências de emoji sobrevivem, e `tests/sheetjs.test.js` para a integridade
  da biblioteca embutida.

## [3.5.1] — 2026-08-04

Auditoria de segurança à versão 3.5.0, centrada no que mudou desde a revisão
anterior: a lista de responsáveis deixou de ser um conjunto fechado de cinco
chaves escritas no código e passou a ser **aberta, escrita pelo utilizador e
persistida** — e essas chaves são usadas como índices de objectos. Relatório
completo em [SECURITY.md](SECURITY.md); nenhuma alteração de comportamento fora
das correcções abaixo.

### Corrigido

- **Um responsável de código `constructor` lia o protótipo de `Object`.** Com
  esse código e uma auditoria sem recomendação escrita, o relatório imprimia
  «function Object() { [native code] }» no bloco desse responsável — texto que
  ficava gravado à primeira vez que alguém tocasse no campo. Pior do que o
  texto: a mesma leitura fazia `respEmUso()` concluir que havia recomendação em
  **todas** as auditorias, e o responsável passava a não poder ser removido,
  com uma mensagem a apontar auditorias onde ninguém escreveu nada. Passa a
  haver uma porta única de leitura, `recTexto()`, com `hasOwnProperty`. É a
  mesma classe de defeito que a guarda `isResp()` fechou em 3.1.1, reaberta por
  outro caminho quando as chaves deixaram de ser fixas.

- **`localStorage` com JSON válido mas de forma errada derrubava o arranque.**
  O `try` de 3.1.1 cobria o que não faz *parse*; ficou de fora o que faz *parse*
  e não é uma lista. Uma chave `services` com o texto `"xpto"` rebentava em
  `services.map` antes do primeiro render — página em branco, e o service worker
  a servir essa mesma página partida offline. Alcançável a partir de qualquer
  outra página da origem, que é o cenário já documentado do armazenamento
  partilhado. Passa a haver `loadArr()`, que recai no valor por omissão quando o
  que está guardado não é uma lista.

- **Armazenamento cheio perdia a auditoria em silêncio.** `setItem` lança
  quando a origem enche (~5 MB, partilhados com tudo o que esteja publicado no
  mesmo domínio), e a excepção subia do `onclick` de Guardar: o relatório não
  abria, nada era gravado e não aparecia mensagem nenhuma — o botão parecia
  morto e o trabalho perdia-se ao fechar a página. `save()` passa a avisar (uma
  vez por acção) e a devolver se gravou; em caso de falha o formulário **não** é
  limpo, porque o que lá está escrito é a única cópia que existe.

- **`__proto__` era aceite como código de responsável e desaparecia.** Ficava
  gravado em `resps` e nunca chegava à lista — atribuir uma string a
  `RESP.__proto__` é ignorado em silêncio pelo motor —, e as perguntas que lhe
  apontassem caíam no responsável de recurso sem explicação. Passa a ser
  recusado à entrada, que é onde se pode dizer porquê. Os restantes nomes do
  protótipo continuam a ser códigos válidos.

### Alterado

- **Substituir todo o histórico numa importação passa a pedir o código de
  acesso.** Desde 3.3.1 apagar *uma* auditoria já o pedia, pela razão de ser
  irreversível; substituir apaga-as *todas* de uma vez e era a única porta
  destrutiva que não o pedia.

- **As listas importadas passam a ter tecto**: 60 responsáveis, 500 perguntas e
  5000 auditorias. Cada um está uma ordem de grandeza acima do maior caso
  plausível, e existe só para que um ficheiro absurdo seja truncado em vez de
  bloquear o dispositivo a desenhar. O diálogo da importação diz quantas
  auditorias foram ignoradas.

### Testes

- Sete regressões novas (85 no total): leitura de chaves herdadas do protótipo
  em `recTexto()` e `respEmUso()`, recusa de `__proto__` e truncatura das listas
  em `sanitizeResps()` e `sanitizeItems()`.

## [3.5.0] — 2026-08-04

### Adicionado

- **Os responsáveis passam a ser editáveis na Configuração.** Deixam de estar
  escritos no código: acrescentam-se, renomeiam-se e removem-se num cartão
  próprio, e a lista guardada em `resps` manda no selector do editor de
  perguntas, no selector da edição de auditorias, nos eixos do radar "Por
  responsável" e nos blocos de recomendações do relatório. Sem nada guardado
  valem os cinco de origem.

  As decisões que estruturam o resto:

  - **O código é a chave e não muda.** Cada pergunta guarda o responsável pelo
    código (`r`), pelo que renomear é livre — muda só o que se lê — mas alterar
    um código desligaria as perguntas que o referenciam. Fixa-se ao criar e
    aparece como etiqueta, não como campo.
  - **Um responsável em uso não pode ser removido**, e a mensagem diz onde está
    o uso: em N perguntas do checklist, em N auditorias gravadas. Conta como uso
    o texto de recomendação já escrito — apagá-lo faria desaparecer do relatório
    o que alguém escreveu, sem aviso e sem recuperação. Para remover, reatribui-
    se primeiro: no editor de perguntas, e em cada auditoria pelo botão Editar.
  - **A lista é um rascunho até Guardar**, como no editor de perguntas, e
    Guardar pede o código de acesso. Mexer na lista não muda nada entretanto.
  - **A ordem é a dos eixos do radar.** Acrescentar fica no fim, para não
    deslocar os que já lá estavam.

- **A exportação JSON passa a incluir a lista de responsáveis, e a importação a
  trazê-la.** Um ficheiro de um dispositivo com responsáveis próprios era lido
  com os de quem importava, e as perguntas atribuídas a um responsável
  desconhecido caíam em silêncio no primeiro da lista. Agora os responsáveis do
  ficheiro entram antes da validação: *Substituir* fica com a lista do ficheiro,
  *Fundir* acrescenta o que falta e mantém os nomes de casa. Cancelar a
  importação repõe a lista como estava.

### Alterado

- **O responsável de recurso deixa de ser `"U"` à letra** e passa a ser o
  primeiro da lista. Com a lista editável, quem removesse o "U" ficaria com
  itens a apontar para uma chave inexistente e um eixo sem nome no radar.

- `REC_KEYS`, que era uma cópia das chaves tirada no arranque, passa a
  `respKeys()`. Uma lista que muda não pode ser lida de uma fotografia.

## [3.4.0] — 2026-08-04

### Adicionado

- **Reatribuir o responsável de cada pergunta dentro de uma auditoria já
  gravada.** Em modo de edição, a linha de cada item deixa de mostrar o
  responsável como texto fixo e passa a mostrá-lo num selector. É o que faltava
  para que acrescentar um responsável — como o Picking em 3.2.0 — possa alcançar
  o passado: até aqui, as auditorias anteriores ficavam presas à atribuição que
  tinham no dia em que foram feitas, e o radar por responsável nunca lhes
  reconhecia o eixo novo.

  Duas fronteiras deliberadas:

  - **A mudança fica só naquela auditoria.** O selector escreve na cópia que o
    formulário usa (`FORM_ITEMS`), que ao Guardar substitui o `items` daquele
    registo. O checklist em vigor (`itemsCfg`) não é tocado — reatribuir o
    passado não é o mesmo que mudar as perguntas de hoje, e para isso continua
    a haver o editor de perguntas.
  - **Só aparece em edição.** Numa auditoria nova o responsável vem do
    checklist, onde é editável com o resto da pergunta; um selector por item
    ali dentro seria uma segunda maneira de dizer a mesma coisa, e as duas
    acabariam a divergir.

  As classificações não mexem: mudar de responsável muda a que eixo do radar e
  a que bloco de recomendações a pergunta pertence, não o que lhe foi
  respondido.

## [3.3.1] — 2026-08-04

### Alterado

- **Apagar uma auditoria passa a pedir o código de acesso**, o mesmo da edição e
  do editor de perguntas. Apagar é a mais definitiva das alterações ao
  histórico: não há como anular, e o que se perde não está em mais lado nenhum
  sem uma exportação. A confirmação continua a vir primeiro, para que um toque
  acidental se desfaça sem ninguém ter de escrever código nenhum.

  Como em 3.3.0, o código é pedido a cada vez e continua a não ser um controlo
  de segurança — protege contra o acidente, não contra quem queira mesmo.

## [3.3.0] — 2026-08-04

### Adicionado

- **Editar auditorias anteriores.** Cada auditoria do Histórico ganha um botão
  **Editar** (e o relatório um **Editar auditoria**), que reabre o formulário
  já preenchido: serviço, data, Picking, Repositor, Verificador, observação e
  todas as respostas. Guardar **substitui** o registo existente em vez de criar
  um segundo — o `id` mantém-se, e com ele o lugar da auditoria no histórico,
  na análise e nas fusões da importação.

  Três decisões que valem a pena registar:

  - **As perguntas usadas na edição são as que ficaram gravadas com a
    auditoria** (`a.items`), não as actuais. Uma pergunta acrescentada,
    removida ou reordenada no editor desde então desalinharia cada resposta em
    relação à pergunta que a originou. Pelo mesmo motivo, a reclassificação ao
    reescrever um valor usa os limiares da própria auditoria: editar não é
    ocasião para recalcular o passado com regras novas.
  - **As recomendações por responsável (`recs`) sobrevivem à edição.** A
    gravação assenta sobre o registo antigo em vez de o substituir, pelo que os
    campos que o formulário não conhece ficam intactos — foi exactamente essa a
    perda que atingiu `recs` na importação em 3.1.1.
  - **Uma auditoria sem as perguntas associadas e com um número de respostas
    diferente do actual não é editável**, e diz-se porquê. Sem saber a que
    pergunta pertence cada resposta, editá-la trocaria as classificações de
    sítio.

  Auditorias importadas de ficheiros sem o campo `raw` não têm valor bruto para
  pré-preencher: o item aparece com a classificação anterior mantida e um aviso
  a dizer que escrever um valor a reavalia. Guardar não a transforma num zero.

- **A edição pede o código de acesso**, o mesmo do editor de perguntas. As duas
  acções reescrevem o que já está guardado, e é isso que justifica o código —
  não o separador em que estão. É pedido a cada vez, e não uma vez por sessão:
  um desbloqueio que ficasse de pé até fechar a aplicação deixava de travar
  exactamente o que o PIN existe para travar, o toque distraído. Continua a não
  ser um controlo de segurança — o código é público, como sempre foi.

- **Cancelar edição** devolve o formulário ao estado de auditoria nova. Apagar
  no Histórico a auditoria que está a ser editada fecha a edição pela mesma
  razão: já não haveria registo que substituir.

- `tests/smoke-edicao.mjs` — smoke test de browser do percurso completo:
  gravar, reabrir, alterar, confirmar que o histórico continua com um só
  registo e que a recomendação sobreviveu, e cancelar.

### Corrigido

- **Os campos do cabeçalho sobreviviam à gravação**: o Picking, o Repositor, o
  Verificador e a observação da auditoria anterior ficavam escritos no
  formulário da seguinte, à espera de serem gravados outra vez sem ninguém
  reparar. Guardar (ou repor as perguntas) passa a deixar o formulário
  verdadeiramente vazio.

## [3.2.1] — 2026-08-04

### Alterado

- **A pergunta nº 8 — "Nº de artigos em rutura mal identificados" — passa de
  Reposição para Picking**, e é a primeira do checklist de origem atribuída ao
  responsável criado em 3.2.0. É o que faz o quinto eixo aparecer no radar por
  responsável sem ser preciso mexer no editor de perguntas.

  Só afecta auditorias **novas**: as já gravadas guardam a sua própria cópia das
  perguntas (`a.items`), pelo que os radares e as recomendações do passado
  continuam a atribuir a nº 8 à Reposição, tal como no dia em que foram feitas.

## [3.2.0] — 2026-08-04

### Adicionado

- **Quinto responsável: Picking.** `RESP` passa a ter a chave `P`, a par de
  Utilizadores, Manutenção, Reposição e Utilizador e Repositor. Aparece no
  selector de responsável do editor de perguntas, no radar e nas barras
  "Desempenho por responsável", e ganha bloco próprio nas recomendações do
  relatório. Nenhuma pergunta do checklist de origem lhe é atribuída — quem
  audita escolhe quais passam a Picking no editor de perguntas.

  A chave nova é acrescentada **no fim** de `RESP`: a ordem do objeto é a ordem
  dos eixos do radar, pelo que os quatro responsáveis anteriores ficam onde
  estavam. `REC_KEYS` deixa de ser uma lista escrita à mão e passa a derivar de
  `Object.keys(RESP)`, para não haver duas listas de responsáveis a divergir.

### Corrigido

- **Um responsável sem perguntas atribuídas entrava no radar da Análise com
  0%.** `pctOf([])` devolve 0, o que é indistinguível de uma pontuação nula:
  o Picking recém-criado apareceria como o pior de todos até lhe ser atribuída
  a primeira pergunta. Zero perguntas não é zero por cento — os eixos sem
  perguntas ficam agora de fora do radar e das barras da Análise, tal como já
  acontecia no radar do relatório. As barras do relatório seguem a mesma regra,
  em vez de listarem "(0 itens) · 0%".

- Auditorias gravadas antes desta versão não têm texto de recomendação para o
  Picking; `recsOf()` normaliza a chave em falta para `""` e o bloco aparece
  vazio, sem migração nem perda do que lá estava.

## [3.1.4] — 2026-07-31

### Corrigido

- **O comentário de cabeçalho do `index.html` estava por fechar**, e engolia
  metade do `<head>`. Uma edição anterior removeu as linhas finais do bloco
  junto com o `-->`, pelo que tudo o que vinha a seguir passou a ser comentário
  até ao primeiro `-->` seguinte — `<html>`, `<head>`, `<meta charset>`,
  `<meta viewport>`, `<title>` e `<link rel="manifest">`.

  O efeito na aplicação publicada não era subtil: sem `charset` o browser
  assumia `windows-1252` e todo o texto acentuado aparecia partido
  (`NÂº`, `serviÃ§o`); sem `viewport` a página abria à largura de um ecrã de
  computador num telemóvel, que é onde a auditoria é feita; sem manifesto
  deixava de ser instalável como PWA; e o separador ficava sem título. A CSP e
  o favicon escaparam por estarem depois do ponto onde o comentário fechava.

- **`findCols()` tomava uma linha de título por cabeçalho.** Num ficheiro com
  `Relatório de serviços` antes da linha de rótulos, a palavra "serviços" casava
  com `/servic/` e a importação trazia a coluna dos **códigos** como se fossem
  nomes de serviço — ficavam na lista `00001`, `00002` em vez das descrições.

  Duas regras novas: ganha a linha que identifica **mais** colunas, e não a
  primeira que identifica alguma; e os padrões passam a estar ancorados no
  início da célula, porque um cabeçalho é um rótulo ("Serviço") e um título é
  uma frase que apenas contém a palavra. Escolhida a linha, as colunas que
  ficarem por identificar levam ainda uma tentativa sem âncora dentro dessa
  linha, para que rótulos invulgares como `Nº/Código` continuem a ser lidos.

### Adicionado

- `tests/excel-cabecalho.test.js`: 11 testes sobre `findCols()` — linha de
  título, preâmbulo de várias linhas, desempate por número de colunas, rótulos
  com acentos e espaços, folhas irregulares e a reserva sem âncora.

## [3.1.3] — 2026-07-31

Migração guiada para as perguntas de amostra.

### Adicionado

- **Proposta de conversão das perguntas 3, 18 e 19.** Desde 3.1.0 estas
  perguntas são de amostra: indica-se quantas unidades foram auditadas e a
  avaliação é feita em percentagem desse total. Quem tinha perguntas gravadas
  de uma versão anterior — basta ter aberto o editor uma vez e carregado em
  Guardar — continuava sem o campo "Auditados", porque a aplicação lê sempre o
  que está guardado e `normItem()` **não** converte tipos: converter em
  silêncio mudaria a classificação de auditorias já feitas.

  A migração é explícita e a pedido. É proposta uma vez, no arranque, depois do
  primeiro render, e preserva o que é do utilizador — enunciado, tema, pilar e
  responsável.

  As perguntas são identificadas pelo **enunciado**, não pelo número: `edSave()`
  renumera ao gravar (ordena por pilar e atribui `n` = posição), pelo que quem
  acrescentou, removeu ou reordenou perguntas tem numeração que já não
  corresponde à de origem — e emparelhar pelo número converteria a pergunta
  errada, dando um alvo auditado a uma pergunta que não é de amostra e deixando
  a verdadeira por converter. O número fica como reserva, para quem reescreveu
  o enunciado mas manteve a ordem, e a proposta mostra sempre o enunciado antes
  de converter seja o que for. Os limiares antigos **não** viajam: eram contagens
  absolutas (4 kanbans) e não têm leitura possível como percentagem, pelo que se
  assumem os de origem (40/10, 50/10 e 20/10 %).

- **Cartão em Configuração** para quem adiar a proposta. Fica visível enquanto
  houver perguntas por converter e desaparece assim que a conversão é feita —
  adiar não fecha a porta, e a proposta não volta a aparecer a cada arranque.

- `tests/amostra-migracao.test.js`: 13 testes sobre `migrarParaAmostra()`, entre
  eles a preservação das personalizações, a não-conversão de perguntas que não
  são de amostra na origem, a idempotência, o emparelhamento com numeração
  trocada e a recusa de converter uma pergunta alheia que calhe ter o número de
  uma de amostra.

### Corrigido

- **O harness dos testes truncava declarações de mais de uma linha**, sem se
  queixar: `extractConst()` lê até ao fim da linha, pelo que uma constante
  partida em duas chegava incompleta e os testes passavam a exercitar código
  que **não** é o de produção. Apanhado com a `chaveTexto()`, extraída sem o
  `.normalize()` nem o `.trim()`. O harness passa a rebentar com uma mensagem
  explícita quando isso acontece, e a `chaveTexto()` é declarada com `function`,
  que é extraída por chavetas.

## [3.1.2] — 2026-07-31

Continuação da auditoria: fecha o ponto 4 do [SECURITY.md](SECURITY.md).

### Adicionado

- **Guarda contra clickjacking.** A directiva `frame-ancestors` da CSP é
  ignorada pelos browsers quando a política vem por `<meta>` — só vale em
  cabeçalho HTTP, que o GitHub Pages não permite definir —, pelo que a
  aplicação estava, na prática, sem qualquer protecção. Um bloco no `<head>`,
  que corre antes de o `<body>` existir, esvazia o documento quando detecta que
  está numa moldura e mostra uma ligação para o abrir em janela própria.
  Deliberadamente **não** se tenta `top.location`: entre origens a escrita é
  bloqueada e a tentativa falharia em silêncio, dando a ilusão de defesa.
- **Os três ícones do PWA.** O `manifest.json` referenciava
  `./icons/icon-192.png`, `icon-512.png` e `icon-512-maskable.png`, que nunca
  existiram no repositório: davam 404, o `install` do service worker falhava
  nesses recursos e a instalação ficava sem ícone. Gerados com as cores da
  própria aplicação; na variante *maskable* o conteúdo fica dentro dos 60%
  centrais, para sobreviver ao recorte circular.
- **`<link rel="icon">`**, que faltava: sem ele o browser pedia
  `/favicon.ico` por omissão e levava 404. Com os ícones e esta linha, o smoke
  test deixou de registar qualquer erro de consola.

### Corrigido

- **CVE-2024-22363 (ReDoS) e CVE-2023-30533 (prototype pollution):** o SheetJS
  embutido passou de **0.18.5 para 0.20.3**, que corrige ambas (a segunda em
  0.19.3, a primeira em 0.20.2). Um `.xlsx` preparado para o efeito deixa de
  poder bloquear o separador durante a leitura. A biblioteca foi obtida de
  `cdn.sheetjs.com` — é hoje a única via de distribuição, já que o pacote
  `xlsx` no npm ficou congelado em 0.18.5.
- **Removida a mitigação que congelava o `Object.prototype`** durante o parsing
  de Excel. Existia só para travar a CVE-2023-30533 numa versão que não podia
  ser actualizada; era irreversível e global à página, e mantê-la por hábito
  custaria essa restrição sem contrapartida.

## [3.1.1] — 2026-07-31

Auditoria de segurança. Sem alterações de funcionalidade nem de formato de
dados. Relatório completo em [SECURITY.md](SECURITY.md).

### Corrigido

- **A importação de histórico gravava as perguntas do ficheiro sem validação.**
  `importJson()` fazia `save("itemsCfg", data.itemsCfg)` em bruto — era o único
  caminho de entrada que contornava a limpeza aplicada em `edImport()` e em
  `sanitizeAudit()`. Um pilar fora de intervalo deixava o item sem eixo em
  `byPillar()` e um responsável desconhecido fazia-o desaparecer de `byResp()`,
  falseando as notas por eixo sem qualquer aviso. A limpeza passou a viver em
  `sanitizeItems()`, porta única partilhada pelos dois caminhos.
- **A guarda de responsável aceitava chaves herdadas do protótipo.**
  `RESP[x.r]` é *truthy* para `"constructor"`, `"toString"` ou `"valueOf"`, pelo
  que essas chaves passavam a validação: o formulário chegava a mostrar
  `Resp.: function Object() { [native code] }`. Substituída por `isResp()`, com
  `hasOwnProperty`. `normItem()` passou também a normalizar o pilar e o
  responsável, para que um `localStorage` contaminado por uma importação
  anterior se repare no arranque em vez de ficar por corrigir.
- **`localStorage` corrompido derrubava o arranque.** `load()` fazia
  `JSON.parse` sem `try`: um valor inválido em qualquer chave lançava antes do
  primeiro render e deixava a página em branco — e o service worker servia a
  mesma página partida offline. Passa a recair no valor por omissão. Relevante
  porque o `localStorage` pertence à origem inteira (`qzte.github.io`), não a
  `/5S/`.
- **A allowlist do service worker não se aplicava às navegações.** O ramo
  `navigate` gravava em `./index.html` qualquer resposta 200 da própria origem,
  ao contrário do que o comentário do ficheiro afirmava. Passa a consultar
  `ALLOWED`, ignorando a query string.
- **`gitignore` estava sem o ponto inicial**, pelo que nenhuma das regras era
  aplicada — incluindo as que impedem que auditorias exportadas (com nomes de
  colaboradores) sejam commitadas para um repositório público.
- **A suite de testes não corria.** `harness.js` faz `require` de
  `../index.html` mas os ficheiros estavam na raiz: `node --test tests/` não
  encontrava nada e a partir da raiz falhava com `ENOENT`. As regressões que
  protegem `sanitizeAudit()` não estavam a ser executadas. Movidos para
  `tests/`.

### Adicionado

- `tests/perguntas.test.js`: 11 testes sobre `sanitizeItems()` — saturação do
  pilar, rejeição de chaves do protótipo, limites de texto, tipo desconhecido,
  preservação dos limiares v3 e do alvo das amostras, idempotência.
- `SECURITY.md` com a auditoria, incluindo o que **não** estava mitigado à
  data: a CVE-2024-22363 do SheetJS 0.18.5 (ReDoS, fechada na 3.1.2), a
  ausência real de protecção contra clickjacking (`frame-ancestors` é ignorado
  numa CSP em `<meta>`) e a partilha de `localStorage` entre todos os projectos
  publicados na mesma conta do GitHub Pages.

## [3.1.0] — 2026-07-31

Perguntas de amostra: alvo auditado definido por auditoria, limiares em
percentagem.

### Adicionado

- **Quarto tipo de resposta, `amostra`.** A pergunta declara um alvo sugerido
  (`tgt`) e os limiares `t1`/`t2` passam a ser **percentagens desse alvo**. O
  alvo efectivo é escolhido em cada auditoria, num campo "Auditados" ao lado da
  resposta. Os cortes acompanham o alvo sem serem reescritos: com `t1 = 40%`,
  auditar 10 kanbans coloca "Mau" em 4; auditar 20 coloca-o em 8.
- `classify(it, n, tgt)` ganha um terceiro argumento com o alvo efectivo. Os
  restantes tipos ignoram-no, pelo que a assinatura antiga continua válida.
  Devolve `null` quando não há alvo utilizável: sem denominador não há
  classificação, e o item fica **por responder** em vez de receber um zero que a
  nota trataria como "Mau". O denominador dinâmico de `pctOf()` já lida com isso.
- **Perguntas 3, 18 e 19** (kanbans com quantidades excessivas, norma de
  reposição, validades) convertidas para `amostra`, com alvo sugerido de 10.
- Campo "Auditados" no formulário, com a percentagem calculada em directo por
  baixo da resposta. Alterar o alvo reclassifica a resposta já introduzida.
- Relatório e lista de itens a melhorar mostram a fracção auditada e a
  percentagem (ex.: `3 / 12 (25%)`) em vez da contagem isolada.
- Editor: tipo "Amostra (% do alvo)", campo de alvo sugerido, limiares
  rotulados em `%` e validação do alvo.
- Auditorias gravam `tgts[]`, paralelo a `scores[]` e `raw[]`.

### Corrigido

- **`sanitizeAudit()` e a importação de perguntas descartavam `t3`.** Sem esse
  campo, `normItem()` relia `t1`/`t2` com a semântica de cortes anónimos de
  2.0.0 e reetiquetava-os — uma contagem `{t1:4, t2:1}` importada tornava-se
  `{t1:4, t2:4}`, isto é, binária, alterando a classificação de uma auditoria
  já gravada. É a mesma família do `recs` perdido em 1.7.0, e fica agora coberta
  por testes.

### Compatibilidade

- Não é disruptivo. As auditorias antigas guardam um instantâneo das perguntas
  com `tp: "count"` e são reclassificadas exactamente como antes; os `scores`
  gravados não são recalculados.
- No alvo nominal de 10, as perguntas 3, 18 e 19 classificam de forma **idêntica**
  a 3.0.0 — os limiares 40%/50%/20% e 10% reproduzem valor a valor os cortes
  absolutos 4/5/2 e 1. Verificado por teste exaustivo.

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

Paridade com a folha de cálculo original.

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
  real são 99,75 pontos. Por isso a mesma auditoria pode dar meio ponto
  percentual a menos no Excel do que na aplicação. Ver a secção *Modelo de pontuação* do README.
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
