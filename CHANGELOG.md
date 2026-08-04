# Changelog

Todas as alterações relevantes deste projeto são registadas neste ficheiro.

O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e o projeto adere a [Semantic Versioning](https://semver.org/lang/pt-BR/).

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
  nomes de serviço — ficavam na lista `11120`, `22450` em vez das descrições.

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
